import { create } from 'zustand';
import budgetApi from '../api/budgetApi';

export const useBudgetStore = create((set, get) => ({
  dailyBudget: 0,
  spentToday: 0,
  remaining: 0,
  percentUsed: 0,
  loading: false,

  fetchDailyBudget: async () => {
    if (!localStorage.getItem('accessToken')) return;
    try {
      set({ loading: true });
      const res = await budgetApi.getDailyBudget();
      const dailyLimit = Number(res?.dailyLimit || 0);
      const spentToday = Number(res?.spentToday || 0);
      const remaining = Math.max(0, dailyLimit - spentToday);
      const percentUsed = dailyLimit > 0
        ? Math.min(100, Math.round((spentToday / dailyLimit) * 100))
        : 0;
      set({ dailyBudget: dailyLimit, spentToday, remaining, percentUsed, loading: false });
    } catch {
      set({ dailyBudget: 0, spentToday: 0, remaining: 0, percentUsed: 0, loading: false });
    }
  },

  updateSpentToday: (spentAmount) => {
    const dailyBudget = Number(get().dailyBudget || 0);
    const spentToday = Number(spentAmount || 0);
    const remaining = Math.max(0, dailyBudget - spentToday);
    const percentUsed = dailyBudget > 0
      ? Math.min(100, Math.round((spentToday / dailyBudget) * 100))
      : 0;
    set({ spentToday, remaining, percentUsed });
  },

  resetDailyBudget: () =>
    set({ dailyBudget: 0, spentToday: 0, remaining: 0, percentUsed: 0, loading: false }),
}));