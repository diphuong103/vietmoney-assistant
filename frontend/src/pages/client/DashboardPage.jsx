import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Navbar from '../../components/layout/Navbar';
import Badge from '../../components/common/Badge';
import authApi, { clearSession } from '../../api/authApi';
import { t } from '../../utils/i18n';
import '../../assets/styles/landing.css';

// ── Weather Helpers ──────────────────────────────────────────────────────────
const WEATHER_CODES = {
  0: { icon: '☀️', desc: 'Clear sky' },
  1: { icon: '🌤️', desc: 'Mainly clear' },
  2: { icon: '⛅', desc: 'Partly cloudy' },
  3: { icon: '☁️', desc: 'Overcast' },
  45: { icon: '🌫️', desc: 'Foggy' },
  48: { icon: '🌫️', desc: 'Fog (rime)' },
  51: { icon: '🌦️', desc: 'Light drizzle' },
  53: { icon: '🌦️', desc: 'Drizzle' },
  55: { icon: '🌧️', desc: 'Heavy drizzle' },
  61: { icon: '🌧️', desc: 'Light rain' },
  63: { icon: '🌧️', desc: 'Rain' },
  65: { icon: '🌧️', desc: 'Heavy rain' },
  80: { icon: '🌦️', desc: 'Rain showers' },
  81: { icon: '🌧️', desc: 'Heavy showers' },
  95: { icon: '⛈️', desc: 'Thunderstorm' },
};

