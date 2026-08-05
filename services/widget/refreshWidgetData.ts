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
import { getDishesServingLocations } from '~/utils/foodAvailability';
import { getDayHoursSync, type DayHours } from '~/utils/hours';

// Open status + next transition for a dish at a location, derived from that
// dish's MEAL window(s) today (HHMM intervals from getDishesServingLocations),
// so the widget matches the app: a breakfast dish reads as open only during
// breakfast, not the hall's whole day. Transition is this window's close when
// open, or the next window's open when closed (null if none left today).
function mealIntervalStatus(
  intervals: { open: number; close: number }[],
  currentMinutes: number,
): { isOpen: boolean; transitionEpoch: number | null } {
  const mins = intervals
    .map((iv) => ({ open: convertToMinutes(iv.open), close: convertToMinutes(iv.close) }))
    .sort((a, b) => a.open - b.open);
  for (const iv of mins) {
    if (currentMinutes >= iv.open && currentMinutes < iv.close) {
      return { isOpen: true, transitionEpoch: Math.floor(easternMinutesToday(iv.close).getTime() / 1000) };
    }
  }
  const next = mins.find((iv) => iv.open > currentMinutes);
  return {
    isOpen: false,
    transitionEpoch: next ? Math.floor(easternMinutesToday(next.open).getTime() / 1000) : null,
  };
}

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

// Today..+2 scraped hours for a location, read synchronously. The widget can
// only look two days ahead — that's the scraped window — but a favorite closed
// for longer than that is rare.
function locationHoursWindow(
  db: ExpoSQLiteDatabase<typeof schema>,
  locationId: string,
): DayHours[] {
  const today = getTodayInCentralTime();
  return [0, 1, 2].map((offset) => {
    const d = new Date(`${today}T12:00:00`);
    d.setDate(d.getDate() + offset);
    return getDayHoursSync(db, locationId, d.toISOString().split('T')[0]);
  });
}

// A scraped day's serving blocks as HHMM open/close intervals (empty unless the
// day is 'open').
function dayIntervals(day: DayHours): { openTime: number; closeTime: number }[] {
  return day.status === 'open'
    ? day.blocks.map((b) => ({ openTime: b.open, closeTime: b.close }))
    : [];
}

// Resolves a location's current open/closed status and next transition from
// today's scraped hours, folding in the force_close override. Shared by the
// favorite-locations status list and the favorite-food availability lookup so
// both agree on whether a location is open right now.
function computeLocationOpenStatus(
  location: schema.Location,
  todayHours: DayHours,
  currentMinutes: number,
): { isOpen: boolean; transitionMinutes: number | null } {
  if (location.force_close) return { isOpen: false, transitionMinutes: null };
  return computeLocationTransition(dayIntervals(todayHours), currentMinutes);
}

// Unix seconds of a location's next opening — later today if there's still an
// interval to come, otherwise the earliest opening on a future scraped day
// (within the today..+2 window). Returns the instant so the widget can show
// "OPENS IN …" for a closed favorite instead of a bare "CLOSED".
function computeNextOpenEpoch(
  location: schema.Location,
  window: DayHours[],
  currentMinutes: number,
): number | null {
  if (location.force_close) return null;

  // Still opening later today?
  const nextOpenToday = dayIntervals(window[0])
    .map((i) => convertToMinutes(i.openTime))
    .filter((m) => m > currentMinutes)
    .sort((a, b) => a - b)[0];
  if (nextOpenToday !== undefined) {
    return Math.floor(easternMinutesToday(nextOpenToday).getTime() / 1000);
  }

  // Otherwise the earliest opening on the next scraped open day.
  const nowEastern = toZonedTime(new Date(), 'America/Detroit');
  for (let offset = 1; offset < window.length; offset++) {
    const intervals = dayIntervals(window[offset]);
    if (intervals.length) {
      const earliestOpen = convertToMinutes(
        [...intervals].sort((a, b) => a.openTime - b.openTime)[0].openTime,
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

  // Meal-accurate serving windows (a breakfast dish -> just the breakfast
  // window), shared with the Saved tab so the widget and app never disagree.
  const byFood = await getDishesServingLocations(db, orderedFoodNames);

  return orderedFoodNames
    .filter((name) => (byFood[name]?.length ?? 0) > 0)
    .map((name) => ({
      name,
      category: categoryByFood.get(name) ?? null,
      servingLocations: (byFood[name] ?? []).map((loc) => {
        const { isOpen, transitionEpoch } = mealIntervalStatus(loc.intervals, currentMinutes);
        return { name: loc.name, isOpen, transitionEpoch };
      }),
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

    const window = locationHoursWindow(db, location.id);
    const { isOpen, transitionMinutes } = computeLocationOpenStatus(location, window[0], currentMinutes);
    // Sent as Unix seconds so the widget can render a live "CLOSES IN / OPENS
    // IN" countdown. Open → next close today; closed → next opening (later
    // today or a future day, so a closed favorite shows "OPENS IN …").
    const transitionEpoch = isOpen
      ? transitionMinutes !== null
        ? Math.floor(easternMinutesToday(transitionMinutes).getTime() / 1000)
        : null
      : computeNextOpenEpoch(location, window, currentMinutes);

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
