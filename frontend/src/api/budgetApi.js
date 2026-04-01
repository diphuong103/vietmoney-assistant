import axiosClient from './axiosClient';

const budgetApi = {
  getTransactions: (params) =>
    axiosClient.get('/budget/transactions', { params }),

  addTransaction: (data) =>
    axiosClient.post('/budget/transactions', data),

  deleteTransaction: (id) =>
    axiosClient.delete(`/budget/transactions/${id}`),

  getCategories: () =>
    axiosClient.get('/budget/categories'),

  addCategory: (data) =>
    axiosClient.post('/budget/categories', data),

  deleteCategory: (id) =>
    axiosClient.delete(`/budget/categories/${id}`),

  getDailyBudget: () =>
    axiosClient.get('/budget/daily'),

  setDailyBudget: (amount) =>
    axiosClient.put('/budget/daily', { amount }),
};

export default budgetApi;
