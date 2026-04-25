import axiosClient from './axiosClient';

const travelPlanApi = {
  getMyPlans: () =>
    axiosClient.get('/travel-plans'),

  createPlan: (data) =>
    axiosClient.post('/travel-plans', data),

  updatePlan: (id, data) =>
    axiosClient.put(`/travel-plans/${id}`, data),

  deletePlan: (id) =>
    axiosClient.delete(`/travel-plans/${id}`),
};

export default travelPlanApi;
