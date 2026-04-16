import { create } from 'zustand';
import { getStoredUser } from '../api/authApi';

// Hydrate from localStorage on creation
const storedUser = getStoredUser();
const storedToken = localStorage.getItem('accessToken') || null;

export const useAuthStore = create((set) => ({
  user: storedUser,
  token: storedToken,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  /** Re-read localStorage (e.g. after saveSession) */
  initFromStorage: () => set({
    user: getStoredUser(),
    token: localStorage.getItem('accessToken') || null,
  }),
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },
}));
