// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.
// Setup type definitions for built-in Supabase Runtime APIs
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Invoked every 5 minutes by pg_cron (see
// supabase/migrations/20260716000000_favorite_alerts_sync.sql). Computes,
// server-side, the same three alert types the app used to schedule locally
// on-device (closing-soon, opening-now, favorite-food-appearance) — but
// personalized per device from the synced device_location_favorites /
// device_food_favorites tables, so delivery no longer depends on the app
// having been foregrounded recently.

const supabase = createClient(
  Deno.env.get('SUPABASE_URL'),
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
);

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
// Two closing heads-ups per closing time: a "within the hour" nudge and a
// final "closes soon" one. The windows partition the timeline (60..30 and
// 30..0 minutes before close) so each fires exactly once, on the first
// 5-minute cron tick that enters its band.
const CLOSING_THRESHOLDS = [
  { within: 60, floor: 30, title: 'closes within the hour', body: 'Closes within the hour.' },
  { within: 30, floor: 0, title: 'closes soon', body: 'Closes within the half hour.' },
];
// Cron runs every 5 min; a slightly wider window than that tolerates a late
// tick without missing the "just opened" moment entirely (device_alert_log
// still prevents any duplicate sends across ticks).
const OPENING_WINDOW_MINUTES = 10;
// Same tolerance for the "just closed" alert that fires right after a location's
// closing time, so a favorited spot's final state change is announced too.
const CLOSED_WINDOW_MINUTES = 10;
// Favorite-food alerts fire at the START of each meal a dish is served in, so
// they land when the dish is actually gettable (a breakfast+dinner dish pings
// around breakfast and again around dinner). Canonical meal starts in Eastern
// minutes; "menu" is the single café/market menu, given one midday heads-up.
const MEAL_STARTS: Record<string, number> = {
  breakfast: 7 * 60,
  brunch: 10 * 60,
  lunch: 11 * 60,
  dinner: 17 * 60,
  menu: 11 * 60,
};
// Fire within this many minutes of a meal's start; a few cron ticks of slack,
// with device_alert_log keeping it to one send per meal per day.
const MEAL_START_WINDOW_MINUTES = 20;
// Dining hall hours (and the menu `date` column) are always in Eastern Time
// (Ann Arbor, MI), regardless of where the request originates from.
const TIMEZONE = 'America/Detroit';

interface TimeRange {
  open: number;
  close: number;
}
interface DaySchedule {
  isClosed?: boolean;
  timeRanges?: TimeRange[];
}
type ServiceHours = Record<string, DaySchedule | undefined>;

// Returns today's date (as stored in menu.date), the current
// minutes-since-midnight, and the current weekday name — all normalized to
// Eastern Time via Intl rather than pulling in a date-fns-tz dependency.
function easternNowParts() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    weekday: 'long',
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const year = get('year');
  const month = get('month');
  const day = get('day');
  let hour = Number(get('hour'));
  if (hour === 24) hour = 0; // Intl can report midnight as "24" with hour12:false
  const minute = Number(get('minute'));
  const weekday = get('weekday').toLowerCase();

  return {
    dateStr: `${year}-${month}-${day}`,
    nowMinutes: hour * 60 + minute,
    weekday,
  };
}

function convertToMinutes(time: number): number {
  const hour = Math.floor(time / 100);
  const minute = time % 100;
  return hour * 60 + minute;
}

function getTodayIntervals(regularServiceHours: unknown, weekday: string): TimeRange[] {
  if (!regularServiceHours || typeof regularServiceHours !== 'object') return [];
  const serviceHours = regularServiceHours as ServiceHours;
  const daySchedule = serviceHours[weekday];
  if (!daySchedule || daySchedule.isClosed || !Array.isArray(daySchedule.timeRanges)) return [];
  return daySchedule.timeRanges;
}

