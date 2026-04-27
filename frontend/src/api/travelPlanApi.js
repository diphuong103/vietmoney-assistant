// frontend/src/api/travelPlanApi.js
import axiosClient from './axiosClient';

const travelPlanApi = {
  getAll: () => axiosClient.get('/travel-plans'),
  getById: (id) => axiosClient.get(`/travel-plans/${id}`),
  create: (data) => axiosClient.post('/travel-plans', data),
  update: (id, data) => axiosClient.put(`/travel-plans/${id}`, data),
  delete: (id) => axiosClient.delete(`/travel-plans/${id}`),
  // Thêm vào travelPlanApi.js
  aiSuggest: (id) => axiosClient.post(`/travel-plans/${id}/ai-suggest`),
  getSchedule: (id) => axiosClient.get(`/travel-plans/${id}/schedule`),
};

export default travelPlanApi;