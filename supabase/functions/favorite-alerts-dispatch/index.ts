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
const CLOSING_SOON_MINUTES = 30;
// Cron runs every 5 min; a slightly wider window than that tolerates a late
// tick without missing the "just opened" moment entirely (device_alert_log
// still prevents any duplicate sends across ticks).
const OPENING_WINDOW_MINUTES = 10;
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

// Attempts to claim an alert for (device, alertKey) by inserting into the
// dedup log. Returns true the first time (caller should send the push),
// false if it was already sent for this device+event (primary key conflict)
// — this is what keeps the 5-minute cron tick from re-sending the same
// closing-soon/opening-now/favorite-food alert repeatedly.
async function tryLogAlert(deviceId: string, alertKey: string): Promise<boolean> {
  const { error } = await supabase
    .from('device_alert_log')
    .insert({ device_id: deviceId, alert_key: alertKey });
  if (!error) return true;
  if (error.code === '23505') return false; // unique_violation — already sent
  console.error('❌ Error logging alert:', error);
  return false;
}

Deno.serve(async (_req) => {
  try {
    const { dateStr: today, nowMinutes, weekday } = easternNowParts();
    const results = { closing: 0, opening: 0, food: 0 };

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
          if (minutesUntilClose > 0 && minutesUntilClose <= CLOSING_SOON_MINUTES) {
            const alertKey = `closing:${fav.location_name}:${today}:${interval.close}`;
            if (await tryLogAlert(fav.device_id, alertKey)) {
              await sendPush(
                pushToken,
                `${fav.location_name} closes soon`,
                `Closes in ${minutesUntilClose} minutes.`,
                { category: 'closing-soon', redirect_url: `/location/${fav.location_name}` },
              );
              results.closing++;
            }
          }

          const minutesSinceOpen = nowMinutes - openM;
          if (minutesSinceOpen >= 0 && minutesSinceOpen < OPENING_WINDOW_MINUTES) {
            const alertKey = `opening:${fav.location_name}:${today}:${interval.open}`;
            if (await tryLogAlert(fav.device_id, alertKey)) {
              await sendPush(
                pushToken,
                `${fav.location_name} is now open`,
                `Open now — go grab a bite!`,
                { category: 'opening-now', redirect_url: `/location/${fav.location_name}` },
              );
              results.opening++;
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

      // Group today's matches by food name so a food offered at multiple
      // dining halls produces one alert listing all of them, matching the
      // grouping the client used to do in favoriteFoodAlerts.ts.
      const byFood = new Map<
        string,
        { locationNames: string[]; menuName: string; categoryName: string | null }
      >();

      for (const item of foodMatches ?? []) {
        const menuCategory = item.menu_category as unknown as {
          title: string | null;
          menu: { name: string | null; date: string; location: { name: string | null } | null } | null;
        } | null;
        const menu = menuCategory?.menu;
        const location = menu?.location;
        if (!item.name || !menu || menu.date !== today || !location?.name || !menu.name) continue;

        const existing = byFood.get(item.name);
        if (existing) {
          if (!existing.locationNames.includes(location.name)) existing.locationNames.push(location.name);
        } else {
          byFood.set(item.name, {
            locationNames: [location.name],
            menuName: menu.name,
            categoryName: menuCategory?.title ?? null,
          });
        }
      }

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

          const alertKey = `food:${today}:${fav.food_name}`;
          if (!(await tryLogAlert(fav.device_id, alertKey))) continue;

          const firstLocation = info.locationNames[0];
          const body =
            info.locationNames.length > 1
              ? `Find it at ${info.locationNames.join(', ')} for ${info.menuName}.`
              : `Find it at ${firstLocation} for ${info.menuName}.`;

          await sendPush(pushToken, `${fav.food_name} is available today!`, body, {
            category: 'favorite-food-appearance',
            redirect_url: `/food/${fav.food_name}?location=${firstLocation}&menu=${info.menuName}&category=${info.categoryName ?? ''}`,
          });
          results.food++;
        }
      }
    }

    return new Response(JSON.stringify({ success: true, ...results }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
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
