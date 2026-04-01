import axiosClient from './axiosClient';

const atmApi = {
  getNearby: (lat, lng, radius = 2000) =>
    axiosClient.get('/atm/nearby', { params: { lat, lng, radius } }),

  getById: (id) =>
    axiosClient.get(`/atm/${id}`),
};

export default atmApi;
