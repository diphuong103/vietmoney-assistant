import axiosClient from './axiosClient';

const travelPlanApi = {
  getMyPlans: () =>
    axiosClient.get('/travel-plans'),

  createPlan: (data) =>
    axiosClient.post('/travel-plans', data),

  deletePlan: (id) =>
    axiosClient.delete(`/travel-plans/${id}`),
};

export default travelPlanApi;
