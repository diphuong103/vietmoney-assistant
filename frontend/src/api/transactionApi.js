import axiosClient from './axiosClient';

const BASE = '/transactions';

const transactionApi = {
  getAll: async (params) => {
    const res = await axiosClient.get(BASE, { params });
    return res?.data ?? res;
  },

  create: async (data) => {
    const payload = {
      type:       data.type?.toUpperCase(),
      amount:     data.amount,
      note:       data.description || data.note,
      categoryId: data.categoryId ?? null,
      budgetId:   data.budgetId   ?? null,
    };
    const res = await axiosClient.post(BASE, payload);
    return res?.data ?? res;
  },

  update: async (id, data) => {
    const payload = {
      type:       data.type?.toUpperCase(),
      amount:     data.amount,
      note:       data.description || data.note,
      categoryId: data.categoryId ?? null,
      budgetId:   data.budgetId   ?? null,
    };
    const res = await axiosClient.put(`${BASE}/${id}`, payload);
    return res?.data ?? res;
  },

  delete: async (id) => {
    const res = await axiosClient.delete(`${BASE}/${id}`);
    return res?.data ?? res;
  },
};

export default transactionApi;