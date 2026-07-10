import { and, eq, inArray } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as Notifications from 'expo-notifications';
import * as schema from '~/services/database/schema';
import { useFoodAlertsStore } from '~/store/useFoodAlertsStore';
import { getTodayInCentralTime } from '~/utils/date';

/**
 * Checks whether any favorited food item appears on today's menu at any
 * dining location, and fires a single local notification the first time each
 * food is seen for the day — combining every location it's offered at into
 * one notification (e.g. "Chicken Parm is available today! Find it at West
 * Campus, PCL for Lunch.") instead of sending a separate notification per
 * dining hall.
 *
 * Meant to be called right after fresh menu data is synced in, since that's
 * the only time today's menu contents can actually change.
 */
export async function checkFavoriteFoodAppearances(db: ExpoSQLiteDatabase<typeof schema>) {
  const favoriteNames = await db
    .selectDistinct({ name: schema.favorites.name })
    .from(schema.favorites)
    .execute();

  if (favoriteNames.length === 0) return;

  const { granted } = await Notifications.getPermissionsAsync();
  if (!granted) return;

  const today = getTodayInCentralTime();
  const names = favoriteNames.map((f) => f.name);

  const matches = await db
    .select({
      food_name: schema.food_item.name,
      location_name: schema.location.name,
      menu_name: schema.menu.name,
      category_name: schema.menu_category.title,
    })
    .from(schema.food_item)
    .innerJoin(
      schema.menu_category,
      eq(schema.food_item.menu_category_id, schema.menu_category.id),
    )
    .innerJoin(schema.menu, eq(schema.menu_category.menu_id, schema.menu.id))
    .innerJoin(schema.location, eq(schema.menu.location_id, schema.location.id))
    .where(and(eq(schema.menu.date, today), inArray(schema.food_item.name, names)))
    .execute();

  const { hasNotified, markNotified, pruneKeysNotMatching } = useFoodAlertsStore.getState();
  pruneKeysNotMatching(today);

  // Group every match by food name first so a food offered at multiple
  // dining halls produces exactly one notification listing all of them,
  // rather than one notification per (food, location, menu) combo.
  const byFood = new Map<
    string,
    { locationNames: string[]; menuName: string; categoryName: string | null }
  >();

  for (const match of matches) {
    if (!match.food_name || !match.location_name || !match.menu_name) continue;

    const existing = byFood.get(match.food_name);
    if (existing) {
      if (!existing.locationNames.includes(match.location_name)) {
        existing.locationNames.push(match.location_name);
      }
    } else {
      byFood.set(match.food_name, {
        locationNames: [match.location_name],
        menuName: match.menu_name,
        categoryName: match.category_name,
      });
    }
  }

  for (const [foodName, info] of byFood) {
    const key = `${today}-${foodName}`;
    if (hasNotified(key)) continue;

    const firstLocation = info.locationNames[0];
    const body =
      info.locationNames.length > 1
        ? `Find it at ${info.locationNames.join(', ')} for ${info.menuName}.`
        : `Find it at ${firstLocation} for ${info.menuName}.`;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${foodName} is available today!`,
        body,
        data: {
          category: 'favorite-food-appearance',
          redirect_url: `/food/${foodName}?location=${firstLocation}&menu=${info.menuName}&category=${info.categoryName}`,
        },
      },
      trigger: null,
    });

    markNotified(key);
  }
}
