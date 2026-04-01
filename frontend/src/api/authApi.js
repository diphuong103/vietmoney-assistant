import axiosClient from './axiosClient';

const authApi = {
  login: (email, password) =>
    axiosClient.post('/auth/login', { email, password }),

  register: (data) =>
    axiosClient.post('/auth/register', data),

  forgotPassword: (email) =>
    axiosClient.post('/auth/forgot-password', { email }),

  verifyOtp: (otp) =>
    axiosClient.post('/auth/verify-otp', { otp }),

  resetPassword: (token, newPassword) =>
    axiosClient.post('/auth/reset-password', { token, newPassword }),

  getMe: () =>
    axiosClient.get('/auth/me'),

  logout: () =>
    axiosClient.post('/auth/logout'),
};

export default authApi;
