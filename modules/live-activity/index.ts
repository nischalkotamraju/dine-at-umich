import { requireNativeModule } from 'expo-modules-core';

type LiveActivityNativeModule = {
  updateWidgetData(json: string): void;
  setWidgetColorScheme(isDarkMode: boolean): void;
};

export type FavoriteLocationStatus = {
  name: string;
  isOpen: boolean;
  // Unix seconds of the next open/close transition today: the closing time if
  // currently open, the opening time if currently closed, or null if there's
  // no further transition today (closed for the rest of the day). Lets the
  // widget show "CLOSES IN 2h" / "OPENS IN 30m" / "CLOSED".
  transitionEpoch: number | null;
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
  // Menu category (e.g. "Beverages", "Hot Cereal") so the widget can show the
  // same per-category food icon as the app (see getCategoryIcon in
  // components/FoodComponent.tsx).
  category: string | null;
  // transitionEpoch mirrors FavoriteLocationStatus: it lets the widget derive
  // each serving location's open/closed state at render time rather than
  // trusting the isOpen snapshot from whenever the app last ran.
  servingLocations: { name: string; isOpen: boolean; transitionEpoch: number | null }[];
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
