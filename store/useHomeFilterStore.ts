import { create } from 'zustand';

interface HomeFilterStore {
  selectedFilters: string[];
  toggleFilter: (filter: string) => void;
  resetFilters: () => void;
}

export const useHomeFilterStore = create<HomeFilterStore>()((set) => ({
  selectedFilters: [],
  toggleFilter: (filter) =>
    set((state) => ({
      selectedFilters: state.selectedFilters.includes(filter)
        ? state.selectedFilters.filter((f) => f !== filter)
        : [...state.selectedFilters, filter],
    })),
  resetFilters: () => set({ selectedFilters: [] }),
}));
