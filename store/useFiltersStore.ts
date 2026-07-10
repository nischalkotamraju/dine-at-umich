import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { zustandStorage } from './rnmmkv-storage';

interface AllergenFilters {
  [key: string]: boolean;
}

interface DietaryFilters {
  [key: string]: boolean;
}

export type MealPeriod = 'Breakfast' | 'Brunch' | 'Lunch' | 'Dinner' | 'Late Night' | null;

export interface FiltersState {
  filters: {
    favorites: boolean;
    mealPeriod: MealPeriod;
    allergens: AllergenFilters;
    dietary: DietaryFilters;
  };
  toggleFavoriteFilter: () => void;
  setMealPeriod: (period: MealPeriod) => void;
  toggleAllergenFilter: (allergen: string) => void;
  toggleDietaryFilter: (diet: string) => void;
  resetFilters: () => void;
}

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set) => ({
      filters: {
        favorites: false,
        mealPeriod: null,
        allergens: {},
        dietary: {},
      },

      toggleFavoriteFilter: () => {
        set((state) => ({
          filters: {
            ...state.filters,
            favorites: !state.filters.favorites,
          },
        }));
      },

      setMealPeriod: (period: MealPeriod) => {
        set((state) => ({
          filters: {
            ...state.filters,
            mealPeriod: state.filters.mealPeriod === period ? null : period,
          },
        }));
      },

      toggleAllergenFilter: (allergen: string) => {
        set((state) => ({
          filters: {
            ...state.filters,
            allergens: {
              ...state.filters.allergens,
              [allergen]: !state.filters.allergens[allergen],
            },
          },
        }));
      },

      toggleDietaryFilter: (diet: string) => {
        set((state) => ({
          filters: {
            ...state.filters,
            dietary: {
              ...state.filters.dietary,
              [diet]: !state.filters.dietary[diet],
            },
          },
        }));
      },

      resetFilters: () => {
        set({
          filters: {
            favorites: false,
            mealPeriod: null,
            allergens: {},
            dietary: {},
          },
        });
      },
    }),
    {
      name: 'filters-storage',
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
