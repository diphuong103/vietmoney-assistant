import axiosClient from './axiosClient';

const adminApi = {
  /* ── Dashboard Stats ─────────────────────────── */
  getStats: () =>
    axiosClient.get('/admin/stats'),

  /* ── User Management ─────────────────────────── */
  getUsers: (params) =>
    axiosClient.get('/admin/users', { params }),

  updateUserRole: (id, role) =>
    axiosClient.patch(`/admin/users/${id}/role`, null, { params: { role } }),

  deleteUser: (id) =>
    axiosClient.delete(`/admin/users/${id}`),

  toggleUserStatus: (id) =>
    axiosClient.patch(`/admin/users/${id}/status`),

  /* ── Article Management ──────────────────────── */
  getArticles: (params) =>
    axiosClient.get('/admin/articles', { params }),

  getPendingArticles: (params) =>
    axiosClient.get('/admin/articles', { params: { ...params, status: 'pending' } }),

  approveArticle: (id) =>
    axiosClient.put(`/articles/admin/${id}/approve`),

  rejectArticle: (id, reason) =>
    axiosClient.put(`/articles/admin/${id}/reject`, null, { params: { reason } }),

  deleteArticle: (id) =>
    axiosClient.delete(`/articles/${id}`),
};

export default adminApi;
