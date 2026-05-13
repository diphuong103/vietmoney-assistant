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
      const raw = await budgetApi.getDailyBudget();

      // Hỗ trợ cả 2 dạng response từ backend:
      // 1. Trực tiếp: { dailyLimit, spentToday, remaining, percentUsed }
      // 2. Wrapped:   { code, data: { dailyLimit, ... } }
      const payload = raw?.dailyLimit !== undefined ? raw : (raw?.data ?? raw);

      const dailyLimit  = Number(payload?.dailyLimit  ?? 0);
      const spentToday  = Number(payload?.spentToday  ?? 0);
      // Cho phép âm để UI hiển thị màu đỏ khi vượt ngân sách
      const remaining   = dailyLimit - spentToday;
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
    const spentToday  = Number(spentAmount || 0);
    const remaining   = Math.max(0, dailyBudget - spentToday);
    const percentUsed = dailyBudget > 0
      ? Math.min(100, Math.round((spentToday / dailyBudget) * 100))
      : 0;
    set({ spentToday, remaining, percentUsed });
  },

  resetDailyBudget: () =>
    set({ dailyBudget: 0, spentToday: 0, remaining: 0, percentUsed: 0, loading: false }),
}));