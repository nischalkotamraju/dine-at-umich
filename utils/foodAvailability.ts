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

// Canonical meal ordering, used to line the day's meals up chronologically
// with the day's open windows.
const MEAL_ORDER: Record<string, number> = {
  breakfast: 0,
  brunch: 1,
  lunch: 2,
  dinner: 3,
  'late night': 4,
};

// Pairs a meal-based location's meals-served-today with its open windows to get
// meal -> window (e.g. breakfast -> 7-9, lunch -> 11-2, dinner -> 5-8). Returns
// null for single-menu cafés (their one menu isn't a real meal) or when the
// counts don't line up, so callers fall back to the whole open hours.
function mealWindowMap(meals: string[], intervals: TimeRange[]): Map<string, TimeRange> | null {
  const orderedMeals = meals
    .map((m) => m.toLowerCase())
    .filter((m) => m in MEAL_ORDER)
    .sort((a, b) => MEAL_ORDER[a] - MEAL_ORDER[b]);
  if (orderedMeals.length === 0 || orderedMeals.length !== intervals.length) return null;
  const windows = [...intervals].sort((a, b) => a.open - b.open);
  const map = new Map<string, TimeRange>();
  orderedMeals.forEach((meal, i) => map.set(meal, windows[i]));
  return map;
}

/**
 * Every location serving `foodNames` today, grouped by food name. For a
 * dining hall (meal-based), a dish's intervals are narrowed to just the
 * window(s) of the meal it's actually served in — so a breakfast dish only
 * reads as available 7-9am, not through lunch and dinner. Single-menu cafés
 * keep their whole open hours. Batched so the Saved tab resolves every
 * favorite in one query.
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
      mealName: schema.menu.name,
      hours: schema.location.regular_service_hours,
      forceClose: schema.location.force_close,
    })
    .from(schema.food_item)
    .innerJoin(schema.menu_category, eq(schema.food_item.menu_category_id, schema.menu_category.id))
    .innerJoin(schema.menu, eq(schema.menu_category.menu_id, schema.menu.id))
    .innerJoin(schema.location, eq(schema.menu.location_id, schema.location.id))
    .where(and(eq(schema.menu.date, today), inArray(schema.food_item.name, foodNames)))
    .execute();

  // Per location: its open windows today, and every meal it serves today (used
  // to build the meal -> window map once per location).
  const locIntervals = new Map<string, TimeRange[]>();
  const locMeals = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.locationName) continue;
    if (!locIntervals.has(row.locationName)) {
      locIntervals.set(
        row.locationName,
        intervalsForToday(row.hours as ServiceHours | null, row.forceClose, weekday),
      );
    }
    if (row.mealName) {
      (locMeals.get(row.locationName) ?? locMeals.set(row.locationName, new Set()).get(row.locationName)!).add(
        row.mealName.toLowerCase(),
      );
    }
  }
  const locMealMap = new Map<string, Map<string, TimeRange> | null>();
  for (const [loc, meals] of locMeals) {
    locMealMap.set(loc, mealWindowMap([...meals], locIntervals.get(loc) ?? []));
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

    const allIntervals = locIntervals.get(row.locationName) ?? [];
    const mealMap = locMealMap.get(row.locationName);
    let intervals: TimeRange[];
    if (mealMap) {
      // Narrow to the window(s) of the meal(s) the dish is served in.
      const uniq = new Map<string, TimeRange>();
      for (const meal of dishMeals.get(k) ?? []) {
        const w = mealMap.get(meal);
        if (w) uniq.set(`${w.open}-${w.close}`, w);
      }
      intervals = uniq.size > 0 ? [...uniq.values()] : allIntervals;
    } else {
      intervals = allIntervals; // café / unmappable -> whole open hours
    }
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
