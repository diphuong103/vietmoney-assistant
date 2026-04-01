import axiosClient from './axiosClient';

const touristApi = {
  getSpots: (params) =>
    axiosClient.get('/tourist-spots', { params }),

  getById: (id) =>
    axiosClient.get(`/tourist-spots/${id}`),
};

export default touristApi;
