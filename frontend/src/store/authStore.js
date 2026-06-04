import { create } from 'zustand';
import { getStoredUser, saveSession, clearSession } from '../api/authApi';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isReady: false,
  isVerifying: false,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),

  verifyAuth: async () => {
    if (get().isVerifying) return;

    const publicPaths = ['/login', '/register', '/forgot-password', '/verify-otp'];
    const currentPath = window.location.pathname;

    // Đang ở trang auth thì không cần gọi /users/me
    if (publicPaths.includes(currentPath)) {
      set({
        user: getStoredUser(),
        token: localStorage.getItem('accessToken') || null,
        isReady: true,
        isVerifying: false,
      });
      return;
    }

    set({ isVerifying: true });

    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!accessToken || accessToken === 'undefined' || accessToken === 'null') {
      clearSession();
      set({
        user: null,
        token: null,
        isReady: true,
        isVerifying: false,
      });
      return;
    }

    try {
      const { default: axiosClient } = await import('../api/axiosClient');

      const res = await axiosClient.get('/users/me', { _silent: true });
      const userData = res.data?.data ?? res.data;

      if (!userData) {
        throw new Error('Invalid user data');
      }

      localStorage.setItem('user', JSON.stringify(userData));

      set({
        user: userData,
        token: accessToken,
        isReady: true,
        isVerifying: false,
      });
    } catch (err) {
      const status = err.response?.status;

      // Nếu backend lỗi 500 thì không để app load mãi
      if (!status || status >= 500) {
        clearSession();
        set({
          user: null,
          token: null,
          isReady: true,
          isVerifying: false,
        });
        return;
      }

      if ((status === 401 || status === 403) && refreshToken) {
        try {
          const axios = (await import('axios')).default;

          const BASE = import.meta.env.VITE_API_BASE_URL
              ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
              : '/api/v1';

          const { data } = await axios.post(
              `${BASE}/auth/refresh-token`,
              null,
              { params: { token: refreshToken } }
          );

          const newAccess = data.data?.accessToken;
          const newRefresh = data.data?.refreshToken;
          const user = data.data?.user ?? getStoredUser();

          if (newAccess) {
            saveSession({
              accessToken: newAccess,
              refreshToken: newRefresh,
              user,
            });

            set({
              user,
              token: newAccess,
              isReady: true,
              isVerifying: false,
            });
            return;
          }
        } catch {
          // refresh fail thì clear bên dưới
        }
      }

      clearSession();
      set({
        user: null,
        token: null,
        isReady: true,
        isVerifying: false,
      });
    }
  },

  /** Re-read localStorage and mark as ready (used after login) */
  initFromStorage: () => set({
    user: getStoredUser(),
    token: localStorage.getItem('accessToken') || null,
    isReady: true,
    isVerifying: false,
  }),

  logout: () => {
    clearSession();
    set({ user: null, token: null, isReady: true });
  },
}));
