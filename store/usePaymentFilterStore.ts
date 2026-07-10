import { create } from 'zustand';
import type { PaymentMethod } from '~/data/PaymentInfo';

interface PaymentFilterStore {
  selectedMethods: PaymentMethod[];
  toggleMethod: (method: PaymentMethod) => void;
  resetMethods: () => void;
}

export const usePaymentFilterStore = create<PaymentFilterStore>()((set) => ({
  selectedMethods: [],
  toggleMethod: (method) =>
    set((state) => ({
      selectedMethods: state.selectedMethods.includes(method)
        ? state.selectedMethods.filter((m) => m !== method)
        : [...state.selectedMethods, method],
    })),
  resetMethods: () => set({ selectedMethods: [] }),
}));
