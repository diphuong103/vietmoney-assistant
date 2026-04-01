import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: call authApi.forgotPassword(email)
    navigate('/verify-otp');
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
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, marginBottom: 8 }}>Forgot Password</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
            Enter your email and we'll send you a reset code.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="you@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <button type="submit" className="submit-form-btn">Send Reset Code</button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
            <Link to="/login" style={{ color: 'var(--accent)' }}>← Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
