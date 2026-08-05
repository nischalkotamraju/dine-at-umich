import { toZonedTime } from 'date-fns-tz';
import { and, eq, inArray } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from '~/services/database/schema';
import type { HoursBlock } from '~/services/database/schema';
import { getTodayInCentralTime } from '~/utils/date';

// Dining hall hours are always Eastern (Ann Arbor), regardless of device tz.
const TIMEZONE = 'America/Detroit';

type TimeRange = { open: number; close: number };

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

// Today's scraped serving blocks for a location, or [] if force-closed / no
// scraped row / recorded closed. Blocks carry their meal name (Breakfast, etc.)
// or "Open" for cafés.
function blocksForToday(
  blocks: unknown,
  isClosed: boolean | null,
  forceClose: boolean,
): HoursBlock[] {
  if (forceClose || isClosed || !Array.isArray(blocks)) return [];
  return blocks as HoursBlock[];
}

/**
 * Every location serving `foodNames` today, grouped by food name. For a
 * meal-based dining hall, a dish's intervals are narrowed to just the scraped
 * window(s) of the meal it's actually served in — matched by meal name against
 * the scraped hours blocks — so a breakfast dish only reads as available 7-9am,
 * not through lunch and dinner. Single-menu cafés (blocks named "Open") keep
 * their whole open hours. Batched so the Saved tab resolves every favorite in
 * one query.
 */
export async function getDishesServingLocations(
  db: ExpoSQLiteDatabase<typeof schema>,
  foodNames: string[],
): Promise<Record<string, DishServingLocation[]>> {
  if (foodNames.length === 0) return {};
  const today = getTodayInCentralTime();

  const rows = await db
    .select({
      foodName: schema.food_item.name,
      locationName: schema.location.name,
      mealName: schema.menu.name,
      forceClose: schema.location.force_close,
      blocks: schema.location_hours.blocks,
      isClosed: schema.location_hours.is_closed,
    })
    .from(schema.food_item)
    .innerJoin(schema.menu_category, eq(schema.food_item.menu_category_id, schema.menu_category.id))
    .innerJoin(schema.menu, eq(schema.menu_category.menu_id, schema.menu.id))
    .innerJoin(schema.location, eq(schema.menu.location_id, schema.location.id))
    .leftJoin(
      schema.location_hours,
      and(
        eq(schema.location_hours.location_id, schema.location.id),
        eq(schema.location_hours.date, today),
      ),
    )
    .where(and(eq(schema.menu.date, today), inArray(schema.food_item.name, foodNames)))
    .execute();

  // Per location: today's serving blocks, all as intervals, plus a meal-name ->
  // window map for narrowing a dish to just its meal.
  const locBlocks = new Map<string, HoursBlock[]>();
  for (const row of rows) {
    if (!row.locationName || locBlocks.has(row.locationName)) continue;
    locBlocks.set(row.locationName, blocksForToday(row.blocks, row.isClosed, row.forceClose));
  }
  const locAllIntervals = new Map<string, TimeRange[]>();
  const locMealMap = new Map<string, Map<string, TimeRange>>();
  for (const [loc, blocks] of locBlocks) {
    locAllIntervals.set(loc, blocks.map((b) => ({ open: b.open, close: b.close })));
    const mealMap = new Map<string, TimeRange>();
    for (const b of blocks) mealMap.set(b.name.toLowerCase(), { open: b.open, close: b.close });
    locMealMap.set(loc, mealMap);
  }

  // Per (food, location): the meals this dish is served in today.
  const dishMeals = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.foodName || !row.locationName || !row.mealName) continue;
    const k = `${row.foodName}|${row.locationName}`;
    (dishMeals.get(k) ?? dishMeals.set(k, new Set()).get(k)!).add(row.mealName.toLowerCase());
  }

  const result: Record<string, DishServingLocation[]> = {};
  const added = new Set<string>();
  for (const row of rows) {
    if (!row.foodName || !row.locationName) continue;
    const k = `${row.foodName}|${row.locationName}`;
    if (added.has(k)) continue;
    added.add(k);

    const allIntervals = locAllIntervals.get(row.locationName) ?? [];
    const mealMap = locMealMap.get(row.locationName);
    // Narrow to the scraped window(s) of the meal(s) the dish is served in;
    // fall back to the whole open hours when no meal name matches (café /
    // single-menu location whose block is just "Open").
    const uniq = new Map<string, TimeRange>();
    if (mealMap) {
      for (const meal of dishMeals.get(k) ?? []) {
        const w = mealMap.get(meal);
        if (w) uniq.set(`${w.open}-${w.close}`, w);
      }
    }
    const intervals = uniq.size > 0 ? [...uniq.values()] : allIntervals;
    (result[row.foodName] ??= []).push({ name: row.locationName, intervals });
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
