import { requireNativeModule } from 'expo-modules-core';

type LiveActivityNativeModule = {
  updateWidgetData(json: string): void;
  setWidgetColorScheme(isDarkMode: boolean): void;
};

export type FavoriteLocationStatus = {
  name: string;
  closesAtISO: string | null;
  isOpen: boolean;
  // Location type name (e.g. "Dining Hall", "Café", "Market") — lets the
  // home screen widget show the same per-type icon as the in-app location
  // cards (see getLocationIcon in app/_components/LocationItem.tsx).
  type: string | null;
};

// A favorited food and every location currently serving it today (whether or
// not that location is itself favorited) — lets the home screen widget's
// Food section surface "find your favorites here" independent of which
// locations happen to be favorited.
export type FavoriteFoodAvailability = {
  name: string;
  servingLocations: { name: string; isOpen: boolean }[];
};

let nativeModule: LiveActivityNativeModule | null = null;
function getModule(): LiveActivityNativeModule | null {
  if (nativeModule) return nativeModule;
  try {
    nativeModule = requireNativeModule<LiveActivityNativeModule>('LiveActivity');
    return nativeModule;
  } catch (error) {
    // Not available on this platform/build (e.g. Android, or before the
    // native module has been built into a dev client).
    console.error('❌ LiveActivity native module not available:', error);
    return null;
  }
}

export function updateWidgetData(
  locations: FavoriteLocationStatus[],
  favoriteFoods: FavoriteFoodAvailability[] = [],
): void {
  getModule()?.updateWidgetData(JSON.stringify({ locations, favoriteFoods }));
}

// Mirrors the app's in-app dark mode toggle (store/useSettingsStore.ts) into
// the App Group so the home screen widget follows it, since a widget
// extension runs in its own process and can't read the app's JS state or
// its `Appearance.setColorScheme()` call directly.
export function setWidgetColorScheme(isDarkMode: boolean): void {
  getModule()?.setWidgetColorScheme(isDarkMode);
}
