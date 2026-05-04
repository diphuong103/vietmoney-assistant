import axiosClient from './axiosClient';

// ── Session helpers ────────────────────────────────────────

export function saveSession({ accessToken, refreshToken, user }) {
  localStorage.setItem('accessToken',  accessToken);
  localStorage.setItem('refreshToken', refreshToken ?? '');
  if (user) localStorage.setItem('user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user') ?? 'null'); }
  catch { return null; }
}

// ── Auth API ───────────────────────────────────────────────

const authApi = {
  /**
   * POST /api/v1/auth/login
   * Body: { email, password }
   * Returns: ApiResponse<AuthResponse>
   *   data: { accessToken, refreshToken, tokenType, expiresIn, user }
   */
  login: ({ identifier, password }) =>
      axiosClient.post('/auth/login', { identifier, password }),

  /**
   * POST /api/v1/auth/register
   * Body: { fullName, email, password, nationality?, travelDestination? }
   * Returns: ApiResponse<UserProfileResponse>
   */
  register: ({username, fullName, email, password, nationality, travelDestination  }) =>
      axiosClient.post('/auth/register', {
        username,
        fullName,
        email,
        password,
        ...(nationality  ? { nationality }  : {}),
        ...(travelDestination   ? { travelDestination }   : {}),
      }),

  /**
   * POST /api/v1/auth/forgot-password
   * Body: { email }
   */
  forgotPassword: (email) =>
      axiosClient.post('/auth/forgot-password', { email }),

  /**
   * POST /api/v1/auth/reset-password
   * Body: { email, otp, purpose, newPassword }
   */
  resetPassword: ({ email, otp, newPassword }) =>
      axiosClient.post('/auth/reset-password', {
        email,
        otp,
        purpose: 'RESET_PASSWORD',
        newPassword,
      }),

  /**
   * POST /api/v1/auth/refresh-token?token=xxx
   */
  refreshToken: (token) =>
      axiosClient.post('/auth/refresh-token', null, { params: { token } }),

  /**
   * POST /api/v1/auth/logout?refreshToken=xxx
   */
  logout: () => {
    const rt = localStorage.getItem('refreshToken');
    return axiosClient.post('/auth/logout', null,
        rt ? { params: { refreshToken: rt } } : {}
    );
  },

  /** GET /api/v1/users/me */
  getMe: () => axiosClient.get('/users/me'),
};

export default authApi;