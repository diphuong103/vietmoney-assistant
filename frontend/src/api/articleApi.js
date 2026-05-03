import axiosClient from './axiosClient';
import axios from 'axios';

const IMGBB_KEY = import.meta.env.VITE_IMGBB_API_KEY;

const articleApi = {
  /** Get all approved articles (public) */
  getAll: (params) =>
    axiosClient.get('/articles/public', { params }),

  /** Get single article by id (public) */
  getById: (id) =>
    axiosClient.get(`/articles/public/${id}`),

  /** Create a new article (requires auth) */
  create: (data) =>
    axiosClient.post('/articles', data),

  /** Admin: approve */
  approve: (id) =>
    axiosClient.patch(`/articles/${id}/approve`),

  /** Admin: reject */
  reject: (id) =>
    axiosClient.patch(`/articles/${id}/reject`),

  /** Admin: delete */
  delete: (id) =>
    axiosClient.delete(`/articles/${id}`),

  /** Toggle like (requires auth) — returns {liked, saved, likeCount} */
  like: (id) =>
    axiosClient.post(`/articles/${id}/like`),

  /** Toggle save (requires auth) — returns {liked, saved, likeCount} */
  save: (id) =>
    axiosClient.post(`/articles/${id}/save`),

  /** Get current user like/save status for an article */
  getStatus: (id) =>
    axiosClient.get(`/articles/${id}/status`),

  /** My articles */
  getMyArticles: (params) =>
    axiosClient.get('/articles/my', { params }),

  /**
   * Upload image to ImgBB and return the hosted URL.
   * @param {File} file — only image files
   * @returns {Promise<string>} image URL
   */
  uploadToImgBB: async (file) => {
    if (!IMGBB_KEY) throw new Error('VITE_IMGBB_API_KEY không được cấu hình');
    const form = new FormData();
    form.append('image', file);
    const res = await axios.post(
      `https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`,
      form
    );
    return res.data?.data?.url;
  },
};

export default articleApi;
