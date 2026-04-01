import axiosClient from './axiosClient';

const exchangeRateApi = {
  getRates: () =>
    axiosClient.get('/exchange-rates'),

  getRate: (from, to) =>
    axiosClient.get(`/exchange-rates/${from}/${to}`),

  getHistory: (from, to, days = 7) =>
    axiosClient.get(`/exchange-rates/history`, { params: { from, to, days } }),
};

export default exchangeRateApi;
