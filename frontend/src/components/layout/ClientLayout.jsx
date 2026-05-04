import { Outlet, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import BottomNav from './BottomNav';
import AIChatModal from './AIChatModal';
import VerticalDock from './VerticalDock';
import FloatingPopup from '../common/FloatingPopup';
import { useAuthStore } from '../../store/authStore';
import { getLanguage, setLanguage } from '../../utils/i18n';

// Lazy-load heavy page content for popups
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

// ── SearchOverlay ─────────────────────────────────────────────────────────────

function SearchOverlay({ open, onClose }) {
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
    setQuery('');
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const SEARCH_ITEMS = [
    { icon: '📷', label: 'AI Scanner', path: '/scan' },
    { icon: '💱', label: 'Exchange Rates', path: '/exchange' },
    { icon: '💰', label: 'Budget', path: '/budget' },
    { icon: '📋', label: 'Price Wiki', path: '/wiki' },
    { icon: '🗺️', label: 'ATM Map', path: '/atm-map' },
    { icon: '📅', label: 'Travel Plans', path: '/plans' },
    { icon: '📰', label: 'News', path: '/news' },
    { icon: '🎓', label: 'Currency Guide', path: '/wiki/guide' },
    { icon: '🏝️', label: 'Tourist Spots', path: '/spots' },
    { icon: '👤', label: 'Profile', path: '/profile' },
  ];

  const filtered = query.trim()
    ? SEARCH_ITEMS.filter(i => i.label.toLowerCase().includes(query.toLowerCase()))
    : SEARCH_ITEMS;

  return (
    <div className={`search-overlay ${open ? 'open' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-modal">
        <div className="search-input-wrap">
          <span className="search-input-icon">🔍</span>
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder="Search features, pages..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="search-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="search-results">
          {filtered.map((item) => (
            <button
              key={item.path}
              className="search-result-item"
              onClick={() => { navigate(item.path); onClose(); }}
            >
              <span className="search-result-icon">{item.icon}</span>
              <span className="search-result-label">{item.label}</span>
              <span className="search-result-arrow">→</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="search-no-results">No results found for "{query}"</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── ClientLayout ──────────────────────────────────────────────────────────────

export default function ClientLayout() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [langOpen, setLangOpen] = useState(false);
  const [activeLang, setActiveLang] = useState(getLanguage());
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [chatOpen, setChatOpen] = useState(false);
  const [plansOpen, setPlansOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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

  // Ctrl+K / Cmd+K to open search
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(s => !s);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

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

      {/* ── Vertical Dock (right edge — desktop only) ── */}
      <VerticalDock
        onOpenPlans={() => setPlansOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* ── Floating Action Buttons (bottom-right — visible on all screens) ── */}
      <div className="floating-fabs">
        <button
          className="fab-btn fab-chat"
          onClick={() => setChatOpen(true)}
          title="AI Chat"
          aria-label="Open AI Chat"
        >
          🤖
        </button>
        <button
          className="fab-btn fab-atm"
          onClick={() => navigate('/atm-map')}
          title="ATM Map"
          aria-label="Open ATM Map"
        >
          🗺️
        </button>
        <button
          className="fab-btn fab-plans"
          onClick={() => setPlansOpen(true)}
          title="Travel Plans"
          aria-label="Open Travel Plans"
        >
          🧭
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
              onClick={() => {
                setActiveLang(l.code);
                setLanguage(l.code);
                setLangOpen(false);
                window.location.reload();
              }}
            >
              <span className="flag">{l.flag}</span>
              <span className="lang-name">{l.name}</span>
              {activeLang === l.code && <span className="lang-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Search Overlay ── */}
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* ── AI Chat Modal ── */}
      <AIChatModal open={chatOpen} onClose={() => setChatOpen(false)} />

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

      {/* ── Bottom Nav (mobile only — CSS hides on desktop) ── */}
      <BottomNav onOpenSearch={() => setSearchOpen(true)} />
    </div>
  );
}