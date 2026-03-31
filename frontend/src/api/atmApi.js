import axiosClient from './axiosClient'
const atmApi = {
  findNearby: (lat, lng, radius = 2000) =>
    axiosClient.get('/atm/nearby', { params: { lat, lng, radius } }),
}
export default atmApi