function WeatherWidget() {
  const [weather, setWeather] = useState(null);
  const [cityName, setCityName] = useState('Đang định vị...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = (lat, lon) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
      fetch(url)
        .then(r => r.json())
        .then(data => { if (data?.current) setWeather(data.current); })
        .catch(() => { })
        .finally(() => setLoading(false));

      // Reverse geocode for city name
      fetch(`https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${lat}&longitude=${lon}&count=1`)
        .catch(() => { });
      // Use a simpler reverse geocode via nominatim
      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`)
        .then(r => r.json())
        .then(data => {
          const city = data?.address?.city || data?.address?.town || data?.address?.state || 'Your Location';
          setCityName(city);
        })
        .catch(() => setCityName('Your Location'));
    };

    // Try browser geolocation first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => {
          // Permission denied — fallback to HCMC
          setCityName('Ho Chi Minh City');
          fetchWeather(10.8231, 106.6297);
        },
        { timeout: 5000 }
      );
    } else {
      setCityName('Ho Chi Minh City');
      fetchWeather(10.8231, 106.6297);
    }
  }, []);

  const code = weather?.weather_code ?? 0;
  const info = WEATHER_CODES[code] || WEATHER_CODES[0];
  const temp = weather?.temperature_2m ?? '--';
  const humidity = weather?.relative_humidity_2m ?? '--';
  const wind = weather?.wind_speed_10m ?? '--';

  return (
    <div className="lp-glass lp-weather-card">
      <h3 className="lp-weather-title">🌤️ Local Weather</h3>
      <p className="lp-weather-location">{cityName}</p>
      {loading ? (
        <div className="lp-weather-loading">📍 Đang lấy vị trí...</div>
      ) : (
        <>
          <div className="lp-weather-main">
            <span className="lp-weather-icon">{info.icon}</span>
            <span className="lp-weather-temp">{Math.round(temp)}°C</span>
          </div>
          <div className="lp-weather-desc">{info.desc}</div>
          <div className="lp-weather-details">
            <div className="lp-weather-detail">
              <span>💧</span>
              <span>{humidity}%</span>
            </div>
            <div className="lp-weather-detail">
              <span>🌬️</span>
              <span>{wind} km/h</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

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

// ── Exchange Rate Ticker Data ────────────────────────────────────────────────
const TICKER_RATES = [
  { label: 'USD/VND', val: '₫25,420', change: '+0.12%', up: true },
  { label: 'EUR/VND', val: '₫27,810', change: '+0.23%', up: true },
  { label: 'JPY/VND', val: '₫165.4', change: '+0.08%', up: true },
  { label: 'KRW/VND', val: '₫18.9', change: '−0.05%', up: false },
  { label: 'GBP/VND', val: '₫32,150', change: '−0.14%', up: false },
  { label: 'CNY/VND', val: '₫3,497', change: '+0.03%', up: true },
  { label: 'AUD/VND', val: '₫16,320', change: '+0.18%', up: true },
  { label: 'THB/VND', val: '₫720', change: '−0.07%', up: false },
];
const TICKER_DOUBLE = [...TICKER_RATES, ...TICKER_RATES];

// ── Budget Chart Data ────────────────────────────────────────────────────────
const BUDGET_DATA = [
  { name: 'Spent', value: 1760000 },
  { name: 'Remaining', value: 3240000 },
];
const CHART_COLORS = ['#f59e0b', '#059669'];

// ── Currency Conversion Rates ────────────────────────────────────────────────
const FX = {
  USD: 25420,
  EUR: 27810,
  JPY: 165.4,
  KRW: 18.9,
  GBP: 32150,
  AUD: 16320,
  THB: 720,
};

// ── Wiki Prices ──────────────────────────────────────────────────────────────
const WIKI_PRICES = [
  { emoji: '☕', name: 'Cafe', price: '25–55k' },
  { emoji: '🍜', name: 'Phở', price: '40–80k' },
  { emoji: '🚕', name: 'Taxi', price: '10–20k/km' },
  { emoji: '🥖', name: 'Bánh Mì', price: '15–35k' },
  { emoji: '🍚', name: 'Cơm', price: '35–65k' },
  { emoji: '🍺', name: 'Bia', price: '15–40k' },
];

// ── Blog/News Posts ──────────────────────────────────────────────────────────
const BLOG_POSTS = [
  {
    img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
    tag: 'Travel',
    title: 'Top 5 Hidden Gems in Hội An',
    excerpt: 'Discover breathtaking spots that most tourists overlook in the ancient town.',
    author: 'VietMoney', time: '2h ago',
  },
  {
    img: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
    tag: 'Finance',
    title: 'USD/VND Rate Update This Week',
    excerpt: 'The State Bank adjusted the margin, affecting tourist spending power.',
    author: 'Finance', time: '5h ago',
  },
  {
    img: 'https://images.unsplash.com/photo-1550652755-66774e14f8d2?auto=format&fit=crop&w=600&q=80',
    tag: 'Culture',
    title: 'Hội An Lantern Festival — A Must-See',
    excerpt: 'The monthly lantern festival attracts thousands of international visitors.',
    author: 'Culture', time: '1d ago',
  },
  {
    img: 'https://images.unsplash.com/photo-1582298538104-fe2e74c27f59?auto=format&fit=crop&w=600&q=80',
    tag: 'Food',
    title: 'Hội An Food Map: What & Where to Eat',
    excerpt: 'From Cao Lầu to Bánh Mì Phượng — the ultimate foodie guide.',
    author: 'Food', time: '2d ago',
  },
];

// ── Tips ─────────────────────────────────────────────────────────────────────
const TIPS = [
  { icon: '💬', title: 'How to Bargain', desc: 'Start at 50% of the quoted price, be friendly, walk away if too high — the vendor will often call you back.' },
  { icon: '💵', title: 'Spot 20k vs 500k Notes', desc: 'Always check the color and size. The 500k note is larger with a blue tint. Under UV light, security features glow.' },
  { icon: '🏧', title: 'ATM Tips for Tourists', desc: 'Use ATMs inside banks to avoid skimmers. Vietcombank & BIDV ATMs accept Visa/Mastercard with low fees.' },
  { icon: '📱', title: 'Pay with Grab/MoMo', desc: 'Download Grab for rides & food delivery. MoMo works at many shops if you have a local phone number.' },
];

// ── SettingsMenu ──────────────────────────────────────────────────────────────

function SettingsMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loggingOut, setOut] = useState(false);
  const menuRef = useRef(null);

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
    try { await authApi.logout(); } catch (_) { }
    finally {
      clearSession();
      setOut(false);
      setOpen(false);
      navigate('/login');
    }
  };

  return (
    <div ref={menuRef} className="settings-menu">
      <button
        className="icon-btn settings-trigger"
        onClick={() => setOpen(v => !v)}
        title="Cài đặt"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <span className={`settings-trigger-icon ${open ? 'open' : 'closed'}`}>⚙️</span>
      </button>

      <div className={`settings-dropdown ${open ? 'open' : 'closed'}`}>
        <div className="settings-dropdown-header">
          <div className="settings-dropdown-header-label">Cài đặt</div>
        </div>

        <div className="settings-dropdown-body">
          {[
            { icon: '👤', label: 'Tài khoản', sub: 'Đang phát triển' },
            { icon: '🔔', label: 'Thông báo', sub: 'Đang phát triển' },
            { icon: '🎨', label: 'Giao diện', sub: 'Đang phát triển' },
          ].map((item) => (
            <button key={item.label} disabled className="settings-menu-item">
              <span className="settings-menu-item-icon">{item.icon}</span>
              <div>
                <div className="settings-menu-item-label">{item.label}</div>
                <div className="settings-menu-item-sub">{item.sub}</div>
              </div>
            </button>
          ))}

          <div className="settings-divider" />

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="settings-logout-btn"
          >
            <span className="settings-logout-icon">{loggingOut ? '⏳' : '🚪'}</span>
            <div>
              <div className="settings-logout-label">
                {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
              </div>
              <div className="settings-logout-sub">Thoát khỏi tài khoản</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ContactForm ───────────────────────────────────────────────────────────────

function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 900));
    setSending(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="contact-success">
        <div className="contact-success-icon">✅</div>
        <div className="contact-success-title">Đã gửi thành công!</div>
        <div className="contact-success-sub">Chúng tôi sẽ phản hồi trong vòng 24 giờ.</div>
        <button className="contact-reset-btn" onClick={() => { setForm({ name: '', email: '', message: '' }); setSent(false); }}>
          Gửi yêu cầu khác
        </button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="contact-form-row">
        <div className="contact-field">
          <label className="contact-label">Họ và tên</label>
          <input className="contact-input" type="text" name="name" placeholder="Nguyễn Văn A" value={form.name} onChange={handleChange} required />
        </div>
        <div className="contact-field">
          <label className="contact-label">Email</label>
          <input className="contact-input" type="email" name="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required />
        </div>
      </div>
      <div className="contact-field">
        <label className="contact-label">Nội dung</label>
        <textarea className="contact-input contact-textarea" name="message" placeholder="Mô tả vấn đề hoặc câu hỏi của bạn..." value={form.message} onChange={handleChange} required rows={4} />
      </div>
      <button type="submit" className="contact-submit-btn" disabled={sending}>
        {sending ? '⏳ Đang gửi...' : '✉️ Gửi yêu cầu'}
      </button>
    </form>
  );
}

// ── DashboardPage ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');

  const isLoggedIn = !!localStorage.getItem('accessToken');
  const user = isLoggedIn ? getStoredUser() : null;
  const displayName = user?.fullName ?? user?.username ?? 'Traveler';
  const avatarSrc = resolveAvatar(user);

  // Currency conversion
  const converted = amount && !isNaN(amount)
    ? (parseFloat(amount) * (FX[currency] || 25420)).toLocaleString('vi-VN')
    : '0';

  return (
    <div className="landing-page">
      {/* ═══════════ ORIGINAL NAVBAR ═══════════ */}
      <Navbar
        title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>}
        actions={
          isLoggedIn ? (
            <>
              <div className="user-box" onClick={() => navigate('/profile')} title="Xem hồ sơ">
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
              <SettingsMenu />
            </>
          ) : (
            <div className="navbar-actions-guest">
              <button className="btn-login" onClick={() => navigate('/login')}>Log In</button>
              <button className="btn-signup" onClick={() => navigate('/register')}>Sign Up</button>
            </div>
          )
        }
      />

      {/* ── Exchange Rate Ticker (below header) ── */}
      <div className="lp-ticker">
        <div className="lp-ticker-inner">
          {TICKER_DOUBLE.map((item, i) => (
            <div className="lp-ticker-item" key={i}>
              <span className="lp-ticker-label">{item.label}</span>
              <span className="lp-ticker-val">{item.val}</span>
              <span className={`lp-ticker-change ${item.up ? 'up' : 'down'}`}>{item.change}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══════════ TIER 1: HERO ═══════════ */}
      <section className="lp-hero" style={{ minHeight: '80vh' }}>
        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span className="dot" />
            Smart Travel Financial Assistant
          </div>

          <h1 className="lp-hero-title">
            Your Vietnam Trip,{' '}
            <span className="highlight">Financially Mastered.</span>
          </h1>

          <p className="lp-hero-desc">
            Scan money with AI, track budgets in real-time, compare prices—everything
            a tourist needs to manage finances in Vietnam, all in one beautiful app.
          </p>

          <button className="lp-cta-btn" onClick={() => navigate(isLoggedIn ? '/scan' : '/login')}>
            <span className="lp-cta-icon">📷</span>
            Scan Money Now
          </button>
        </div>
      </section>

      {/* ═══════════ TIER 2: FINANCIAL DASHBOARD ═══════════ */}
      <section className="lp-dashboard lp-section">
        <h2 className="lp-section-title">Financial Dashboard</h2>
        <p className="lp-section-subtitle">
          Track your budget, convert currencies instantly, and take control of your travel spending.
        </p>

        <div className="lp-dashboard-grid">
          {/* Budget Card */}
          <div className="lp-glass lp-budget-card">
            <div className="lp-budget-header">
              <h3 className="lp-budget-title">📊 Travel Budget</h3>
              <span className="lp-budget-badge">This Week</span>
            </div>
            <div className="lp-chart-wrap" style={{ position: 'relative' }}>
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={BUDGET_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {BUDGET_DATA.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: 12, color: 'var(--lp-muted)', fontWeight: 500 }}>Remaining</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 800, color: 'var(--lp-emerald)' }}>65%</div>
              </div>
            </div>
            <div className="lp-budget-info">
              <div className="lp-budget-stat">
                <div className="lp-budget-stat-label">Budget Left</div>
                <div className="lp-budget-stat-val emerald">₫3,240,000</div>
              </div>
              <div className="lp-budget-stat">
                <div className="lp-budget-stat-label">Today's Spent</div>
                <div className="lp-budget-stat-val amber">₫480,000</div>
              </div>
            </div>
          </div>

          {/* Weather Widget */}
          <WeatherWidget />

          {/* Currency Converter */}
          <div className="lp-glass lp-converter-card">
            <h3 className="lp-converter-title">💱 Quick Currency Converter</h3>
            <p className="lp-converter-sub">See how much your money is worth in Vietnamese Đồng</p>

            <div className="lp-converter-row">
              <div className="lp-converter-input-wrap">
                <span className="lp-converter-currency">$</span>
                <input
                  className="lp-converter-input"
                  type="number"
                  placeholder="100"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
              </div>
              <select
                className="lp-converter-select"
                value={currency}
                onChange={e => setCurrency(e.target.value)}
              >
                {Object.keys(FX).map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="lp-converter-result">
              <div className="lp-converter-result-label">Vietnamese Đồng (VND)</div>
              <div className="lp-converter-result-val">₫{converted}</div>
              <div className="lp-converter-result-sub">
                1 {currency} ≈ ₫{(FX[currency] || 25420).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TIER 3: UTILITY GRID ═══════════ */}
      <section className="lp-utility lp-section">
        <h2 className="lp-section-title">Traveler's Toolkit</h2>
        <p className="lp-section-subtitle">
          Essential tools designed for tourists navigating Vietnam with confidence.
        </p>

        <div className="lp-utility-grid">
          {/* ATM Map */}
          <div className="lp-glass lp-util-card" onClick={() => navigate('/atm-map')}>
            <div className="lp-util-icon">📍</div>
            <h3 className="lp-util-card-title">ATM Finder</h3>
            <p className="lp-util-card-desc">
              Locate international-card friendly ATMs (Visa/Mastercard) near you instantly.
            </p>
            <div className="lp-util-highlight">🟢 ATM nearest you: ~200m</div>
          </div>

          {/* Travel Planner */}
          <div className="lp-glass lp-util-card" onClick={() => navigate('/plans')}>
            <div className="lp-util-icon amber-bg">📅</div>
            <h3 className="lp-util-card-title">Travel Planner</h3>
            <p className="lp-util-card-desc">
              Smart itineraries, budget estimates, and local recommendations for your trip.
            </p>
            <div className="lp-util-highlight amber">🕖 Next: Dinner at Hội An — 19:00</div>
          </div>

          {/* Wiki Price */}
          <div className="lp-glass lp-util-card" onClick={() => navigate('/wiki')}>
            <div className="lp-util-icon blue-bg">📋</div>
            <h3 className="lp-util-card-title">Vietnam Price Wiki</h3>
            <p className="lp-util-card-desc">
              Know what things cost before you buy. Crowdsourced average prices.
            </p>
            <div className="lp-wiki-price-row">
              {WIKI_PRICES.map(w => (
                <div className="lp-wiki-price-item" key={w.name}>
                  <span className="emoji">{w.emoji}</span>
                  <span className="price">{w.price}</span>
                  <span className="name">{w.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TIER 4: COMMUNITY & NEWS ═══════════ */}
      <section className="lp-community lp-section">
        <h2 className="lp-section-title">Community & News</h2>
        <p className="lp-section-subtitle">
          Stories, tips, and insights from fellow travelers exploring Vietnam.
        </p>

        <div className="lp-community-layout">
          {/* Masonry Blog */}
          <div className="lp-masonry">
            {BLOG_POSTS.map((post, i) => (
              <div className="lp-masonry-card" key={i} onClick={() => navigate('/news')}>
                <img
                  src={post.img}
                  alt={post.title}
                  className="lp-masonry-img"
                  loading="lazy"
                  style={{ borderRadius: '20px 20px 0 0' }}
                />
                <div className="lp-masonry-body">
                  <span className="lp-masonry-tag">{post.tag}</span>
                  <h4 className="lp-masonry-title">{post.title}</h4>
                  <p className="lp-masonry-excerpt">{post.excerpt}</p>
                </div>
                <div className="lp-masonry-footer">
                  <span>{post.author} · {post.time}</span>
                  <span style={{ color: 'var(--lp-emerald)', cursor: 'pointer' }}>Read more →</span>
                </div>
              </div>
            ))}
          </div>

          {/* Wiki Essentials Sidebar */}
          <div className="lp-tips-sidebar">
            <h3 className="lp-tips-sidebar-title">💡 Wiki Essentials</h3>
            {TIPS.map((tip, i) => (
              <div className="lp-glass lp-tip-card" key={i}>
                <div className="lp-tip-card-icon">{tip.icon}</div>
                <h4 className="lp-tip-card-title">{tip.title}</h4>
                <p className="lp-tip-card-desc">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ TIER 5: FOOTER ═══════════ */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <h3>Viet<span>Money</span></h3>
              <p>
                The smart financial companion for tourists in Vietnam.
                Scan, track, convert, and travel with confidence.
              </p>
            </div>

            <div>
              <h4 className="lp-footer-col-title">Features</h4>
              <ul className="lp-footer-links">
                <li><a href="/scan">AI Money Scanner</a></li>
                <li><a href="/budget">Budget Tracker</a></li>
                <li><a href="/exchange">Exchange Rates</a></li>
                <li><a href="/wiki">Price Wiki</a></li>
              </ul>
            </div>

            <div>
              <h4 className="lp-footer-col-title">Explore</h4>
              <ul className="lp-footer-links">
                <li><a href="/atm-map">ATM Finder</a></li>
                <li><a href="/plans">Travel Planner</a></li>
                <li><a href="/spots">Tourist Spots</a></li>
                <li><a href="/news">Travel News</a></li>
              </ul>
            </div>

            <div>
              <h4 className="lp-footer-col-title">Company</h4>
              <ul className="lp-footer-links">
                <li><a href="#">About Us</a></li>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <span>© 2026 VietMoney. All rights reserved.</span>
            <div className="lp-footer-social">
              <a href="#" title="Twitter">𝕏</a>
              <a href="#" title="Facebook">f</a>
              <a href="#" title="Instagram">📷</a>
              <a href="#" title="GitHub">⌨</a>
            </div>
          </div>
        </div>
      </footer>

      <div style={{ height: 24 }} />
    </div>
  );
}