import { toZonedTime } from 'date-fns-tz';
import { and, eq, inArray } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from '~/services/database/schema';
import { getTodayInCentralTime } from '~/utils/date';

// Dining hall hours are always Eastern (Ann Arbor), regardless of device tz.
const TIMEZONE = 'America/Detroit';
// getDay(): 0 = Sunday … 6 = Saturday.
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

type TimeRange = { open: number; close: number };
type DaySchedule = { isClosed?: boolean; timeRanges?: TimeRange[] };
type ServiceHours = Record<string, DaySchedule | undefined>;

// A location that serves a given dish today, with the location's open
// intervals for today (empty if it's closed today / force-closed).
export type DishServingLocation = {
  name: string;
  intervals: TimeRange[];
};

// One time window in the "where to find it today" timeline: the locations
// serving the dish that are open during [open, close), plus whether that
// window is happening right now.
export type AvailabilitySlot = {
  open: number; // HHMM (e.g. 1730 for 5:30 PM)
  close: number;
  locationNames: string[];
  isNow: boolean;
};

function nowEasternMinutes(): number {
  const e = toZonedTime(new Date(), TIMEZONE);
  return e.getHours() * 60 + e.getMinutes();
}

function easternWeekdayKey(): string {
  return DAY_KEYS[toZonedTime(new Date(), TIMEZONE).getDay()];
}

function hhmmToMinutes(t: number): number {
  return Math.floor(t / 100) * 60 + (t % 100);
}

// 1730 -> "5:30 PM", 0 -> "12:00 AM", 2400 -> "12:00 AM".
export function formatHHMM(t: number): string {
  const h24 = Math.floor(t / 100) % 24;
  const minute = t % 100;
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  const hour = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${hour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

function intervalsForToday(
  hours: ServiceHours | null,
  forceClose: boolean,
  weekday: string,
): TimeRange[] {
  if (forceClose || !hours) return [];
  const day = hours[weekday];
  if (!day || day.isClosed || !Array.isArray(day.timeRanges)) return [];
  return day.timeRanges;
}

/**
 * Every location serving `foodNames` today, grouped by food name, each with
 * that location's open intervals for today. Batched so the Saved tab can
 * resolve every favorite in one query.
 */
export async function getDishesServingLocations(
  db: ExpoSQLiteDatabase<typeof schema>,
  foodNames: string[],
): Promise<Record<string, DishServingLocation[]>> {
  if (foodNames.length === 0) return {};
  const today = getTodayInCentralTime();
  const weekday = easternWeekdayKey();

  const rows = await db
    .select({
      foodName: schema.food_item.name,
      locationName: schema.location.name,
      hours: schema.location.regular_service_hours,
      forceClose: schema.location.force_close,
    })
    .from(schema.food_item)
    .innerJoin(schema.menu_category, eq(schema.food_item.menu_category_id, schema.menu_category.id))
    .innerJoin(schema.menu, eq(schema.menu_category.menu_id, schema.menu.id))
    .innerJoin(schema.location, eq(schema.menu.location_id, schema.location.id))
    .where(and(eq(schema.menu.date, today), inArray(schema.food_item.name, foodNames)))
    .execute();

  const result: Record<string, DishServingLocation[]> = {};
  const seen = new Set<string>(); // `${food}|${location}` to de-dupe
  for (const row of rows) {
    if (!row.foodName || !row.locationName) continue;
    const key = `${row.foodName}|${row.locationName}`;
    if (seen.has(key)) continue;
    seen.add(key);
    (result[row.foodName] ??= []).push({
      name: row.locationName,
      intervals: intervalsForToday(row.hours as ServiceHours | null, row.forceClose, weekday),
    });
  }
  return result;
}

/** Serving locations for a single dish today (used by the food detail page). */
export async function getDishServingLocations(
  db: ExpoSQLiteDatabase<typeof schema>,
  foodName: string,
): Promise<DishServingLocation[]> {
  const byFood = await getDishesServingLocations(db, [foodName]);
  return byFood[foodName] ?? [];
}

/** Names of the serving locations that are open right now. */
export function openNowLocationNames(servingLocations: DishServingLocation[]): string[] {
  const now = nowEasternMinutes();
  return servingLocations
    .filter((loc) =>
      loc.intervals.some((iv) => now >= hhmmToMinutes(iv.open) && now < hhmmToMinutes(iv.close)),
    )
    .map((loc) => loc.name);
}

/**
 * The day's availability timeline: one entry per distinct open window, listing
 * the locations open during it, sorted by start time. Windows overlapping the
 * current time are flagged isNow.
 */
export function buildAvailabilityTimeline(
  servingLocations: DishServingLocation[],
): AvailabilitySlot[] {
  const now = nowEasternMinutes();
  const byWindow = new Map<string, { open: number; close: number; names: string[] }>();

  for (const loc of servingLocations) {
    for (const iv of loc.intervals) {
      const key = `${iv.open}-${iv.close}`;
      const entry = byWindow.get(key) ?? { open: iv.open, close: iv.close, names: [] };
      if (!entry.names.includes(loc.name)) entry.names.push(loc.name);
      byWindow.set(key, entry);
    }
  }

  return [...byWindow.values()]
    .sort((a, b) => a.open - b.open || a.close - b.close)
    .map((s) => ({
      open: s.open,
      close: s.close,
      locationNames: [...s.names].sort(),
      isNow: now >= hhmmToMinutes(s.open) && now < hhmmToMinutes(s.close),
    }));
}
