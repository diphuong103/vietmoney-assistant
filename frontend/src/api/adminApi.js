import axiosClient from './axiosClient'
const adminApi = {
  getUsers: (params) => axiosClient.get('/admin/users', { params }),
  deleteUser: (id) => axiosClient.delete(`/admin/users/${id}`),
  importExcel: (formData) => axiosClient.post('/admin/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getStats: () => axiosClient.get('/admin/stats'),
}
export default adminApi
