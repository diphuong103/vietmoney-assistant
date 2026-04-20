import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import BottomNav from './BottomNav';
import AIChatModal from './AIChatModal';
import FloatingPopup from '../common/FloatingPopup';
import { useAuthStore } from '../../store/authStore';

// Lazy-load heavy page content for popups
const AtmMapPage = lazy(() => import('../../pages/client/AtmMapPage'));
const TravelPlanPage = lazy(() => import('../../pages/client/TravelPlanPage'));

// ── LANGS ─────────────────────────────────────────────────────────────────────

const LANGS = [
  { code: 'en', flag: '🇺🇸', name: 'English' },
  { code: 'ko', flag: '🇰🇷', name: '한국어' },
  { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt' },
];

// ── ThemeToggle ───────────────────────────────────────────────────────────────

function ThemeToggle({ dark, onToggle }) {
  return (
    <button
      className="theme-toggle-btn"
      onClick={onToggle}
      title={dark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-label="Toggle theme"
    >
      <span className="theme-toggle-track">
        <span className={`theme-toggle-thumb${dark ? ' dark' : ''}`} />
      </span>
      <span className="theme-toggle-icon">{dark ? '🌙' : '☀️'}</span>
    </button>
  );
}

// ── ClientLayout ──────────────────────────────────────────────────────────────

export default function ClientLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [langOpen, setLangOpen] = useState(false);
  const [activeLang, setActiveLang] = useState('en');
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [chatOpen, setChatOpen] = useState(false);
  const [atmOpen, setAtmOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);

  const langRef = useRef(null);
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';
  const currentLang = LANGS.find(l => l.code === activeLang) ?? LANGS[0];

  // Apply / remove dark class on <html> and persist
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Close lang dropdown when clicking outside
  useEffect(() => {
    if (!langOpen) return;
    const handler = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [langOpen]);

  return (
    <div className="app">
      <Outlet />

      {/* ── Admin Panel Button — only visible for admin users ── */}
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

      {/* ── Float Cluster ── */}
      <div className="float-cluster" id="float-cluster">
        <button className="float-btn" onClick={() => setPlansOpen(true)}>
          <span className="icon">🧭</span>
          <span className="float-btn-label">Plans</span>
        </button>
        <button
          className="float-btn float-map-btn"
          onClick={() => setAtmOpen(true)}
        >
          <span className="icon">🗺️</span>
          <span className="float-btn-label">ATM Map</span>
        </button>
        <button
          className="float-btn float-chat-btn"
          onClick={() => setChatOpen(true)}
        >
          <span className="icon">🤖</span>
          <span className="float-btn-label">AI Chat</span>
        </button>
      </div>

      {/* ── Language Switcher + Theme Toggle ── */}
      <div ref={langRef} className="lang-switcher">
        <button className="lang-btn" onClick={() => setLangOpen(o => !o)}>
          <span className="lang-flag">{currentLang.flag}</span>
          <span className="lang-code">{currentLang.code.toUpperCase()}</span>
          <span className={`lang-chevron${langOpen ? ' open' : ''}`}>▾</span>
        </button>

        <div className={`lang-dropdown${langOpen ? ' open' : ''}`}>

          {/* Theme toggle row — trên cùng trong dropdown */}
          <div className="lang-theme-row">
            <span className="lang-theme-label">Giao diện</span>
            <ThemeToggle dark={dark} onToggle={() => setDark(d => !d)} />
          </div>

          <div className="lang-divider" />

          {/* Language options */}
          {LANGS.map(l => (
            <button
              key={l.code}
              className={`lang-option${activeLang === l.code ? ' active' : ''}`}
              onClick={() => { setActiveLang(l.code); setLangOpen(false); }}
            >
              <span className="flag">{l.flag}</span>
              <span className="lang-name">{l.name}</span>
              {activeLang === l.code && <span className="lang-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── AI Chat Modal ── */}
      <AIChatModal open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* ── ATM Map Popup ── */}
      <FloatingPopup
        open={atmOpen}
        onClose={() => setAtmOpen(false)}
        title="ATM Map"
        icon="🗺️"
      >
        <Suspense fallback={
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            <div style={{ fontSize: 28 }}>🏧</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Đang tải...</div>
          </div>
        }>
          {atmOpen && <AtmMapPage embedded />}
        </Suspense>
      </FloatingPopup>

      {/* ── Plans Popup ── */}
      <FloatingPopup
        open={plansOpen}
        onClose={() => setPlansOpen(false)}
        title="Travel Plans"
        icon="🧭"
      >
        <Suspense fallback={
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            <div style={{ fontSize: 28 }}>✈️</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Đang tải...</div>
          </div>
        }>
          {plansOpen && <TravelPlanPage embedded />}
        </Suspense>
      </FloatingPopup>

      <BottomNav />
    </div>
  );
}