import { create } from 'zustand';

export const useBudgetStore = create((set, get) => ({
  transactions: [],
  dailyBudget: 2_000_000,
  categories: [
    { emoji: '🍜', name: 'Food',      color: '#C8F23D' },
    { emoji: '🛺', name: 'Transport', color: '#3DF2C8' },
    { emoji: '🏨', name: 'Hotel',     color: '#3D8FF2' },
    { emoji: '🎭', name: 'Activity',  color: '#F2C43D' },
    { emoji: '🛍️', name: 'Shopping', color: '#F23D6E' },
  ],

  setDailyBudget: (budget) => set({ dailyBudget: budget }),

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
