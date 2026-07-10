import { eq } from 'drizzle-orm';
import type { ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import * as Network from 'expo-network';
import { insertDataIntoSQLiteDB } from '~/services/database/database';
import { checkFavoriteFoodAppearances } from '~/services/notifications/favoriteFoodAlerts';
import { useDataSyncStore } from '~/store/useDataSyncStore';
import * as schema from '../services/database/schema';

// Ensures every fresh app launch checks Supabase for new data at least once,
// regardless of the 6-hour staleness window below — without this, someone
// could open the app minutes after a scrape finishes and be stuck looking at
// stale cached menus for hours. Now that there's no manual "Sync Data"
// button, this is the only thing that surfaces newly scraped data promptly.
let hasSyncedThisSession = false;

export const fetchMenuData = async (
  drizzleDb: ExpoSQLiteDatabase<typeof schema>,
  forceSync: boolean = false,
) => {
  const SYNC_TIMEOUT_MS = 60000;
  const isFirstSyncThisSession = !hasSyncedThisSession;

  // Check internet connection and time-based sync logic
  const networkState = await Network.getNetworkStateAsync();
  if (networkState.isConnected) {
    // Get sync store state directly (not using hook since this is not a React component)
    const syncStore = useDataSyncStore.getState();

    // Check if SQLite is empty (no locations, or no food items despite having
    // locations) — always force sync in that case. The food_item check matters
    // because a previously-interrupted sync (crash, dropped connection, the
    // timeout race below) could leave locations populated but food_item empty;
    // without checking it here, the app would never notice and would keep
    // serving that broken local state indefinitely.
    const [localLocationCount, localFoodItemCount] = await Promise.all([
      drizzleDb.select().from(schema.location),
      drizzleDb.select().from(schema.food_item),
    ]);
    const isLocalEmpty = localLocationCount.length === 0 || localFoodItemCount.length === 0;

    // Sync with Supabase if 6 hours have passed since last sync, SQLite is empty,
    // this is the first check since the app process started, OR if manually forced
    if (forceSync || isLocalEmpty || isFirstSyncThisSession || syncStore.shouldSyncWithSupabase()) {
      hasSyncedThisSession = true;
      try {
        const reason = forceSync
          ? 'Manual refresh requested'
          : isLocalEmpty
            ? 'Local database empty or incomplete'
            : isFirstSyncThisSession
              ? 'App just opened, checking for new data'
              : '6+ hours since last sync';
        console.log(`🔄 ${reason}, fetching fresh data from Supabase...`);
        await Promise.race([
          insertDataIntoSQLiteDB(drizzleDb),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Sync timeout')), SYNC_TIMEOUT_MS),
          ),
        ]);

        // Update the last sync time after successful sync
        syncStore.setLastSupabaseQueryTime(Date.now());
        console.log('✅ Successfully synced with Supabase and updated sync timestamp');

        // Fresh menu data just landed — this is the only point where today's
        // menu contents can actually change, so it's the right time to check
        // whether any favorited food showed up somewhere on campus.
        checkFavoriteFoodAppearances(drizzleDb).catch((error) =>
          console.error('❌ Error checking favorite food appearances:', error),
        );
      } catch (error) {
        console.warn('Failed to sync with remote database, using cached data:', error);
        // Continue to return cached data even if sync fails
      }
    } else {
      const timeSinceLastSync = syncStore.getTimeSinceLastSync();
      const hoursUntilNextSync = Math.max(
        0,
        (6 * 60 * 60 * 1000 - timeSinceLastSync) / (60 * 60 * 1000), // 6 hours in milliseconds
      );
      console.log(
        `ℹ️  Using cached data (${(timeSinceLastSync / (60 * 60 * 1000)).toFixed(1)}h since last sync, next sync in ${hoursUntilNextSync.toFixed(1)}h)`,
      );
    }
  } else {
    console.log('📱 Offline mode: using cached SQLite data');
  }

  // Always return cached data from SQLite (works both online and offline).
  const readLocalData = () =>
    Promise.all([
      drizzleDb
        .select()
        .from(schema.location)
        .innerJoin(schema.location_type, eq(schema.location.type_id, schema.location_type.id))
        .orderBy(schema.location.display_order)
        .then((joinedData) =>
          joinedData.map(({ location, location_type }) => ({
            ...location,
            type: location_type.name,
          })),
        ),
      drizzleDb.select().from(schema.location_type).orderBy(schema.location_type.display_order),
    ]);

  let data: Awaited<ReturnType<typeof readLocalData>>[0];
  let types: Awaited<ReturnType<typeof readLocalData>>[1];
  try {
    [data, types] = await readLocalData();
  } catch (error) {
    // A JS reload (dev Fast Refresh, or one triggered mid-edit) can orphan the
    // previous session's in-flight SQLite work on this same native
    // connection, leaving it in a briefly unstable state — this local read
    // (which is supposed to always succeed, online or offline) can then throw
    // a transient "Access to closed resource" error even though nothing is
    // actually wrong with the data. Without this, that throw escapes
    // fetchMenuData entirely and surfaces as a hard error screen on the home
    // tab instead of just falling back to cache. Give the stale work a beat
    // to finish settling and retry once before actually giving up.
    console.warn('⚠️ Local SQLite read failed, retrying once:', error);
    await new Promise((resolve) => setTimeout(resolve, 500));
    [data, types] = await readLocalData();
  }

  return { locations: data, locationTypes: types };
};
