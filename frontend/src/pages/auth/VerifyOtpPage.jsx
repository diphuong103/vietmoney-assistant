import { useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import authApi from '../../api/authApi';

/**
 * VerifyOtpPage — dùng cho luồng Reset Password:
 *   1. ForgotPasswordPage gửi email → redirect tới trang này
 *   2. User nhập 6 số OTP + mật khẩu mới
 *   3. POST /api/v1/auth/reset-password
 *   4. Chuyển về /login khi thành công
 */
export default function VerifyOtpPage() {
  const navigate  = useNavigate();
  const location  = useLocation();

  // email được truyền từ ForgotPasswordPage qua router state
  const email = location.state?.email ?? '';

  const [otp,         setOtp]         = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [resendMsg,   setResendMsg]   = useState('');

  const inputs = useRef([]);

  /* ── OTP input handlers ─────────────────────────────── */
  const handleChange = (val, i) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    setError('');
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft'  && i > 0) inputs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    const next = [...otp];
    pasted.split('').forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  /* ── Resend OTP ─────────────────────────────────────── */
  const handleResend = async () => {
    if (!email) return;
    setResendMsg('');
    try {
      await authApi.forgotPassword(email);
      setResendMsg('Đã gửi lại mã OTP. Vui lòng kiểm tra email!');
    } catch {
      setResendMsg('Gửi lại thất bại. Vui lòng thử lại sau.');
    }
  };

  /* ── Submit ─────────────────────────────────────────── */
  const handleVerify = async (e) => {
    e.preventDefault();

    const otpCode = otp.join('');

    if (!email) {
      setError('Không tìm thấy email. Vui lòng quay lại trang Quên mật khẩu.');
      return;
    }
    if (otpCode.length < 6) {
      setError('Vui lòng nhập đầy đủ 6 chữ số OTP.');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setError('Mật khẩu mới phải có ít nhất 8 ký tự.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // POST /api/v1/auth/reset-password
      // Body: { email, otp, purpose: 'RESET_PASSWORD', newPassword }
      await authApi.resetPassword({ email, otp: otpCode, newPassword });

      navigate('/login', {
        state: { message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập.' },
      });
    } catch (err) {
      const msg =
          err.response?.data?.error ??
          err.response?.data?.message ??
          'Mã OTP không hợp lệ hoặc đã hết hạn.';
      setError(msg);
      // Reset OTP boxes
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  /* ── Styles ─────────────────────────────────────────── */
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
        <div style={{ width: '100%', maxWidth: 400 }}>

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
              Xác Nhận OTP
            </h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 6 }}>
              Nhập mã 6 chữ số đã gửi đến
            </p>
            {email && (
                <p style={{
                  fontSize: 13, fontWeight: 600,
                  color: 'var(--accent)', marginBottom: 24,
                }}>
                  {email}
                </p>
            )}

            {/* Error */}
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

            <form onSubmit={handleVerify} noValidate>

              {/* OTP boxes */}
              <div style={{
                display: 'flex', gap: 8,
                justifyContent: 'center', marginBottom: 24,
              }}>
                {otp.map((digit, i) => (
                    <input
                        key={i}
                        ref={el => { inputs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleChange(e.target.value, i)}
                        onKeyDown={e => handleKeyDown(e, i)}
                        onPaste={i === 0 ? handlePaste : undefined}
                        style={{
                          width: 48, height: 56, textAlign: 'center',
                          fontSize: 24, fontFamily: 'DM Mono, monospace',
                          background: 'var(--bg3)',
                          border: `2px solid ${digit ? 'var(--accent)' : 'var(--border)'}`,
                          borderRadius: 12, color: 'var(--text)',
                          outline: 'none', padding: 0,
                          transition: 'border-color 0.2s',
                        }}
                    />
                ))}
              </div>

              {/* New password */}
              <div style={{ marginBottom: 20 }}>
                <label style={{
                  display: 'block', fontSize: 12,
                  fontFamily: 'DM Mono, monospace',
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                  color: 'var(--muted)', marginBottom: 6,
                }}>
                  Mật khẩu mới
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Ít nhất 8 ký tự"
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError(''); }}
                      style={{ ...inputStyle, paddingRight: 44 }}
                      autoComplete="new-password"
                  />
                  <button
                      type="button" tabIndex={-1}
                      onClick={() => setShowPw(v => !v)}
                      style={{
                        position: 'absolute', right: 12, top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none', border: 'none',
                        color: 'var(--muted)', cursor: 'pointer', fontSize: 16, padding: 0,
                      }}
                  >
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
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
                    fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
                    transition: 'background 0.2s',
                  }}
              >
                {loading ? '⏳ Đang xác nhận...' : 'Đặt Lại Mật Khẩu'}
              </button>
            </form>

            {/* Resend */}
            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
              Chưa nhận được mã?{' '}
              <span
                  onClick={handleResend}
                  style={{ color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}
              >
              Gửi lại
            </span>
            </p>
            {resendMsg && (
                <p style={{
                  textAlign: 'center', fontSize: 12, marginTop: 8,
                  color: resendMsg.includes('thất bại') ? 'var(--accent3)' : '#28d878',
                }}>
                  {resendMsg}
                </p>
            )}

            <p style={{ textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--muted)' }}>
              <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
                ← Quay lại Đăng Nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
  );
}