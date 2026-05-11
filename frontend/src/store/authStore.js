import { create } from 'zustand';
import { getStoredUser, saveSession, clearSession } from '../api/authApi';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isReady: false,
  isVerifying: false,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),

  /**
   * Verify auth on app startup.
   * 1. Check localStorage for accessToken
   * 2. If exists → call GET /users/me to verify
   * 3. If valid → set user/token, isReady = true
   * 4. If invalid → try refresh → if fails → clear session
   * 5. If no token → isReady = true, user = null
   */
  verifyAuth: async () => {
    if (get().isVerifying) return;
    set({ isVerifying: true });

    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    // No token at all → not logged in
    if (!accessToken) {
      clearSession();
      set({ user: null, token: null, isReady: true, isVerifying: false });
      return;
    }

    try {
      // Dynamically import to avoid circular dependency
      const { default: axiosClient } = await import('../api/axiosClient');

      // Verify the token by calling /users/me with _silent flag to suppress error toasts
      const res = await axiosClient.get('/users/me', { _silent: true });
      const userData = res.data?.data ?? res.data;

      if (userData) {
        // Token is valid — save user to localStorage and store
        localStorage.setItem('user', JSON.stringify(userData));
        set({
          user: userData,
          token: accessToken,
          isReady: true,
          isVerifying: false,
        });
      } else {
        throw new Error('Invalid user data');
      }
    } catch (err) {
      const status = err.response?.status;

      // Server error (500, 502, 503, etc.) — NOT an auth failure
      // Fall back to stored user data if available
      if (!status || status >= 500) {
        const storedUser = getStoredUser();
        if (storedUser) {
          set({
            user: storedUser,
            token: accessToken,
            isReady: true,
            isVerifying: false,
          });
          return;
        }
        // No stored user either — treat as unauthenticated
        clearSession();
        set({ user: null, token: null, isReady: true, isVerifying: false });
        return;
      }

      // Auth error (401/403) — try refresh token
      if (status === 401 || status === 403) {
        // Try refresh token manually if interceptor didn't handle it
        if (refreshToken) {
          try {
            const axios = (await import('axios')).default;
            const BASE = import.meta.env.VITE_API_BASE_URL
              ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
              : 'http://localhost:8080/api/v1';

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
            // Refresh also failed — clear everything
          }
        }
      }

      // All attempts failed — clear session and mark as ready (unauthenticated)
      clearSession();
      set({ user: null, token: null, isReady: true, isVerifying: false });
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
