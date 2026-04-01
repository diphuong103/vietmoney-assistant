import Navbar from '../../components/layout/Navbar';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const navigate = useNavigate();

  return (
    <div className="page active" id="page-profile">
      <Navbar
        title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>}
        subtitle="Profile"
      />
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center' }}>
        <img src="https://i.pravatar.cc/80" alt="Avatar"
          style={{ width: 80, height: 80, borderRadius: '50%', border: '3px solid var(--accent)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700 }}>Traveler</div>
          <div style={{ color: 'var(--muted)', fontSize: 13 }}>traveler@email.com</div>
        </div>
        <button
          className="submit-form-btn"
          style={{ maxWidth: 300 }}
          onClick={() => navigate('/login')}
        >Log Out</button>
      </div>
    </div>
  );
}
