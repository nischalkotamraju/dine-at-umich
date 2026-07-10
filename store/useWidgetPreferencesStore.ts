import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from './rnmmkv-storage';

// Controls whether favorited-locations data is pushed to the home screen
// widget.
interface WidgetPreferencesState {
  homeScreenWidgetEnabled: boolean;
  setHomeScreenWidgetEnabled: (enabled: boolean) => void;
}

export const useWidgetPreferencesStore = create<WidgetPreferencesState>()(
  persist(
    (set) => ({
      homeScreenWidgetEnabled: true,
      setHomeScreenWidgetEnabled: (enabled) => set({ homeScreenWidgetEnabled: enabled }),
    }),
    {
      name: 'widget-preferences-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
