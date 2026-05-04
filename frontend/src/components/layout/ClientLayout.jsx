import { Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import BottomNav from './BottomNav';

const LANGS = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'ko', flag: '🇰🇷', name: '한국어'  },
  { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt' },
];

export default function ClientLayout() {
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [activeLang, setActiveLang] = useState('en');

  const currentLang = LANGS.find(l => l.code === activeLang);

  return (
    <div className="app">
      <Outlet />

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
