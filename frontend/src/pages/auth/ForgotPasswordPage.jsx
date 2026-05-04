import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../../api/authApi';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Địa chỉ email không hợp lệ.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // POST /api/v1/auth/forgot-password  →  { email }
      await authApi.forgotPassword(email.trim());

      // Navigate to OTP page, carry email in router state
      navigate('/verify-otp', { state: { email: email.trim() } });
    } catch (err) {
      const msg =
          err.response?.data?.error ??
          err.response?.data?.message ??
          'Đã xảy ra lỗi. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%', background: 'var(--bg3)',
    border: `1px solid ${error ? 'rgba(242,61,110,0.6)' : 'var(--border)'}`,
    borderRadius: 12, color: 'var(--text)',
    padding: '11px 14px', fontSize: 15, outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  };

  return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: 20, background: 'var(--bg)',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          {/* Logo */}
          <Link to="/" style={{
            fontFamily: 'Syne, sans-serif', fontWeight: 800,
            fontSize: 22, marginBottom: 32, display: 'block',
            textAlign: 'center', color: 'var(--text)', textDecoration: 'none',
          }}>
            Viet<span style={{ color: 'var(--accent)' }}>Money</span>
          </Link>

          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 24, padding: 28,
          }}>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, marginBottom: 8 }}>
              Quên Mật Khẩu
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
              Nhập email của bạn — chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
            </p>

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

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block', fontSize: 12,
                  fontFamily: 'DM Mono, monospace',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  color: 'var(--muted)', marginBottom: 6,
                }}>
                  Email
                </label>
                <input
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    style={inputStyle}
                    autoComplete="email"
                    required
                />
              </div>

              <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px',
                    background: loading ? 'var(--bg3)' : 'var(--accent)',
                    color: loading ? 'var(--muted)' : '#000',
                    borderRadius: 12, border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
                    transition: 'background 0.2s',
                  }}
              >
                {loading ? '⏳ Đang gửi...' : 'Gửi Mã OTP'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
              <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                ← Quay lại Đăng Nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
  );
}