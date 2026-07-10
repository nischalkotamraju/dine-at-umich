-- Reverts 20260709000000_live_activity_push_support.sql — the Live Activity
-- no longer shows any dining status content or receives server-sent APNs
-- push updates (it's now just a static Dynamic Island shortcut), so the
-- favorited_locations table and user_devices' Live Activity columns are no
-- longer used by any client or Edge Function.

drop table if exists "public"."favorited_locations";

alter table "public"."user_devices" drop column if exists "live_activity_push_token";

alter table "public"."user_devices" drop column if exists "live_activity_id";
