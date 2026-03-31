import axiosClient from './axiosClient'
const scanApi = {
  scanImage: (formData) => axiosClient.post('/scan', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getHistory: (params) => axiosClient.get('/scan/history', { params }),
}
export default scanApi
