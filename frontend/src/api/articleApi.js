import axiosClient from './axiosClient';

const articleApi = {
  // ── PUBLIC FEED ─────────────────────
  getFeed: (params = {}) =>
    axiosClient.get('/articles/public', { params }),

  getAll: (params = {}) =>
    axiosClient.get('/articles/public', { params }),

  // ── FOLLOWING FEED ──────────────────  (MỚI)
  getFollowingFeed: (params = {}) =>
    axiosClient.get('/articles/following', { params }),

  // ── ARTICLE DETAIL ──────────────────  (MỚI)
  getById: (id) =>
    axiosClient.get(`/articles/${id}`),

  // ── COMMENTS ────────────────────────
  getComments: (articleId, params = {}) =>
    axiosClient.get(`/articles/${articleId}/comments`, { params }),

  createComment: (articleId, data) =>
    axiosClient.post(`/articles/${articleId}/comments`, data),

  getReplies: (articleId, commentId) =>
    axiosClient.get(`/articles/${articleId}/comments/${commentId}/replies`),

  likeComment: (articleId, commentId) =>
    axiosClient.post(`/articles/${articleId}/comments/${commentId}/like`),

  deleteComment: (articleId, commentId) =>
    axiosClient.delete(`/articles/${articleId}/comments/${commentId}`),

  // ── PREVIEW (không tăng view) ────────
  getPreview: (id) =>
    axiosClient.get(`/articles/${id}/preview`),

  // ── MY POSTS ────────────────────────
  getMyPosts: (params = {}) =>
    axiosClient.get('/articles/my', { params }),

  // ── USER ARTICLES ───────────────────  (MỚI)
  getUserArticles: (userId, params = {}) =>
    axiosClient.get(`/articles/user/${userId}`, { params }),

  // ── CATEGORY ────────────────────────  (MỚI)
  getByCategory: (category, params = {}) =>
    axiosClient.get(`/articles/category/${category}`, { params }),

  // ── LOCATION ────────────────────────  (MỚI)
  getByLocation: (location, params = {}) =>
    axiosClient.get('/articles/location', { params: { location, ...params } }),

  // ── TRENDING ────────────────────────  (MỚI)
  getTrending: (params = {}) =>
    axiosClient.get('/articles/trending', { params }),

  // ── FEATURED ────────────────────────  (MỚI)
  getFeatured: (params = {}) =>
    axiosClient.get('/articles/featured', { params }),

  // ── SEARCH ──────────────────────────  (MỚI)
  search: (keyword, params = {}) =>
    axiosClient.get('/articles/search', { params: { keyword, ...params } }),

  // ── HASHTAG ─────────────────────────  (MỚI)
  getByHashtag: (hashtag, params = {}) =>
    axiosClient.get(`/articles/hashtag/${hashtag}`, { params }),

  // ── RELATED ─────────────────────────  (MỚI)
  getRelated: (id, params = {}) =>
    axiosClient.get(`/articles/${id}/related`, { params }),

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

  // ── SAVED LIST ──────────────────────  (MỚI)
  getSaved: (params = {}) =>
    axiosClient.get('/articles/saved', { params }),

  // ── STATISTICS ──────────────────────  (MỚI)
  countApproved: () =>
    axiosClient.get('/articles/statistics/approved-count'),

  countAll: () =>
    axiosClient.get('/articles/statistics/total-count'),

  countMine: () =>
    axiosClient.get('/articles/statistics/my-count'),
};

export default articleApi;