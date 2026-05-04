import axiosClient from './axiosClient';

const CATEGORY_BASE = '/categories';

const categoryApi = {
  /**
   * Lấy toàn bộ category của user
   * @param {'INCOME'|'EXPENSE'|null} type
   * @param {Object} options
   */
  getAll: async (type = null, options = {}) => {
    const response = await axiosClient.get(CATEGORY_BASE, {
      params: type ? { type } : {},
      ...options,
    });

    return response.data.data;
  },

  /**
   * Tạo category mới
   * payload:
   * {
   *   name: string,
   *   type: 'INCOME' | 'EXPENSE',
   *   icon: string,
   *   color: string
   * }
   */
  create: async (payload, options = {}) => {
    const response = await axiosClient.post(
      CATEGORY_BASE,
      payload,
      options
    );

    return response.data.data;
  },

  /**
   * Cập nhật category
   */
  update: async (id, payload, options = {}) => {
    const response = await axiosClient.put(
      `${CATEGORY_BASE}/${id}`,
      payload,
      options
    );

    return response.data.data;
  },

  /**
   * Xoá category
   */
  delete: async (id, options = {}) => {
    const response = await axiosClient.delete(
      `${CATEGORY_BASE}/${id}`,
      options
    );

    return response.data.data;
  },
};

export default categoryApi;