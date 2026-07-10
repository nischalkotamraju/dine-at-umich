import { and, eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import type * as schema from '~/services/database/schema';
import { type Location, type LocationWithType, menu } from '~/services/database/schema';
import { getTodayInCentralTime } from '~/utils/date';
import { getLocationTimeMessage, isLocationOpen } from '~/utils/time';

export function getLocationOpenStatus(
  location: LocationWithType,
  locationData: Location | null,
  db: ExpoSQLiteDatabase<typeof schema>,
  currentTime: Date = new Date(),
  targetDate?: string,
): boolean {
  // Use provided date or default to today's date in Central Time
  const dateToCheck = targetDate || getTodayInCentralTime();

  // Check if location has menus and if there's menu data for the specific date
  if (location.has_menus) {
    const menuData = db
      .select()
      .from(menu)
      .where(and(eq(menu.location_id, location.id), eq(menu.date, dateToCheck)))
      .get();
    if (!menuData) {
      return false;
    }
  }

  // Check if location is open based on time
  return isLocationOpen(locationData, currentTime);
}

export type LocationStatus = 'open' | 'opening_soon' | 'closed';

/**
 * Returns 'open' if currently open (has menu data + within hours),
 * 'opening_soon' if closed now but will open later today,
 * 'closed' otherwise.
 */
export function getDetailedLocationStatus(
  location: LocationWithType,
  locationData: Location | null,
  db: ExpoSQLiteDatabase<typeof schema>,
  currentTime: Date = new Date(),
  targetDate?: string,
): LocationStatus {
  if (locationData?.force_close) return 'closed';

  const isOpen = getLocationOpenStatus(location, locationData, db, currentTime, targetDate);
  if (isOpen) return 'open';

  // Check schedule only (ignoring menu data) to detect "opening soon"
  const msg = getLocationTimeMessage(locationData, currentTime);
  if (msg.startsWith('Opens in')) return 'opening_soon';

  return 'closed';
}
