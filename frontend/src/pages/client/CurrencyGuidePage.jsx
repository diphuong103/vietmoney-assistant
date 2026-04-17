import { useState, useRef, useEffect, useCallback } from 'react';
import Navbar from '../../components/layout/Navbar';

import img500kFront from '../../assets/images/500k_1.png';
import img500kBack from '../../assets/images/500k_2.png';
import img200kFront from '../../assets/images/200k_1.jpg';
import img200kBack from '../../assets/images/200k_2.jpg';
import img100kFront from '../../assets/images/100k_1.jpg';
import img100kBack from '../../assets/images/100k_2.jpg';
import img50kFront from '../../assets/images/50k_1.jpg';
import img50kBack from '../../assets/images/50k_2.jpg';
import img20kFront from '../../assets/images/20k_1.jpg';
import img20kBack from '../../assets/images/20k_2.jpg';
import img10kFront from '../../assets/images/10k_1.jpg';
import img10kBack from '../../assets/images/10k-2.jpg';
import img5kFront from '../../assets/images/5k_1.jpg';
import img5kBack from '../../assets/images/5k_2.jpg';
import img2kFront from '../../assets/images/2k_1.png';
import img2kBack from '../../assets/images/2k_2.jpg';
import img1kFront from '../../assets/images/1k_1.jpg';
import img1kBack from '../../assets/images/1k_2.jpg';

// ─── Data ────────────────────────────────────────────────────────────────────

const CARDS = [
  {
    denom: '500k',
    label: '₫500,000',
    frontImg: img500kFront,
    backImg: img500kBack,
    security: ['Polymer note', 'Holographic strip', 'See-through window'],
    color: '#2a6dd9',
  },
  {
    denom: '200k',
    label: '₫200,000',
    frontImg: img200kFront,
    backImg: img200kBack,
    security: ['Watermark portrait', 'Color-shift ink', 'Raised print feel'],
    color: '#c87533',
  },
  {
    denom: '100k',
    label: '₫100,000',
    frontImg: img100kFront,
    backImg: img100kBack,
    security: ['Security thread', 'UV fluorescent ink', 'Microprinting'],
    color: '#7c5cbf',
  },
  {
    denom: '50k',
    label: '₫50,000',
    frontImg: img50kFront,
    backImg: img50kBack,
    security: ['Printed security thread', 'Serial number', 'Clear window pattern'],
    color: '#c0392b',
  },
  {
    denom: '20k',
    label: '₫20,000',
    frontImg: img20kFront,
    backImg: img20kBack,
    security: ['⚠️ Similar blue-green as 500k', 'SMALLER size', 'Check carefully!'],
    color: '#e2a61d',
    warn: true,
  },
  {
    denom: '10k',
    label: '₫10,000',
    frontImg: img10kFront,
    backImg: img10kBack, 
    security: ['Cotton paper', 'Watermark', 'Red-brown color'],
    color: '#8b6914',
  },
  {
    denom: '5k',
    label: '₫5,000',
    frontImg: img5kFront,
    backImg: img5kBack,
    security: ['Cotton paper', 'Gray-blue tone', 'Serial number'],
    color: '#557a55',
  },
  {
    denom: '2k',
    label: '₫2,000',
    frontImg: img2kFront,
    backImg: img2kBack,
    security: ['Cotton paper', 'Green tone', 'Rarely used'],
    color: '#3d8c6c',
  },
  {
    denom: '1k',
    label: '₫1,000',
    frontImg: img1kFront,
    backImg: img1kBack,
    security: ['Cotton paper', 'Gray tone', 'Rare in circulation'],
    color: '#777',
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
    text: 'Higher denomination notes are slightly larger. If in doubt, look for the printed number in large bold font on the top-right corner of each note.',
  },
];

