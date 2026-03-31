import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => {
        localStorage.removeItem('vm_token')
        set({ user: null, token: null, isAuthenticated: false })
      },
      updateUser: (user) => set({ user }),
    }),
    {
      name: 'vietmoney-auth',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)
