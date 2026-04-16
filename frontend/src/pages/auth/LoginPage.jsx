import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi, { saveSession } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

export default function LoginPage() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Vui lòng nhập email hoặc username và mật khẩu.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.login({ identifier, password });

      // Backend: ApiResponse<AuthResponse>
      // response.data = { success, message, data: { accessToken, refreshToken, user, ... } }
      const authData = response.data?.data;

      if (!authData?.accessToken) {
        throw new Error('Phản hồi không hợp lệ từ máy chủ.');
      }

      // Lưu token + user vào localStorage
      saveSession({
        accessToken: authData.accessToken,
        refreshToken: authData.refreshToken,
        user: authData.user,
      });

      // Hydrate Zustand store từ localStorage
      useAuthStore.getState().initFromStorage();

      // Redirect theo role: ADMIN → /admin, CLIENT → /
      const role = authData.user?.role?.toUpperCase();
      navigate(role === 'ADMIN' ? '/admin' : '/');
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      const msg =
        err.response?.data?.error ??
        err.response?.data?.message ??
        err.message ??
        'Sai tên đăng nhập hoặc mật khẩu!';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ── styles ──────────────────────────────────────────── */
  const inputStyle = {
    width: '100%', background: 'var(--bg3)',
    border: '1px solid var(--border)', borderRadius: 12,
    color: 'var(--text)', padding: '11px 14px', fontSize: 15,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20, background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>

        {/* Logo */}
        <div style={{
          marginBottom: 32, fontSize: 24, display: 'block',
          textAlign: 'center', fontFamily: 'Syne, sans-serif',
          fontWeight: 800, color: 'var(--text)',
        }}>
          Viet<span style={{ color: 'var(--accent)' }}>Money</span>
        </div>

        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 24, padding: 28,
        }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, marginBottom: 6 }}>
            Đăng Nhập
          </h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24 }}>
            Chào mừng trở lại!
          </p>

          {/* Error banner */}
          {error && (
            <div style={{
              background: 'rgba(242,61,110,0.08)',
              border: '1px solid rgba(242,61,110,0.35)',
              borderRadius: 12, padding: '10px 14px',
              fontSize: 13, color: 'var(--accent3)', marginBottom: 18,
            }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleLogin} noValidate>

            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontFamily: 'DM Mono, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: 'var(--muted)',
                marginBottom: 6,
              }}>
                Tên đăng nhập
              </label>
              <input
                type="text"
                placeholder="Email hoặc username"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError(''); // Xóa lỗi khi người dùng nhập mới
                }}
                style={inputStyle} // Áp dụng object style chung
                autoComplete="username"
                required
              />
            </div>
            {/* Password */}
            <div style={{ marginBottom: 8 }}>
              <label style={{
                display: 'block', fontSize: 12,
                fontFamily: 'DM Mono, monospace',
                textTransform: 'uppercase', letterSpacing: '0.5px',
                color: 'var(--muted)', marginBottom: 6,
              }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  style={{ ...inputStyle, paddingRight: 44 }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw(v => !v)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    color: 'var(--muted)', cursor: 'pointer', fontSize: 16, padding: 0,
                  }}
                  aria-label="Toggle password visibility"
                >
                  {showPw ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div style={{ textAlign: 'right', marginBottom: 20 }}>
              <Link to="/forgot-password" style={{
                fontSize: 13, color: 'var(--muted)', textDecoration: 'none',
              }}>
                Quên mật khẩu?
              </Link>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '13px',
                background: loading ? 'var(--bg3)' : 'var(--accent)',
                color: loading ? 'var(--muted)' : '#000',
                borderRadius: 12, border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'Syne, sans-serif',
                fontWeight: 700, fontSize: 15,
                transition: 'background 0.2s',
              }}
            >
              {loading ? '⏳ Đang đăng nhập...' : 'Đăng Nhập'}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 12, margin: '20px 0',
          }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>hoặc</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Google OAuth */}
          <a
            href="/oauth2/authorization/google"
            style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 10,
              width: '100%', padding: '11px 0',
              borderRadius: 40, background: 'var(--bg3)',
              border: '1px solid var(--border)',
              color: 'var(--text)', fontSize: 14,
              fontWeight: 500, textDecoration: 'none',
              boxSizing: 'border-box',
            }}
          >
            🌐 Đăng nhập với Google
          </a>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
            Chưa có tài khoản?{' '}
            <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>
              Đăng Ký
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}