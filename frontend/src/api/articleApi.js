import axiosClient from './axiosClient'
const articleApi = {
  getApproved: (params) => axiosClient.get('/articles/public', { params }),
  getById: (id) => axiosClient.get(`/articles/${id}`),
  create: (data) => axiosClient.post('/articles', data),
  saveArticle: (id) => axiosClient.post(`/articles/${id}/save`),
  getSaved: () => axiosClient.get('/articles/saved'),
  admin: {
    getPending: (params) => axiosClient.get('/admin/articles/pending', { params }),
    approve: (id) => axiosClient.put(`/articles/admin/${id}/approve`),
    reject: (id, reason) => axiosClient.put(`/articles/admin/${id}/reject`, null, { params: { reason } }),
  }
}
export default articleApi
