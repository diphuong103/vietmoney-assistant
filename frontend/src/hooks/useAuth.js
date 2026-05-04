import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import authApi from '../api/authApi';

export function useAuth() {
  const { user, token, setUser, setToken, logout } = useAuthStore();

  useEffect(() => {
    // Rehydrate user on mount if token exists in localStorage
    const savedToken = localStorage.getItem('token');
    if (savedToken && !user) {
      setToken(savedToken);
      authApi.getMe()
        .then((res) => setUser(res.data))
        .catch(() => { localStorage.removeItem('token'); logout(); });
    }
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    const { token: t, user: u } = res.data;
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
    return u;
  };

  const logoutUser = async () => {
    try { await authApi.logout(); } catch (_) {}
    localStorage.removeItem('token');
    logout();
  };

  return { user, token, login, logout: logoutUser, isAuthenticated: !!user };
}
