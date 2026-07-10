import { and, eq, getTableColumns, inArray } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import * as Notifications from 'expo-notifications';
import * as schema from '~/services/database/schema';
import {
  updateWidgetData,
  type FavoriteFoodAvailability,
  type FavoriteLocationStatus,
} from '~/modules/live-activity';
import { useWidgetPreferencesStore } from '~/store/useWidgetPreferencesStore';
import { getTodayInCentralTime } from '~/utils/date';
import { getTodaySchedule } from '~/utils/time';

const CATEGORY_CLOSING = 'closing-soon';
const CATEGORY_OPENING = 'opening-now';
const MINUTES_BEFORE_CLOSE = 30;

function convertToMinutes(time: number): number {
  const hour = Math.floor(time / 100);
  const minute = time % 100;
  return hour * 60 + minute;
}

// Builds the absolute Date instant for a given "minutes since midnight, Eastern
// Time, today" value — dining hall hours are always stored in Eastern Time
// regardless of the device's own timezone, so a naive `new Date()` with local
// getters would schedule the alert at the wrong instant for anyone outside ET.
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
// open/close transition to count down to today, from its list of
// today's service intervals. Live Activities always reflect this — not
// just the last 30 minutes before close — so favoriting a location shows
// its status "no matter what" for the rest of the day.
function computeLocationTransition(
  intervals: { openTime: number; closeTime: number }[],
  currentMinutes: number,
): { isOpen: boolean; transitionMinutes: number | null; label: 'Closes' | 'Opens' | null } {
  for (const interval of intervals) {
    const openM = convertToMinutes(interval.openTime);
    const closeM = convertToMinutes(interval.closeTime);
    if (currentMinutes >= openM && currentMinutes < closeM) {
      return { isOpen: true, transitionMinutes: closeM, label: 'Closes' };
    }
  }

  const nextOpen = intervals
    .map((interval) => convertToMinutes(interval.openTime))
    .filter((openM) => openM > currentMinutes)
    .sort((a, b) => a - b)[0];

  if (nextOpen !== undefined) {
    return { isOpen: false, transitionMinutes: nextOpen, label: 'Opens' };
  }

  // No more transitions today (e.g. already closed for the rest of the day).
  return { isOpen: false, transitionMinutes: null, label: null };
}

/**
 * Re-schedules "opens now" and "closing soon" (30 min before close) local
 * notifications for every favorited dining location, based on today's hours.
 * Always clears previously scheduled alerts of both kinds first, since this
 * is re-run whenever favorites change or the app is foregrounded on a new
 * day — without clearing, stale/duplicate alerts from a prior day or a
 * since-unfavorited location would pile up.
 *
 * Also keeps the home screen widget's favorite-location status AND
 * favorite-food availability in sync — the latter reflects every location
 * currently serving a favorited food today, not just favorited locations, so
 * a favorite food shows up in the widget regardless of whether its location
 * happens to be favorited too. This is independent of notification
 * permission — a revoked notification permission should stop alerts, not the
 * widget, so that logic isn't gated behind the `granted` check below.
 */
