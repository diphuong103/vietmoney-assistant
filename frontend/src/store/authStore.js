import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null, // { name, email, role }
  token: null,
  setUser:  (user)  => set({ user }),
  setToken: (token) => set({ token }),
  logout:   ()      => set({ user: null, token: null }),
}));
