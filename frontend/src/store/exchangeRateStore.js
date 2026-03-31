import { create } from 'zustand'

export const useExchangeRateStore = create((set) => ({
  rates: {},
  updatedAt: null,
  isConnected: false,
  setRates: (rates, updatedAt) => set({ rates, updatedAt }),
  setConnected: (isConnected) => set({ isConnected }),
}))
