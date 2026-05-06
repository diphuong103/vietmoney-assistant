import axiosClient from './axiosClient';

const CATEGORY_BASE = '/categories';

const categoryApi = {

  getAll: async (type = null, options = {}) => {
    const response = await axiosClient.get(CATEGORY_BASE, {
      params: type ? { type } : {},
      ...options,
    });

    return response.data.data;
  },

  create: async (payload, options = {}) => {
    const response = await axiosClient.post(
      CATEGORY_BASE,
      payload,
      options
    );

    return response.data.data;
  },

  update: async (id, payload, options = {}) => {
    const response = await axiosClient.put(
      `${CATEGORY_BASE}/${id}`,
      payload,
      options
    );

    return response.data.data;
  },

  delete: async (id, options = {}) => {
    const response = await axiosClient.delete(
      `${CATEGORY_BASE}/${id}`,
      options
    );

    return response.data.data;
  },
};

export default categoryApi;