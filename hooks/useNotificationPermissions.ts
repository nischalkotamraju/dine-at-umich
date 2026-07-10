import * as Notifications from 'expo-notifications';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useNotificationPermissions() {
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  const checkPermissions = useCallback(async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      setPermissionStatus(Notifications.PermissionStatus.DENIED);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check permissions on mount
  useEffect(() => {
    checkPermissions();
  }, [checkPermissions]);

  // Re-check permissions when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      checkPermissions();
    }, [checkPermissions]),
  );

  // Re-check permissions when the app returns from background (e.g. after
  // the user grants/denies the permission in the system Settings app) —
  // useFocusEffect alone doesn't fire here since in-app navigation focus
  // never changes when backgrounding/foregrounding the whole app.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') checkPermissions();
    });
    return () => subscription.remove();
  }, [checkPermissions]);

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status);
      return status;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return Notifications.PermissionStatus.DENIED;
    }
  };

  return {
    permissionStatus,
    isLoading,
    isGranted: permissionStatus === Notifications.PermissionStatus.GRANTED,
    isDenied: permissionStatus === Notifications.PermissionStatus.DENIED,
    isUndetermined: permissionStatus === Notifications.PermissionStatus.UNDETERMINED,
    requestPermissions,
  };
}
