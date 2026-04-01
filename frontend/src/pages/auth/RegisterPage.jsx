import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRegister = (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return alert('Passwords do not match');
    // TODO: call authApi.register(form)
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
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, marginBottom: 24 }}>Create Account</h2>

          <form onSubmit={handleRegister}>
            {[
              { key: 'name',     label: 'Full Name',       type: 'text',     placeholder: 'Your name'       },
              { key: 'email',    label: 'Email',            type: 'email',    placeholder: 'you@email.com'   },
              { key: 'password', label: 'Password',         type: 'password', placeholder: '••••••••'        },
              { key: 'confirm',  label: 'Confirm Password', type: 'password', placeholder: '••••••••'        },
            ].map(({ key, label, type, placeholder }) => (
              <div className="form-field" key={key}>
                <label className="form-label">{label}</label>
                <input
                  type={type} className="form-input" placeholder={placeholder}
                  value={form[key]} onChange={set(key)} required
                />
              </div>
            ))}
            <button type="submit" className="submit-form-btn">Register</button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
