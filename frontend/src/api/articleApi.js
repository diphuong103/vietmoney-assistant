import axiosClient from './axiosClient';

const articleApi = {
  // ── PUBLIC FEED ─────────────────────
  getFeed: (params = {}) =>
    axiosClient.get('/articles/public', { params }),

  getAll: (params = {}) =>
    axiosClient.get('/articles/public', { params }),

  // ── MY POSTS ────────────────────────
  getMyPosts: (params = {}) =>
    axiosClient.get('/articles/my', { params }),

  // ── CRUD ────────────────────────────
  create: (data) =>
    axiosClient.post('/articles', data),

  update: (id, data) =>
    axiosClient.put(`/articles/${id}`, data),

  deleteSoft: (id) =>
    axiosClient.delete(`/articles/${id}/soft`),

  // ── LIKE / SAVE ─────────────────────
  like: (id) =>
    axiosClient.post(`/articles/${id}/like`),

  save: (id) =>
    axiosClient.post(`/articles/${id}/save`),

  getStatus: (id) =>
    axiosClient.get(`/articles/${id}/status`),
};

export default articleApi;