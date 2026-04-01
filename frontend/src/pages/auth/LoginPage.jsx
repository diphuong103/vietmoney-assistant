import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // TODO: call authApi.login(email, password)
    navigate('/');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20, background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div className="topbar-logo" style={{ marginBottom: 32, fontSize: 24, display: 'block', textAlign: 'center'}}>
          Viet<span style={{ color: 'var(--accent)' }}>Money</span>
        </div>

        <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 24, padding: 28 }}>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, marginBottom: 24 }}>Sign In</h2>

          <form onSubmit={handleLogin}>
            <div className="form-field">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="you@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-field">
              <label className="form-label">Password</label>
              <input type="password" className="form-input" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--muted)' }}>
                Forgot password?
              </Link>
            </div>
            <button type="submit" className="submit-form-btn">Sign In</button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--accent)' }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
