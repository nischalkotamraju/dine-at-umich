import { and, eq, getTableColumns, inArray } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import * as schema from '~/services/database/schema';
import {
  updateWidgetData,
  type FavoriteFoodAvailability,
  type FavoriteLocationStatus,
} from '~/modules/live-activity';
import { useWidgetPreferencesStore } from '~/store/useWidgetPreferencesStore';
import { getTodayInCentralTime } from '~/utils/date';
import { getTodaySchedule } from '~/utils/time';

function convertToMinutes(time: number): number {
  const hour = Math.floor(time / 100);
  const minute = time % 100;
  return hour * 60 + minute;
}

// Builds the absolute Date instant for a given "minutes since midnight, Eastern
// Time, today" value — dining hall hours are always stored in Eastern Time
// regardless of the device's own timezone, so a naive `new Date()` with local
// getters would compute the wrong instant for anyone outside ET.
function easternMinutesToday(minutes: number): Date {
  const nowEastern = toZonedTime(new Date(), 'America/Detroit');
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const wallClockTarget = new Date(
    nowEastern.getFullYear(),
    nowEastern.getMonth(),
    nowEastern.getDate(),
    hour,
    minute,
    0,
    0,
  );
  return fromZonedTime(wallClockTarget, 'America/Detroit');
}

// Returns "now" as minutes-since-midnight in Eastern Time, so it can be
// compared directly against interval.openTime/closeTime (also Eastern).
function nowMinutesEastern(): number {
  const nowEastern = toZonedTime(new Date(), 'America/Detroit');
  return nowEastern.getHours() * 60 + nowEastern.getMinutes();
}

// Determines a location's current open/closed status and the next
// open/close transition to count down to today, from its list of today's
// service intervals — used for the home screen widget's status display.
function computeLocationTransition(
  intervals: { openTime: number; closeTime: number }[],
  currentMinutes: number,
): { isOpen: boolean; transitionMinutes: number | null } {
  for (const interval of intervals) {
    const openM = convertToMinutes(interval.openTime);
    const closeM = convertToMinutes(interval.closeTime);
    if (currentMinutes >= openM && currentMinutes < closeM) {
      return { isOpen: true, transitionMinutes: closeM };
    }
  }

  const nextOpen = intervals
    .map((interval) => convertToMinutes(interval.openTime))
    .filter((openM) => openM > currentMinutes)
    .sort((a, b) => a - b)[0];

  if (nextOpen !== undefined) {
    return { isOpen: false, transitionMinutes: nextOpen };
  }

  // No more transitions today (e.g. already closed for the rest of the day).
  return { isOpen: false, transitionMinutes: null };
}

// Resolves a full location row to its current open/closed status and next
// transition, folding in the force_close override and the "no schedule today"
// case. Shared by the favorite-locations status list and the favorite-food
// availability lookup so both agree on whether a location is open right now.
function computeLocationOpenStatus(
  location: schema.Location,
  currentMinutes: number,
): { isOpen: boolean; transitionMinutes: number | null } {
  if (location.force_close) return { isOpen: false, transitionMinutes: null };
  const schedule = getTodaySchedule(location);
  if (!schedule) return { isOpen: false, transitionMinutes: null };
  return computeLocationTransition(schedule.intervals, currentMinutes);
}

const DAY_ORDER = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

type WidgetDaySchedule = { isClosed?: boolean; timeRanges?: { open: number }[] } | undefined;

