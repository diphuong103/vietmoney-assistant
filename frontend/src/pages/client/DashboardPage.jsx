import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Badge from '../../components/common/Badge';
import authApi, { clearSession } from '../../api/authApi';

// ── helpers ──────────────────────────────────────────────────────────────────

function getStoredUser() {
  try { return JSON.parse(localStorage.getItem('user') ?? 'null'); }
  catch { return null; }
}

function resolveAvatar(user) {
  if (user?.avatarUrl) return user.avatarUrl;
  const seed = user?.id ?? user?.username ?? 'guest';
  return `https://api.dicebear.com/8.x/thumbs/svg?seed=${seed}&radius=50`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

// ── Ticker ────────────────────────────────────────────────────────────────────

const TICKER_ITEMS = [
  { label: 'VND/USD', val: '₫25,420', change: '+0.12%', up: true },
  { label: 'VND/KRW', val: '₫18.9',   change: '−0.05%', up: false },
  { label: 'VND/EUR', val: '₫27,810', change: '+0.23%', up: true },
  { label: 'VND/JPY', val: '₫165.4',  change: '+0.08%', up: true },
  { label: 'VND/GBP', val: '₫32,150', change: '−0.14%', up: false },
];
const TICKER_FULL = [...TICKER_ITEMS, ...TICKER_ITEMS];

// ── SettingsMenu ──────────────────────────────────────────────────────────────

function SettingsMenu() {
  const navigate = useNavigate();
  const [open,       setOpen]  = useState(false);
  const [loggingOut, setOut]   = useState(false);
  const menuRef = useRef(null);

  // Đóng khi click ra ngoài
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleLogout = async () => {
    setOut(true);
    try {
      await authApi.logout();
    } catch (_) {
      // Dù lỗi vẫn clear phía client
    } finally {
      clearSession();
      setOut(false);
      setOpen(false);
      navigate('/login');
    }
  };

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>

      {/* Trigger ⚙️ */}
      <button
        className="icon-btn"
        onClick={() => setOpen(v => !v)}
        title="Cài đặt"
        aria-haspopup="true"
        aria-expanded={open}
        style={{
          background:   open ? 'var(--bg3)' : 'transparent',
          borderRadius: 10,
          transition:   'background 0.18s',
        }}
      >
        <span style={{
          display:    'inline-block',
          transition: 'transform 0.3s cubic-bezier(.34,1.56,.64,1)',
          transform:  open ? 'rotate(60deg)' : 'rotate(0deg)',
        }}>
          ⚙️
        </span>
      </button>

      {/* Dropdown panel */}
      <div style={{
        position:      'absolute',
        top:           'calc(100% + 8px)',
        right:         0,
        width:         224,
        background:    'var(--bg2)',
        border:        '1px solid var(--border)',
        borderRadius:  16,
        boxShadow:     '0 8px 32px rgba(0,0,0,0.30), 0 2px 8px rgba(0,0,0,0.16)',
        zIndex:        1000,
        overflow:      'hidden',
        transformOrigin: 'top right',
        transform:     open ? 'scale(1) translateY(0)'        : 'scale(0.92) translateY(-8px)',
        opacity:       open ? 1                               : 0,
        pointerEvents: open ? 'all'                           : 'none',
        transition:    'transform 0.22s cubic-bezier(.34,1.56,.64,1), opacity 0.18s ease',
      }}>

        {/* Header */}
        <div style={{
          padding:      '13px 16px 10px',
          borderBottom: '1px solid var(--border)',
        }}>
          <div style={{
            fontSize:      11,
            fontFamily:    'DM Mono, monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
            color:         'var(--muted)',
          }}>
            Cài đặt
          </div>
        </div>

        {/* Placeholder items — chưa phát triển */}
        <div style={{ padding: '6px 0' }}>
          {[
            { icon: '👤', label: 'Tài khoản'  },
            { icon: '🔔', label: 'Thông báo'  },
            { icon: '🎨', label: 'Giao diện'  },
          ].map((item) => (
            <button
              key={item.label}
              disabled
              style={{
                display:    'flex',
                alignItems: 'center',
                gap:        12,
                width:      '100%',
                padding:    '10px 16px',
                background: 'none',
                border:     'none',
                color:      'var(--text)',
                cursor:     'not-allowed',
                opacity:    0.38,
                textAlign:  'left',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 17 }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                  Đang phát triển
                </div>
              </div>
            </button>
          ))}

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />

          {/* Đăng xuất */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        12,
              width:      '100%',
              padding:    '10px 16px',
              background: 'none',
              border:     'none',
              color:      loggingOut ? 'var(--muted)' : '#f23d6e',
              cursor:     loggingOut ? 'not-allowed'  : 'pointer',
              textAlign:  'left',
              fontFamily: 'inherit',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => {
              if (!loggingOut) e.currentTarget.style.background = 'rgba(242,61,110,0.09)';
            }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
          >
            <span style={{ fontSize: 17 }}>{loggingOut ? '⏳' : '🚪'}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>
                Thoát khỏi tài khoản
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DashboardPage ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const [clock,   setClock] = useState('--:--');
  const [dateStr, setDate]  = useState('');

  const isLoggedIn  = !!localStorage.getItem('accessToken');
  const user        = isLoggedIn ? getStoredUser() : null;
  const displayName = user?.fullName ?? user?.username ?? 'Traveler';
  const avatarSrc   = resolveAvatar(user);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('en-US',  { weekday: 'long', month: 'long', day: 'numeric' }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="page active" id="page-home">
      <Navbar
        title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>}
        actions={
          isLoggedIn ? (
            <>
              {/* Avatar → profile */}
              <div
                className="user-box"
                onClick={() => navigate('/profile')}
                style={{ cursor: 'pointer' }}
                title="Xem hồ sơ"
              >
                <img
                  src={avatarSrc}
                  className="avatar"
                  alt={displayName}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
                  }}
                  style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                />
                <div className="user-info">
                  <div className="name">{displayName}</div>
                </div>
              </div>

              <button className="icon-btn" title="Thông báo">🔔</button>

              {/* Settings dropdown */}
              <SettingsMenu />
            </>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => navigate('/login')}
                style={{
                  background: 'transparent', color: 'var(--accent)',
                  border: '1px solid var(--accent)', padding: '6px 12px',
                  borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
                }}
              >
                Log In
              </button>
              <button
                onClick={() => navigate('/register')}
                style={{
                  background: 'var(--accent)', color: '#fff', border: 'none',
                  padding: '6px 12px', borderRadius: '8px',
                  cursor: 'pointer', fontWeight: 'bold',
                }}
              >
                Sign Up
              </button>
            </div>
          )
        }
      />

      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {TICKER_FULL.map((item, i) => (
            <div className="ticker-item" key={i}>
              <span className="ticker-label">{item.label}</span>
              <span className="ticker-val">{item.val}</span>
              <span className={`ticker-change ${item.up ? 'up' : 'down'}`}>{item.change}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Greeting Card */}
      <div className="greeting-section">
        <div className="greeting-card">
          <div className="greeting-row">
            <div>
              <div className="clock">{clock}</div>
              <div className="date-str">{dateStr}</div>
            </div>
            <div className="weather-pill">
              <span className="weather-icon">⛅</span>
              <div className="weather-info">
                <div className="temp">29°C</div>
                <div className="city">{user?.travelDestination ?? 'Hội An, VN'}</div>
              </div>
            </div>
          </div>
          <div className="greeting-text">
            <div className="label">{isLoggedIn ? 'Welcome back' : 'Welcome to VietMoney'}</div>
            <div className="hello">
              {getGreeting()}, <span>{isLoggedIn ? displayName : 'Guest'}</span> 👋
            </div>
          </div>
          <div className="spacer" />
          {isLoggedIn && (
            <div className="greeting-meta">
              <div className="meta-item"><strong>Day 3</strong><span> of your trip</span></div>
              <div className="meta-item"><strong>₫1,240,000</strong><span> remaining</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="section-title">Quick Actions</div>
      <div className="bento-grid">
        <div className="bento-card scan-card" onClick={() => navigate(isLoggedIn ? '/scan' : '/login')}>
          <div className="card-icon">📷</div>
          <div className="card-label">Scan Money</div>
          <div className="card-sub">AI Recognition</div>
          <Badge>AI</Badge>
        </div>
        <div className="bento-card exchange-card" onClick={() => navigate('/exchange')}>
          <div className="card-icon">💱</div>
          <div className="card-label">Exchange Rate</div>
          <div className="card-value">25,420</div>
        </div>
        <div className="bento-card budget-card" onClick={() => navigate(isLoggedIn ? '/budget' : '/login')}>
          <div className="card-icon">💰</div>
          <div className="card-label">Budget</div>
          <div className="card-sub">{isLoggedIn ? '65% used today' : 'Manage your spending'}</div>
        </div>
        <div className="bento-card wiki-card" onClick={() => navigate('/wiki')}>
          <div className="card-icon">📋</div>
          <div className="card-label">Price Wiki</div>
          <div className="card-sub">Reference prices</div>
        </div>
        <div className="bento-card map-card wide" onClick={() => navigate('/wiki/guide')}>
          <div className="card-icon">🎓</div>
          <div className="card-label">Currency Guide</div>
          <div className="card-sub">Learn Vietnamese Dong — flip cards &amp; security features</div>
        </div>
      </div>

      <div className="divider" />

      {/* News */}
      <div className="section-title">Latest News</div>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="news-card-item" onClick={() => navigate('/news')}>
          <div className="news-img">🏖️</div>
          <div className="news-body">
            <span className="news-tag">Travel</span>
            <div className="news-title">Top 5 Hidden Gems in Da Nang You Must Visit</div>
            <div className="news-footer">
              <div className="news-author">
                <div className="news-author-dot">A</div>
                <span>Admin · 2h ago</span>
              </div>
              <div className="news-like">❤️ 142</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ height: 16 }} />
    </div>
  );
}