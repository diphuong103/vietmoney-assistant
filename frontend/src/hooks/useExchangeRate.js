import { useEffect } from 'react';
import { useExchangeRateStore } from '../store/exchangeRateStore';
import exchangeRateApi from '../api/exchangeRateApi';

export function useExchangeRate() {
  const { rates, loading, error, lastUpdated, setRates, setLoading, setError, convert } =
    useExchangeRateStore();

  const fetchRates = async () => {
    setLoading(true);
    try {
      const res = await exchangeRateApi.getRates();
      setRates(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only refetch if data is older than 5 minutes
    const stale = !lastUpdated || Date.now() - new Date(lastUpdated).getTime() > 5 * 60 * 1000;
    if (stale) fetchRates();
  }, []);

  return { rates, loading, error, lastUpdated, convert, refresh: fetchRates };
}