// Unix seconds of a location's next opening — later today if there's still an
// interval to come, otherwise the earliest opening on the next open day (up to
// a week out). Mirrors getNextOpeningInfo in utils/time.ts, but returns the
// instant so the widget can show "OPENS IN …" for a closed favorite instead of
// a bare "CLOSED".
function computeNextOpenEpoch(
  location: schema.Location,
  currentMinutes: number,
): number | null {
  if (location.force_close) return null;
  const hours = location.regular_service_hours as Record<string, WidgetDaySchedule> | null;
  if (!hours) return null;

  const nowEastern = toZonedTime(new Date(), 'America/Detroit');
  const todayIdx = (nowEastern.getDay() + 6) % 7; // getDay(): 0=Sun → Monday-first index

  // Still opening later today?
  const todayHours = hours[DAY_ORDER[todayIdx]];
  if (todayHours && !todayHours.isClosed && todayHours.timeRanges?.length) {
    const nextOpenToday = todayHours.timeRanges
      .map((r) => convertToMinutes(r.open))
      .filter((m) => m > currentMinutes)
      .sort((a, b) => a - b)[0];
    if (nextOpenToday !== undefined) {
      return Math.floor(easternMinutesToday(nextOpenToday).getTime() / 1000);
    }
  }

  // Otherwise the earliest opening on the next open day.
  for (let offset = 1; offset <= 7; offset++) {
    const day = hours[DAY_ORDER[(todayIdx + offset) % 7]];
    if (day && !day.isClosed && day.timeRanges?.length) {
      const earliestOpen = convertToMinutes(
        [...day.timeRanges].sort((a, b) => a.open - b.open)[0].open,
      );
      const target = new Date(
        nowEastern.getFullYear(),
        nowEastern.getMonth(),
        nowEastern.getDate() + offset,
        Math.floor(earliestOpen / 60),
        earliestOpen % 60,
        0,
        0,
      );
      return Math.floor(fromZonedTime(target, 'America/Detroit').getTime() / 1000);
    }
  }

  return null;
}

/**
 * Builds the home screen widget's Food section data: for every favorited food,
 * every location serving a dish of that name *today* (whether or not that
 * location is itself favorited), tagged with each location's current open
 * status. Mirrors the "where is my favorite served today" lookup on the Saved
 * tab (app/(tabs)/saved.tsx) so the widget and the app never disagree.
 */
