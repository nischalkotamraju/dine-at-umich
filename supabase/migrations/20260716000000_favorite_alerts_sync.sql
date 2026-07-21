-- Favorites sync (per-device) + server-side alert dedup log, enabling
-- personalized closing-soon / opening-now / favorite-food-appearance push
-- notifications computed server-side by the favorite-alerts-dispatch Edge
-- Function (invoked on a schedule via pg_cron + pg_net below), rather than
-- relying on the app being foregrounded to (re)schedule local notifications.

create table "public"."device_location_favorites" (
    "device_id" text not null,
    "location_name" text not null,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."device_location_favorites" enable row level security;

CREATE UNIQUE INDEX device_location_favorites_pkey ON public.device_location_favorites USING btree (device_id, location_name);

alter table "public"."device_location_favorites" add constraint "device_location_favorites_pkey" PRIMARY KEY using index "device_location_favorites_pkey";

create table "public"."device_food_favorites" (
    "device_id" text not null,
    "food_name" text not null,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."device_food_favorites" enable row level security;

CREATE UNIQUE INDEX device_food_favorites_pkey ON public.device_food_favorites USING btree (device_id, food_name);

alter table "public"."device_food_favorites" add constraint "device_food_favorites_pkey" PRIMARY KEY using index "device_food_favorites_pkey";

-- Server-side dedup log so favorite-alerts-dispatch (which polls every 5
-- minutes) doesn't re-send the same closing-soon/opening-now/favorite-food
-- alert to a device on every tick. Mirrors the purpose of the client's old
-- useFoodAlertsStore + "clear scheduled, reschedule" local dedup, but keyed
-- server-side since delivery is now server-driven. Never touched by the
-- client directly, only by the Edge Function via the service role key.
create table "public"."device_alert_log" (
    "device_id" text not null,
    "alert_key" text not null,
    "sent_at" timestamp with time zone not null default now()
);

alter table "public"."device_alert_log" enable row level security;

CREATE UNIQUE INDEX device_alert_log_pkey ON public.device_alert_log USING btree (device_id, alert_key);

alter table "public"."device_alert_log" add constraint "device_alert_log_pkey" PRIMARY KEY using index "device_alert_log_pkey";

-- Grants: same anon/authenticated/service_role pattern as user_devices
-- (20250704170007_push_notification_setup.sql) — this app has no Supabase
-- Auth, devices are anonymous and identified via the x-device-id header
-- enforced by the RLS policies below.
grant delete, insert, references, select, trigger, truncate, update on table "public"."device_location_favorites" to "anon", "authenticated", "service_role";

grant delete, insert, references, select, trigger, truncate, update on table "public"."device_food_favorites" to "anon", "authenticated", "service_role";

grant delete, insert, references, select, trigger, truncate, update on table "public"."device_alert_log" to "service_role";

create policy "Device can read its own location favorites"
on "public"."device_location_favorites"
as permissive
for select
to public
using ((device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text)));

create policy "Device can insert its own location favorites"
on "public"."device_location_favorites"
as permissive
for insert
to public
with check ((device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text)));

create policy "Device can delete its own location favorites"
on "public"."device_location_favorites"
as permissive
for delete
to public
using ((device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text)));

create policy "Device can read its own food favorites"
on "public"."device_food_favorites"
as permissive
for select
to public
using ((device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text)));

create policy "Device can insert its own food favorites"
on "public"."device_food_favorites"
as permissive
for insert
to public
with check ((device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text)));

create policy "Device can delete its own food favorites"
on "public"."device_food_favorites"
as permissive
for delete
to public
using ((device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text)));

-- Scheduling: enable pg_cron + pg_net so Postgres itself can invoke the
-- favorite-alerts-dispatch Edge Function on a schedule, avoiding the
-- multi-minute delivery lag GitHub Actions' cron scheduler can exhibit at
-- peak load (this app's other scheduled job, scrape-menus.yaml, doesn't need
-- tight timing, but a "closing in 30 minutes" alert does).
create extension if not exists pg_cron with schema extensions;

create extension if not exists pg_net with schema extensions;

-- The cron job authenticates to the Edge Function with the project's public
-- anon key. This is safe to commit: it's the same key already shipped in the
-- mobile app bundle, RLS protects all data, and here it only needs to satisfy
-- the function gateway's JWT check (verify_jwt). The function itself uses the
-- service-role key from its own environment (SUPABASE_SERVICE_ROLE_KEY) for
-- every database read/write, so the caller's token grants no extra access.
select
  cron.schedule(
    'favorite-alerts-dispatch',
    '*/5 * * * *',
    $$
    select net.http_post(
      url := 'https://gtkzwyhqxtubgmlvovmn.supabase.co/functions/v1/favorite-alerts-dispatch',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0a3p3eWhxeHR1YmdtbHZvdm1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NjI4NjksImV4cCI6MjA5ODMzODg2OX0.dGT07TNYz2OGEXqrrZzRSkYuL9L4fiAIexj1aVSHiEA'
      ),
      body := '{}'::jsonb
    );
    $$
  );
