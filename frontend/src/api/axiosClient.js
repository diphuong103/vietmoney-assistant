import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL
    ? `${import.meta.env.VITE_API_BASE_URL}/api/v1`
    : 'http://localhost:8080/api/v1';   // fallback rõ ràng cho dev

const axiosClient = axios.create({
    baseURL: BASE,
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: false,             // không dùng cookie, dùng Bearer token
});

// ── Request: đính kèm access token ───────────────────────
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Response: xử lý 401 + refresh rotation ───────────────
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve(token)
    );
    failedQueue = [];
};

axiosClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;

        // Chỉ xử lý 401 và không retry lần 2
        if (error.response?.status === 401 && !original._retry) {
            // Các endpoint auth không cần refresh
            if (original.url?.includes('/auth/')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then((newToken) => {
                    original.headers.Authorization = `Bearer ${newToken}`;
                    return axiosClient(original);
                });
            }

            original._retry = true;
            isRefreshing    = true;
            const refreshToken = localStorage.getItem('refreshToken');

            if (!refreshToken) {
                isRefreshing = false;
                redirectToLogin();
                return Promise.reject(error);
            }

            try {
                const { data } = await axios.post(
                    `${BASE}/auth/refresh-token`,
                    null,
                    { params: { token: refreshToken } }
                );
                const newAccess  = data.data?.accessToken;
                const newRefresh = data.data?.refreshToken;

                localStorage.setItem('accessToken',  newAccess);
                localStorage.setItem('refreshToken', newRefresh);

                axiosClient.defaults.headers.common.Authorization = `Bearer ${newAccess}`;
                original.headers.Authorization                    = `Bearer ${newAccess}`;

                processQueue(null, newAccess);
                return axiosClient(original);
            } catch (err) {
                processQueue(err, null);
                redirectToLogin();
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

function redirectToLogin() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
}

export default axiosClient;