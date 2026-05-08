import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../../components/layout/Navbar';
import wikiApi from '../../api/wikiApi';

// ── Constants ──────────────────────────────────────────────────────────────────
const CURRENCY_SYMBOLS = {
  VND: '₫', USD: '$', EUR: '€', KRW: '₩', JPY: '¥',
  GBP: '£', AUD: 'A$', THB: '฿',
};

const CAT_FALLBACK_STYLES = {
  Food:          { color: '#F2C43D', bg: 'rgba(242,196,61,0.10)',  border: 'rgba(242,196,61,0.25)',  icon: '🍜' },
  Transport:     { color: '#3D8FF2', bg: 'rgba(61,143,242,0.10)',  border: 'rgba(61,143,242,0.25)',  icon: '🚗' },
  Hotel:         { color: '#C8F23D', bg: 'rgba(200,242,61,0.10)',  border: 'rgba(200,242,61,0.25)',  icon: '🏨' },
  Shopping:      { color: '#F23DC8', bg: 'rgba(242,61,200,0.10)',  border: 'rgba(242,61,200,0.25)',  icon: '🛍️' },
  Entertainment: { color: '#3DF2C8', bg: 'rgba(61,242,200,0.10)', border: 'rgba(61,242,200,0.25)', icon: '🎭' },
  Other:         { color: '#888',    bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)', icon: '📦' },
};

function getCatStyle(cat, categories = []) {
  const found = categories.find(c => c.name === cat);
  if (found) {
    return {
      color:  found.color ? found.color.replace(/,[\d.]+\)$/, ',1)') : '#aaa',
      bg:     found.color || 'rgba(255,255,255,0.07)',
      border: found.color ? found.color.replace(/,[\d.]+\)$/, ',0.30)') : 'rgba(255,255,255,0.12)',
      icon:   found.icon || '📦',
    };
  }
  return CAT_FALLBACK_STYLES[cat] || CAT_FALLBACK_STYLES.Other;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmt(n, currency = 'VND', sym = '') {
  if (n === null || n === undefined || n === '') return '—';
  const num = Number(n);
  if (isNaN(num)) return '—';
  const s = sym || CURRENCY_SYMBOLS[currency] || currency;
  if (currency === 'VND') {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M' + s;
    if (num >= 1_000)     return Math.round(num / 1_000) + 'k' + s;
    return num + s;
  }
  return s + num.toFixed(2);
}

// ── Skeleton ───────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
      borderTop: '1px solid var(--border)',
      animation: 'pw-pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'var(--bg3)', flexShrink: 0 }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ height: 12, width: '42%', borderRadius: 5, background: 'var(--bg3)' }} />
        <div style={{ height: 10, width: '22%', borderRadius: 5, background: 'var(--bg3)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <div style={{ height: 12, width: 88, borderRadius: 5, background: 'var(--bg3)' }} />
        <div style={{ height: 10, width: 56, borderRadius: 5, background: 'var(--bg3)' }} />
      </div>
    </div>
  );
}

// ── Affordable Badge ───────────────────────────────────────────────────────────
function AffordBadge({ canAfford }) {
  return canAfford ? (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
      background: 'rgba(61,242,100,0.10)', color: '#3DF264',
      border: '1px solid rgba(61,242,100,0.22)',
    }}>✓ Affordable</span>
  ) : (
    <span style={{
      fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
      background: 'rgba(242,61,110,0.08)', color: '#F23D6E',
      border: '1px solid rgba(242,61,110,0.20)',
    }}>Over budget</span>
  );
}

