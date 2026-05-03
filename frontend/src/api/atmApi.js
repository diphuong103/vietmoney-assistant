import axiosClient from './axiosClient';

const atmApi = {
  getNearby: (lat, lng, radius = 3000) =>
    axiosClient.get('/atm/nearby', { params: { lat, lng, radius } }),

  getById: (id) =>
    axiosClient.get(`/atm/${id}`),

  // Proxy qua backend để bảo vệ API key
  getDirection: (origin, destination, vehicle = 'car') =>
    axiosClient.get('/atm/direction', { params: { origin, destination, vehicle } }),

  // Gợi ý tìm kiếm địa điểm
  getAutocomplete: (query, lat, lng) =>
    axiosClient.get('/atm/autocomplete', { params: { query, lat, lng } }),

  // Lấy tọa độ của 1 placeId
  getPlaceDetail: (placeId) =>
    axiosClient.get('/atm/place-detail', { params: { placeId } }),

  saveAtm: (data) =>
    axiosClient.post('/atm/save', data),

  unsaveAtm: (atmId) =>
    axiosClient.delete(`/atm/unsave/${atmId}`),

  getSaved: () =>
    axiosClient.get('/atm/saved'),
};

export default atmApi;
