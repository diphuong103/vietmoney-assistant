import axios from 'axios';
import toast from 'react-hot-toast';

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

// ── Response: xử lý 401 + refresh rotation + global error toast ──
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve(token)
    );
    failedQueue = [];
};

/** Map HTTP status → user-friendly message (Vietnamese) */
const ERROR_MESSAGES = {
    400: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
    401: 'Phiên đăng nhập đã hết hạn.',
    403: 'Bạn không có quyền thực hiện hành động này.',
    404: 'Không tìm thấy dữ liệu yêu cầu.',
    409: 'Dữ liệu bị trùng lặp. Vui lòng kiểm tra lại.',
    500: 'Lỗi hệ thống. Vui lòng thử lại sau.',
};

axiosClient.interceptors.response.use(
    (res) => res,
    async (error) => {
        const original = error.config;
        const status   = error.response?.status;

        // ── 401 handling (refresh token rotation) ─────────
        if (status === 401 && !original._retry) {
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

        // ── Global Error Toast ────────────────────────────
        // Chỉ hiển thị toast cho lỗi chưa được silent (không có _silent flag)
        if (!original._silent && status && status !== 401) {
            const serverMsg = error.response?.data?.error
                           ?? error.response?.data?.message;
            const fallback  = ERROR_MESSAGES[status] ?? `Lỗi ${status}. Vui lòng thử lại.`;
            toast.error(serverMsg || fallback, {
                duration: 4000,
                style: {
                    background: '#1a1a2e',
                    color: '#fff',
                    border: '1px solid rgba(242,61,110,0.3)',
                    borderRadius: '12px',
                    fontSize: '14px',
                },
                iconTheme: { primary: '#f23d6e', secondary: '#fff' },
            });
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