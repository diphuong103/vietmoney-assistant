import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import BottomNav from './BottomNav';
import { useAuthStore } from '../../store/authStore';

const LANGS = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'ko', flag: '🇰🇷', name: '한국어' },
  { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt' },
];

export default function ClientLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [langOpen, setLangOpen] = useState(false);
  const [activeLang, setActiveLang] = useState('en');
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const currentLang = LANGS.find(l => l.code === activeLang);

  return (
    <div className="app">
      <Outlet />

      {/* Admin Panel Button – only visible for admin users */}
      {isAdmin && (
        <button
          className="float-btn admin-panel-btn"
          onClick={() => navigate('/admin')}
          title="Quản trị"
          style={{
            position: 'fixed', top: 16, right: 16, zIndex: 200,
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 14px', borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            color: '#000', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 700, boxShadow: '0 4px 16px rgba(200,242,61,0.3)',
            transition: 'all 0.2s ease',
          }}
        >
          🛡️ Quản trị
        </button>
      )}

      {/* Float Cluster */}
      <div className="float-cluster" id="float-cluster">
        <button className="float-btn" onClick={() => navigate('/plans')}>
          <span className="icon">🧭</span>
          <span className="float-btn-label">Plans</span>
        </button>
        <button
          className="float-btn float-map-btn"
          onClick={() => navigate('/atm-map')}
        >
          <span className="icon">🗺️</span>
          <span className="float-btn-label">ATM Map</span>
        </button>
      </div>

      {/* Language Switcher */}
      <div className="lang-switcher">
        <button className="lang-btn" onClick={() => setLangOpen(o => !o)}>
          <span>{currentLang.flag}</span>
          <span>{currentLang.code.toUpperCase()}</span>
          <span style={{ fontSize: '10px', color: 'var(--muted)' }}>▲</span>
        </button>
        <div className={`lang-dropdown${langOpen ? ' open' : ''}`}>
          {LANGS.map(l => (
            <button
              key={l.code}
              className={`lang-option${activeLang === l.code ? ' active' : ''}`}
              onClick={() => { setActiveLang(l.code); setLangOpen(false); }}
            >
              <span className="flag">{l.flag}</span>
              <span className="lang-name">{l.name}</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
