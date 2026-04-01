import axiosClient from './axiosClient';

const adminApi = {
  getStats: () =>
    axiosClient.get('/admin/stats'),

  getUsers: (params) =>
    axiosClient.get('/admin/users', { params }),

  updateUserRole: (id, role) =>
    axiosClient.patch(`/admin/users/${id}/role`, { role }),

  deleteUser: (id) =>
    axiosClient.delete(`/admin/users/${id}`),
};

export default adminApi;
