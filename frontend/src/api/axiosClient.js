import axios from 'axios'

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('vm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vm_token')
      window.location.href = '/login'
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default axiosClient
