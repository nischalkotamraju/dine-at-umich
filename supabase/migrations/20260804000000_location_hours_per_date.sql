-- Per-date scraped hours. The old location.regular_service_hours is a static
-- weekly schedule that drifts out of date (holidays, term changes, summer), so
-- hours are now scraped per calendar date from MDining's own "Today's Hours"
-- block (ul.calhours) alongside menus, and stored here one row per (location,
-- date). Blocks are the meal windows for dining halls (Breakfast/Lunch/Dinner/
-- Brunch) or a single "Open" block for cafés/markets.
create table if not exists "public"."location_hours" (
  "location_id" uuid not null references "public"."location"("id") on delete cascade,
  "date" text not null, -- YYYY-MM-DD (Eastern), matches menu.date
  "is_closed" boolean not null default false,
  -- [{ name: "Breakfast" | "Open" | ..., open: 700, close: 900 }] — open/close
  -- are HHMM integers (e.g. 1630 = 4:30 PM), same encoding as
  -- regular_service_hours.timeRanges, so existing open/close math still applies.
  "blocks" jsonb not null default '[]'::jsonb,
  "updated_at" timestamptz not null default now()
);

create unique index if not exists location_hours_pkey on "public"."location_hours" using btree (location_id, date);
alter table "public"."location_hours" add constraint "location_hours_pkey" primary key using index "location_hours_pkey";

-- Fast lookups by date (the app pulls a small window of dates around today).
create index if not exists location_hours_date_idx on "public"."location_hours" using btree (date);

alter table "public"."location_hours" enable row level security;

-- Public menu/hours data: readable by anyone (same as location), written only
-- by the scraper via the service role.
grant select on table "public"."location_hours" to "anon", "authenticated";
grant delete, insert, references, select, trigger, truncate, update on table "public"."location_hours" to "service_role";

create policy "Anyone can read location hours"
on "public"."location_hours"
for select
to public
using (true);