async function computeFavoriteFoodAvailability(
  db: ExpoSQLiteDatabase<typeof schema>,
  currentMinutes: number,
): Promise<FavoriteFoodAvailability[]> {
  const favoriteFoods = await db
    .select({
      name: schema.favorites.name,
      category: schema.favorites.category_name,
      dateAdded: schema.favorites.date_added,
    })
    .from(schema.favorites)
    .execute();
  if (favoriteFoods.length === 0) return [];

  // Most-recently-favorited first (matches the Saved tab ordering), de-duped
  // by name since the same dish can be favorited from multiple locations.
  const orderedFoodNames: string[] = [];
  const categoryByFood = new Map<string, string | null>();
  const seen = new Set<string>();
  for (const fav of [...favoriteFoods].sort(
    (a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime(),
  )) {
    if (fav.name && !seen.has(fav.name)) {
      seen.add(fav.name);
      orderedFoodNames.push(fav.name);
      categoryByFood.set(fav.name, fav.category ?? null);
    }
  }
  if (orderedFoodNames.length === 0) return [];

  const today = getTodayInCentralTime();
  const rows = await db
    .select({
      foodName: schema.food_item.name,
      locationName: schema.location.name,
    })
    .from(schema.food_item)
    .innerJoin(schema.menu_category, eq(schema.food_item.menu_category_id, schema.menu_category.id))
    .innerJoin(schema.menu, eq(schema.menu_category.menu_id, schema.menu.id))
    .innerJoin(schema.location, eq(schema.menu.location_id, schema.location.id))
    .where(and(eq(schema.menu.date, today), inArray(schema.food_item.name, orderedFoodNames)))
    .execute();

  const foodToLocations = new Map<string, Set<string>>();
  const servingLocationNames = new Set<string>();
  for (const row of rows) {
    if (!row.foodName || !row.locationName) continue;
    if (!foodToLocations.has(row.foodName)) foodToLocations.set(row.foodName, new Set());
    foodToLocations.get(row.foodName)?.add(row.locationName);
    servingLocationNames.add(row.locationName);
  }
  if (servingLocationNames.size === 0) return [];

  // Resolve each serving location's current status + next transition once,
  // then reuse it across every food that location serves. The transition lets
  // the widget re-derive open/closed at render time instead of trusting this
  // snapshot.
  const statusByLocation = new Map<
    string,
    { isOpen: boolean; transitionEpoch: number | null }
  >();
  const servingLocations = await db
    .select()
    .from(schema.location)
    .where(inArray(schema.location.name, [...servingLocationNames]))
    .execute();
  for (const location of servingLocations) {
    if (!location.name) continue;
    const { isOpen, transitionMinutes } = computeLocationOpenStatus(location, currentMinutes);
    const transitionEpoch = isOpen
      ? transitionMinutes !== null
        ? Math.floor(easternMinutesToday(transitionMinutes).getTime() / 1000)
        : null
      : computeNextOpenEpoch(location, currentMinutes);
    statusByLocation.set(location.name, { isOpen, transitionEpoch });
  }

  return orderedFoodNames
    .filter((name) => foodToLocations.has(name))
    .map((name) => ({
      name,
      category: categoryByFood.get(name) ?? null,
      servingLocations: [...(foodToLocations.get(name) ?? [])].map((locationName) => ({
        name: locationName,
        isOpen: statusByLocation.get(locationName)?.isOpen ?? false,
        transitionEpoch: statusByLocation.get(locationName)?.transitionEpoch ?? null,
      })),
    }))
    // Prioritize dishes available at the most locations today; ties keep the
    // most-recently-favorited order above (stable sort).
    .sort((a, b) => b.servingLocations.length - a.servingLocations.length);
}

/**
 * Keeps the home screen widget's favorite-location status in sync,
 * reflecting each location's current open/closed status and a countdown to
 * its next transition. Meant to be re-run whenever favorites change or the
 * app is foregrounded on a new day, so the widget doesn't go stale.
 *
 * Closing-soon/opening-now/favorite-food alerts themselves are no longer
 * scheduled here — they're computed server-side by the favorite-alerts-
 * dispatch Edge Function from the synced device_location_favorites /
 * device_food_favorites tables, so they're delivered as real pushes
 * regardless of whether the app has been opened recently.
 */
export async function refreshFavoriteLocationsWidgetData(db: ExpoSQLiteDatabase<typeof schema>) {
  const { homeScreenWidgetEnabled } = useWidgetPreferencesStore.getState();

  // The widget being turned off should clear it entirely, regardless of what
  // favorites exist — so short-circuit before doing any work.
  if (!homeScreenWidgetEnabled) {
    updateWidgetData([], []);
    return;
  }

  const currentMinutes = nowMinutesEastern();
  const favoriteFoods = await computeFavoriteFoodAvailability(db, currentMinutes);

  const favoriteLocations = await db.select().from(schema.location_favorites).execute();
  if (favoriteLocations.length === 0) {
    updateWidgetData([], favoriteFoods);
    return;
  }

  const locationNames = favoriteLocations.map((f) => f.location_name);
  // Joined in (rather than selecting schema.location.* alone) so the home
  // screen widget can pick the same per-type icon (dining hall/café/market/
  // etc.) the in-app location cards use — see getLocationIcon in
  // app/_components/LocationItem.tsx.
  const locations = await db
    .select({
      ...getTableColumns(schema.location),
      type: schema.location_type.name,
    })
    .from(schema.location)
    .innerJoin(schema.location_type, eq(schema.location.type_id, schema.location_type.id))
    .where(inArray(schema.location.name, locationNames))
    .execute();

  const widgetStatuses: FavoriteLocationStatus[] = [];

  for (const location of locations) {
    if (!location.name) continue;

    const { isOpen, transitionMinutes } = computeLocationOpenStatus(location, currentMinutes);
    // Sent as Unix seconds so the widget can render a live "CLOSES IN / OPENS
    // IN" countdown. Open → next close today; closed → next opening (later
    // today or a future day, so a closed favorite shows "OPENS IN …").
    const transitionEpoch = isOpen
      ? transitionMinutes !== null
        ? Math.floor(easternMinutesToday(transitionMinutes).getTime() / 1000)
        : null
      : computeNextOpenEpoch(location, currentMinutes);

    widgetStatuses.push({
      name: location.name,
      isOpen,
      transitionEpoch,
      type: location.type,
    });
  }

  // Open locations first (soonest-to-close at the top), then closed ones
  // (soonest-to-open first). Unknown transitions sort to the bottom of their
  // group.
  widgetStatuses.sort((a, b) => {
    if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
    if (a.transitionEpoch == null) return b.transitionEpoch == null ? 0 : 1;
    if (b.transitionEpoch == null) return -1;
    return a.transitionEpoch - b.transitionEpoch;
  });

  updateWidgetData(widgetStatuses, favoriteFoods);
}
