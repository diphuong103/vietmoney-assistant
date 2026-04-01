import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputs = useRef([]);
  const navigate = useNavigate();

  const handleChange = (val, i) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (e, i) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleVerify = (e) => {
    e.preventDefault();
    // TODO: call authApi.verifyOtp(otp.join(''))
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20, background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div className="topbar-logo" style={{ marginBottom: 32, fontSize: 24, display: 'block' }}>
          Viet<span style={{ color: 'var(--accent)' }}>Money</span>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 24, padding: 28 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, marginBottom: 8 }}>Enter OTP</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 28 }}>
            We sent a 6-digit code to your email.
          </p>

          <form onSubmit={handleVerify}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => inputs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className="form-input"
                  value={digit}
                  onChange={e => handleChange(e.target.value, i)}
                  onKeyDown={e => handleKeyDown(e, i)}
                  style={{
                    width: 48, height: 52, textAlign: 'center',
                    fontSize: 22, fontFamily: 'DM Mono, monospace', padding: 0,
                  }}
                />
              ))}
            </div>
            <button type="submit" className="submit-form-btn">Verify</button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
            Didn't receive it?{' '}
            <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Resend</span>
          </p>
        </div>
      </div>
    </div>
  );
}
