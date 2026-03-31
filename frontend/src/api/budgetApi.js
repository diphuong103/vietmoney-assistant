import axiosClient from './axiosClient'
const budgetApi = {
  getAll: () => axiosClient.get('/budgets'),
  create: (data) => axiosClient.post('/budgets', data),
  update: (id, data) => axiosClient.put(`/budgets/${id}`, data),
  delete: (id) => axiosClient.delete(`/budgets/${id}`),
}
export default budgetApi