const DENOMS = [
  { icon: '🟣', name: '₫500,000', detail: 'Polymer · Blue-green · Large', usd: '$19.67', warn: false },
  { icon: '🔵', name: '₫200,000', detail: 'Polymer · Orange-brown', usd: '$7.87', warn: false },
  { icon: '🟡', name: '₫100,000', detail: 'Polymer · Purple', usd: '$3.93', warn: false },
  { icon: '🟢', name: '₫50,000', detail: 'Polymer · Red-pink', usd: '$1.97', warn: false },
  { icon: '⚠️', name: '₫20,000 ← CAREFUL', detail: 'Cotton · Blue-green · SMALLER than 500k', usd: '$0.79', warn: true },
  { icon: '🟤', name: '₫10,000', detail: 'Cotton · Red-brown', usd: '$0.39', warn: false },
  { icon: '🟩', name: '₫5,000', detail: 'Cotton · Gray-blue', usd: '$0.20', warn: false },
  { icon: '🔶', name: '₫2,000', detail: 'Cotton · Green', usd: '$0.08', warn: false },
  { icon: '⬜', name: '₫1,000', detail: 'Cotton · Gray', usd: '$0.04', warn: false },
];

// ─── 3D Bill Viewer Component ─────────────────────────────────────────────────

function BillViewer3D({ card }) {
  const billRef = useRef(null);
  const stageRef = useRef(null);
  const rafRef = useRef(null);
  const stateRef = useRef({
    rotY: 0, rotX: 0,
    targetY: 0, targetX: 0,
    dragging: false, lastX: 0, lastY: 0,
    velY: 0, auto: false,
  });

  const lerp = (a, b, t) => a + (b - a) * t;

  const applyTransform = useCallback(() => {
    const s = stateRef.current;
    if (!billRef.current) return;
    billRef.current.style.transform = `rotateX(${s.rotX.toFixed(2)}deg) rotateY(${s.rotY.toFixed(2)}deg)`;
    const norm = ((s.rotY % 360) + 360) % 360;
    const isFront = norm <= 90 || norm >= 270;
    // gleam
    const gx = 50 + Math.sin(s.rotY * Math.PI / 180) * 40;
    const gy = 50 - Math.sin(s.rotX * Math.PI / 180) * 35;
    const faces = billRef.current.querySelectorAll('.bv-gleam');
    faces.forEach((g, i) => {
      const shouldShow = i === 0 ? isFront : !isFront;
      g.style.opacity = shouldShow ? '1' : '0';
      if (shouldShow) {
        g.style.background = `radial-gradient(ellipse at ${gx}% ${gy}%, rgba(255,255,255,0.25) 0%, rgba(200,255,200,0.07) 40%, transparent 70%)`;
      }
    });
  }, []);

  useEffect(() => {
    const tick = () => {
      const s = stateRef.current;
      if (!s.dragging) {
        if (s.auto) {
          s.targetY += 1.5;
        } else {
          s.velY *= 0.91;
          s.targetY += s.velY;
          s.targetX = lerp(s.targetX, 0, 0.07);
        }
      }
      s.rotY = lerp(s.rotY, s.targetY, s.dragging ? 1 : 0.1);
      s.rotX = lerp(s.rotX, s.targetX, s.dragging ? 1 : 0.08);
      applyTransform();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [applyTransform]);

  // Mouse / touch handlers
  const onDown = (clientX, clientY) => {
    const s = stateRef.current;
    s.dragging = true; s.lastX = clientX; s.lastY = clientY; s.velY = 0; s.auto = false;
    if (billRef.current) billRef.current.style.cursor = 'grabbing';
  };
  const onMove = (clientX, clientY) => {
    const s = stateRef.current;
    if (!s.dragging) return;
    const dx = clientX - s.lastX;
    const dy = clientY - s.lastY;
    s.velY = dx * 0.5;
    s.targetY += dx * 0.65;
    s.targetX = Math.max(-32, Math.min(32, s.targetX + dy * 0.3));
    s.rotY = s.targetY; s.rotX = s.targetX;
    s.lastX = clientX; s.lastY = clientY;
  };
  const onUp = () => {
    stateRef.current.dragging = false;
    if (billRef.current) billRef.current.style.cursor = 'grab';
  };

  const handleFlip = () => { stateRef.current.auto = false; stateRef.current.targetY += 180; };
  const handleAuto = (el) => {
    stateRef.current.auto = !stateRef.current.auto;
    el.textContent = stateRef.current.auto ? '⏹ Dừng' : '▶ Auto';
  };

  const accentColor = card.color || '#2a6dd9';

  return (
    <div className="bv-wrap">
      {/* 3D Stage */}
      <div
        className="bv-stage"
        ref={stageRef}
        onMouseDown={e => onDown(e.clientX, e.clientY)}
        onMouseMove={e => onMove(e.clientX, e.clientY)}
        onMouseUp={onUp}
        onMouseLeave={onUp}
        onTouchStart={e => { e.preventDefault(); onDown(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchMove={e => { e.preventDefault(); onMove(e.touches[0].clientX, e.touches[0].clientY); }}
        onTouchEnd={onUp}
        style={{ touchAction: 'none' }}
      >
        <div className="bv-perspective">
          <div className="bv-bill" ref={billRef} style={{ cursor: 'grab' }}>
            {/* Front face */}
            <div className="bv-face bv-front">
              {card.frontImg
                ? <img src={card.frontImg} alt={`${card.label} mặt trước`} className="bv-img" draggable={false} />
                : (
                  <div className="bv-placeholder" style={{ background: `linear-gradient(135deg, ${accentColor}22, ${accentColor}44)`, borderColor: `${accentColor}55` }}>
                    <span className="bv-ph-denom" style={{ color: accentColor }}>{card.denom}</span>
                    <span className="bv-ph-label">{card.label}</span>
                    <span className="bv-ph-sub">Mặt trước</span>
                  </div>
                )}
              <div className="bv-gleam" />
            </div>
            {/* Back face */}
            <div className="bv-face bv-back">
              {card.backImg
                ? <img src={card.backImg} alt={`${card.label} mặt sau`} className="bv-img" draggable={false} />
                : (
                  <div className="bv-placeholder" style={{ background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}55)`, borderColor: `${accentColor}55` }}>
                    <span className="bv-ph-denom" style={{ color: accentColor }}>{card.denom}</span>
                    <span className="bv-ph-label">{card.label}</span>
                    <span className="bv-ph-sub">Mặt sau</span>
                  </div>
                )}
              <div className="bv-gleam" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bv-controls">
        <button className="bv-btn" onClick={handleFlip}>Lật ↺</button>
        <button className="bv-btn" onClick={e => handleAuto(e.currentTarget)}>▶ Auto</button>
      </div>
      <div className="bv-hint">Kéo để xoay 360°</div>

      {/* Security features */}
      <div className="bv-security">
        {card.security.map((s, i) => (
          <span key={i} className="bv-sec-tag" style={{ borderColor: `${accentColor}55`, color: accentColor }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CurrencyGuidePage() {
  const [activeCard, setActiveCard] = useState(0);

  return (
    <div className="page active" id="page-guide">
      <Navbar
        title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>}
        subtitle="Guide"
      />
      <div style={{ height: 8 }} />

      <div className="guide-section">

        {/* ── 3D Bill Viewer ── */}
        <div className="section-title">Rotate 360° — Explore the banknote</div>

        {/* Denomination selector tabs */}
        <div className="bv-tabs">
          {CARDS.map((card, i) => (
            <button
              key={i}
              className={`bv-tab${activeCard === i ? ' active' : ''}${card.warn ? ' warn' : ''}`}
              onClick={() => setActiveCard(i)}
              style={activeCard === i ? { borderColor: card.color, color: card.color } : {}}
            >
              {card.denom}
            </button>
          ))}
        </div>

        {/* 3D viewer for selected card */}
        <BillViewer3D key={activeCard} card={CARDS[activeCard]} />

        {/* ── Confusion Cards ── */}
        <div className="section-title" style={{ marginTop: 24 }}>⚠️ Easy to Confuse</div>
        {CONFUSIONS.map((c, i) => (
          <div className="confusion-card" key={i}>
            <div className="confusion-icon">{c.icon}</div>
            <div>
              <div className="confusion-title">{c.title}</div>
              <div className="confusion-text">{c.text}</div>
            </div>
          </div>
        ))}

        {/* ── Denomination Quick Reference ── */}
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
                <div className="wiki-item-price">{d.usd}</div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}