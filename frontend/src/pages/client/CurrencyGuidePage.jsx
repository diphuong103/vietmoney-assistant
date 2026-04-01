import { useState } from 'react';
import Navbar from '../../components/layout/Navbar';

const CARDS = [
  {
    denom: '500k', label: '₫500,000',
    security: '🔒 Polymer note\nHolographic strip\nSee-through window',
  },
  {
    denom: '200k', label: '₫200,000',
    security: '🔒 Watermark portrait\nColor-shift ink\nRaised print feel',
  },
  {
    denom: '100k', label: '₫100,000',
    security: '🔒 Security thread\nUV fluorescent ink\nMicroprinting',
  },
  {
    denom: '50k', label: '₫50,000',
    security: '🔒 Printed security thread\nSerial number\nClear window pattern',
  },
  {
    denom: '20k', label: '₫20,000',
    security: '⚠️ Same blue-green color as 500k — CAREFUL!',
  },
];

const CONFUSIONS = [
  {
    icon: '⚠️',
    title: '₫20,000 vs ₫500,000',
    text: 'Both notes share a similar blue-green color tone. Key differences: 500k is larger in size, has a holographic strip on the right side, and a clear polymer window. Always check the number before paying!',
  },
  {
    icon: '💡',
    title: 'Quick Tip: Check the Size',
    text: "Higher denomination notes are slightly larger. If in doubt, look for the printed number in large bold font on the top-right corner of each note.",
  },
];

const DENOMS = [
  { icon: '🟣', name: '₫500,000', detail: 'Polymer · Blue-green · Large',        usd: '$19.67', color: 'var(--blue)' },
  { icon: '🔵', name: '₫200,000', detail: 'Polymer · Orange-brown',              usd: '$7.87',  color: 'var(--gold)' },
  { icon: '🟡', name: '₫100,000', detail: 'Polymer · Purple',                    usd: '$3.93',  color: 'var(--accent)' },
  { icon: '🟢', name: '₫50,000',  detail: 'Polymer · Red-pink',                  usd: '$1.97',  color: 'var(--accent3)' },
  { icon: '⚠️', name: '₫20,000 ← CAREFUL', detail: 'Cotton · Blue-green · SMALLER than 500k', usd: '$0.79', color: 'var(--muted)', warn: true },
];

export default function CurrencyGuidePage() {
  const [flipped, setFlipped] = useState({});
  const toggle = (i) => setFlipped(f => ({ ...f, [i]: !f[i] }));

  return (
    <div className="page active" id="page-guide">
      <Navbar
        title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>}
        subtitle="Guide"
      />
      <div style={{ height: 8 }} />

      <div className="guide-section">
        {/* Flip Cards */}
        <div className="section-title">Tap to Flip — Security Features</div>
        <div className="currency-cards-row">
          {CARDS.map((card, i) => (
            <div
              key={i}
              className={`currency-card-flip${flipped[i] ? ' flipped' : ''}`}
              onClick={() => toggle(i)}
            >
              <div className="card-inner">
                <div className="card-face">
                  <div className="card-denomination">{card.denom}</div>
                  <div className="card-name">{card.label}</div>
                  <div className="card-flip-hint">Tap to flip →</div>
                </div>
                <div className="card-back">
                  <div className="card-security-item"
                    style={{ whiteSpace: 'pre-line', textAlign: 'center', fontSize: 10, color: 'var(--accent2)', lineHeight: 1.4 }}>
                    {card.security}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Confusion Cards */}
        <div className="section-title">⚠️ Easy to Confuse</div>
        {CONFUSIONS.map((c, i) => (
          <div className="confusion-card" key={i}>
            <div className="confusion-icon">{c.icon}</div>
            <div>
              <div className="confusion-title">{c.title}</div>
              <div className="confusion-text">{c.text}</div>
            </div>
          </div>
        ))}

        {/* Denomination Quick Reference */}
        <div className="section-title" style={{ marginTop: 20 }}>Denomination Quick Reference</div>
        <div style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {DENOMS.map((d, i) => (
            <div
              className="wiki-item"
              key={i}
              style={d.warn ? { borderColor: 'rgba(242,196,61,0.3)' } : {}}
            >
              <div className="wiki-item-icon">{d.icon}</div>
              <div className="wiki-item-detail">
                <div className="wiki-item-name" style={d.warn ? { color: 'var(--gold)' } : {}}>{d.name}</div>
                <div className="wiki-item-range">{d.detail}</div>
              </div>
              <div>
                <div className="wiki-item-price" style={{ color: d.color }}>{d.usd}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
