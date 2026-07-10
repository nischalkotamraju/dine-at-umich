-- Adds what's needed to send scheduled ActivityKit push updates for the
-- "closing soon" Live Activity from the server instead of only ever updating
-- it on app foreground:
--   1. A per-device push token + activity id for the currently running
--      Live Activity (separate from the existing Expo `push_token` column,
--      which is unrelated — ActivityKit pushes go straight to APNs).
--   2. A `favorited_locations` table so the server knows which locations a
--      device cares about, since favorites are otherwise local-only SQLite
--      data never synced to Supabase.

alter table "public"."user_devices" add column "live_activity_push_token" text;

alter table "public"."user_devices" add column "live_activity_id" text;


create table "public"."favorited_locations" (
    "device_id" text not null,
    "location_name" text not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."favorited_locations" enable row level security;

CREATE UNIQUE INDEX favorited_locations_pkey ON public.favorited_locations USING btree (device_id, location_name);

alter table "public"."favorited_locations" add constraint "favorited_locations_pkey" PRIMARY KEY using index "favorited_locations_pkey";

alter table "public"."favorited_locations" add constraint "favorited_locations_device_id_fkey" FOREIGN KEY (device_id) REFERENCES public.user_devices(device_id) ON DELETE CASCADE;

grant delete on table "public"."favorited_locations" to "anon";

grant insert on table "public"."favorited_locations" to "anon";

grant references on table "public"."favorited_locations" to "anon";

grant select on table "public"."favorited_locations" to "anon";

grant trigger on table "public"."favorited_locations" to "anon";

grant truncate on table "public"."favorited_locations" to "anon";

grant update on table "public"."favorited_locations" to "anon";

grant delete on table "public"."favorited_locations" to "authenticated";

grant insert on table "public"."favorited_locations" to "authenticated";

grant references on table "public"."favorited_locations" to "authenticated";

grant select on table "public"."favorited_locations" to "authenticated";

grant trigger on table "public"."favorited_locations" to "authenticated";

grant truncate on table "public"."favorited_locations" to "authenticated";

grant update on table "public"."favorited_locations" to "authenticated";

grant delete on table "public"."favorited_locations" to "service_role";

grant insert on table "public"."favorited_locations" to "service_role";

grant references on table "public"."favorited_locations" to "service_role";

grant select on table "public"."favorited_locations" to "service_role";

grant trigger on table "public"."favorited_locations" to "service_role";

grant truncate on table "public"."favorited_locations" to "service_role";

grant update on table "public"."favorited_locations" to "service_role";


create policy "Device can read its own favorites"
on "public"."favorited_locations"
as permissive
for select
to public
using ((device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text)));


create policy "Device can insert its own favorites"
on "public"."favorited_locations"
as permissive
for insert
to public
with check ((device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text)));


create policy "Device can delete its own favorites"
on "public"."favorited_locations"
as permissive
for delete
to public
using ((device_id = ((current_setting('request.headers'::text, true))::json ->> 'x-device-id'::text)));
