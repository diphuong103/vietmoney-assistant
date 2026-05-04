import axiosClient from './axiosClient';

const articleApi = {
  getAll: (params) =>
    axiosClient.get('/articles/public', { params }),

  getById: (id) =>
    axiosClient.get(`/articles/${id}`),

  create: (data) =>
    axiosClient.post('/articles', data),

  approve: (id) =>
    axiosClient.patch(`/articles/${id}/approve`),

  reject: (id) =>
    axiosClient.patch(`/articles/${id}/reject`),

  delete: (id) =>
    axiosClient.delete(`/articles/${id}`),

  like: (id) =>
    axiosClient.post(`/articles/${id}/like`),

  save: (id) =>
    axiosClient.post(`/articles/${id}/save`),

  uploadMedia: (formData) =>
    axiosClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

export default articleApi;