async function sendPush(pushToken: string, title: string, body: string, data: Record<string, unknown>) {
  await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('EXPO_ACCESS_TOKEN')}`,
    },
    body: JSON.stringify({ to: pushToken, sound: 'default', title, body, data }),
  });
}

// Attempts to claim an alert for (pushToken, alertKey) by inserting into the
// dedup log. Returns true the first time (caller should send the push), false
// if it was already sent for this token+event (primary key conflict).
//
// Keyed by PUSH TOKEN, not device_id: a single physical device can accumulate
// several device_id rows (device_id is app-local and regenerates on reinstall,
// while favorites re-sync each launch), all pointing at the same push token.
// Deduping on device_id would then deliver the same alert to the phone once
// per stale row. The push token is the actual delivery target, so it's the
// correct dedup identity. (The column is still named device_id; it just stores
// the token here.)
async function tryLogAlert(pushToken: string, alertKey: string): Promise<boolean> {
  const { error } = await supabase
    .from('device_alert_log')
    .insert({ device_id: pushToken, alert_key: alertKey });
  if (!error) return true;
  if (error.code === '23505') return false; // unique_violation — already sent
  console.error('❌ Error logging alert:', error);
  return false;
}

Deno.serve(async (_req) => {
  try {
    const { dateStr: today, nowMinutes, weekday } = easternNowParts();
    const results = { closing: 0, opening: 0, food: 0 };

    // Diagnostics returned in the response so a manual curl can reveal why a
    // test alert didn't fire without needing table access (RLS hides these
    // from the anon key). Harmless to leave on.
    const { count: devicesRegistered } = await supabase
      .from('user_devices')
      .select('*', { count: 'exact', head: true });
    let foodsOnMenuToday = 0;

    // ---- Closing-soon / opening-now alerts for favorited locations ----
    const { data: locationFavorites, error: locFavError } = await supabase
      .from('device_location_favorites')
      .select('device_id, location_name');
    if (locFavError) throw locFavError;

    if (locationFavorites && locationFavorites.length > 0) {
      const locationNames = [...new Set(locationFavorites.map((f) => f.location_name))];
      const { data: locations, error: locError } = await supabase
        .from('location')
        .select('name, regular_service_hours, force_close')
        .in('name', locationNames);
      if (locError) throw locError;
      const locationByName = new Map((locations ?? []).map((l) => [l.name, l]));

      const deviceIds = [...new Set(locationFavorites.map((f) => f.device_id))];
      const { data: devices, error: devError } = await supabase
        .from('user_devices')
        .select('device_id, push_token')
        .in('device_id', deviceIds);
      if (devError) throw devError;
      const tokenByDevice = new Map((devices ?? []).map((d) => [d.device_id, d.push_token]));

      for (const fav of locationFavorites) {
        const location = locationByName.get(fav.location_name);
        if (!location || location.force_close) continue;

        const pushToken = tokenByDevice.get(fav.device_id);
        if (!pushToken) continue;

        const intervals = getTodayIntervals(location.regular_service_hours, weekday);
        for (const interval of intervals) {
          const openM = convertToMinutes(interval.open);
          const closeM = convertToMinutes(interval.close);

          const minutesUntilClose = closeM - nowMinutes;
          for (const t of CLOSING_THRESHOLDS) {
            if (minutesUntilClose <= t.within && minutesUntilClose > t.floor) {
              const alertKey = `closing:${fav.location_name}:${today}:${interval.close}:${t.within}`;
              if (await tryLogAlert(pushToken, alertKey)) {
                await sendPush(
                  pushToken,
                  `${fav.location_name} ${t.title}`,
                  t.body,
                  { category: 'closing-soon', redirect_url: `/location/${fav.location_name}` },
                );
                results.closing++;
              }
            }
          }

          const minutesSinceOpen = nowMinutes - openM;
          if (minutesSinceOpen >= 0 && minutesSinceOpen < OPENING_WINDOW_MINUTES) {
            const alertKey = `opening:${fav.location_name}:${today}:${interval.open}`;
            if (await tryLogAlert(pushToken, alertKey)) {
              await sendPush(
                pushToken,
                `${fav.location_name} is now open`,
                `Open now — go grab a bite!`,
                { category: 'opening-now', redirect_url: `/location/${fav.location_name}` },
              );
              results.opening++;
            }
          }

          const minutesSinceClose = nowMinutes - closeM;
          if (minutesSinceClose >= 0 && minutesSinceClose < CLOSED_WINDOW_MINUTES) {
            const alertKey = `closed:${fav.location_name}:${today}:${interval.close}`;
            if (await tryLogAlert(pushToken, alertKey)) {
              await sendPush(
                pushToken,
                `${fav.location_name} is now closed`,
                `Closed for now.`,
                { category: 'now-closed', redirect_url: `/location/${fav.location_name}` },
              );
              results.closing++;
            }
          }
        }
      }
    }

    // ---- Favorite-food-appearance alerts ----
    const { data: foodFavorites, error: foodFavError } = await supabase
      .from('device_food_favorites')
      .select('device_id, food_name');
    if (foodFavError) throw foodFavError;

    if (foodFavorites && foodFavorites.length > 0) {
      const foodNames = [...new Set(foodFavorites.map((f) => f.food_name))];
      const { data: foodMatches, error: foodError } = await supabase
        .from('food_item')
        .select(
          'name, menu_category:menu_category_id(title, menu:menu_id(name, date, location:location_id(name)))',
        )
        .in('name', foodNames);
      if (foodError) throw foodError;

      // food name -> the meals it's served in today + the locations serving it.
      const byFood = new Map<string, { meals: Set<string>; locationNames: string[] }>();

      for (const item of foodMatches ?? []) {
        const menuCategory = item.menu_category as unknown as {
          title: string | null;
          menu: { name: string | null; date: string; location: { name: string | null } | null } | null;
        } | null;
        const menu = menuCategory?.menu;
        const location = menu?.location;
        if (!item.name || !menu || menu.date !== today || !location?.name || !menu.name) continue;

        const meal = menu.name.toLowerCase();
        const existing = byFood.get(item.name);
        if (existing) {
          existing.meals.add(meal);
          if (!existing.locationNames.includes(location.name)) existing.locationNames.push(location.name);
        } else {
          byFood.set(item.name, { meals: new Set([meal]), locationNames: [location.name] });
        }
      }

      foodsOnMenuToday = byFood.size;

      if (byFood.size > 0) {
        const deviceIds = [...new Set(foodFavorites.map((f) => f.device_id))];
        const { data: devices, error: devError } = await supabase
          .from('user_devices')
          .select('device_id, push_token')
          .in('device_id', deviceIds);
        if (devError) throw devError;
        const tokenByDevice = new Map((devices ?? []).map((d) => [d.device_id, d.push_token]));

        for (const fav of foodFavorites) {
          const info = byFood.get(fav.food_name);
          if (!info) continue;
          const pushToken = tokenByDevice.get(fav.device_id);
          if (!pushToken) continue;

          // Fire once for each of the dish's meals that's starting right now.
          for (const meal of info.meals) {
            const start = MEAL_STARTS[meal];
            if (start === undefined) continue;
            if (nowMinutes < start || nowMinutes >= start + MEAL_START_WINDOW_MINUTES) continue;

            const alertKey = `food:${today}:${meal}:${fav.food_name}`;
            if (!(await tryLogAlert(pushToken, alertKey))) continue;

            const where =
              info.locationNames.length > 1
                ? info.locationNames.join(', ')
                : info.locationNames[0];
            const isMeal = meal !== 'menu';
            const title = isMeal
              ? `${fav.food_name} — ${meal.charAt(0).toUpperCase()}${meal.slice(1)}`
              : `${fav.food_name} is available today`;
            const body = isMeal ? `Being served now at ${where}.` : `Find it at ${where}.`;

            await sendPush(pushToken, title, body, {
              category: 'favorite-food-appearance',
              redirect_url: `/food/${fav.food_name}?location=${info.locationNames[0]}`,
            });
            results.food++;
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...results,
        debug: {
          today,
          nowMinutes,
          weekday,
          devicesRegistered: devicesRegistered ?? 0,
          locationFavorites: locationFavorites?.length ?? 0,
          foodFavorites: foodFavorites?.length ?? 0,
          foodsOnMenuToday,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('❌ favorite-alerts-dispatch error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/favorite-alerts-dispatch' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{}'

  Note: this function takes no body — it computes everything from
  device_location_favorites / device_food_favorites / today's menus.

*/
