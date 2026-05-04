import axiosClient from './axiosClient';

const budgetApi = {
  getBudgets: async () => {
    const res = await axiosClient.get('/budgets');
    return res?.data ?? res;
  },

  getDailyBudget: async () => {
    const res = await axiosClient.get('/budgets/daily');
    return res?.data ?? res;
  },

  createBudget: async (data) => {
    const res = await axiosClient.post('/budgets', data);
    return res?.data ?? res;
  },

  updateBudget: async (id, data) => {
    const res = await axiosClient.put(`/budgets/${id}`, data);
    return res?.data ?? res;
  },

  deleteBudget: async (id) => {
    const res = await axiosClient.delete(`/budgets/${id}`);
    return res?.data ?? res;
  },
};

export default budgetApi;
