import { and, eq, inArray } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as schema from '~/services/database/schema';
import type { HoursBlock } from '~/services/database/schema';
import { getTodayInCentralTime } from '~/utils/date';

export type { HoursBlock };

// A single date's scraped hours. `status`:
//  - 'open'    -> has one or more serving blocks (blocks populated)
//  - 'closed'  -> scraper recorded the location as closed that day
//  - 'unknown' -> no scraped row yet (never fall back to stale weekly hours)
export type DayHours = {
  date: string;
  status: 'open' | 'closed' | 'unknown';
  blocks: HoursBlock[];
};

// The 5-date window the hours modal shows: today-2 .. today+2, in order.
export function hoursWindowDates(today = getTodayInCentralTime()): string[] {
  const base = new Date(`${today}T12:00:00`);
  const out: string[] = [];
  for (let offset = -2; offset <= 2; offset++) {
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    out.push(d.toISOString().split('T')[0]);
  }
  return out;
}

function toDayHours(date: string, row: schema.LocationHours | undefined): DayHours {
  if (!row) return { date, status: 'unknown', blocks: [] };
  const blocks = (Array.isArray(row.blocks) ? row.blocks : []) as HoursBlock[];
  if (row.is_closed || blocks.length === 0) return { date, status: 'closed', blocks: [] };
  return { date, status: 'open', blocks: [...blocks].sort((a, b) => a.open - b.open) };
}

/** Scraped hours for a location across `dates`, one entry per date, in order. */
export async function getHoursForDates(
  db: ExpoSQLiteDatabase<typeof schema>,
  locationName: string,
  dates: string[],
): Promise<DayHours[]> {
  const locRows = await db
    .select({ id: schema.location.id })
    .from(schema.location)
    .where(eq(schema.location.name, locationName))
    .execute();
  const locationId = locRows[0]?.id;
  if (!locationId) return dates.map((date) => ({ date, status: 'unknown', blocks: [] }));

  const rows = await db
    .select()
    .from(schema.location_hours)
    .where(
      and(
        eq(schema.location_hours.location_id, locationId),
        inArray(schema.location_hours.date, dates),
      ),
    )
    .execute();
  const byDate = new Map(rows.map((r) => [r.date, r]));
  return dates.map((date) => toDayHours(date, byDate.get(date)));
}

/** A location's hours for a single date. */
export async function getHoursForDate(
  db: ExpoSQLiteDatabase<typeof schema>,
  locationName: string,
  date: string,
): Promise<DayHours> {
  return (await getHoursForDates(db, locationName, [date]))[0];
}

// ---------------------------------------------------------------------------
// Synchronous readers. expo-sqlite drizzle supports synchronous .get()/.all(),
// which the app's open/closed status logic relies on (it runs inside effects
// and the widget refresh without an await boundary). These mirror the async
// readers above but never fall back to stale weekly hours — a missing row is
// surfaced as status: 'unknown'.

/** One date's scraped hours for a location id, read synchronously. */
export function getDayHoursSync(
  db: ExpoSQLiteDatabase<typeof schema>,
  locationId: string,
  date: string,
): DayHours {
  const row = db
    .select()
    .from(schema.location_hours)
    .where(
      and(
        eq(schema.location_hours.location_id, locationId),
        eq(schema.location_hours.date, date),
      ),
    )
    .get();
  return toDayHours(date, row as schema.LocationHours | undefined);
}

/** One date's scraped hours for a location name, read synchronously. */
export function getDayHoursByNameSync(
  db: ExpoSQLiteDatabase<typeof schema>,
  locationName: string,
  date: string,
): DayHours {
  const loc = db
    .select({ id: schema.location.id })
    .from(schema.location)
    .where(eq(schema.location.name, locationName))
    .get();
  if (!loc?.id) return { date, status: 'unknown', blocks: [] };
  return getDayHoursSync(db, loc.id, date);
}

/**
 * Every location's scraped hours for `date`, keyed by location id, read
 * synchronously — for list screens that render many locations at once.
 */
export function getHoursMapForDateSync(
  db: ExpoSQLiteDatabase<typeof schema>,
  date: string,
): Map<string, DayHours> {
  const rows = db
    .select()
    .from(schema.location_hours)
    .where(eq(schema.location_hours.date, date))
    .all();
  const map = new Map<string, DayHours>();
  for (const row of rows) {
    map.set(row.location_id, toDayHours(date, row as schema.LocationHours));
  }
  return map;
}
