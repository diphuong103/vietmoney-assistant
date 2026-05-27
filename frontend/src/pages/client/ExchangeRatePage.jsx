import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';

const RATES = {
  VND: 1,
  USD: 25420,
  EUR: 27810,
  KRW: 18.9,
  JPY: 165.4,
  GBP: 32150,
  CNY: 3497,
};

const CURRENCIES = ['VND', 'USD', 'EUR', 'KRW', 'JPY', 'GBP', 'CNY'];

import { useTranslation } from 'react-i18next';

export default function ExchangeRatePage() {
  const { t } = useTranslation();

  const RATE_CARDS = [
    { flag: '🇺🇸', pair: 'VND / USD', name: t('currency_usd', 'Đô la Mỹ'), rate: '25,420', change: '+0.12%', up: true },
    { flag: '🇰🇷', pair: 'VND / KRW', name: t('currency_krw', 'Won Hàn Quốc'), rate: '18.79', change: '−0.05%', up: false },
    { flag: '🇪🇺', pair: 'VND / EUR', name: t('currency_eur', 'Euro'), rate: '27,810', change: '+0.23%', up: true },
    { flag: '🇯🇵', pair: 'VND / JPY', name: t('currency_jpy', 'Yên Nhật'), rate: '165.4', change: '+0.08%', up: true },
    { flag: '🇬🇧', pair: 'VND / GBP', name: t('currency_gbp', 'Bảng Anh'), rate: '32,150', change: '−0.14%', up: false },
    { flag: '🇨🇳', pair: 'VND / CNY', name: t('currency_cny', 'Nhân dân tệ'), rate: '3,497', change: '+0.03%', up: true },
  ];

  const [fromAmt, setFromAmt] = useState('1000000');
  const [fromCur, setFromCur] = useState('VND');
  const [toCur, setToCur] = useState('USD');

  const convert = (amount, from, to) => {
    const vnd = parseFloat(amount) * RATES[from];
    const result = vnd / RATES[to];
    return isNaN(result) ? '0' : result.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const swap = () => {
    setFromCur(toCur);
    setToCur(fromCur);
  };

  return (
    <div className="page active" id="page-exchange">
      <Navbar
        title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>}
        subtitle={t('exchange_subtitle', 'Tỷ giá')}
        actions={<button className="icon-btn" title={t('refresh', 'Làm mới')}>🔄</button>}
      />
      <div style={{ height: 8 }} />

      <div className="exchange-hero">
        {/* Converter */}
        <div className="converter-card">
          <div className="converter-title">{t('quick_converter', '⚡ Chuyển đổi nhanh')}</div>

          <div className="converter-row">
            <input
              type="number"
              className="converter-input"
              value={fromAmt}
              onChange={e => setFromAmt(e.target.value)}
            />
            <select className="converter-select" value={fromCur} onChange={e => setFromCur(e.target.value)}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button className="swap-btn" onClick={swap}>⇅</button>

          <div className="converter-row">
            <input
              type="text"
              className="converter-input"
              value={convert(fromAmt, fromCur, toCur)}
              readOnly
              style={{ opacity: 0.8 }}
            />
            <select className="converter-select" value={toCur} onChange={e => setToCur(e.target.value)}>
              {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Rate Cards */}
        {RATE_CARDS.map((r, i) => (
          <div className="rate-card" key={i}>
            <div className="rate-flag">{r.flag}</div>
            <div className="rate-info">
              <div className="rate-pair">{r.pair}</div>
              <div className="rate-name">{r.name}</div>
            </div>
            <div className="rate-val">
              <div className="rate">{r.rate}</div>
              <div className={`change ${r.up ? 'up' : 'down'}`}>{r.change}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ height: 16 }} />
    </div>
  );
}
