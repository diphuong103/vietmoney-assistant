import { create } from 'zustand';

import budgetApi from '../api/budgetApi';

export const useBudgetStore = create((set, get) => ({
  transactions: [],
  dailyBudget: 2_000_000,
  spentToday: 0,
  remaining: 2_000_000,
  percentUsed: 0,
  categories: [
    { emoji: '🍜', name: 'Food', color: '#C8F23D' },
    { emoji: '🛺', name: 'Transport', color: '#3DF2C8' },
    { emoji: '🏨', name: 'Hotel', color: '#3D8FF2' },
    { emoji: '🎭', name: 'Activity', color: '#F2C43D' },
    { emoji: '🛍️', name: 'Shopping', color: '#F23D6E' },
  ],

  setDailyBudget: (budget) => set({ dailyBudget: budget }),

  fetchDailyBudget: async () => {
    try {
      const data = await budgetApi.getDailyBudget();
      if (data) {
        set({
          dailyBudget: data.dailyBudget ?? 0,
          spentToday: data.spentToday ?? 0,
          remaining: data.remaining ?? 0,
          percentUsed: data.percentUsed ?? 0
        });
      }
    } catch (e) {
      if (e.response?.status === 404) {
        set({
          dailyBudget: 0,
          spentToday: 0,
          remaining: 0,
          percentUsed: 0
        });
      } else {
        console.error(e);
      }
    }
  },

  addTransaction: (txn) =>
    set((state) => ({ transactions: [txn, ...state.transactions] })),

  removeTransaction: (idx) =>
    set((state) => ({
      transactions: state.transactions.filter((_, i) => i !== idx),
    })),

  addCategory: (cat) =>
    set((state) => ({ categories: [...state.categories, cat] })),

  removeCategory: (idx) =>
    set((state) => ({
      categories: state.categories.filter((_, i) => i !== idx),
    })),

  getTotalSpent: () => {
    const { transactions } = get();
    return transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  },
}));
