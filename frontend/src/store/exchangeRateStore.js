import { create } from 'zustand';

const DEFAULT_RATES = {
  VND: 1,
  USD: 25420,
  EUR: 27810,
  KRW: 18.9,
  JPY: 165.4,
  GBP: 32150,
  CNY: 3497,
};

export const useExchangeRateStore = create((set) => ({
  rates: DEFAULT_RATES,
  lastUpdated: null,
  loading: false,
  error: null,

  setRates: (rates) => set({ rates, lastUpdated: new Date() }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  convert: (amount, from, to) => {
    const rates = useExchangeRateStore.getState().rates;
    const inVND = parseFloat(amount) * rates[from];
    return inVND / rates[to];
  },
}));
