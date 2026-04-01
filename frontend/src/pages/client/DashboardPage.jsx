import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Badge from '../../components/common/Badge';

// Ticker data (replace with real API via useExchangeRate hook)
const TICKER_ITEMS = [
  { label: 'VND/USD', val: '₫25,420', change: '+0.12%', up: true },
  { label: 'VND/KRW', val: '₫18.9',   change: '−0.05%', up: false },
  { label: 'VND/EUR', val: '₫27,810', change: '+0.23%', up: true },
  { label: 'VND/JPY', val: '₫165.4',  change: '+0.08%', up: true },
  { label: 'VND/GBP', val: '₫32,150', change: '−0.14%', up: false },
];
// Duplicate for seamless scroll
const TICKER_FULL = [...TICKER_ITEMS, ...TICKER_ITEMS];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [clock, setClock]   = useState('--:--');
  const [dateStr, setDate]  = useState('');

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setClock(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }));
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
          <>
            <div className="user-box">
              <img src="https://i.pravatar.cc/40" className="avatar" alt="Avatar" />
              <div className="user-info"><div className="name">Traveler</div></div>
            </div>
            <button className="icon-btn" title="Notifications">🔔</button>
            <button className="icon-btn" onClick={() => navigate('/profile')} title="Settings">⚙️</button>
          </>
        }
      />

      {/* Exchange Rate Ticker */}
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
                <div className="city">Hội An, VN</div>
              </div>
            </div>
          </div>
          <div className="greeting-text">
            <div className="label">Welcome back</div>
            <div className="hello">Good evening, <span>Traveler</span> 👋</div>
          </div>
          <div className="spacer" />
          <div className="greeting-meta">
            <div className="meta-item"><strong>Day 3</strong><span> of your trip</span></div>
            <div className="meta-item"><strong>₫1,240,000</strong><span> remaining</span></div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bento */}
      <div className="section-title">Quick Actions</div>
      <div className="bento-grid">
        <div className="bento-card scan-card" onClick={() => navigate('/scan')}>
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

        <div className="bento-card budget-card" onClick={() => navigate('/budget')}>
          <div className="card-icon">💰</div>
          <div className="card-label">Budget</div>
          <div className="card-sub">65% used today</div>
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

      {/* Latest News Preview */}
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
