import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import Badge from '../../components/common/Badge';
import authApi, { clearSession } from '../../api/authApi';
import { t } from '../../utils/i18n';

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
  { label: 'VND/KRW', val: '₫18.9', change: '−0.05%', up: false },
  { label: 'VND/EUR', val: '₫27,810', change: '+0.23%', up: true },
  { label: 'VND/JPY', val: '₫165.4', change: '+0.08%', up: true },
  { label: 'VND/GBP', val: '₫32,150', change: '−0.14%', up: false },
  { label: 'VND/CNY', val: '₫3,497', change: '+0.03%', up: true },
];
const TICKER_FULL = [...TICKER_ITEMS, ...TICKER_ITEMS];

// ── Destinations Data ────────────────────────────────────────────────────────
const DESTINATIONS = [
  { id: 1, name: 'Hạ Long Bay', location: 'Quảng Ninh', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&q=80&w=400', rating: '4.9' },
  { id: 2, name: 'Hội An', location: 'Quảng Nam', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&q=80&w=400', rating: '4.8' },
  { id: 3, name: 'Sa Pa', location: 'Lào Cai', image: 'https://images.unsplash.com/photo-1550652755-66774e14f8d2?auto=format&fit=crop&q=80&w=400', rating: '4.7' },
  { id: 4, name: 'Bà Nà Hills', location: 'Đà Nẵng', image: 'https://images.unsplash.com/photo-1582298538104-fe2e74c27f59?auto=format&fit=crop&q=80&w=400', rating: '4.9' },
];

// ── Quick Action Buttons ─────────────────────────────────────────────────────
const QUICK_BTNS = [
  { icon: '📷', label: 'Quét Tiền AI', path: '/scan', authRequired: true },
  { icon: '💬', label: 'Hỏi Đáp RAG', path: '/rag', authRequired: false },
  { icon: '📋', label: 'Tra Giá Wiki', path: '/wiki', authRequired: false },
  { icon: '🗺️', label: 'Lên Lịch Trình', path: '/plan', authRequired: true },
];

// ── About / Features / Price / News data ─────────────────────────────────────
const FEATURES = [
  {
    icon: '📷',
    title: 'Quét Tiền AI',
    desc: 'Nhận diện mệnh giá tiền Việt tức thì bằng camera. Không lo nhầm tờ, không lo bị thiếu.',
    btn: 'Thử ngay',
    path: '/scan',
    authRequired: true,
    color: 'feature-card--green',
    img: 'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: '💰',
    title: 'Quản Lý Ngân Sách',
    desc: 'Theo dõi chi tiêu hàng ngày, đặt giới hạn và nhận cảnh báo khi vượt ngưỡng.',
    btn: 'Quản lý',
    path: '/budget',
    authRequired: true,
    color: 'feature-card--gold',
    img: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80',
  },
  {
    icon: '🗺️',
    title: 'Kế Hoạch Du Lịch',
    desc: 'Lập lịch trình thông minh, gợi ý địa điểm và ước tính ngân sách cho chuyến đi của bạn.',
    btn: 'Lên lịch',
    path: '/plan',
    authRequired: true,
    color: 'feature-card--blue',
    img: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
  },
];

const PRICE_ITEMS = [
  { icon: '🥖', name: 'Bánh Mì', low: '15,000', high: '35,000', tip: 'Phổ biến khắp nơi' },
  { icon: '🍜', name: 'Phở', low: '40,000', high: '80,000', tip: 'Tuỳ quán & thành phố' },
  { icon: '☕', name: 'Cà Phê', low: '15,000', high: '55,000', tip: 'Cà phê sữa đá' },
  { icon: '🚕', name: 'Taxi/km', low: '10,000', high: '20,000', tip: 'Grab thường rẻ hơn' },
  { icon: '🍚', name: 'Cơm tấm', low: '35,000', high: '65,000', tip: 'Đặc sản miền Nam' },
  { icon: '🏨', name: 'Hostel/đêm', low: '150,000', high: '350,000', tip: 'Tuỳ vị trí' },
];

const NEWS_ITEMS = [
  {
    emoji: '🏖️',
    tag: 'Du lịch',
    title: 'Top 5 Địa Điểm Ẩn Bị Bỏ Qua Ở Đà Nẵng',
    desc: 'Những góc khuất tuyệt đẹp mà phần lớn khách du lịch chưa biết tới.',
    author: 'Admin',
    time: '2 giờ trước',
    likes: 142,
    path: '/news',
  },
  {
    emoji: '💱',
    tag: 'Tài chính',
    title: 'Tỷ Giá USD/VND Tăng Nhẹ Tuần Này',
    desc: 'Ngân hàng Nhà nước điều chỉnh biên độ, ảnh hưởng tới chi tiêu du khách.',
    author: 'Finance',
    time: '5 giờ trước',
    likes: 87,
    path: '/news',
  },
  {
    emoji: '🎌',
    tag: 'Văn hoá',
    title: 'Hội An Mùa Đèn Lồng — Kinh Nghiệm Không Thể Bỏ Lỡ',
    desc: 'Lễ hội đèn lồng hàng tháng thu hút hàng nghìn du khách quốc tế.',
    author: 'Culture',
    time: '1 ngày trước',
    likes: 213,
    path: '/news',
  },
  {
    emoji: '🍜',
    tag: 'Ẩm thực',
    title: 'Bản Đồ Ẩm Thực Hội An: Ăn Gì, Ở Đâu?',
    desc: 'Từ Cao Lầu đến Bánh Mì Phượng — cẩm nang đầy đủ cho tín đồ ẩm thực.',
    author: 'Food',
    time: '2 ngày trước',
    likes: 305,
    path: '/news',
  },
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
    // Mock submit — replace with real API call as needed
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
          <input
            className="contact-input"
            type="text"
            name="name"
            placeholder="Nguyễn Văn A"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="contact-field">
          <label className="contact-label">Email</label>
          <input
            className="contact-input"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
      </div>
      <div className="contact-field">
        <label className="contact-label">Nội dung</label>
        <textarea
          className="contact-input contact-textarea"
          name="message"
          placeholder="Mô tả vấn đề hoặc câu hỏi của bạn..."
          value={form.message}
          onChange={handleChange}
          required
          rows={4}
        />
      </div>
      <button type="submit" className="contact-submit-btn" disabled={sending}>
        {sending ? '⏳ Đang gửi...' : '✉️ Gửi yêu cầu'}
      </button>
    </form>
  );
}

// ── Feature Slider Data ─────────────────────────────────────────────────────────

const INTRO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=800&q=80',
    get tag() { return t('slide_1_tag'); },
    get title() { return t('slide_1_title'); },
    get description() { return t('slide_1_desc'); },
    get actionText() { return t('slide_1_btn'); },
    actionPath: '/scan'
  },
  {
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80',
    get tag() { return t('slide_2_tag'); },
    get title() { return t('slide_2_title'); },
    get description() { return t('slide_2_desc'); },
    get actionText() { return t('slide_2_btn'); },
    actionPath: '/budget'
  },
  {
    image: 'https://images.unsplash.com/photo-1550652755-66774e14f8d2?auto=format&fit=crop&w=800&q=80',
    get tag() { return t('slide_3_tag'); },
    get title() { return t('slide_3_title'); },
    get description() { return t('slide_3_desc'); },
    get actionText() { return t('slide_3_btn'); },
    actionPath: '/plan'
  }
];

