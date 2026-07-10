import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from './rnmmkv-storage';

interface FoodAlertsState {
  // Keys of (date, food) combos already notified for, so re-running the
  // appearance check (every sync / app foreground) doesn't re-notify about
  // the same favorited food again today, even if it's showing at multiple
  // dining halls.
  notifiedKeys: Record<string, true>;
  hasNotified: (key: string) => boolean;
  markNotified: (key: string) => void;
  // Drops any tracked key not prefixed with today's date, so this doesn't
  // grow forever — only "have we already notified about this today" matters.
  pruneKeysNotMatching: (todayPrefix: string) => void;
}

export const useFoodAlertsStore = create<FoodAlertsState>()(
  persist(
    (set, get) => ({
      notifiedKeys: {},

      hasNotified: (key: string) => !!get().notifiedKeys[key],

      markNotified: (key: string) => {
        set((state) => ({ notifiedKeys: { ...state.notifiedKeys, [key]: true } }));
      },

      pruneKeysNotMatching: (todayPrefix: string) => {
        set((state) => ({
          notifiedKeys: Object.fromEntries(
            Object.entries(state.notifiedKeys).filter(([key]) => key.startsWith(todayPrefix)),
          ) as Record<string, true>,
        }));
      },
    }),
    {
      name: 'food-alerts-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
