import axiosClient from './axiosClient'
const authApi = {
  register: (data) => axiosClient.post('/auth/register', data),
  login: (data) => axiosClient.post('/auth/login', data),
  forgotPassword: (data) => axiosClient.post('/auth/forgot-password', data),
  resetPassword: (data) => axiosClient.post('/auth/reset-password', data),
}
export default authApi