// ── Budget Meter ───────────────────────────────────────────────────────────────
function BudgetMeter({ budgetVND, data }) {
  if (!data.length || !budgetVND) return null;
  const mids = data.map(i => (Number(i.minPrice) + Number(i.maxPrice)) / 2).filter(Boolean);
  if (!mids.length) return null;
  const avg = mids.reduce((a, b) => a + b, 0) / mids.length;
  const pct = Math.min(100, Math.round((budgetVND / avg) * 10));
  const color = pct >= 80 ? '#3DF264' : pct >= 40 ? '#F2C43D' : '#F23D6E';

  return (
    <div style={{
      background: 'var(--bg2)', border: '1px solid var(--border)',
      borderRadius: 14, padding: '14px 16px', marginBottom: 16,
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div style={{ fontSize: 20 }}>💰</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Purchasing power
        </div>
        <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${pct}%`,
            background: color,
            borderRadius: 99, transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
          }} />
        </div>
      </div>
      <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>
        {pct}%
      </div>
    </div>
  );
}

// ── Stats Bar ──────────────────────────────────────────────────────────────────
function StatsBar({ data, currency, sym }) {
  if (!data.length) return null;
  const allPrices = data.flatMap(i => [Number(i.minPrice), Number(i.maxPrice)]).filter(Boolean);
  const avg = allPrices.length ? Math.round(allPrices.reduce((a, b) => a + b, 0) / allPrices.length) : 0;
  const min = allPrices.length ? Math.min(...allPrices) : 0;
  const max = allPrices.length ? Math.max(...allPrices) : 0;

  const stats = [
    { icon: '📦', label: 'Items',   val: data.length,              color: 'var(--accent)' },
    { icon: '📊', label: 'Average', val: fmt(avg, currency, sym),  color: '#3D8FF2' },
    { icon: '⬇️', label: 'Lowest',  val: fmt(min, currency, sym),  color: '#3DF264' },
    { icon: '⬆️', label: 'Highest', val: fmt(max, currency, sym),  color: '#F2C43D' },
  ];

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      gap: 8, marginBottom: 16,
    }}>
      {stats.map(s => (
        <div key={s.label} style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '11px 12px',
        }}>
          <div style={{ fontSize: 16, marginBottom: 3 }}>{s.icon}</div>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 13, fontWeight: 700, color: s.color }}>{s.val}</div>
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1, fontWeight: 600 }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Price Row ──────────────────────────────────────────────────────────────────
function PriceRow({ item, idx, budgetVND, currency, sym, categories }) {
  const s   = getCatStyle(item.category, categories);
  const mid = (Number(item.minPrice) + Number(item.maxPrice)) / 2;
  const canAfford = budgetVND > 0 ? budgetVND >= mid : null;
  const maxVal = Number(item.maxPrice);
  const barPct = maxVal > 0 && budgetVND > 0 ? Math.min(100, Math.round((budgetVND / maxVal) * 100)) : 0;

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px',
        borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
        opacity: canAfford === false ? 0.42 : 1,
        transition: 'opacity 0.25s, background 0.12s',
        cursor: 'default',
        animation: `pw-fadeUp 0.28s ease both`,
        animationDelay: `${idx * 30}ms`,
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.022)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Icon */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: s.bg, border: `1px solid ${s.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17,
      }}>
        {s.icon}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.item}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          {item.unit && (
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>per {item.unit}</span>
          )}
          {item.note && (
            <span style={{ fontSize: 11, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
              · {item.note}
            </span>
          )}
        </div>
        {budgetVND > 0 && (
          <div style={{
            height: 2, borderRadius: 99, marginTop: 5, width: `${barPct}%`,
            background: s.color, opacity: 0.55,
            transition: 'width 0.5s ease',
          }} />
        )}
      </div>

      {/* Price + badge */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 12.5, fontWeight: 700, color: s.color }}>
          {fmt(item.minPrice, currency, sym)} – {fmt(item.maxPrice, currency, sym)}
        </div>
        {canAfford !== null && (
          <div style={{ marginTop: 4 }}>
            <AffordBadge canAfford={canAfford} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dropdown ───────────────────────────────────────────────────────────────────
function Dropdown({ triggerLabel, triggerIcon, open, onToggle, children, dropRef, disabled }) {
  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <button
        className="pw-selector-btn"
        onClick={onToggle}
        disabled={disabled}
        style={{ opacity: disabled ? 0.5 : 1 }}
      >
        <span>{triggerIcon}</span>
        <span>{triggerLabel}</span>
        <span style={{ fontSize: 8, color: 'var(--muted)', marginLeft: 2 }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="pw-dropdown">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function PriceWikiPage() {
  // Data
  const [countries,   setCountries]   = useState([]);
  const [cities,      setCities]      = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [currencies,  setCurrencies]  = useState([]);
  const [prices,      setPrices]      = useState([]);

  // Selections
  const [selectedCountryId, setSelectedCountryId] = useState('');
  const [selectedCity,      setSelectedCity]      = useState('');
  const [selectedCurrency,  setSelectedCurrency]  = useState('VND');
  const [activeCat,         setActiveCat]         = useState('All');
  const [search,            setSearch]            = useState('');
  const [amount,            setAmount]            = useState('500000');

  // Loading / error
  const [loadingMeta,   setLoadingMeta]   = useState(true);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [error,         setError]         = useState(null);

  // Dropdowns
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen,    setCityOpen]    = useState(false);
  const countryRef = useRef(null);
  const cityRef    = useRef(null);
  const loadRef    = useRef(0);

  // Close dropdowns on outside click
  useEffect(() => {
    const fn = e => {
      if (countryRef.current && !countryRef.current.contains(e.target)) setCountryOpen(false);
      if (cityRef.current    && !cityRef.current.contains(e.target))    setCityOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  // Load meta
  useEffect(() => {
    (async () => {
      setLoadingMeta(true);
      try {
        const [rCountries, rCategories, rCurrencies] = await Promise.all([
          fetch('/api/v1/wiki/countries').then(r => r.json()),
          fetch('/api/v1/wiki/categories').then(r => r.json()).catch(() => ({ data: [] })),
          fetch('/api/v1/wiki/currencies').then(r => r.json()),
        ]);
        setCountries(rCountries?.data ?? []);
        setCategories(rCategories?.data ?? []);
        setCurrencies(rCurrencies?.data ?? []);
      } catch {
        setCountries([]);
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  // Load cities on country change
  useEffect(() => {
    if (!selectedCountryId) { setCities([]); setSelectedCity(''); return; }
    setLoadingCities(true);
    fetch(`/api/v1/wiki/cities?countryId=${selectedCountryId}`)
      .then(r => r.json())
      .then(r => setCities(r?.data ?? []))
      .catch(() => setCities([]))
      .finally(() => setLoadingCities(false));
    setSelectedCity('');
    setActiveCat('All');
    setPrices([]);
  }, [selectedCountryId]);

  // Derived currency info
  const selectedCountry    = countries.find(c => String(c.id) === String(selectedCountryId));
  const countryCurrencyCode = selectedCountry?.currencyCode ?? 'VND';
  const currencyCode       = selectedCurrency || countryCurrencyCode;
  const currencyObj        = currencies.find(c => c.code === currencyCode);
  const sym                = currencyObj?.symbol ?? CURRENCY_SYMBOLS[currencyCode] ?? currencyCode;
  const rateToVnd          = currencyObj?.rateToVnd ?? 1;
  const budgetVND          = (parseFloat(amount) || 0) * rateToVnd;

  // Auto-set currency to country default
  useEffect(() => {
    if (selectedCountry?.currencyCode) setSelectedCurrency(selectedCountry.currencyCode);
  }, [selectedCountry]);

  // Load prices
  const loadPrices = useCallback(async () => {
    if (!selectedCity && !selectedCountryId) { setPrices([]); return; }
    const token = ++loadRef.current;
    setLoadingPrices(true);
    setError(null);
    try {
      if (selectedCity) {
        const r = await fetch(`/api/v1/wiki/prices?city=${encodeURIComponent(selectedCity)}&currency=${currencyCode}`).then(r => r.json());
        if (token !== loadRef.current) return;
        setPrices(r?.data ?? []);
      } else {
        const cityList = cities.length > 0 ? cities : await fetch(`/api/v1/wiki/cities?countryId=${selectedCountryId}`).then(r => r.json()).then(r => r?.data ?? []);
        const results = await Promise.all(
          cityList.map(c =>
            fetch(`/api/v1/wiki/prices?city=${encodeURIComponent(c.name)}&currency=${currencyCode}`)
              .then(r => r.json()).then(r => r?.data ?? []).catch(() => [])
          )
        );
        if (token !== loadRef.current) return;
        setPrices(results.flat());
      }
    } catch {
      if (token !== loadRef.current) return;
      setPrices([]);
      setError('Unable to load price data. Please try again.');
    } finally {
      if (token === loadRef.current) setLoadingPrices(false);
    }
  }, [selectedCity, selectedCountryId, currencyCode, cities]);

  useEffect(() => { loadPrices(); }, [loadPrices]);

  // Filter + group
  const uniqueCats = [...new Set(prices.map(p => p.category))];
  const filtered = prices.filter(p => {
    const mc = activeCat === 'All' || p.category === activeCat;
    const ms = !search.trim() || p.item.toLowerCase().includes(search.toLowerCase());
    return mc && ms;
  });
  const grouped = {};
  if (activeCat !== 'All') {
    grouped[activeCat] = filtered;
  } else {
    uniqueCats.forEach(cat => {
      const items = filtered.filter(p => p.category === cat);
      if (items.length) grouped[cat] = items;
    });
  }
  const catCounts = {};
  uniqueCats.forEach(cat => { catCounts[cat] = prices.filter(p => p.category === cat).length; });

  const availableCurrencies = currencies.length > 0
    ? currencies.slice(0, 7)
    : Object.keys(CURRENCY_SYMBOLS).slice(0, 6).map(code => ({ code }));

  return (
    <>
      <style>{`
        @keyframes pw-pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.38; }
        }
        @keyframes pw-fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pw-slideIn {
          from { opacity: 0; transform: translateY(6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .pw-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 14px;
          overflow: hidden;
          z-index: 200;
          min-width: 200px;
          max-height: 260px;
          overflow-y: auto;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          animation: pw-slideIn 0.15s ease both;
          scrollbar-width: thin;
        }
        .pw-dropdown-item {
          padding: 10px 14px;
          font-size: 13px;
          cursor: pointer;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
          color: var(--text);
          font-weight: 500;
          transition: background 0.1s;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pw-dropdown-item:hover { background: var(--bg3); }
        .pw-dropdown-item.active { color: var(--accent); font-weight: 700; }

        .pw-selector-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 13px;
          border-radius: 10px;
          cursor: pointer;
          background: var(--bg3);
          border: 1px solid var(--border);
          color: var(--text);
          font-size: 13px;
          font-weight: 600;
          transition: border-color 0.15s, background 0.15s;
          white-space: nowrap;
        }
        .pw-selector-btn:hover:not(:disabled) { border-color: var(--accent); }

        .pw-cat-chip {
          padding: 6px 13px;
          font-size: 11.5px;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.15s;
          border: 1px solid var(--border);
          background: var(--bg3);
          color: var(--muted);
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .pw-search {
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          padding: 9px 13px 9px 36px;
          font-size: 13px;
          outline: none;
          flex: 1;
          min-width: 0;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .pw-search:focus { border-color: var(--accent); }

        .pw-amount-wrap {
          position: relative;
        }
        .pw-amount-sym {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'DM Mono', monospace;
          font-size: 14px;
          font-weight: 700;
          color: var(--accent);
          pointer-events: none;
        }
        .pw-amount-input {
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text);
          padding: 9px 13px 9px 30px;
          font-size: 14px;
          font-family: 'DM Mono', monospace;
          font-weight: 600;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .pw-amount-input:focus { border-color: var(--accent); }
        .pw-amount-input::placeholder { opacity: 0.35; }

        .pw-cur-pill {
          padding: 5px 11px;
          font-size: 11px;
          border-radius: 20px;
          cursor: pointer;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          font-family: 'DM Mono', monospace;
          font-weight: 700;
          transition: all 0.15s;
          flex-shrink: 0;
          letter-spacing: 0.02em;
        }
        .pw-cur-pill:hover { border-color: var(--accent); color: var(--accent); }
        .pw-cur-pill.active {
          background: rgba(200,242,61,0.10);
          color: var(--accent);
          border-color: rgba(200,242,61,0.28);
        }

        .pw-city-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          background: rgba(61,143,242,0.08);
          color: #3D8FF2;
          border: 1px solid rgba(61,143,242,0.22);
          transition: background 0.12s;
        }
        .pw-city-tag:hover { background: rgba(61,143,242,0.16); }

        .pw-empty {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 52px 24px;
          text-align: center;
        }

        .pw-ctrl-label {
          font-size: 10px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.09em;
          font-weight: 700;
          display: block;
          margin-bottom: 6px;
        }
      `}</style>

      <div className="page active" style={{ paddingBottom: 52 }}>
        <Navbar title="VietMoney" subtitle="Price Wiki" />

        <div style={{ padding: '0 16px', width: '100%' }}>

          {/* ── Header ── */}
          <div style={{ paddingTop: 22, marginBottom: 20 }}>
            <h1 style={{
              fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 800,
              margin: 0, letterSpacing: -0.5, display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{
                width: 32, height: 32, borderRadius: 9,
                background: 'rgba(200,242,61,0.12)', border: '1px solid rgba(200,242,61,0.22)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>💰</span>
              Price Wiki
            </h1>
            <p style={{ color: 'var(--muted)', fontSize: 12.5, margin: '5px 0 0' }}>
              Reference prices by region — updated with your currency
            </p>
          </div>

          {/* ── Controls Card ── */}
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 18, padding: '16px', marginBottom: 16,
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>

            {/* Row 1: Location selectors */}
            <div>
              <label className="pw-ctrl-label">Location</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Dropdown
                  dropRef={countryRef}
                  triggerIcon="🌍"
                  triggerLabel={selectedCountry?.name ?? 'Select country'}
                  open={countryOpen}
                  onToggle={() => { setCountryOpen(v => !v); setCityOpen(false); }}
                >
                  {loadingMeta ? (
                    <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--muted)' }}>Loading…</div>
                  ) : countries.map(c => (
                    <button key={c.id}
                      className={`pw-dropdown-item ${String(c.id) === String(selectedCountryId) ? 'active' : ''}`}
                      onClick={() => { setSelectedCountryId(String(c.id)); setCountryOpen(false); }}>
                      {String(c.id) === String(selectedCountryId) && <span style={{ fontSize: 10 }}>✓</span>}
                      {c.name}
                      <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>
                        {c.currencyCode}
                      </span>
                    </button>
                  ))}
                </Dropdown>

                {selectedCountryId && (
                  <Dropdown
                    dropRef={cityRef}
                    triggerIcon="📍"
                    triggerLabel={selectedCity || (loadingCities ? 'Loading…' : 'All areas')}
                    open={cityOpen}
                    onToggle={() => { setCityOpen(v => !v); setCountryOpen(false); }}
                    disabled={loadingCities}
                  >
                    <button
                      className={`pw-dropdown-item ${!selectedCity ? 'active' : ''}`}
                      onClick={() => { setSelectedCity(''); setCityOpen(false); setActiveCat('All'); }}>
                      {!selectedCity && <span style={{ fontSize: 10 }}>✓</span>}
                      All areas
                    </button>
                    {cities.map(c => (
                      <button key={c.id}
                        className={`pw-dropdown-item ${c.name === selectedCity ? 'active' : ''}`}
                        onClick={() => { setSelectedCity(c.name); setCityOpen(false); setActiveCat('All'); }}>
                        {c.name === selectedCity && <span style={{ fontSize: 10 }}>✓</span>}
                        {c.name}
                        {c.isPopular && <span style={{ marginLeft: 'auto', fontSize: 10 }}>⭐</span>}
                      </button>
                    ))}
                  </Dropdown>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border)', margin: '0 -2px' }} />

            {/* Row 2: Currency selector */}
            <div>
              <label className="pw-ctrl-label">Currency</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {availableCurrencies.map(c => (
                  <button key={c.code} className={`pw-cur-pill ${selectedCurrency === c.code ? 'active' : ''}`}
                    onClick={() => setSelectedCurrency(c.code)}>
                    {c.code}
                  </button>
                ))}
                {selectedCountryId && currencyObj?.rateToVnd && currencyCode !== 'VND' && (
                  <span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>
                    1 {currencyCode} ≈ {Number(currencyObj.rateToVnd).toLocaleString('vi-VN')}₫
                  </span>
                )}
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border)', margin: '0 -2px' }} />

            {/* Row 3: Budget input */}
            <div>
              <label className="pw-ctrl-label">My budget ({currencyCode})</label>
              <div className="pw-amount-wrap">
                <span className="pw-amount-sym">{sym}</span>
                <input
                  className="pw-amount-input"
                  type="number"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="500000"
                />
              </div>
              {currencyCode !== 'VND' && budgetVND > 0 && (
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
                  ≈ {budgetVND.toLocaleString('vi-VN')}₫
                </div>
              )}
            </div>
          </div>

          {/* ── Category chips ── */}
          {selectedCountryId && !loadingPrices && uniqueCats.length > 0 && (
            <div style={{
              display: 'flex', gap: 7, overflowX: 'auto',
              paddingBottom: 4, marginBottom: 14, scrollbarWidth: 'none',
            }}>
              {['All', ...uniqueCats].map(cat => {
                const s     = cat === 'All' ? null : getCatStyle(cat, categories);
                const isAct = activeCat === cat;
                return (
                  <button key={cat} className="pw-cat-chip"
                    style={isAct ? {
                      background: cat === 'All' ? 'var(--accent)' : s.bg,
                      color:      cat === 'All' ? '#000' : s.color,
                      borderColor: cat === 'All' ? 'var(--accent)' : s.border,
                    } : {}}
                    onClick={() => setActiveCat(cat)}>
                    {cat === 'All' ? '🗂️' : s.icon}
                    {cat === 'All' ? 'All' : cat}
                    <span style={{
                      fontSize: 10, padding: '1px 5px', borderRadius: 99,
                      background: isAct && cat !== 'All' ? s.bg : 'var(--bg3)',
                      color: isAct && cat !== 'All' ? s.color : 'var(--muted)',
                      fontWeight: 700,
                    }}>
                      {cat === 'All' ? prices.length : (catCounts[cat] ?? 0)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* ── Search ── */}
          {selectedCountryId && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 13, opacity: 0.4, pointerEvents: 'none' }}>🔍</span>
                <input
                  className="pw-search"
                  placeholder="Search items or services…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch('')} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 13, opacity: 0.4, lineHeight: 1, padding: 0,
                  }}>✕</button>
                )}
              </div>
              {!loadingPrices && (
                <span style={{ fontSize: 11.5, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                  {filtered.length} results
                </span>
              )}
            </div>
          )}

          {/* ── Budget Meter ── */}
          {!loadingPrices && <BudgetMeter budgetVND={budgetVND} data={filtered} />}

          {/* ── Stats ── */}
          {!loadingPrices && filtered.length > 0 && (
            <StatsBar data={filtered} currency={currencyCode} sym={sym} />
          )}

          {/* ── Content ── */}
          {!selectedCountryId ? (
            <div className="pw-empty">
              <div style={{ fontSize: 40, marginBottom: 12 }}>🌍</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                Select a country to start
              </div>
              <p style={{ color: 'var(--muted)', fontSize: 13, maxWidth: 300, margin: '0 auto', lineHeight: 1.6 }}>
                Choose a country to see reference prices by region and in your currency.
              </p>
            </div>

          ) : error ? (
            <div className="pw-empty">
              <div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>
              <div style={{ color: '#F23D6E', fontSize: 13.5, marginBottom: 14 }}>{error}</div>
              <button onClick={loadPrices} style={{
                padding: '9px 22px', borderRadius: 10, cursor: 'pointer',
                background: 'var(--accent)', color: '#000', border: 'none',
                fontWeight: 700, fontSize: 13,
              }}>Try again</button>
            </div>

          ) : loadingPrices ? (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{
                background: 'var(--bg3)', padding: '9px 16px',
                display: 'grid', gridTemplateColumns: '1fr auto',
                fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase',
                letterSpacing: '0.08em', fontWeight: 700,
              }}>
                <span>Item</span>
                <span style={{ textAlign: 'right' }}>Price range</span>
              </div>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>

          ) : filtered.length === 0 ? (
            <div className="pw-empty" style={{ padding: '48px 24px' }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📭</div>
              <div style={{ color: 'var(--muted)', fontSize: 13.5 }}>
                {search ? `No results for "${search}"` : 'No data for the current filter.'}
              </div>
              {search && (
                <button onClick={() => setSearch('')} style={{
                  marginTop: 12, fontSize: 12, color: 'var(--accent)',
                  background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700,
                }}>Clear search</button>
              )}
            </div>

          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {Object.entries(grouped).map(([cat, items]) => {
                const s = getCatStyle(cat, categories);
                return (
                  <div key={cat}>
                    {/* Category header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 7,
                        background: s.bg, border: `1px solid ${s.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                      }}>
                        {s.icon}
                      </div>
                      <span style={{
                        fontFamily: 'Syne, sans-serif', fontWeight: 700,
                        fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.08em',
                      }}>{cat}</span>
                      <span style={{
                        fontSize: 10.5, padding: '2px 7px', borderRadius: 20,
                        background: s.bg, fontWeight: 700, color: s.color,
                      }}>{items.length}</span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>

                    {/* Items */}
                    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden' }}>
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr auto',
                        padding: '8px 16px', background: 'var(--bg3)',
                        fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase',
                        letterSpacing: '0.08em', fontWeight: 700,
                      }}>
                        <span>Item</span>
                        <span style={{ textAlign: 'right' }}>Range ({sym})</span>
                      </div>
                      {items.map((item, idx) => (
                        <PriceRow
                          key={item.id} item={item} idx={idx}
                          budgetVND={budgetVND} currency={currencyCode} sym={sym}
                          categories={categories}
                        />
                      ))}
                    </div>

                    {/* City tags */}
                    {!selectedCity && items.length > 0 && [...new Set(items.map(i => i.city).filter(Boolean))].length > 1 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
                        {[...new Set(items.map(i => i.city).filter(Boolean))].map(city => (
                          <button key={city} className="pw-city-tag"
                            onClick={() => { setSelectedCity(city); setActiveCat(cat); }}>
                            📍 {city}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          {!loadingPrices && filtered.length > 0 && (
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)', marginTop: 24, lineHeight: 1.65, opacity: 0.7 }}>
              💡 Prices are for reference only and may vary by time and location.<br />
              Data is aggregated from multiple sources and updated regularly.
            </p>
          )}

          <div style={{ height: 28 }} />
        </div>
      </div>
    </>
  );
}