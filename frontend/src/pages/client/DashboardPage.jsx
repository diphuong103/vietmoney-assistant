import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell } from 'recharts';
import { useTranslation } from 'react-i18next';

import exchangeRateApi from '../../api/exchangeRateApi';
import articleApi from '../../api/articleApi';
import budgetApi from '../../api/budgetApi';
import travelPlanApi from '../../api/travelPlanApi';

import { useTransactionStore } from '../../store/transactionStore';
import { useNotificationStore } from '../../store/notificationStore';
import NotificationPanel from '../../components/common/NotificationPanel';

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
  const { t } = useTranslation();
  const [weather, setWeather] = useState(null);
  const [cityName, setCityName] = useState(t('dash_locating', 'Locating...'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeather = (lat, lon) => {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;

      fetch(url)
        .then((r) => r.json())
        .then((data) => {
          if (data?.current) setWeather(data.current);
        })
        .catch(() => { })
        .finally(() => setLoading(false));

      fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`)
        .then((r) => r.json())
        .then((data) => {
          const city =
            data?.address?.city ||
            data?.address?.town ||
            data?.address?.state ||
            t('dash_your_location', 'Your Location');

          setCityName(city);
        })
        .catch(() => setCityName(t('dash_your_location', 'Your Location')));
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => {
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
      <h3 className="lp-weather-title">🌤️ {t('dash_local_weather', 'Local Weather')}</h3>
      <p className="lp-weather-location">{cityName}</p>

      {loading ? (
        <div className="lp-weather-loading">📍 {t('dash_fetching_loc', 'Fetching location...')}</div>
      ) : (
        <>
          <div className="lp-weather-main">
            <span className="lp-weather-icon">{info.icon}</span>
            <span className="lp-weather-temp">{Math.round(temp)}°C</span>
          </div>

          <div className="lp-weather-desc">{t(`weather_code_${code}`, info.desc)}</div>

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

// ── Helpers ──────────────────────────────────────────────────────────────────
function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') ?? 'null');
  } catch {
    return null;
  }
}

function resolveAvatar(user) {
  if (user?.avatarUrl) return user.avatarUrl;

  const seed = user?.id ?? user?.username ?? 'guest';
  return `https://api.dicebear.com/8.x/thumbs/svg?seed=${seed}&radius=50`;
}

function getGreeting(t) {
  const h = new Date().getHours();

  if (h < 12) return t('dash_good_morning', 'Good morning');
  if (h < 18) return t('dash_good_afternoon', 'Good afternoon');

  return t('dash_good_evening', 'Good evening');
}

function fmtVND(n) {
  const v = Number(n || 0);

  if (v >= 1_000_000) return `₫${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `₫${(v / 1_000).toFixed(0)}K`;

  return `₫${v}`;
}

function timeAgo(dateStr, t) {
  if (!dateStr) return '';

  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.round(diff / 60000);

  if (m < 60) return `${m}${t('dash_m_ago', 'm ago')}`;

  const h = Math.round(m / 60);

  if (h < 24) return `${h}${t('dash_h_ago', 'h ago')}`;

  return `${Math.round(h / 24)}${t('dash_d_ago', 'd ago')}`;
}

// Currency fallback rates
const FX_FALLBACK = {
  USD: 25420,
  EUR: 27810,
  JPY: 165.4,
  KRW: 18.9,
  GBP: 32150,
  AUD: 16320,
  THB: 720,
  CNY: 3497,
};

const getTips = (t) => [
  {
    icon: '💬',
    title: t('dash_tip_bargain_title', 'How to Bargain'),
    desc: t('dash_tip_bargain_desc', 'Start at 50% of the quoted price, be friendly, walk away if too high — the vendor will often call you back.'),
  },
  {
    icon: '💵',
    title: t('dash_tip_notes_title', 'Spot 20k vs 500k Notes'),
    desc: t('dash_tip_notes_desc', 'Always check the color and size. The 500k note is larger with a blue tint. Under UV light, security features glow.'),
  },
  {
    icon: '🏧',
    title: t('dash_tip_atm_title', 'ATM Tips for Tourists'),
    desc: t('dash_tip_atm_desc', 'Use ATMs inside banks to avoid skimmers. Vietcombank & BIDV ATMs accept Visa/Mastercard with low fees.'),
  },
  {
    icon: '📱',
    title: t('dash_tip_grab_title', 'Pay with Grab/MoMo'),
    desc: t('dash_tip_grab_desc', 'Download Grab for rides & food delivery. MoMo works at many shops if you have a local phone number.'),
  },
];

const CHART_COLORS = ['#f59e0b', '#059669'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [scrolled, setScrolled] = useState(false);

  const [rates, setRates] = useState(FX_FALLBACK);
  const [ratesLoading, setRatesLoading] = useState(true);

  const [budgetData, setBudgetData] = useState(null);
  const [dailyBudget, setDailyBudget] = useState(null);

  const { fetchTransactions } = useTransactionStore();

  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  const [nextPlan, setNextPlan] = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);

  const { unreadCount, fetch: fetchNotifs } = useNotificationStore();

  const isLoggedIn = !!localStorage.getItem('accessToken');
  const user = isLoggedIn ? getStoredUser() : null;
  const displayName = user?.fullName ?? user?.username ?? t('dash_traveler', 'Traveler');
  const avatarSrc = resolveAvatar(user);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);

    window.addEventListener('scroll', handleScroll);

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    exchangeRateApi
      .getRates()
      .then((res) => {
        const list = res?.data?.data ?? res?.data ?? [];

        if (Array.isArray(list) && list.length > 0) {
          const map = {};

          list.forEach((r) => {
            if (r.fromCurrency && r.toCurrency === 'VND') {
              map[r.fromCurrency] = r.rate;
            }
          });

          if (Object.keys(map).length > 0) {
            setRates({ ...FX_FALLBACK, ...map });
          }
        }
      })
      .catch(() => { })
      .finally(() => setRatesLoading(false));
  }, []);

  useEffect(() => {
    articleApi
      .getTrending({ size: 4 })
      .then((res) => {
        const outer = res?.data?.data ?? res?.data ?? {};
        const list = Array.isArray(outer) ? outer : outer?.content ?? [];

        setArticles(list.slice(0, 4));
      })
      .catch(() => { })
      .finally(() => setArticlesLoading(false));
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;

    fetchTransactions();

    budgetApi
      .getBudgets()
      .then((res) => {
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];

        const today = new Date().toISOString().slice(0, 10);

        const active =
          list.find((b) => b.startDate <= today && b.endDate >= today) ??
          list[0] ??
          null;

        setBudgetData(active);
      })
      .catch(() => { });

    budgetApi
      .getDailyBudget()
      .then((res) => {
        const d = res?.data ?? res;
        setDailyBudget(d);
      })
      .catch(() => {
        setDailyBudget(null);
      });

    travelPlanApi
      .getAll()
      .then((res) => {
        const raw = res?.data?.data ?? res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : [];

        if (list.length > 0) {
          const sorted = [...list].sort(
            (a, b) => new Date(a.startDate) - new Date(b.startDate)
          );

          const upcoming =
            sorted.find((p) => new Date(p.endDate) >= new Date()) ??
            sorted[sorted.length - 1];

          setNextPlan(upcoming ?? null);
        }
      })
      .catch(() => { });
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  const converted =
    amount && !isNaN(amount)
      ? (parseFloat(amount) * (rates[currency] || 25420)).toLocaleString('vi-VN')
      : '0';

  const totalBudget = budgetData ? Number(budgetData.totalAmount ?? 0) : 0;
  const totalExpense = budgetData ? Number(budgetData.spentAmount ?? 0) : 0;
  const remaining = Math.max(0, totalBudget - totalExpense);
  const pct = totalBudget > 0 ? Math.round((remaining / totalBudget) * 100) : 0;

  const chartData =
    totalBudget > 0
      ? [
        { name: 'Spent', value: totalExpense || 0.001 },
        { name: 'Remaining', value: remaining },
      ]
      : [
        { name: 'Spent', value: 1 },
        { name: 'Remaining', value: 2 },
      ];

  const TICKER_KEYS = ['USD', 'EUR', 'JPY', 'KRW', 'GBP', 'CNY', 'AUD', 'THB'];

  const tickerItems = TICKER_KEYS.map((c) => ({
    label: `${c}/VND`,
    val: `₫${Number(rates[c] || 0).toLocaleString('vi-VN')}`,
  }));

  const TICKER_DOUBLE = [...tickerItems, ...tickerItems];

  const planHighlight = nextPlan
    ? `📅 ${t('dash_next_trip', 'Next')}: ${nextPlan.destination ?? nextPlan.name} — ${nextPlan.startDate}`
    : `📅 ${t('dash_no_upcoming_trips', 'No upcoming trips — plan one now!')}`;

  const ARTICLE_FALLBACK_IMGS = [
    'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1550652755-66774e14f8d2?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1582298538104-fe2e74c27f59?auto=format&fit=crop&w=600&q=80',
  ];

  const scrollToMenu = (e, id) => {
    e.preventDefault();

    const el = document.getElementById(id);

    if (el) {
      const top = el.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page" style={{ paddingTop: 72 }}>
      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <a
          href="#"
          className="lp-nav-logo"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          Viet<span>Money</span>
        </a>

        <div className="lp-nav-links">
          <button
            className="lp-nav-link"
            onClick={(e) => scrollToMenu(e, 'financial-dashboard')}
          >
            {t('dash_section_financial', 'Financial Dashboard')}
          </button>

          <button
            className="lp-nav-link"
            onClick={(e) => scrollToMenu(e, 'travelers-toolkit')}
          >
            {t('dash_section_toolkit', "Traveler's Toolkit")}
          </button>

          <button
            className="lp-nav-link"
            onClick={(e) => scrollToMenu(e, 'community-news')}
          >
            {t('dash_section_community', 'Community & News')}
          </button>

          <button
            className="lp-nav-link"
            onClick={(e) => scrollToMenu(e, 'about')}
          >
            {t('dash_footer_about_nav', 'About')}
          </button>
        </div>

        <div
          className="lp-nav-actions"
          style={{ display: 'flex', gap: 10, alignItems: 'center' }}
        >
          {isLoggedIn ? (
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
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(displayName)}`;
                  }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />

                <div className="user-info">
                  <div className="name">{displayName}</div>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <button
                  className="icon-btn"
                  onClick={() => setNotifOpen((v) => !v)}
                  title="Thông báo"
                  aria-label="Thông báo"
                  style={{ position: 'relative' }}
                >
                  🔔

                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        minWidth: 16,
                        height: 16,
                        background: '#f23d6e',
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 700,
                        borderRadius: 8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 3px',
                        lineHeight: 1,
                        pointerEvents: 'none',
                      }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </button>

                <NotificationPanel
                  open={notifOpen}
                  onClose={() => setNotifOpen(false)}
                />
              </div>

              <button
                className="icon-btn"
                onClick={() => navigate('/settings')}
                title="Cài đặt"
                aria-label="Cài đặt"
              >
                ⚙️
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <button
                className="lp-nav-link"
                style={{ fontWeight: 600 }}
                onClick={() => navigate('/login')}
              >
                {t('dash_login', 'Log In')}
              </button>

              <button
                className="lp-nav-cta"
                onClick={() => navigate('/register')}
              >
                {t('dash_signup', 'Sign Up')}
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="lp-ticker">
        <div className="lp-ticker-inner">
          {TICKER_DOUBLE.map((item, i) => (
            <div className="lp-ticker-item" key={`${item.label}-${i}`}>
              <span className="lp-ticker-label">{item.label}</span>
              <span className="lp-ticker-val">
                {ratesLoading ? '…' : item.val}
              </span>
            </div>
          ))}
        </div>
      </div>

      <section className="lp-hero" style={{ minHeight: '80vh' }}>
        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span className="dot" />
            {isLoggedIn
              ? `${getGreeting(t)}, ${displayName} 👋`
              : t('dash_smart_assistant', 'Smart Travel Financial Assistant')}
          </div>

          <h1 className="lp-hero-title">
            {t('dash_hero_title_main', 'Your Vietnam Trip,')}{' '}
            <span className="highlight">{t('dash_hero_title_highlight', 'Financially Mastered.')}</span>
          </h1>

          <p className="lp-hero-desc">
            {t('dash_hero_desc', 'Scan money with AI, track budgets in real-time, compare prices—everything a tourist needs to manage finances in Vietnam, all in one beautiful app.')}
          </p>

          <button
            className="lp-cta-btn"
            onClick={() => navigate(isLoggedIn ? '/scan' : '/login')}
          >
            <span className="lp-cta-icon">📷</span>
            {t('dash_scan_now', 'Scan Money Now')}
          </button>
        </div>
      </section>

      <section id="financial-dashboard" className="lp-dashboard lp-section">
        <h2 className="lp-section-title">{t('dash_section_financial', 'Financial Dashboard')}</h2>

        <p className="lp-section-subtitle">
          {t('dash_section_financial_sub', 'Track your budget, convert currencies instantly, and take control of your travel spending.')}
        </p>

        <div className="lp-dashboard-grid">
          <div
            className="lp-glass lp-budget-card"
            style={{ cursor: isLoggedIn ? 'pointer' : 'default' }}
            onClick={() => isLoggedIn && navigate('/budget')}
          >
            <div className="lp-budget-header">
              <h3 className="lp-budget-title">📊 {t('dash_travel_budget', 'Travel Budget')}</h3>

              {budgetData ? (
                <span className="lp-budget-badge">
                  {budgetData.name ?? t('dash_budget_active', 'Active')}
                </span>
              ) : (
                <span className="lp-budget-badge">
                  {isLoggedIn ? t('dash_no_budget', 'No Budget') : t('dash_preview', 'Preview')}
                </span>
              )}
            </div>

            <div className="lp-chart-wrap" style={{ position: 'relative' }}>
              <div style={{ position: 'relative', width: 200, height: 200 }}>
                <PieChart width={200} height={200}>
                  <Pie
                    data={chartData}
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
                    {chartData.map((_, idx) => (
                      <Cell
                        key={`budget-cell-${idx}`}
                        fill={CHART_COLORS[idx]}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </div>

              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--lp-muted)',
                    fontWeight: 500,
                  }}
                >
                  {t('dash_remaining', 'Remaining')}
                </div>

                <div
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 22,
                    fontWeight: 800,
                    color: 'var(--lp-emerald)',
                  }}
                >
                  {isLoggedIn && totalBudget > 0 ? `${pct}%` : '--'}
                </div>
              </div>
            </div>

            <div className="lp-budget-info">
              <div className="lp-budget-stat">
                <div className="lp-budget-stat-label">{t('dash_budget_left', 'Budget Left')}</div>
                <div className="lp-budget-stat-val emerald">
                  {isLoggedIn && totalBudget > 0 ? fmtVND(remaining) : '—'}
                </div>
              </div>

              <div className="lp-budget-stat">
                <div className="lp-budget-stat-label">{t('dash_today_spent', "Today's Spent")}</div>
                <div className="lp-budget-stat-val amber">
                  {isLoggedIn && dailyBudget
                    ? fmtVND(dailyBudget.spentToday)
                    : '—'}
                </div>
              </div>
            </div>

            {isLoggedIn && (
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: 'var(--lp-muted)',
                  textAlign: 'center',
                }}
              >
                {totalBudget > 0
                  ? t('dash_tap_manage_budget', 'Tap to manage your budget →')
                  : t('dash_tap_setup_budget', 'Tap to set up a budget →')}
              </div>
            )}
          </div>

          <WeatherWidget />

          <div className="lp-glass lp-converter-card">
            <h3 className="lp-converter-title">💱 {t('dash_converter_title', 'Quick Currency Converter')}</h3>

            <p className="lp-converter-sub">
              {t('dash_converter_sub', 'See how much your money is worth in Vietnamese Đồng')}
            </p>

            <div className="lp-converter-row">
              <div className="lp-converter-input-wrap">
                <span className="lp-converter-currency">$</span>

                <input
                  className="lp-converter-input"
                  type="number"
                  placeholder="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <select
                className="lp-converter-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {Object.keys(rates).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="lp-converter-result">
              <div className="lp-converter-result-label">
                {t('dash_vnd_label', 'Vietnamese Đồng (VND)')}
              </div>

              <div className="lp-converter-result-val">₫{converted}</div>

              <div className="lp-converter-result-sub">
                1 {currency} ≈ ₫
                {(rates[currency] || 25420).toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="travelers-toolkit" className="lp-utility lp-section">
        <h2 className="lp-section-title">{t('dash_section_toolkit', "Traveler's Toolkit")}</h2>

        <p className="lp-section-subtitle">
          {t('dash_section_toolkit_sub', 'Essential tools designed for tourists navigating Vietnam with confidence.')}
        </p>

        <div className="lp-utility-grid">
          <div className="lp-glass lp-util-card" onClick={() => navigate('/atm-map')}>
            <div className="lp-util-icon">📍</div>

            <h3 className="lp-util-card-title">{t('dash_atm_finder', 'ATM Finder')}</h3>

            <p className="lp-util-card-desc">
              {t('dash_atm_finder_desc', 'Locate international-card friendly ATMs (Visa/Mastercard) near you instantly.')}
            </p>

            <div className="lp-util-highlight">
              🟢 {t('dash_tap_find_atm', 'Tap to find ATMs near you')}
            </div>
          </div>

          <div className="lp-glass lp-util-card" onClick={() => navigate('/plans')}>
            <div className="lp-util-icon amber-bg">📅</div>

            <h3 className="lp-util-card-title">{t('dash_travel_planner', 'Travel Planner')}</h3>

            <p className="lp-util-card-desc">
              {t('dash_travel_planner_desc', 'Smart itineraries, budget estimates, and local recommendations for your trip.')}
            </p>

            <div className="lp-util-highlight amber">{planHighlight}</div>
          </div>

          <div className="lp-glass lp-util-card" onClick={() => navigate('/wiki')}>
            <div className="lp-util-icon blue-bg">📋</div>

            <h3 className="lp-util-card-title">{t('dash_price_wiki', 'Vietnam Price Wiki')}</h3>

            <p className="lp-util-card-desc">
              {t('dash_price_wiki_desc', 'Know what things cost before you buy. Crowdsourced average prices.')}
            </p>

            <div className="lp-wiki-price-row">
              {[
                { emoji: '☕', name: 'Cafe', price: '25–55k' },
                { emoji: '🍜', name: 'Phở', price: '40–80k' },
                { emoji: '🚕', name: 'Taxi', price: '10–20k/km' },
                { emoji: '🥖', name: 'Bánh Mì', price: '15–35k' },
                { emoji: '🍚', name: 'Cơm', price: '35–65k' },
                { emoji: '🍺', name: 'Bia', price: '15–40k' },
              ].map((w) => (
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

      <section id="community-news" className="lp-community lp-section">
        <h2 className="lp-section-title">{t('dash_section_community', 'Community & News')}</h2>

        <p className="lp-section-subtitle">
          {t('dash_section_community_sub', 'Stories, tips, and insights from fellow travelers exploring Vietnam.')}
        </p>

        <div className="lp-community-layout">
          <div className="lp-masonry">
            {articlesLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div
                  className="lp-masonry-card"
                  key={i}
                  style={{ opacity: 0.5, minHeight: 200 }}
                >
                  <div
                    style={{
                      height: 140,
                      background: 'var(--lp-surface)',
                      borderRadius: '20px 20px 0 0',
                    }}
                  />

                  <div className="lp-masonry-body">
                    <div
                      style={{
                        height: 12,
                        width: '60%',
                        background: 'var(--lp-surface)',
                        borderRadius: 6,
                        marginBottom: 8,
                      }}
                    />

                    <div
                      style={{
                        height: 16,
                        width: '90%',
                        background: 'var(--lp-surface)',
                        borderRadius: 6,
                        marginBottom: 6,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : articles.length > 0 ? (
              articles.map((art, i) => (
                <div
                  className="lp-masonry-card"
                  key={art.id ?? i}
                  onClick={() => navigate('/news')}
                  style={{ position: 'relative' }}
                >
                  {i < 3 && (
                    <div style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      zIndex: 2,
                      background: 'linear-gradient(135deg, #ff6b35, #f7931e)',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: 12,
                      boxShadow: '0 2px 8px rgba(255,107,53,.4)',
                      letterSpacing: '.3px',
                    }}>
                      #{i + 1} 🔥
                    </div>
                  )}

                  <img
                    src={
                      art.mediaUrl ||
                      art.coverImage ||
                      art.imageUrl ||
                      art.thumbnailUrl ||
                      ARTICLE_FALLBACK_IMGS[i % 4]
                    }
                    alt={art.title}
                    className="lp-masonry-img"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    style={{ borderRadius: '20px 20px 0 0' }}
                    onError={(e) => {
                      e.currentTarget.src = ARTICLE_FALLBACK_IMGS[i % 4];
                    }}
                  />

                  <div className="lp-masonry-body">
                    <span className="lp-masonry-tag">
                      {art.category ?? art.tag ?? 'News'}
                    </span>

                    <h4 className="lp-masonry-title">{art.title}</h4>

                    <p className="lp-masonry-excerpt">
                      {art.summary ?? art.content?.slice(0, 100) ?? ''}
                    </p>
                  </div>

                  <div className="lp-masonry-footer">
                    <span>
                      {art.authorName ?? art.author?.username ?? 'VietMoney'} ·{' '}
                      {timeAgo(art.createdAt, t)}
                    </span>

                    <span
                      style={{
                        color: 'var(--lp-emerald)',
                        cursor: 'pointer',
                      }}
                    >
                      {t('dash_read_more', 'Read more →')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              [
                {
                  img: ARTICLE_FALLBACK_IMGS[0],
                  tag: 'Travel',
                  title: 'Top 5 Hidden Gems in Hội An',
                  excerpt:
                    'Discover breathtaking spots that most tourists overlook in the ancient town.',
                  author: 'VietMoney',
                },
                {
                  img: ARTICLE_FALLBACK_IMGS[1],
                  tag: 'Finance',
                  title: 'USD/VND Rate Update This Week',
                  excerpt:
                    'The State Bank adjusted the margin, affecting tourist spending power.',
                  author: 'Finance',
                },
                {
                  img: ARTICLE_FALLBACK_IMGS[2],
                  tag: 'Culture',
                  title: 'Hội An Lantern Festival — A Must-See',
                  excerpt:
                    'The monthly lantern festival attracts thousands of international visitors.',
                  author: 'Culture',
                },
                {
                  img: ARTICLE_FALLBACK_IMGS[3],
                  tag: 'Food',
                  title: 'Hội An Food Map: What & Where to Eat',
                  excerpt:
                    'From Cao Lầu to Bánh Mì Phượng — the ultimate foodie guide.',
                  author: 'Food',
                },
              ].map((post, i) => (
                <div
                  className="lp-masonry-card"
                  key={post.title}
                  onClick={() => navigate('/news')}
                >
                  <img
                    src={post.img}
                    alt={post.title}
                    className="lp-masonry-img"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    style={{ borderRadius: '20px 20px 0 0' }}
                  />

                  <div className="lp-masonry-body">
                    <span className="lp-masonry-tag">{post.tag}</span>

                    <h4 className="lp-masonry-title">{post.title}</h4>

                    <p className="lp-masonry-excerpt">{post.excerpt}</p>
                  </div>

                  <div className="lp-masonry-footer">
                    <span>{post.author}</span>

                    <span
                      style={{
                        color: 'var(--lp-emerald)',
                        cursor: 'pointer',
                      }}
                    >
                      {t('dash_read_more', 'Read more →')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="lp-tips-sidebar">
            <h3 className="lp-tips-sidebar-title">💡 {t('dash_wiki_essentials', 'Wiki Essentials')}</h3>

            {getTips(t).map((tip) => (
              <div className="lp-glass lp-tip-card" key={tip.title}>
                <div className="lp-tip-card-icon">{tip.icon}</div>

                <h4 className="lp-tip-card-title">{tip.title}</h4>

                <p className="lp-tip-card-desc">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="about" className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <h3>
                Viet<span>Money</span>
              </h3>

              <p>
                {t('dash_footer_brand_desc', 'The smart financial companion for tourists in Vietnam. Scan, track, convert, and travel with confidence.')}
              </p>
            </div>

            <div>
              <h4 className="lp-footer-col-title">{t('dash_footer_features', 'Features')}</h4>

              <ul className="lp-footer-links">
                <li>
                  <a href="/scan">{t('dash_footer_ai_scanner', 'AI Money Scanner')}</a>
                </li>
                <li>
                  <a href="/budget">{t('nav_budget', 'Budget Tracker')}</a>
                </li>
                <li>
                  <a href="/exchange">{t('dash_footer_exchange', 'Exchange Rates')}</a>
                </li>
                <li>
                  <a href="/wiki">{t('dash_footer_price_wiki', 'Price Wiki')}</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="lp-footer-col-title">{t('dash_footer_explore', 'Explore')}</h4>

              <ul className="lp-footer-links">
                <li>
                  <a href="/atm-map">{t('dash_atm_finder', 'ATM Finder')}</a>
                </li>
                <li>
                  <a href="/plans">{t('dash_travel_planner', 'Travel Planner')}</a>
                </li>
                <li>
                  <a href="/spots">{t('dash_tourist_spots', 'Tourist Spots')}</a>
                </li>
                <li>
                  <a href="/news">{t('dash_travel_news', 'Travel News')}</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="lp-footer-col-title">{t('dash_footer_company', 'Company')}</h4>

              <ul className="lp-footer-links">
                <li>
                  <a href="#">{t('dash_footer_about', 'About Us')}</a>
                </li>
                <li>
                  <a href="#">{t('dash_footer_privacy', 'Privacy Policy')}</a>
                </li>
                <li>
                  <a href="#">{t('dash_footer_terms', 'Terms of Service')}</a>
                </li>
                <li>
                  <a href="#">{t('dash_footer_contact', 'Contact')}</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="lp-footer-bottom">
            <span>{t('dash_footer_copyright', '© 2026 VietMoney. All rights reserved.')}</span>

            <div className="lp-footer-social">
              <a href="#" title="Twitter">
                𝕏
              </a>
              <a href="#" title="Facebook">
                f
              </a>
              <a href="#" title="Instagram">
                📷
              </a>
              <a href="#" title="GitHub">
                ⌨
              </a>
            </div>
          </div>
        </div>
      </footer>

      <div style={{ height: 24 }} />
    </div>
  );
}