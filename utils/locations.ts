import { eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';

import { useDatabase } from '~/hooks/useDatabase';
import * as schema from '~/services/database/schema';

// Type definition for meal times from database
export interface MealTimes {
  breakfast?: { openTime: number; closeTime: number };
  lunch?: { openTime: number; closeTime: number };
  dinner?: { openTime: number; closeTime: number };
}

/**
 * Get meal times from database for a given location
 * @param db - The database instance
 * @param locationName - The location name
 * @returns The meal times for the location or null if not found
 */
export const getMealTimes = (
  db: ExpoSQLiteDatabase<typeof schema>,
  locationName: string,
): MealTimes | null => {
  try {
    const locationData = db
      .select({
        meal_times: schema.location.meal_times,
      })
      .from(schema.location)
      .where(eq(schema.location.name, locationName))
      .get();

    if (locationData?.meal_times) {
      const mealTimes: MealTimes = {};
      const raw = locationData.meal_times;

      // Support both array format [{name, start_time, end_time}] and
      // object format {"breakfast": {"open": 700, "close": 900}, ...}
      if (Array.isArray(raw)) {
        (raw as { name: string; start_time: number; end_time: number }[]).forEach((meal) => {
          if (!meal?.name) return;
          const mealName = meal.name.toLowerCase() as 'breakfast' | 'lunch' | 'dinner';
          mealTimes[mealName] = { openTime: meal.start_time, closeTime: meal.end_time };
        });
      } else if (raw !== null && typeof raw === 'object') {
        const obj = raw as Record<string, { open: number; close: number }>;
        for (const key of ['breakfast', 'lunch', 'dinner'] as const) {
          if (obj[key]) {
            mealTimes[key] = { openTime: obj[key].open, closeTime: obj[key].close };
          }
        }
      }

      return Object.keys(mealTimes).length > 0 ? mealTimes : null;
    }

    return null;
  } catch (error) {
    console.error('Error fetching meal times from database:', error);
    return null;
  }
};

/**
 * Hook version for React components that need reactive updates for meal times
 */
export const useMealTimes = (locationName: string): MealTimes | null => {
  const db = useDatabase();
  return getMealTimes(db, locationName);
};
