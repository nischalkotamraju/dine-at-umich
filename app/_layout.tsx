import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useFonts, RobotoMono_400Regular, RobotoMono_500Medium, RobotoMono_700Bold } from '@expo-google-fonts/roboto-mono';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { PostHogProvider } from 'posthog-react-native';
import { Suspense, useEffect, type ReactNode } from 'react';
import { ActivityIndicator, Appearance, View } from 'react-native';
import { SheetProvider } from 'react-native-actions-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { useSyncQueries } from 'tanstack-query-dev-tools-expo-plugin';

import '../components/sheets/Sheets';

import migrations from '../drizzle/migrations';

import '../global.css';
import * as Device from 'expo-device';
import { VersionCheckProvider } from '~/components/VersionCheckProvider';
import { useDatabase } from '~/hooks/useDatabase';
import { POSTHOG_CONFIG } from '~/services/analytics/posthog';
import {
  PushNotificationsInitializer,
  WidgetRefreshInitializer,
} from '~/services/notifications/notifications';
import { ratingService } from '~/services/rating/rating';
import { setWidgetColorScheme } from '~/modules/live-activity';
import { useAppLaunchStore } from '~/store/useAppLaunchStore';
import { useSettingsStore } from '~/store/useSettingsStore';
export const DATABASE_NAME = 'database.db';

// This is the default configuration
configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

const queryClient = new QueryClient();

// Runs migrations using the SAME connection SQLiteProvider hands out via
// useSQLiteContext(), rather than a second, separate openDatabaseSync()
// connection to the same database file. Opening two live connections to one
// SQLite file let the runtime query connection (used by fetchMenuData, etc.)
// race against the migration connection — one could get closed out from
// under the other, surfacing as "AccessClosedResourceException: Access to
// closed resource" on the very first Supabase sync after a cold launch.
const MigrationGate = ({ children }: { children: ReactNode }) => {
  const db = useDatabase();
  const { success, error } = useMigrations(db, migrations);
  const { incrementLaunchCount } = useAppLaunchStore();

  useEffect(() => {
    if (success) {
      console.log('✅ Database migrated successfully');

      // Increment launch count on successful app initialization
      incrementLaunchCount();

      // Check and show rating prompt if conditions are met
      ratingService.checkAndShowRatingPrompt();
    } else if (error) {
      console.error('❌ Error migrating database:', error);
    }
  }, [success, error, incrementLaunchCount]);

  if (!success && !error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="small" />
      </View>
    );
  }

  return <>{children}</>;
};

const AppContent = () => {
  const [fontsLoaded] = useFonts({ RobotoMono_400Regular, RobotoMono_500Medium, RobotoMono_700Bold });
  const isDarkMode = useSettingsStore((state) => state.isDarkMode);
  useSyncQueries({ queryClient });

  const isTablet = Device.deviceType === Device.DeviceType.TABLET;
  // Must match the inner `bg` each formSheet modal paints (hours-modal,
  // home-filter, payment-filter, location-filter) — otherwise the native
  // sheet container fills the bottom safe area with a mismatched color,
  // leaving a white strip below the content in light mode.
  const sheetBg = isDarkMode ? '#1C1C1E' : '#F2F2F7';

  // Sync the native color scheme to the app's manual dark mode toggle.
  // Without this, native chrome (like the formSheet drag handle/grabber on
  // hours-modal, home-filter, etc.) keeps following the device's actual OS
  // appearance setting instead of our in-app toggle, so it can render the
  // wrong (mismatched) color or flash as it corrects itself after mount.
  useEffect(() => {
    Appearance.setColorScheme(isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // Keeps the home screen widget's theme in sync with the in-app toggle —
  // widget extensions run in their own process and can't observe this
  // store or the native Appearance override above.
  useEffect(() => {
    setWidgetColorScheme(isDarkMode);
  }, [isDarkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense
        fallback={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" />
          </View>
        }
      >
        <SQLiteProvider
          databaseName={DATABASE_NAME}
          options={{ enableChangeListener: true }}
          useSuspense
        >
          <MigrationGate>
          <GestureHandlerRootView>
            <SheetProvider>
              <VersionCheckProvider>
                <PushNotificationsInitializer />
                <WidgetRefreshInitializer />
                <Stack
                  key={isDarkMode ? 'dark' : 'light'}
                  screenOptions={{
                    headerShown: false,
                    contentStyle: {
                      backgroundColor: 'white',
                    },
                    gestureEnabled: true,
                  }}
                >
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

                  <Stack.Screen
                    name="food/[food]"
                    options={{
                      presentation: isTablet ? 'card' : 'modal',
                      sheetGrabberVisible: true,
                      headerShown: false,
                    }}
                  />

                  <Stack.Screen
                    name="location/[location]"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="home-filter"
                    options={{
                      presentation: 'formSheet',
                      headerShown: false,
                      sheetAllowedDetents: [0.56],
                      sheetInitialDetentIndex: 0,
                      sheetGrabberVisible: true,
                      contentStyle: { backgroundColor: sheetBg },
                    }}
                  />
                  <Stack.Screen
                    name="payment-filter"
                    options={{
                      presentation: 'formSheet',
                      headerShown: false,
                      sheetAllowedDetents: [0.56],
                      sheetInitialDetentIndex: 0,
                      sheetGrabberVisible: true,
                      contentStyle: { backgroundColor: sheetBg },
                    }}
                  />
                  <Stack.Screen
                    name="location/hours-modal"
                    options={{
                      presentation: 'formSheet',
                      headerShown: false,
                      sheetAllowedDetents: 'fitToContents',
                      sheetInitialDetentIndex: 0,
                      sheetGrabberVisible: true,
                      contentStyle: { backgroundColor: sheetBg },
                    }}
                  />
                  <Stack.Screen
                    name="location-filter"
                    options={{
                      presentation: 'formSheet',
                      headerShown: false,
                      sheetAllowedDetents: ['large'],
                      sheetInitialDetentIndex: 0,
                      sheetGrabberVisible: true,
                      contentStyle: { backgroundColor: sheetBg },
                    }}
                  />
                </Stack>
              </VersionCheckProvider>
            </SheetProvider>
          </GestureHandlerRootView>
          </MigrationGate>
        </SQLiteProvider>
      </Suspense>
    </QueryClientProvider>
  );
};

export default function Layout() {
  // Always wrap with PostHogProvider (even without an API key) so that
  // usePostHog() always has a client in context — otherwise every screen
  // that calls usePostHog() logs a "called without a PostHog client" error.
  // With no API key, PostHog is disabled and never sends any data.
  return (
    <PostHogProvider
      apiKey={POSTHOG_CONFIG.apiKey ?? ''}
      options={POSTHOG_CONFIG.options}
      autocapture={POSTHOG_CONFIG.autocapture}
      debug={POSTHOG_CONFIG.debug}
    >
      <AppContent />
    </PostHogProvider>
  );
}