// ── DashboardPage ─────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const [clock, setClock] = useState('--:--');
  const [dateStr, setDate] = useState('');
  const [currentIntroSlide, setCurrentIntroSlide] = useState(0);

  const touchStartX = useRef(null);
  const touchEndX = useRef(null);
  const minSwipeDistance = 50;

  const handleTouchStart = (e) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;

    if (distance > minSwipeDistance) {
      setCurrentIntroSlide(prev => (prev + 1) % INTRO_SLIDES.length);
    } else if (distance < -minSwipeDistance) {
      setCurrentIntroSlide(prev => (prev - 1 + INTRO_SLIDES.length) % INTRO_SLIDES.length);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIntroSlide(prev => (prev + 1) % INTRO_SLIDES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const isLoggedIn = !!localStorage.getItem('accessToken');
  const user = isLoggedIn ? getStoredUser() : null;
  const displayName = user?.fullName ?? user?.username ?? 'Traveler';
  const avatarSrc = resolveAvatar(user);

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
          isLoggedIn ? (
            <>
              <div
                className="user-box"
                onClick={() => navigate('/profile')}
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
            <div className="label">{isLoggedIn ? t('greeting_label') : 'Welcome to VietMoney'}</div>
            <div className="hello">
              {t('greeting_hello').replace('Du khách', isLoggedIn ? displayName : 'Guest').replace('Good evening, ', '')}
            </div>
          </div>
          <div className="spacer" />
          {isLoggedIn && (
            <div className="greeting-meta">
              <div className="meta-item"><strong>{t('trip_day')}</strong><span>{t('of_trip')}</span></div>
              <div className="meta-item"><strong>₫1,240,000</strong><span>{t('remaining')}</span></div>
            </div>
          )}
        </div>
      </div>

      {/* Hero Search */}
      <div className="hero-search-container compact">
        <div className="hero-search-box">
          <span className="hero-search-icon">🔍</span>
          <input type="text" className="hero-search-input" placeholder={t('search_placeholder')} />
        </div>
      </div>

      {/* ── Quick Actions (bento grid gốc) ── */}
      <div className="section-title compact">{t('quick_actions')}</div>
      <div className="quick-actions-row">
        <div className="bento-card scan-card" onClick={() => navigate(isLoggedIn ? '/scan' : '/login')}>
          <div className="card-icon">📷</div>
          <div className="card-label">{t('scan_money')}</div>
          <div className="card-sub">{t('scan_sub')}</div>
          <Badge>AI</Badge>
        </div>
        <div className="bento-card exchange-card" onClick={() => navigate('/exchange')}>
          <div className="card-icon">💱</div>
          <div className="card-label">{t('exchange_rate')}</div>
          <div className="card-value">25,420</div>
        </div>
        <div className="bento-card budget-card" onClick={() => navigate(isLoggedIn ? '/budget' : '/login')}>
          <div className="card-icon">💰</div>
          <div className="card-label">{t('budget')}</div>
          <div className="card-sub">{isLoggedIn ? '65% used today' : 'Manage your spending'}</div>
        </div>
        <div className="bento-card wiki-card" onClick={() => navigate('/wiki')}>
          <div className="card-icon">📋</div>
          <div className="card-label">{t('price_wiki')}</div>
          <div className="card-sub">{t('wiki_sub')}</div>
        </div>
        <div className="bento-card map-card" onClick={() => navigate('/wiki/guide')}>
          <div className="card-icon">🎓</div>
          <div className="card-label">{t('currency_guide')}</div>
          <div className="card-sub">{t('guide_sub')}</div>
        </div>
      </div>

      {/* ── Awesome Tourist Introduction Slider ── */}
      <div style={{ padding: '0 20px', marginBottom: 24, marginTop: 16 }}>
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: 'relative',
            borderRadius: 24,
            overflow: 'hidden',
            background: `url(${INTRO_SLIDES[currentIntroSlide].image}) center/cover no-repeat`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            minHeight: 320,
            boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            transition: 'background 0.5s ease-in-out',
            touchAction: 'pan-y'
          }}
        >
          {/* Dark Overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, rgba(10,12,15,0) 0%, rgba(10,12,15,0.9) 100%)'
          }} />

          {/* Content overlay */}
          <div style={{ position: 'relative', zIndex: 2, padding: 24 }}>
            <div style={{
              display: 'inline-block', background: 'var(--accent)', color: '#000',
              padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14
            }}>
              {INTRO_SLIDES[currentIntroSlide].tag}
            </div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, fontWeight: 800, lineHeight: 1.3, marginBottom: 10, color: '#fff' }}>
              {INTRO_SLIDES[currentIntroSlide].title}
            </h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 20, maxWidth: '95%', lineHeight: 1.5, minHeight: 42 }}>
              {INTRO_SLIDES[currentIntroSlide].description}
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => navigate(INTRO_SLIDES[currentIntroSlide].actionPath)} style={{
                background: 'var(--accent)',
                border: 'none',
                color: '#000',
                padding: '10px 20px',
                borderRadius: 24,
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'Syne, sans-serif',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(200, 242, 61, 0.3)',
                transition: 'transform 0.2s'
              }}>
                {INTRO_SLIDES[currentIntroSlide].actionText}
              </button>
            </div>
            {/* Dots */}
            <div style={{ display: 'flex', gap: 6, position: 'absolute', bottom: 24, right: 24 }}>
              {INTRO_SLIDES.map((_, i) => (
                <div key={i} onClick={() => setCurrentIntroSlide(i)} style={{
                  width: 8, height: 8, borderRadius: '50%', cursor: 'pointer',
                  background: currentIntroSlide === i ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
                  transition: 'background 0.3s'
                }} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="divider compact" />



      {/* ── Section: Về VietMoney ── */}
      <div className="section-title compact">{t('about_title')}</div>
      <div className="about-section">
        <div className="about-grid">
          {/* Cột trái: Tầm nhìn */}
          <div className="about-vision">
            <div className="about-vision-tag">{t('about_vision')}</div>
            <h2 className="about-vision-title">{t('about_vision_title')}</h2>
            <p className="about-vision-desc">
              {t('about_vision_desc')}
            </p>
            <div className="about-stat-row">
              <div className="about-stat"><span className="about-stat-num">50K+</span><span className="about-stat-label">Người dùng</span></div>
              <div className="about-stat"><span className="about-stat-num">12</span><span className="about-stat-label">Loại tiền tệ</span></div>
              <div className="about-stat"><span className="about-stat-num">4.9★</span><span className="about-stat-label">Đánh giá</span></div>
            </div>
          </div>

          {/* Cột phải: Tiện ích */}
          <div className="about-features">
            <div className="about-vision-tag">Tiện ích</div>
            {[
              { icon: '🤖', title: 'RAG AI Hỏi Đáp', desc: 'Trả lời mọi câu hỏi về tài chính & du lịch VN' },
              { icon: '📷', title: 'Nhận diện mệnh giá', desc: 'AI nhận dạng tiền Việt chính xác tức thì' },
              { icon: '💱', title: 'Chuyển đổi tỉ giá', desc: 'Cập nhật tỉ giá thực tế theo thời gian thực' },
              { icon: '📊', title: 'Quản lý ngân sách', desc: 'Theo dõi và kiểm soát chi tiêu thông minh' },
            ].map((f) => (
              <div key={f.title} className="about-feature-item">
                <div className="about-feature-icon">{f.icon}</div>
                <div>
                  <div className="about-feature-title">{f.title}</div>
                  <div className="about-feature-desc">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Thông tin liên hệ */}
        <div className="about-contact-row">
          <div className="about-contact-item">
            <span className="about-contact-icon">✉️</span>
            <div>
              <div className="about-contact-label">Email</div>
              <div className="about-contact-val">hello@vietmoney.app</div>
            </div>
          </div>
          <div className="about-contact-item">
            <span className="about-contact-icon">📍</span>
            <div>
              <div className="about-contact-label">Địa chỉ</div>
              <div className="about-contact-val">36 Bạch Đằng, Đà Nẵng</div>
            </div>
          </div>
          <div className="about-contact-item">
            <span className="about-contact-icon">📞</span>
            <div>
              <div className="about-contact-label">Điện thoại</div>
              <div className="about-contact-val">+84 236 123 4567</div>
            </div>
          </div>
        </div>
      </div>

      <div className="divider compact" />

      {/* ── Section: Tính Năng Nổi Bật ── */}
      <div className="section-title compact">Tính Năng Nổi Bật</div>
      <div className="features-grid">
        {FEATURES.map((f) => (
          <div key={f.title} className={`feature-card ${f.color}`}>
            <div className="feature-card-img-wrap">
              <img src={f.img} alt={f.title} className="feature-card-img" loading="lazy" />
              <div className="feature-card-img-overlay" />
              <div className="feature-card-badge">{f.icon} {f.title}</div>
            </div>
            <div className="feature-card-body">
              <p className="feature-card-desc">{f.desc}</p>
              <button
                className="feature-card-btn"
                onClick={() => navigate(f.authRequired && !isLoggedIn ? '/login' : f.path)}
              >
                {f.btn} →
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="divider compact" />

      {/* ── Section: Wiki Giá Tham Khảo ── */}
      <div className="section-title compact">Wiki Giá Tham Khảo</div>
      <div className="price-section">
        <div className="price-ref-tag">📌 Thông tin tham khảo — Giá có thể thay đổi theo địa điểm</div>
        <div className="price-grid">
          {PRICE_ITEMS.map((p) => (
            <div key={p.name} className="price-card">
              <div className="price-card-icon">{p.icon}</div>
              <div className="price-card-name">{p.name}</div>
              <div className="price-card-range">₫{p.low} – ₫{p.high}</div>
              <div className="price-card-tip">{p.tip}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/wiki')}
            style={{
              padding: '8px 24px', background: 'var(--bg3)', color: 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer',
              fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text)';
            }}
          >
            Xem thêm Wiki →
          </button>
        </div>
      </div>

      <div className="divider compact" />

      {/* ── Section: Tin Tức Nổi Bật ── */}
      <div className="section-title compact">Tin Tức Nổi Bật</div>
      <div className="news-grid">
        {NEWS_ITEMS.map((n, i) => (
          <div key={i} className="news-card-item news-card-new" onClick={() => navigate(n.path)}>
            <div className="news-thumb">{n.emoji}</div>
            <div className="news-body">
              <span className="news-tag">{n.tag}</span>
              <div className="news-title">{n.title}</div>
              <div className="news-desc">{n.desc}</div>
              <div className="news-footer">
                <div className="news-author">
                  <div className="news-author-dot">{n.author[0]}</div>
                  <span>{n.author} · {n.time}</span>
                </div>
                <div className="news-footer-right">
                  <span className="news-like">❤️ {n.likes}</span>
                  <button className="news-more-btn" onClick={(e) => { e.stopPropagation(); navigate(n.path); }}>Xem thêm</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="divider compact" />

      {/* ── Section: Liên Hệ / Hỏi Đáp ── */}
      <div className="section-title compact">Liên Hệ / Hỏi Đáp</div>
      <div className="contact-section">
        <div className="contact-card">
          <div className="contact-card-header">
            <div className="contact-card-title">Gửi yêu cầu hỗ trợ</div>
            <div className="contact-card-sub">Chúng tôi phản hồi trong vòng 24 giờ</div>
          </div>
          <ContactForm />
        </div>
      </div>

      <div style={{ height: 24 }} />

      {/* Language + Theme Switcher (fixed bottom-left) */}
      {/* Đã chuyển sang ClientLayout — luôn hiển thị ở mọi tab */}
    </div>
  );
}