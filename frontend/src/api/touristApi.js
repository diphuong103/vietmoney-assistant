import axiosClient from './axiosClient'
const touristApi = {
  getSpots: (params) => axiosClient.get('/tourist-spots/public', { params }),
  getById: (id) => axiosClient.get(`/tourist-spots/${id}`),
  getPlans: () => axiosClient.get('/travel-plans'),
  createPlan: (data) => axiosClient.post('/travel-plans', data),
  updatePlan: (id, data) => axiosClient.put(`/travel-plans/${id}`, data),
  deletePlan: (id) => axiosClient.delete(`/travel-plans/${id}`),
}
export default touristApi
