import { Appearance } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from './rnmmkv-storage';

interface SettingsState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (isDarkMode: boolean) => void;
}

// Get the initial color scheme from device
const devicePrefersDarkMode = Appearance.getColorScheme() === 'dark';

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      isDarkMode: devicePrefersDarkMode,
      toggleDarkMode: () => {
        set((state) => ({
          isDarkMode: !state.isDarkMode,
        }));
      },
      setDarkMode: (isDarkMode) => {
        set({ isDarkMode });
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
