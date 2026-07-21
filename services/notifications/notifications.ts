import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useDatabase } from '~/hooks/useDatabase';
import * as schema from '~/services/database/schema';
import { getOrCreateDeviceId } from '~/services/device/deviceId';
import { refreshFavoriteLocationsWidgetData } from '~/services/widget/refreshWidgetData';
import { usePushNotificationsStore } from '~/store/usePushNotificationsStore';
import { useWidgetPreferencesStore } from '~/store/useWidgetPreferencesStore';
import { supabase } from '~/utils/supabase';
import { insertNotification } from '../database/database';

// closing-soon/opening-now/favorite-food-appearance used to be scheduled
// purely on-device and were filtered out of the in-app Notifications list
// via this set. They're now computed server-side (favorite-alerts-dispatch
// Edge Function, based on device_location_favorites/device_food_favorites)
// and delivered as real pushes, so they should persist like any other
// notification — this set is kept empty rather than removed outright in
// case a future local-only category is ever reintroduced.
const LOCAL_ONLY_CATEGORIES: string[] = [];

async function shouldPersistNotification(category: unknown): Promise<boolean> {
  if (typeof category !== 'string' || !LOCAL_ONLY_CATEGORIES.includes(category)) return true;
  const { granted } = await Notifications.getPermissionsAsync();
  return granted;
}

// Global handler (still needed)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldShowAlert: true,
  }),
});

export function PushNotificationsInitializer() {
  const setDeviceId = usePushNotificationsStore((s) => s.setDeviceId);
  const setExpoPushToken = usePushNotificationsStore((s) => s.setExpoPushToken);
  const setNotification = usePushNotificationsStore((s) => s.setNotification);
  const db = useDatabase();

  useEffect(() => {
    const deviceId = getOrCreateDeviceId();
    setDeviceId(deviceId);

    async function registerAndSync() {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }

      if (!Device.isDevice) {
        alert('Must use physical device for push notifications.');
        return;
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        if (__DEV__) {
          alert('Permission not granted for push notifications! (DEV)');
        }
        return;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

      if (!projectId) {
        if (__DEV__) {
          alert('Project ID not found. (DEV)');
        }
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      setExpoPushToken(token);

      // Sync to Supabase
      const { data } = await supabase
        .from('user_devices')
        .select('push_token')
        .eq('device_id', deviceId)
        .single();

      // If the device is not in the database, insert it
      if (!data) {
        const { error } = await supabase.from('user_devices').insert({
          device_id: deviceId,
          push_token: token,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.error('❌ Error inserting push token:', error);
        } else {
          console.log('✅ Push token registered:', token);
        }
      } else if (data.push_token !== token) {
        // If the push token is different, update it
        const { error } = await supabase.from('user_devices').upsert({
          device_id: deviceId,
          push_token: token,
          updated_at: new Date().toISOString(),
        });

        if (error) {
          console.error('❌ Error updating push token:', error);
        } else {
          console.log('✅ Push token updated:', token);
        }
      } else {
        console.log('✅ Push token already synced.');
      }
    }

    registerAndSync();

    // Triggered when the app is in the foreground (when the app is open)
    const notificationListener = Notifications.addNotificationReceivedListener(
      async (notification) => {
        console.log('📱 Notification foreground received:', JSON.stringify(notification, null, 2));
        setNotification(notification);

        if (db && (await shouldPersistNotification(notification.request.content.data?.category))) {
          try {
            await insertNotification(db, {
              id: notification.request.identifier,
              title: notification.request.content.title ?? 'Notification',
              body: notification.request.content.body ?? '',
              sent_at: new Date().toISOString(),
              redirect_url: notification.request.content.data?.redirect_url ?? null,
              type: notification.request.content.data?.type ?? null,
            });
          } catch (error) {
            console.error('❌ Error saving notification to database:', error);
          }
        }
      },
    );

    // Triggered when the app is in the background (when the app is closed and the notification is tapped)
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      async (response) => {
        console.log('📱 Notification background response:', JSON.stringify(response, null, 2));
        const notification = response.notification;
        setNotification(notification);

        if (db && (await shouldPersistNotification(notification.request.content.data?.category))) {
          try {
            await insertNotification(db, {
              id: notification.request.identifier,
              title: notification.request.content.title ?? 'Notification',
              body: notification.request.content.body ?? '',
              sent_at: new Date().toISOString(),
              redirect_url: response.notification.request.content.data?.redirect_url ?? null,
              type: response.notification.request.content.data?.type ?? null,
            });
          } catch (error) {
            console.error('❌ Error saving notification response to database:', error);
          }
        }

        // If there is a redirect url, navigate to it. If not, navigate to the notifications screen.
        if (notification.request.content.data?.redirect_url) {
          router.push(notification.request.content.data.redirect_url);
        } else {
          router.push('/notifications');
        }
      },
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
      console.log('✅ Push notification listeners cleaned up.');
    };
  }, [setDeviceId, setExpoPushToken, setNotification, db]);

  return null;
}

/**
 * Keeps the home screen widget's favorite-location status in sync:
 * re-computes it whenever the favorited-locations/foods list changes, and
 * again whenever the app is foregrounded (so hours computed for "today"
 * don't go stale across a day rollover while the app was backgrounded).
 *
 * Closing-soon/opening-now/favorite-food alerts themselves are delivered
 * server-side (see services/notifications/PushNotificationsInitializer's
 * doc comment above) — this initializer only refreshes the widget display.
 */
export function WidgetRefreshInitializer() {
  const db = useDatabase();
  const { data: locationFavorites } = useLiveQuery(db.select().from(schema.location_favorites));
  const favoriteNames = locationFavorites.map((f) => f.location_name).join(',');
  // The widget's Food section is driven by favorited dishes, so watch those
  // too — otherwise favoriting/unfavoriting a food wouldn't update the widget
  // until the next app foreground.
  const { data: foodFavorites } = useLiveQuery(db.select().from(schema.favorites));
  const favoriteFoodNames = foodFavorites.map((f) => f.name).join(',');
  const { homeScreenWidgetEnabled } = useWidgetPreferencesStore();
  const dbRef = useRef(db);
  dbRef.current = db;

  useEffect(() => {
    refreshFavoriteLocationsWidgetData(dbRef.current);
    // Also re-run whenever the user flips the widget preference in Settings,
    // so turning it off immediately clears it instead of waiting for a
    // favorite change or the next app foreground.
  }, [favoriteNames, favoriteFoodNames, homeScreenWidgetEnabled]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refreshFavoriteLocationsWidgetData(dbRef.current);
      }
    });

    return () => subscription.remove();
  }, []);

  return null;
}
