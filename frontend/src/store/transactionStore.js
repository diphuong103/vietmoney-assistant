import { create } from 'zustand';
import transactionApi from '../api/transactionApi';

export const useTransactionStore = create((set, get) => ({
  // ===== STATE =====
  transactions: [],

  // ===== FETCH =====
  fetchTransactions: async () => {
    try {
      const res = await transactionApi.getAll();
      set({ transactions: res || [] });
    } catch (err) {
      console.error('Fetch transactions failed', err);
    }
  },

  // ===== CRUD =====
  addTransaction: async (payload) => {
    try {
      await transactionApi.create(payload);
      await get().fetchTransactions();
    } catch (err) {
      console.error('Add transaction failed', err);
    }
  },

  updateTransaction: async (id, payload) => {
    try {
      const updated = await transactionApi.update(id, payload);
      set((state) => ({
        transactions: state.transactions.map((t) =>
          t.id === id ? { ...t, ...updated } : t
        ),
      }));
    } catch (err) {
      console.error('Update transaction failed', err);
    }
  },

  removeTransaction: async (id) => {
    try {
      await transactionApi.delete(id);
      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
      }));
    } catch (err) {
      console.error('Delete transaction failed', err);
    }
  },

  // ===== SELECTORS =====
  getTotalSpent: () =>
    get().transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0),

  getTotalIncome: () =>
    get().transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0),

  getBalance: () => {
    const { getTotalIncome, getTotalSpent } = get();
    return getTotalIncome() - getTotalSpent();
  },
}));