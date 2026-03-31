import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'
import authApi from '../api/authApi'
import toast from 'react-hot-toast'

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, logout } = useAuthStore()
  const navigate = useNavigate()

  const login = async (data) => {
    try {
      const res = await authApi.login(data)
      localStorage.setItem('vm_token', res.data.accessToken)
      setAuth(res.data.user, res.data.accessToken)
      toast.success('Đăng nhập thành công!')
      navigate(res.data.user?.role === 'ADMIN' ? '/admin' : '/dashboard')
    } catch (err) {
      toast.error(err?.message || 'Đăng nhập thất bại')
    }
  }

  const register = async (data) => {
    try {
      const res = await authApi.register(data)
      localStorage.setItem('vm_token', res.data.accessToken)
      setAuth(res.data.user, res.data.accessToken)
      toast.success('Đăng ký thành công!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err?.message || 'Đăng ký thất bại')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Đã đăng xuất')
  }

  return { user, token, isAuthenticated, login, register, logout: handleLogout }
}
