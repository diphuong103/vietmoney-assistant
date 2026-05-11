import { useAuthStore } from '../store/authStore';
import authApi, { clearSession } from '../api/authApi';

export function useAuth() {
  const { user, token, setUser, setToken, logout, isReady } = useAuthStore();

  const login = async (identifier, password) => {
    const res = await authApi.login({ identifier, password });
    const { token: t, user: u } = res.data;
    localStorage.setItem('accessToken', t);
    setToken(t);
    setUser(u);
    return u;
  };

  const logoutUser = async () => {
    try { await authApi.logout(); } catch (_) { }
    clearSession();
    logout();
  };

  return { user, token, login, logout: logoutUser, isAuthenticated: !!user, isReady };
}
