import { create } from 'zustand'

export const useBudgetStore = create((set) => ({
  budgets: [],
  selected: null,
  setBudgets: (budgets) => set({ budgets }),
  setSelected: (selected) => set({ selected }),
  addBudget: (budget) => set((s) => ({ budgets: [...s.budgets, budget] })),
  removeBudget: (id) => set((s) => ({ budgets: s.budgets.filter(b => b.id !== id) })),
}))
