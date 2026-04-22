import axiosClient from './axiosClient';

const atmApi = {
  getNearby: (lat, lng, radius = 2000) =>
    axiosClient.get('/atm/nearby', { params: { lat, lng, radius } }),

  getById: (id) =>
    axiosClient.get(`/atm/${id}`),

  saveAtm: (data) =>
    axiosClient.post('/atm/save', data),

  unsaveAtm: (atmId) =>
    axiosClient.delete(`/atm/unsave/${atmId}`),

  getSaved: () =>
    axiosClient.get('/atm/saved'),
};

export default atmApi;
