import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

export function useLocationPermissions() {
  const [permissionStatus, setPermissionStatus] = useState<Location.PermissionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkPermissions = useCallback(async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking location permissions:', error);
      setPermissionStatus(Location.PermissionStatus.DENIED);
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status);
      return status;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return Location.PermissionStatus.DENIED;
    }
  };

  return {
    permissionStatus,
    isLoading,
    isGranted: permissionStatus === Location.PermissionStatus.GRANTED,
    isDenied: permissionStatus === Location.PermissionStatus.DENIED,
    isUndetermined:
      !permissionStatus || permissionStatus === Location.PermissionStatus.UNDETERMINED,
    requestPermissions,
  };
}