export async function scheduleClosingSoonNotifications(db: ExpoSQLiteDatabase<typeof schema>) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(
        (n) =>
          n.content.data?.category === CATEGORY_CLOSING ||
          n.content.data?.category === CATEGORY_OPENING,
      )
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) {
    // Notification permission was revoked (e.g. in system Settings) after
    // these were originally scheduled. Some platforms don't reliably purge
    // already-pending local notifications just because permission was later
    // revoked, so proactively cancel everything still queued — otherwise the
    // user can keep receiving "closing soon"/"opening now" alerts they
    // thought they'd turned off. This function already reruns on every app
    // foreground, so the queue gets swept clean shortly after the user
    // revokes permission.
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  const today = getTodayInCentralTime();

  const { homeScreenWidgetEnabled } = useWidgetPreferencesStore.getState();

  const favoriteLocations = await db.select().from(schema.location_favorites).execute();
  const locationNames = favoriteLocations.map((f) => f.location_name);

  // Which locations are serving each favorited food today, regardless of
  // whether that location is itself favorited — a favorite food should
  // surface in the widget no matter where it's being served.
  const favoriteFoodNames = await db.selectDistinct({ name: schema.favorites.name }).from(schema.favorites).execute();
  const foodMatches =
    favoriteFoodNames.length > 0
      ? await db
          .select({
            food_name: schema.food_item.name,
            location_name: schema.location.name,
          })
          .from(schema.food_item)
          .innerJoin(schema.menu_category, eq(schema.food_item.menu_category_id, schema.menu_category.id))
          .innerJoin(schema.menu, eq(schema.menu_category.menu_id, schema.menu.id))
          .innerJoin(schema.location, eq(schema.menu.location_id, schema.location.id))
          .where(
            and(
              eq(schema.menu.date, today),
              inArray(schema.food_item.name, favoriteFoodNames.map((f) => f.name)),
            ),
          )
          .execute()
      : [];

  const foodLocationNames = Array.from(
    new Set(foodMatches.map((m) => m.location_name).filter((name): name is string => !!name)),
  );
  // Every location we need full details for: favorited ones (for the
  // Locations section/local notifications) plus any location serving a
  // favorited food today (for the Food section), even if it isn't favorited
  // itself.
  const allLocationNames = Array.from(new Set([...locationNames, ...foodLocationNames]));

  // Joined in (rather than selecting schema.location.* alone) so the home
  // screen widget can pick the same per-type icon (dining hall/café/market/
  // etc.) the in-app location cards use — see getLocationIcon in
  // app/_components/LocationItem.tsx.
  const allLocations =
    allLocationNames.length > 0
      ? await db
          .select({
            ...getTableColumns(schema.location),
            type: schema.location_type.name,
          })
          .from(schema.location)
          .innerJoin(schema.location_type, eq(schema.location.type_id, schema.location_type.id))
          .where(inArray(schema.location.name, allLocationNames))
          .execute()
      : [];

  const now = new Date();
  const currentMinutes = nowMinutesEastern();

  // Open/closed right now for every location above — computed once so a
  // favorite food's serving locations can be marked open/closed even for
  // locations that aren't favorited (and thus never go through the loop
  // below, which only handles favorited locations' schedules).
  const isOpenByLocationName = new Map<string, boolean>();
  for (const location of allLocations) {
    if (!location.name) continue;
    if (location.force_close) {
      isOpenByLocationName.set(location.name, false);
      continue;
    }
    const schedule = getTodaySchedule(location);
    isOpenByLocationName.set(
      location.name,
      schedule ? computeLocationTransition(schedule.intervals, currentMinutes).isOpen : false,
    );
  }

  // Every favorited food plus every location (favorited or not) currently
  // serving it, for the widget's Food section.
  const foodOrder: string[] = [];
  const servingLocationsByFood = new Map<string, { name: string; isOpen: boolean }[]>();
  for (const match of foodMatches) {
    if (!match.food_name || !match.location_name) continue;

    if (!servingLocationsByFood.has(match.food_name)) {
      foodOrder.push(match.food_name);
      servingLocationsByFood.set(match.food_name, []);
    }
    const servingLocations = servingLocationsByFood.get(match.food_name)!;
    if (!servingLocations.some((l) => l.name === match.location_name)) {
      servingLocations.push({
        name: match.location_name,
        isOpen: isOpenByLocationName.get(match.location_name) ?? false,
      });
    }
  }
  // Sort each food's serving locations open-first (so "where can I get this
  // right now" reads left to right), then rank foods themselves by how many
  // locations carry them — a food available at more places is a safer bet to
  // show first than one you can only get in one place.
  const favoriteFoodsAvailability: FavoriteFoodAvailability[] = foodOrder
    .map((name) => ({
      name,
      servingLocations: (servingLocationsByFood.get(name) ?? [])
        .slice()
        .sort((a, b) => Number(b.isOpen) - Number(a.isOpen)),
    }))
    .sort((a, b) => b.servingLocations.length - a.servingLocations.length);

  const locations = allLocations.filter(
    (location): location is typeof location & { name: string } =>
      !!location.name && locationNames.includes(location.name),
  );
  const widgetStatuses: FavoriteLocationStatus[] = [];

  for (const location of locations) {
    if (!location.name) continue;

    if (location.force_close) {
      widgetStatuses.push({
        name: location.name,
        closesAtISO: null,
        isOpen: false,
        type: location.type,
      });
      continue;
    }

    const schedule = getTodaySchedule(location);
    if (!schedule) {
      widgetStatuses.push({
        name: location.name,
        closesAtISO: null,
        isOpen: false,
        type: location.type,
      });
      continue;
    }

    // "Opens now" / "closes soon" local push notifications.
    for (const interval of schedule.intervals) {
      const openAt = easternMinutesToday(convertToMinutes(interval.openTime));
      if (openAt > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${location.name} is now open`,
            body: `Open now — go grab a bite!`,
            data: { category: CATEGORY_OPENING, redirect_url: `/location/${location.name}` },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: openAt },
        });
      }

      const notifyMinutes = convertToMinutes(interval.closeTime) - MINUTES_BEFORE_CLOSE;
      const notifyAt = easternMinutesToday(notifyMinutes);
      if (notifyAt > now) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `${location.name} closes soon`,
            body: `Closes in ${MINUTES_BEFORE_CLOSE} minutes.`,
            data: { category: CATEGORY_CLOSING, redirect_url: `/location/${location.name}` },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifyAt },
        });
      }
    }

    const { isOpen, transitionMinutes } = computeLocationTransition(schedule.intervals, currentMinutes);
    const transitionISO = transitionMinutes !== null ? easternMinutesToday(transitionMinutes).toISOString() : null;

    widgetStatuses.push({
      name: location.name,
      closesAtISO: isOpen ? transitionISO : null,
      isOpen,
      type: location.type,
    });
  }

  // Respect the user's widget preference (Settings → Widgets). Disabling it
  // clears the widget rather than just skipping the update, so it doesn't
  // stay stuck showing stale data after being turned off. Note this runs
  // regardless of whether there are any favorited locations — a favorited
  // food being served somewhere today is enough to populate
  // favoriteFoodsAvailability even when widgetStatuses is empty.
  if (homeScreenWidgetEnabled) {
    updateWidgetData(widgetStatuses, favoriteFoodsAvailability);
  } else {
    updateWidgetData([], []);
  }
}
