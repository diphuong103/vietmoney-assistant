import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import atmApi from '../../api/atmApi';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';

const MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY || '';
const FALLBACK_CENTER = { lat: 21.0285, lng: 105.8542 };

// ─── Bank metadata ──────────────────────────────────────────────────────────
const BANK_META = {
  Vietcombank: { color: '#00C98D', label: 'VCB', bg: 'rgba(0,201,141,0.15)' },
  Techcombank: { color: '#FF5C7A', label: 'TCB', bg: 'rgba(255,92,122,0.15)' },
  BIDV: { color: '#4D9FFF', label: 'BIDV', bg: 'rgba(77,159,255,0.15)' },
  MBBank: { color: '#A78BFA', label: 'MB', bg: 'rgba(167,139,250,0.15)' },
  Agribank: { color: '#FBBF24', label: 'AGB', bg: 'rgba(251,191,36,0.15)' },
  TPBank: { color: '#C084FC', label: 'TPB', bg: 'rgba(192,132,252,0.15)' },
  VPBank: { color: '#34D399', label: 'VPB', bg: 'rgba(52,211,153,0.15)' },
  HDBank: { color: '#38BDF8', label: 'HDB', bg: 'rgba(56,189,248,0.15)' },
  ACB: { color: '#FB923C', label: 'ACB', bg: 'rgba(251,146,60,0.15)' },
  Sacombank: { color: '#F87171', label: 'STB', bg: 'rgba(248,113,113,0.15)' },
  VIB: { color: '#60A5FA', label: 'VIB', bg: 'rgba(96,165,250,0.15)' },
  MSB: { color: '#22D3EE', label: 'MSB', bg: 'rgba(34,211,238,0.15)' },
  SeABank: { color: '#F472B6', label: 'SEA', bg: 'rgba(244,114,182,0.15)' },
  OCB: { color: '#4ADE80', label: 'OCB', bg: 'rgba(74,222,128,0.15)' },
  VietinBank: { color: '#FCA5A5', label: 'CTG', bg: 'rgba(252,165,165,0.15)' },
};
const BANK_KEYS = Object.keys(BANK_META);
const ALL_BANKS = ['Tất cả', ...BANK_KEYS];

function getBankMeta(bankKey) {
  return BANK_META[bankKey] ?? { color: '#6B7280', label: 'ATM', bg: 'rgba(107,114,128,0.15)' };
}

function detectBankKey(atm) {
  if (atm.bankKey && BANK_META[atm.bankKey]) return atm.bankKey;
  const name = (atm.name ?? '').toLowerCase();
  for (const k of BANK_KEYS) {
    if (name.includes(k.toLowerCase()) || name.includes(BANK_META[k].label.toLowerCase())) return k;
  }
  return null;
}

const BANK_ALIASES = {
  'vcb': 'Vietcombank', 'vietcom': 'Vietcombank',
  'tcb': 'Techcombank', 'techcom': 'Techcombank',
  'ctg': 'VietinBank', 'vietin': 'VietinBank', 'incombank': 'VietinBank',
  'mb': 'MBBank', 'mbbank': 'MBBank', 'smartbank': 'MBBank',
  'agr': 'Agribank', 'nong nghiep': 'Agribank',
  'tpb': 'TPBank', 'vpb': 'VPBank', 'hdb': 'HDBank',
  'stb': 'Sacombank', 'sacom': 'Sacombank',
  'msb': 'MSB', 'maritime': 'MSB', 'sea': 'SeABank',
  'shb': 'SHB', 'exim': 'Eximbank',
  'lienviet': 'LienVietPostBank', 'buu dien': 'LienVietPostBank',
  'baca': 'BacABank', 'bac a': 'BacABank',
};

function normVN(str) {
  return (str ?? '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function atmMatchesSearch(atm, q) {
  if (!q?.trim()) return true;
  const query = normVN(q.toLowerCase().trim());
  if (normVN(atm.name).includes(query)) return true;
  if (normVN(atm.address).includes(query)) return true;
  if (normVN(atm.bankKey ?? '').includes(query)) return true;
  if (normVN(getBankMeta(atm.bankKey).label).includes(query)) return true;
  for (const [alias, bankKey] of Object.entries(BANK_ALIASES)) {
    if (query.includes(normVN(alias)) || normVN(alias).includes(query)) {
      if (atm.bankKey === bankKey) return true;
    }
  }
  return false;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180)
    * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function distStr(km) {
  if (km == null) return '';
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function decodePolyline(encoded) {
  const coords = []; let index = 0, lat = 0, lng = 0;
  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += (result & 1) ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += (result & 1) ? ~(result >> 1) : result >> 1;
    coords.push([lng / 1e5, lat / 1e5]);
  }
  return coords;
}

// ─── Navigation geometry helpers ────────────────────────────────────────────
function calcBearing(fromLngLat, toLngLat) {
  const toRad = d => (d * Math.PI) / 180;
  const dLng = toRad(toLngLat[0] - fromLngLat[0]);
  const lat1 = toRad(fromLngLat[1]);
  const lat2 = toRad(toLngLat[1]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function ptSegDist(p, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  if (dx === 0 && dy === 0) return Math.hypot(p[0] - a[0], p[1] - a[1]);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

function findClosestSegment(lngLat, coords) {
  let minDeg = Infinity, minIdx = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = ptSegDist(lngLat, coords[i], coords[i + 1]);
    if (d < minDeg) { minDeg = d; minIdx = i; }
  }
  return { idx: minIdx, distM: minDeg * 111_000 };
}

// ─── Navigation helpers (GPS smooth + snap + steps + reroute) ───────────────

/**
 * GPS Smoothing: trung bình cộng buffer 3 điểm gần nhất.
 * Giảm ~65% jitter mà không cần thư viện ngoài.
 */
function smoothGps(bufRef, rawLng, rawLat) {
  const buf = bufRef.current;
  buf.push([rawLng, rawLat]);
  if (buf.length > 3) buf.shift();
  const avgLng = buf.reduce((s, p) => s + p[0], 0) / buf.length;
  const avgLat = buf.reduce((s, p) => s + p[1], 0) / buf.length;
  return [avgLng, avgLat];
}

/**
 * Snap-to-road: tìm điểm gần nhất trên polyline theo Haversine.
 * Trả về { snappedLngLat, segmentIdx, distanceM }
 */
function snapToRoad(lngLat, routeCoords) {
  if (!routeCoords.length) return { snappedLngLat: lngLat, segmentIdx: 0, distanceM: 0 };
  let minDist = Infinity, minIdx = 0, snapped = routeCoords[0];
  for (let i = 0; i < routeCoords.length; i++) {
    const d = haversineKm(lngLat[1], lngLat[0], routeCoords[i][1], routeCoords[i][0]) * 1000;
    if (d < minDist) { minDist = d; minIdx = i; snapped = routeCoords[i]; }
  }
  return { snappedLngLat: snapped, segmentIdx: minIdx, distanceM: minDist };
}

/**
 * Parse steps từ Direction API response, gán _startIdx dựa trên polyline đã decode.
 */
function parseStepsWithIdx(legs, routeCoords) {
  if (!legs?.length) return [];
  const steps = [];
  let coordCursor = 0;
  for (const step of legs[0].steps ?? []) {
    const stepCoords = step.polyline?.points ? decodePolyline(step.polyline.points) : [];
    const startIdx = coordCursor;
    coordCursor += Math.max(stepCoords.length - 1, 1);
    steps.push({
      instruction: step.html_instructions
        ? step.html_instructions.replace(/<[^>]+>/g, '')
        : (step.maneuver ?? 'Đi thẳng'),
      distanceM: step.distance?.value ?? 0,
      _startIdx: startIdx,
      _endIdx: coordCursor,
    });
  }
  return steps;
}

// ─── Map marker factories ────────────────────────────────────────────────────
function createAtmMarker(color, label, selected = false) {
  const el = document.createElement('div');
  const size = selected ? 52 : 40;
  el.style.cssText = `width:${size}px;height:${size * 1.25}px;cursor:pointer;transition:all .2s cubic-bezier(.34,1.56,.64,1);filter:drop-shadow(0 ${selected ? 6 : 3}px ${selected ? 14 : 6}px ${color}88)`;
  el.innerHTML = `<svg width="${size}" height="${size * 1.25}" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
    ${selected ? `<circle cx="20" cy="16" r="28" fill="${color}" opacity="0.15"/>` : ''}
    <path d="M20 2C12.27 2 6 8.27 6 16C6 27 20 48 20 48S34 27 34 16C34 8.27 27.73 2 20 2Z" fill="${color}" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    <circle cx="20" cy="15.5" r="8.5" fill="rgba(0,0,0,0.4)"/>
    <text x="20" y="19.5" text-anchor="middle" font-size="${label.length > 3 ? 6.5 : 8}" font-family="'IBM Plex Sans',system-ui,sans-serif" font-weight="700" fill="white">${label}</text>
  </svg>`;
  return el;
}

function createUserMarker() {
  const el = document.createElement('div');
  el.style.cssText = 'width:30px;height:30px;display:flex;align-items:center;justify-content:center;z-index:999;cursor:pointer;';
  el.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30" style="overflow:visible">
      <circle cx="15" cy="15" r="12" fill="#00C98D" fill-opacity="0.2">
        <animate attributeName="r" from="8" to="15" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="fill-opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="15" cy="15" r="7" fill="#0F1923" opacity="1"/>
      <circle cx="15" cy="15" r="5" fill="#00C98D" opacity="1"/>
    </svg>
    <div style="position:absolute;top:-32px;left:50%;transform:translateX(-50%);background:#1A2535;padding:4px 10px;border-radius:12px;box-shadow:0 2px 10px rgba(0,0,0,0.4);font-size:11px;font-weight:700;color:#00C98D;white-space:nowrap;border:1px solid rgba(0,201,141,0.3);pointer-events:none;">Vị trí của bạn</div>
  `;
  return el;
}

function createNavMarker() {
  const el = document.createElement('div');
  el.style.cssText = 'width:36px;height:36px;';
  el.innerHTML = `
    <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="17" fill="#00C98D" stroke="#0D1520" stroke-width="2.5"/>
      <polygon points="18,8 26,26 18,21 10,26" fill="#0D1520"/>
    </svg>`;
  return el;
}

// ─── Tiny sub-components ─────────────────────────────────────────────────────
function StatusDot({ status }) {
  const open = status !== 'closed';
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: open ? '#00C98D' : '#FF5C7A' }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: open ? '#00C98D' : '#FF5C7A', display: 'inline-block', flexShrink: 0, boxShadow: `0 0 6px ${open ? '#00C98D' : '#FF5C7A'}` }} />
      {open ? 'Đang mở' : 'Đã đóng'}
    </span>
  );
}

function Spinner({ size = 16, color = '#00C98D' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="40 60" strokeLinecap="round" />
    </svg>
  );
}

function IconSearch({ size = 16, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>;
}
function IconLocation({ size = 16, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>;
}
function IconNavArrow({ size = 16, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>;
}
function IconX({ size = 16, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>;
}
function IconFilter({ size = 16, color = 'currentColor' }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" /></svg>;
}
function IconChevron({ size = 16, color = 'currentColor', dir = 'down' }) {
  const r = { down: 0, up: 180, right: -90, left: 90 }[dir] ?? 0;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ transform: `rotate(${r}deg)`, transition: 'transform .2s' }}><polyline points="6 9 12 15 18 9" /></svg>;
}
function IconStar({ size = 14, color = '#FBBF24', filled = false }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? color : 'none'} stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
}

// ─── GLOBAL CSS ──────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
::-webkit-scrollbar-thumb:hover{background:rgba(0,201,141,0.3)}

@keyframes spin{to{transform:rotate(360deg)}}
@keyframes slideUp{from{transform:translateY(12px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes slideDown{from{transform:translateY(-8px);opacity:0}to{transform:translateY(0);opacity:1}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes shimmer{0%,100%{opacity:.3}50%{opacity:.6}}
@keyframes bsUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes nearestGlow{0%,100%{box-shadow:0 0 0 0 rgba(0,201,141,0.2)}60%{box-shadow:0 0 0 6px rgba(0,201,141,0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
@keyframes rerouteIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}

.atm-root{
  display:flex;width:100%;height:100%;
  font-family:'IBM Plex Sans','Segoe UI',sans-serif;
  background:#080E18;overflow:hidden;position:relative;
}
.sidebar{
  width:360px;max-width:90vw;flex-shrink:0;height:100%;
  display:flex;flex-direction:column;
  background:#0D1520;
  border-right:1px solid rgba(255,255,255,0.06);
  z-index:20;transition:transform .3s cubic-bezier(.4,0,.2,1);
}
.sidebar-header{
  padding:16px 16px 12px;
  border-bottom:1px solid rgba(255,255,255,0.06);
  flex-shrink:0;background:#0D1520;
}
.sidebar-list{flex:1;overflow-y:auto;padding:8px;}
.atm-card{
  border-radius:12px;padding:12px;margin-bottom:6px;
  border:1px solid rgba(255,255,255,0.06);
  cursor:pointer;transition:all .15s;
  background:#111B2A;
  display:block;width:100%;text-align:left;
}
.atm-card:hover{border-color:rgba(0,201,141,0.25);background:#142030;}
.atm-card.active{
  border-color:rgba(0,201,141,0.5);
  background:rgba(0,201,141,0.08);
  box-shadow:0 0 0 1px rgba(0,201,141,0.2), inset 0 0 20px rgba(0,201,141,0.03);
}
.atm-card.nearest{animation:nearestGlow 2.5s ease-in-out infinite;}
.search-wrap{
  display:flex;align-items:center;gap:8px;padding:0 12px;height:42px;
  border:1px solid rgba(255,255,255,0.1);
  border-radius:10px;background:rgba(255,255,255,0.04);transition:all .15s;
}
.search-wrap:focus-within{
  border-color:rgba(0,201,141,0.5);
  background:rgba(0,201,141,0.05);
  box-shadow:0 0 0 3px rgba(0,201,141,0.08);
}
.search-input{
  flex:1;border:none;background:transparent;
  font-size:13.5px;color:#E2E8F0;font-family:inherit;outline:none;
}
.search-input::placeholder{color:rgba(255,255,255,0.3);}
.chip{
  padding:5px 12px;border-radius:20px;
  border:1px solid rgba(255,255,255,0.1);
  background:rgba(255,255,255,0.04);
  font-size:11.5px;font-weight:600;color:rgba(255,255,255,0.5);
  cursor:pointer;white-space:nowrap;transition:all .15s;font-family:inherit;
}
.chip:hover{border-color:rgba(0,201,141,0.35);color:rgba(0,201,141,0.9);}
.chip.on{border-color:rgba(0,201,141,0.5);background:rgba(0,201,141,0.1);color:#00C98D;}
.rad-slider{
  appearance:none;-webkit-appearance:none;width:100%;height:3px;
  border-radius:2px;
  background:linear-gradient(90deg,#00C98D,rgba(0,201,141,0.3));
  outline:none;cursor:pointer;
}
.rad-slider::-webkit-slider-thumb{
  appearance:none;width:16px;height:16px;border-radius:50%;
  background:#00C98D;border:2.5px solid #0D1520;
  box-shadow:0 0 8px rgba(0,201,141,0.5);cursor:pointer;
}
.btn-primary{
  display:flex;align-items:center;justify-content:center;gap:8px;
  padding:10px 18px;border-radius:10px;border:none;
  background:linear-gradient(135deg,#00C98D,#00A875);
  color:#0D1520;font-weight:700;font-size:13.5px;
  cursor:pointer;font-family:inherit;transition:all .15s;width:100%;
  box-shadow:0 4px 14px rgba(0,201,141,0.25);
}
.btn-primary:hover{background:linear-gradient(135deg,#00D99A,#00B882);box-shadow:0 6px 20px rgba(0,201,141,0.35);transform:translateY(-1px);}
.btn-primary:active{transform:translateY(0);}
.btn-primary:disabled{background:rgba(0,201,141,0.2);color:rgba(0,201,141,0.4);cursor:not-allowed;box-shadow:none;transform:none;}
.btn-ghost{
  display:flex;align-items:center;justify-content:center;gap:6px;
  padding:9px 14px;border-radius:10px;
  border:1px solid rgba(255,255,255,0.1);
  background:rgba(255,255,255,0.04);
  color:rgba(255,255,255,0.7);font-weight:600;font-size:13px;
  cursor:pointer;font-family:inherit;transition:all .15s;
}
.btn-ghost:hover{border-color:rgba(0,201,141,0.35);color:#00C98D;background:rgba(0,201,141,0.06);}
.btn-danger{
  display:flex;align-items:center;justify-content:center;gap:6px;
  padding:9px 16px;border-radius:10px;border:none;
  background:linear-gradient(135deg,#FF5C7A,#E0335A);
  color:white;font-weight:700;font-size:13px;
  cursor:pointer;font-family:inherit;transition:all .15s;
  box-shadow:0 4px 14px rgba(255,92,122,0.25);
}
.btn-danger:hover{box-shadow:0 6px 20px rgba(255,92,122,0.35);transform:translateY(-1px);}
.map-pill{
  position:absolute;z-index:15;display:flex;align-items:center;gap:8px;
  background:#0D1520;border-radius:24px;padding:8px 14px;
  box-shadow:0 4px 20px rgba(0,0,0,0.4);
  border:1px solid rgba(255,255,255,0.08);
  font-size:12.5px;font-weight:600;color:rgba(255,255,255,0.8);
  animation:slideDown .2s;
}
.map-fab{
  width:44px;height:44px;border-radius:50%;
  background:#0D1520;
  border:1px solid rgba(255,255,255,0.08);
  box-shadow:0 4px 16px rgba(0,0,0,0.3);
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .2s;color:rgba(255,255,255,0.7);
}
.map-fab:hover{box-shadow:0 6px 24px rgba(0,0,0,0.4);transform:translateY(-1px);border-color:rgba(0,201,141,0.3);color:#00C98D;}
.map-fab.active{background:rgba(0,201,141,0.15);color:#00C98D;border-color:rgba(0,201,141,0.4);}
.bottom-sheet{
  position:absolute;bottom:0;left:0;right:0;z-index:30;
  background:#0D1520;border-radius:20px 20px 0 0;
  box-shadow:0 -4px 40px rgba(0,0,0,0.5);
  border-top:1px solid rgba(255,255,255,0.06);
  animation:bsUp .3s cubic-bezier(.34,1.2,.64,1);
}
.bs-handle{width:36px;height:4px;border-radius:2px;background:rgba(255,255,255,0.15);margin:10px auto 0;}
.map-popup{
  position:absolute;top:16px;z-index:20;
  background:#0D1520;border-radius:16px;
  box-shadow:0 8px 40px rgba(0,0,0,0.5);
  border:1px solid rgba(255,255,255,0.08);
  width:320px;animation:slideUp .22s cubic-bezier(.34,1.2,.64,1);
}
.route-bar{
  position:absolute;bottom:0;left:0;right:0;z-index:20;
  background:#0D1520;color:white;padding:16px 20px;
  display:flex;align-items:center;gap:12px;flex-wrap:wrap;
  border-top:1px solid rgba(0,201,141,0.2);
  box-shadow:0 -4px 30px rgba(0,0,0,0.4);
}
.travel-wrap{
  position:absolute;top:16px;z-index:15;
  background:#0D1520;border-radius:12px;padding:5px;
  box-shadow:0 4px 16px rgba(0,0,0,0.3);
  border:1px solid rgba(255,255,255,0.08);
  display:flex;gap:3px;
}
.travel-btn{
  padding:6px 12px;border-radius:8px;border:none;
  background:transparent;font-size:12px;font-weight:600;
  color:rgba(255,255,255,0.4);cursor:pointer;transition:all .15s;
  font-family:inherit;display:flex;align-items:center;gap:5px;
}
.travel-btn.on{background:rgba(0,201,141,0.15);color:#00C98D;}
.travel-btn:hover:not(.on){background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.7);}
.suggest-box{
  position:absolute;top:calc(100% + 6px);left:0;right:0;z-index:100;
  background:#0D1520;border-radius:12px;
  box-shadow:0 8px 30px rgba(0,0,0,0.5);
  border:1px solid rgba(255,255,255,0.08);
  max-height:260px;overflow-y:auto;
  animation:slideDown .15s;
}
.suggest-row{
  display:flex;align-items:center;gap:10px;padding:10px 14px;
  cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.04);transition:background .1s;
}
.suggest-row:last-child{border-bottom:none;}
.suggest-row:hover{background:rgba(0,201,141,0.06);}
.mob-toggle{display:none;position:absolute;top:16px;left:16px;z-index:16;}
.step-banner{
  font-size:11.5px;color:rgba(255,255,255,0.55);margin-top:3px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:220px;
}
.reroute-badge{
  font-size:10.5px;color:#A78BFA;font-weight:700;margin-top:2px;
  display:flex;align-items:center;gap:4px;animation:rerouteIn .3s ease;
}

@media(max-width:768px){
  .sidebar{position:absolute;top:0;left:0;height:100%;transform:translateX(-100%);z-index:30;width:88vw;}
  .sidebar.open{transform:translateX(0);box-shadow:4px 0 40px rgba(0,0,0,0.5);}
  .mob-toggle{display:flex;}
  .map-popup{display:none;}
  .route-bar{padding-bottom:28px;}
  .travel-wrap{left:70px;}
}
@media(min-width:769px){
  .mob-toggle{display:none;}
  .bottom-sheet{display:none;}
}
`;

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export default function AtmMapPage({ embedded = false }) {
  const navigate = useNavigate();

  // ── Data ──────────────────────────────────────────────────────────────────
  const [atms, setAtms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [coords, setCoords] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');
  const [savedAtms, setSavedAtms] = useState(new Set());

  // ── Map ───────────────────────────────────────────────────────────────────
  const [mapReady, setMapReady] = useState(false);
  const mapDivRef = useRef(null);
  const gMapRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const mapCentered = useRef(false);
  const panCenterRef = useRef(null);

  // ── Selection & route ─────────────────────────────────────────────────────
  const [selectedAtm, setSelectedAtm] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeCoords, setRouteCoords] = useState([]);
  const [travelMode, setTravelMode] = useState('car');
  const [navigating, setNavigating] = useState(false);

  // Navigation refs
  const navMarkerRef = useRef(null);
  const navWatchIdRef = useRef(null);
  const prevNavCoordRef = useRef(null);
  const navProgressRef = useRef(0);
  const navigatingRef = useRef(false);
  const routeCoordsRef = useRef([]);
  const selectedAtmRef = useRef(null);

  // ── NEW: Navigation enhancement refs ─────────────────────────────────────
  const gpsBufferRef = useRef([]);      // GPS smoothing buffer (max 3 pts)
  const lastRerouteTimeRef = useRef(0);       // ms timestamp of last reroute
  const routeStepsRef = useRef([]);      // parsed turn-by-turn steps
  const [currentStep, setCurrentStep] = useState(null);
  const [rerouteFlash, setRerouteFlash] = useState(false);

  // ── Search & filter ───────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const searchRef = useRef(null);
  const suggestTimer = useRef(null);
  const [filterBank, setFilterBank] = useState('Tất cả');
  const [filterType, setFilterType] = useState('Tất cả');
  const [showBankFilter, setShowBankFilter] = useState(false);
  const [searchRadius, setSearchRadius] = useState(10000);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 768);
  const [hoveredId, setHoveredId] = useState(null);
  const [popupCollapsed, setPopupCollapsed] = useState(false);
  const [panLoading, setPanLoading] = useState(false);
  const pollTimerRef = useRef(null);
  const radiusTimer = useRef(null);
  const panTimerRef = useRef(null);
  const customPlaceMarkerRef = useRef(null);

  // Ambient GPS watch
  const watchIdRef = useRef(null);

  const isDesktop = () => window.innerWidth > 768;

  // ── Sync refs ─────────────────────────────────────────────────────────────
  useEffect(() => { navigatingRef.current = navigating; }, [navigating]);
  useEffect(() => { routeCoordsRef.current = routeCoords; }, [routeCoords]);
  useEffect(() => { selectedAtmRef.current = selectedAtm; }, [selectedAtm]);

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const r = () => { if (window.innerWidth > 768) setShowSidebar(true); };
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);

  // ── Load ATMs ─────────────────────────────────────────────────────────────
  const loadAtms = useCallback(async (lat, lng, radius, silent = false) => {
    if (!silent) setLoading(true);
    clearTimeout(pollTimerRef.current);
    try {
      const res = await atmApi.getNearby(lat, lng, radius ?? searchRadius);
      const raw = res.data?.data ?? [];
      const coverage = res.data?.meta?.coveragePct ?? 100;
      const enriched = raw.map(a => ({
        ...a,
        bankKey: a.bankKey || detectBankKey(a),
        distanceKm: haversineKm(lat, lng, a.lat ?? 0, a.lng ?? 0),
      })).sort((a, b) => a.distanceKm - b.distanceKm);
      setAtms(enriched);
      if (coverage < 100) {
        setScanning(true);
        pollTimerRef.current = setTimeout(() => loadAtms(lat, lng, radius, true), 4000);
      } else {
        setScanning(false);
      }
    } catch {
      setAtms([]); setScanning(false);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [searchRadius]);

  useEffect(() => () => clearTimeout(pollTimerRef.current), []);

  // ── Ambient GPS watch ─────────────────────────────────────────────────────
  const applyPosition = useCallback((pos, forceCenter = false) => {
    const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setCoords(c);
    setGeoLoading(false);
    setGeoError('');
    loadAtms(c.lat, c.lng);
    panCenterRef.current = c;

    if (!gMapRef.current) return;

    if (navigatingRef.current) {
      if (userMarkerRef.current) userMarkerRef.current.setLngLat([c.lng, c.lat]);
      return;
    }

    if (!mapCentered.current || forceCenter) {
      mapCentered.current = true;
      gMapRef.current.flyTo({ center: [c.lng, c.lat], zoom: 16, speed: 1.3 });
      if (userMarkerRef.current) {
        const popup = new goongjs.Popup({ offset: 25, closeButton: false })
          .setHTML('<div style="font-size:12px;font-weight:700;color:#00C98D;padding:2px 4px;background:#0D1520;border-radius:6px;">Bạn đang ở đây</div>');
        userMarkerRef.current.setPopup(popup).togglePopup();
        setTimeout(() => popup.remove(), 3000);
      }
    }
  }, [loadAtms]);

  const fetchLocation = useCallback((forceCenter = true) => {
    setGeoLoading(true); setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Trình duyệt không hỗ trợ GPS.');
      setGeoLoading(false);
      loadAtms(FALLBACK_CENTER.lat, FALLBACK_CENTER.lng);
      return;
    }
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    // Reset GPS buffer on manual re-center
    gpsBufferRef.current = [];
    let localForceCenter = forceCenter;
    const onPos = (p) => { applyPosition(p, localForceCenter); localForceCenter = false; };
    const onErr = (err) => {
      console.warn('Geolocation error:', err);
      if (!coords) {
        setGeoError('Không lấy được vị trí.');
        setGeoLoading(false);
        loadAtms(FALLBACK_CENTER.lat, FALLBACK_CENTER.lng);
      }
    };
    watchIdRef.current = navigator.geolocation.watchPosition(onPos, onErr, {
      enableHighAccuracy: true, maximumAge: 10000, timeout: 15000,
    });
    navigator.geolocation.getCurrentPosition(onPos, onErr, {
      enableHighAccuracy: false, timeout: 5000, maximumAge: 60000,
    });
  }, [loadAtms, applyPosition, coords]);

  useEffect(() => {
    fetchLocation(true);
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await atmApi.getSaved();
        setSavedAtms(new Set((res.data?.data || []).map(a => a.id)));
      } catch { }
    })();
  }, []);

  // ── Radius change ─────────────────────────────────────────────────────────
  const handleRadiusChange = useCallback(val => {
    setSearchRadius(val);
    clearTimeout(radiusTimer.current);
    radiusTimer.current = setTimeout(() => {
      const c = coords ?? FALLBACK_CENTER;
      loadAtms(c.lat, c.lng, val);
    }, 400);
  }, [coords, loadAtms]);

  // ── Map init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapDivRef.current || gMapRef.current || !MAPTILES_KEY) {
      if (!MAPTILES_KEY) setLoading(false);
      return;
    }
    goongjs.accessToken = MAPTILES_KEY;
    const center = coords ?? FALLBACK_CENTER;
    const map = new goongjs.Map({
      container: mapDivRef.current,
      style: 'https://tiles.goong.io/assets/goong_map_dark.json',
      center: [center.lng, center.lat],
      zoom: 14,
    });
    map.addControl(new goongjs.NavigationControl(), 'bottom-right');
    map.on('load', () => {
      map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
      map.addLayer({ id: 'route-bg', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': 'rgba(0,201,141,0.3)', 'line-width': 9, 'line-opacity': 0.8 } });
      map.addLayer({ id: 'route-line', type: 'line', source: 'route', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#00C98D', 'line-width': 4, 'line-opacity': 1 } });
      map.addSource('route-done', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } });
      map.addLayer({ id: 'route-done-line', type: 'line', source: 'route-done', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': 'rgba(255,255,255,0.2)', 'line-width': 4, 'line-opacity': 0.8 } });
      gMapRef.current = map;
      setMapReady(true);

      map.on('moveend', () => {
        if (navigatingRef.current) return;
        const c = map.getCenter(), prev = panCenterRef.current;
        if (prev && haversineKm(prev.lat, prev.lng, c.lat, c.lng) < 0.3) return;
        clearTimeout(panTimerRef.current);
        panTimerRef.current = setTimeout(() => {
          panCenterRef.current = { lat: c.lat, lng: c.lng };
          setPanLoading(true);
          loadAtms(c.lat, c.lng).finally(() => setPanLoading(false));
        }, 900);
      });
      // Suppress missing image warnings for custom sprite icons
      map.on('styleimagemissing', (e) => {
        if (!map.hasImage(e.id)) {
          const canvas = document.createElement('canvas');
          canvas.width = 1; canvas.height = 1;
          map.addImage(e.id, canvas);
        }
      });
    });
    return () => {
      try {
        // Null ref BEFORE remove() so any in-flight cleanup (stopNavigation)
        // sees gMapRef.current as null and skips map API calls.
        const m = map;
        gMapRef.current = null;
        setMapReady(false);
        m.remove();
      } catch { }
    };
  }, [mapDivRef.current]);

  // ── User marker ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !coords || !gMapRef.current) return;
    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([coords.lng, coords.lat]);
    } else {
      const el = createUserMarker();
      userMarkerRef.current = new goongjs.Marker({ element: el, anchor: 'center' })
        .setLngLat([coords.lng, coords.lat])
        .addTo(gMapRef.current);
    }
  }, [mapReady, coords]);

  // ── ATM markers ───────────────────────────────────────────────────────────
  const nearestId = useMemo(() => atms.length > 0 ? (atms[0].placeId ?? atms[0].id) : null, [atms]);

  useEffect(() => {
    if (!mapReady || !gMapRef.current) return;
    Object.values(markersRef.current).forEach(({ marker }) => marker?.remove());
    markersRef.current = {};
    atms.forEach(atm => {
      if (!atm.lat || !atm.lng) return;
      const key = atm.placeId ?? atm.id;
      const meta = getBankMeta(atm.bankKey);
      const color = atm.status !== 'closed' ? meta.color : '#4B5563';
      const el = createAtmMarker(color, meta.label, false);
      const marker = new goongjs.Marker({ element: el }).setLngLat([atm.lng, atm.lat]).addTo(gMapRef.current);
      el.addEventListener('click', e => { e.stopPropagation(); handleSelectAtm(atm); });
      el.addEventListener('mouseenter', () => setHoveredId(key));
      el.addEventListener('mouseleave', () => setHoveredId(null));
      markersRef.current[key] = { marker, el, atm };
    });
  }, [mapReady, atms, nearestId]);

  useEffect(() => {
    if (!mapReady) return;
    const selKey = selectedAtm ? (selectedAtm.placeId ?? selectedAtm.id) : null;
    Object.values(markersRef.current).forEach(({ el, atm }) => {
      if (!atm) return;
      const key = atm.placeId ?? atm.id;
      const isSel = key === selKey, isHov = key === hoveredId;
      const meta = getBankMeta(atm.bankKey);
      const color = atm.status !== 'closed' ? meta.color : '#4B5563';
      const size = isSel ? 52 : isHov ? 46 : 40;
      el.style.width = `${size}px`;
      el.style.height = `${size * 1.25}px`;
      el.style.zIndex = isSel ? '200' : isHov ? '150' : '10';
      el.innerHTML = createAtmMarker(color, meta.label, isSel).innerHTML;
    });
  }, [mapReady, selectedAtm, hoveredId]);

  useEffect(() => {
    if (!mapReady || !selectedAtm?.isCustomPlace) {
      customPlaceMarkerRef.current?.remove(); customPlaceMarkerRef.current = null; return;
    }
    const el = createAtmMarker('#FF5C7A', '📍', true);
    customPlaceMarkerRef.current?.remove();
    customPlaceMarkerRef.current = new goongjs.Marker({ element: el })
      .setLngLat([selectedAtm.lng, selectedAtm.lat])
      .addTo(gMapRef.current);
    return () => { customPlaceMarkerRef.current?.remove(); customPlaceMarkerRef.current = null; };
  }, [mapReady, selectedAtm]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => atms.filter(a => {
    if (!atmMatchesSearch(a, search)) return false;
    if (filterBank !== 'Tất cả' && a.bankKey !== filterBank) return false;
    if (filterType !== 'Tất cả' && a.type !== filterType) return false;
    return true;
  }), [atms, search, filterBank, filterType]);

  useEffect(() => {
    if (!mapReady) return;
    const keys = new Set(filtered.map(a => a.placeId ?? a.id));
    Object.values(markersRef.current).forEach(({ marker, atm }) => {
      if (!marker) return;
      marker.getElement().style.display = keys.has(atm?.placeId ?? atm?.id) ? '' : 'none';
    });
  }, [filtered, mapReady]);

  // ════════════════════════════════════════════════════════════════════════════
  //  NAVIGATION — stopNavigation
  // ════════════════════════════════════════════════════════════════════════════
  const stopNavigation = useCallback(() => {
    if (navWatchIdRef.current != null) {
      navigator.geolocation.clearWatch(navWatchIdRef.current);
      navWatchIdRef.current = null;
    }

    setNavigating(false);

    // Reset all navigation refs
    navProgressRef.current = 0;
    prevNavCoordRef.current = null;
    gpsBufferRef.current = [];      // NEW: clear smoothing buffer
    routeStepsRef.current = [];      // NEW: clear steps
    setCurrentStep(null);              // NEW
    setRerouteFlash(false);            // NEW

    navMarkerRef.current?.remove();
    navMarkerRef.current = null;

    const map = gMapRef.current;
    if (map) {
      try {
        const src = map.getSource('route-done');
        if (src) src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
        map.easeTo({ pitch: 0, bearing: 0, zoom: 15, duration: 600 });
      } catch { }
    }
  }, []);

  // ── Turn-by-turn step updater ─────────────────────────────────────────────
  const updateCurrentStep = useCallback((segmentIdx) => {
    const steps = routeStepsRef.current;
    if (!steps.length) return;
    let active = steps[0];
    for (const s of steps) {
      if (s._startIdx <= segmentIdx) active = s;
      else break;
    }
    setCurrentStep(prev => prev?.instruction === active.instruction ? prev : active);
  }, []);

  // ── Reroute ───────────────────────────────────────────────────────────────
  const doReroute = useCallback(async (lngLat, atm) => {
    const now = Date.now();
    if (now - lastRerouteTimeRef.current < 15_000) return; // 15s cooldown
    if (!atm?.lat || !atm?.lng) return;
    lastRerouteTimeRef.current = now;
    try {
      const res = await atmApi.getDirection(
        `${lngLat[1]},${lngLat[0]}`,
        `${atm.lat},${atm.lng}`,
        travelMode,
      );
      const route = (res.data?.data ?? res.data)?.routes?.[0];
      if (!route) return;
      const encoded = route.overview_polyline?.points;
      let newCoords = [];
      if (encoded) {
        newCoords = decodePolyline(encoded);
      } else {
        for (const s of route.legs?.[0]?.steps ?? []) {
          if (s.polyline?.points) newCoords.push(...decodePolyline(s.polyline.points));
        }
      }
      if (!newCoords.length) return;

      // Update map layers
      gMapRef.current?.getSource?.('route')?.setData({
        type: 'Feature', geometry: { type: 'LineString', coordinates: newCoords },
      });
      gMapRef.current?.getSource?.('route-done')?.setData({
        type: 'Feature', geometry: { type: 'LineString', coordinates: [] },
      });

      // Sync state + refs
      setRouteCoords(newCoords);
      routeCoordsRef.current = newCoords;
      navProgressRef.current = 0;
      routeStepsRef.current = parseStepsWithIdx(route.legs, newCoords);
      if (routeStepsRef.current.length) setCurrentStep(routeStepsRef.current[0]);

      // Flash badge
      setRerouteFlash(true);
      setTimeout(() => setRerouteFlash(false), 3000);
    } catch (e) {
      console.warn('Reroute failed:', e);
    }
  }, [travelMode]);

  // ════════════════════════════════════════════════════════════════════════════
  //  NAVIGATION — startNavigation (with GPS smooth + snap + turn-by-turn + reroute)
  // ════════════════════════════════════════════════════════════════════════════
  const startNavigation = useCallback(() => {
    const coords_ = routeCoordsRef.current;
    if (!coords_.length || !gMapRef.current) return;

    stopNavigation();
    setNavigating(true);
    setShowSidebar(false);

    navProgressRef.current = 0;
    prevNavCoordRef.current = null;
    gpsBufferRef.current = []; // fresh buffer on start

    const startLngLat = coords
      ? [coords.lng, coords.lat]
      : coords_[0];

    const el = createNavMarker();
    navMarkerRef.current = new goongjs.Marker({
      element: el,
      rotationAlignment: 'map',
      anchor: 'center',
    }).setLngLat(startLngLat).addTo(gMapRef.current);

    gMapRef.current.easeTo({
      center: startLngLat, zoom: 18, pitch: 55, bearing: 0, duration: 1000,
    });

    if (!navigator.geolocation) return;

    if (navWatchIdRef.current != null) {
      navigator.geolocation.clearWatch(navWatchIdRef.current);
    }

    navWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (!gMapRef.current || !navigatingRef.current) return;

        const { latitude: rawLat, longitude: rawLng, heading, accuracy } = pos.coords;
        if (accuracy > 100) return;

        // ── Step 1: GPS Smoothing ───────────────────────────────────
        const [sLng, sLat] = smoothGps(gpsBufferRef, rawLng, rawLat);

        // ── Step 2: Snap-to-road ────────────────────────────────────
        const routePts = routeCoordsRef.current;
        const { snappedLngLat, segmentIdx, distanceM } = routePts.length
          ? snapToRoad([sLng, sLat], routePts)
          : { snappedLngLat: [sLng, sLat], segmentIdx: 0, distanceM: 0 };

        // NavMarker snaps to road — no jumping off polyline
        navMarkerRef.current?.setLngLat(snappedLngLat);

        // ── Step 3: Turn-by-turn ────────────────────────────────────
        updateCurrentStep(segmentIdx);

        // ── Step 4: Reroute if off-route > 50m ─────────────────────
        if (distanceM > 50 && selectedAtmRef.current) {
          doReroute([sLng, sLat], selectedAtmRef.current);
        }

        // ── Bearing ─────────────────────────────────────────────────
        let bearing = 0;
        if (heading != null && !isNaN(heading) && accuracy < 50) {
          bearing = heading;
        } else if (prevNavCoordRef.current) {
          const prev = prevNavCoordRef.current;
          const distDeg = Math.hypot(sLng - prev[0], sLat - prev[1]);
          if (distDeg > 0.00004) {
            bearing = calcBearing(prev, [sLng, sLat]);
          } else {
            bearing = gMapRef.current.getBearing();
          }
        }
        prevNavCoordRef.current = [sLng, sLat];

        navMarkerRef.current?.setRotation(bearing - gMapRef.current.getBearing());

        // ── Progress / route-done ───────────────────────────────────
        if (routePts.length > 1) {
          if (segmentIdx > navProgressRef.current) navProgressRef.current = segmentIdx;

          gMapRef.current.getSource?.('route-done')?.setData({
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: routePts.slice(0, navProgressRef.current + 2),
            },
          });

          // Arrived if < 30m from destination
          const dest = routePts[routePts.length - 1];
          const distDest = haversineKm(rawLat, rawLng, dest[1], dest[0]) * 1000;
          if (distDest < 30) {
            stopNavigation();
            return;
          }
        }

        // ── Camera follow ───────────────────────────────────────────
        gMapRef.current.easeTo({
          center: snappedLngLat,
          zoom: 18, pitch: 55, bearing,
          duration: 900,
          easing: t => t,
        });
      },
      (err) => {
        console.warn('Nav GPS error:', err.code, err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10_000,
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coords, stopNavigation, updateCurrentStep, doReroute]);

  useEffect(() => () => stopNavigation(), [stopNavigation]);

  // ── Select ATM ────────────────────────────────────────────────────────────
  const handleSelectAtm = useCallback(async atm => {
    stopNavigation();
    setRouteInfo(null); setRouteCoords([]);
    gMapRef.current?.getSource?.('route')?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
    gMapRef.current?.getSource?.('route-done')?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });

    let enriched = atm;
    if ((atm.lat == null || atm.lng == null) && atm.placeId) {
      try {
        const res = await atmApi.getPlaceDetail(atm.placeId);
        const loc = res.data?.data?.geometry?.location ?? res.data?.data;
        if (loc?.lat && loc?.lng) {
          enriched = { ...atm, lat: loc.lat, lng: loc.lng };
          setAtms(prev => prev.map(a => a.placeId === atm.placeId ? enriched : a));
        }
      } catch { }
    }
    setSelectedAtm(enriched);
    setPopupCollapsed(false);

    if (gMapRef.current && enriched.lat && enriched.lng) {
      gMapRef.current.flyTo({
        center: [enriched.lng, enriched.lat],
        zoom: 16, speed: 1.1,
        offset: isDesktop() ? [0, 0] : [0, -80],
      });
    }
  }, [stopNavigation]);

  // ── Directions ────────────────────────────────────────────────────────────
  const handleRoute = useCallback(async atm => {
    if (!coords) return;
    setRouteLoading(true); setRouteInfo(null); setRouteCoords([]); stopNavigation();
    try {
      const res = await atmApi.getDirection(`${coords.lat},${coords.lng}`, `${atm.lat},${atm.lng}`, travelMode);
      const route = (res.data?.data ?? res.data)?.routes?.[0];
      if (!route) throw new Error('no route');

      let coordinates = [];
      const encoded = route.overview_polyline?.points;
      if (encoded) {
        coordinates = decodePolyline(encoded);
      } else {
        for (const s of route.legs?.[0]?.steps ?? []) {
          if (s.polyline?.points) coordinates.push(...decodePolyline(s.polyline.points));
        }
        if (!coordinates.length) {
          const sL = route.legs?.[0]?.start_location, eL = route.legs?.[0]?.end_location;
          if (sL && eL) coordinates = [[sL.lng, sL.lat], [eL.lng, eL.lat]];
        }
      }

      gMapRef.current?.getSource?.('route')?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates } });

      if (coordinates.length > 1) {
        const lngs = coordinates.map(c => c[0]), lats = coordinates.map(c => c[1]);
        const bounds = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
        setRouteCoords(coordinates);
        gMapRef.current?.fitBounds(bounds, {
          padding: { top: 80, bottom: isDesktop() ? 100 : 180, left: isDesktop() ? 400 : 20, right: 60 },
          maxZoom: 17,
        });
      }

      // NEW: Parse turn-by-turn steps
      const steps = parseStepsWithIdx(route.legs, coordinates);
      routeStepsRef.current = steps;
      if (steps.length) setCurrentStep(steps[0]);

      const leg = route.legs?.[0], dur = leg?.duration?.value ?? 0, dist = leg?.distance?.value ?? 0;
      setRouteInfo({
        duration: dur < 3600 ? `${Math.round(dur / 60)} phút` : `${(dur / 3600).toFixed(1)} giờ`,
        distance: dist < 1000 ? `${dist} m` : `${(dist / 1000).toFixed(1)} km`,
      });
    } catch {
      setRouteInfo({ error: 'Không thể tính đường đi.' });
    } finally {
      setRouteLoading(false);
    }
  }, [coords, travelMode, stopNavigation]);

  const clearRoute = () => {
    stopNavigation();
    gMapRef.current?.getSource?.('route')?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
    gMapRef.current?.getSource?.('route-done')?.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
    setRouteInfo(null); setRouteCoords([]); setSelectedAtm(null);
  };

  // ── Search autocomplete ───────────────────────────────────────────────────
  const handleSearchChange = useCallback(val => {
    setSearch(val);
    clearTimeout(suggestTimer.current);
    if (!val.trim()) { setSuggestions([]); setShowSuggestions(false); return; }
    const c = coords ?? FALLBACK_CENTER;
    const local = atms
      .filter(a => atmMatchesSearch(a, val))
      .slice(0, 5)
      .map(a => ({ placeId: a.placeId ?? a.id, mainText: a.name, secondaryText: a.address, atm: a, lat: a.lat, lng: a.lng, _source: 'local' }));
    if (local.length) { setSuggestions(local); setShowSuggestions(true); }
    suggestTimer.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await atmApi.getAutocomplete(val, c.lat, c.lng);
        const remote = (res.data?.data ?? []).map(s => ({ ...s, _source: 'remote' }));
        if (remote.length) {
          const seen = new Set(local.map(s => s.placeId));
          const merged = [...local, ...remote.filter(s => s.placeId && !seen.has(s.placeId))].slice(0, 8);
          setSuggestions(merged); setShowSuggestions(true);
        }
      } catch { } finally { setSuggestLoading(false); }
    }, 300);
  }, [atms, coords]);

  const handleSuggestionClick = useCallback(async sug => {
    setShowSuggestions(false); setSearch(sug.mainText || sug.description || '');
    if (sug.atm) { handleSelectAtm(sug.atm); return; }
    if (sug.placeId) {
      try {
        const res = await atmApi.getPlaceDetail(sug.placeId);
        const loc = res.data?.data?.geometry?.location ?? res.data?.data;
        const lat = loc?.lat ?? sug.lat, lng = loc?.lng ?? sug.lng;
        if (lat && lng) handleSelectAtm({ id: sug.placeId, name: sug.mainText ?? 'Địa điểm', address: sug.secondaryText ?? '', lat, lng, isCustomPlace: true, type: 'Địa điểm', status: 'open' });
      } catch {
        if (sug.lat && sug.lng) handleSelectAtm({ id: sug.placeId || 'search-' + Date.now(), name: sug.mainText ?? 'Địa điểm', address: sug.secondaryText ?? '', lat: sug.lat, lng: sug.lng, isCustomPlace: true, type: 'Địa điểm', status: 'open' });
      }
    }
  }, [handleSelectAtm]);

  useEffect(() => {
    const h = e => { if (!searchRef.current?.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  // ── Save/unsave ───────────────────────────────────────────────────────────
  const toggleSave = useCallback(async atm => {
    if (!atm || atm.isCustomPlace) return;
    try {
      if (savedAtms.has(atm.id)) {
        await atmApi.unsaveAtm(atm.id);
        setSavedAtms(prev => { const n = new Set(prev); n.delete(atm.id); return n; });
      } else {
        await atmApi.saveAtm({ atmId: atm.id, name: atm.name, address: atm.address, lat: atm.lat, lng: atm.lng, bankKey: atm.bankKey });
        setSavedAtms(prev => new Set([...prev, atm.id]));
      }
    } catch { }
  }, [savedAtms]);

  // ── Skeleton ──────────────────────────────────────────────────────────────
  const Skeleton = () => (
    <div style={{ borderRadius: 12, padding: 12, marginBottom: 6, height: 88, background: 'rgba(255,255,255,0.03)', animation: 'shimmer 1.6s ease-in-out infinite', border: '1px solid rgba(255,255,255,0.04)' }} />
  );

  // ── ATM Card ──────────────────────────────────────────────────────────────
  const AtmCard = ({ atm, idx }) => {
    const key = atm.placeId ?? atm.id;
    const isActive = (selectedAtm?.placeId ?? selectedAtm?.id) === key;
    const isNearest = key === nearestId && !search;
    const meta = getBankMeta(atm.bankKey);
    return (
      <div
        role="button" tabIndex={0} data-id={key}
        className={`atm-card${isActive ? ' active' : ''}${isNearest ? ' nearest' : ''}`}
        style={{ animationDelay: `${idx * 30}ms` }}
        onClick={() => { handleSelectAtm(atm); if (!isDesktop()) setShowSidebar(false); }}
        onMouseEnter={() => setHoveredId(key)} onMouseLeave={() => setHoveredId(null)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleSelectAtm(atm); if (!isDesktop()) setShowSidebar(false); } }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${meta.color}33` }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: meta.color, letterSpacing: '-.3px' }}>{meta.label}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#E2E8F0', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {isNearest && <span style={{ fontSize: 9, color: '#00C98D', fontWeight: 700, background: 'rgba(0,201,141,0.12)', padding: '1px 5px', borderRadius: 4, marginRight: 5, verticalAlign: 'middle', border: '1px solid rgba(0,201,141,0.2)' }}>GẦN NHẤT</span>}
                {atm.name}
              </span>
              {atm.distanceKm != null && <span style={{ fontSize: 12, fontWeight: 700, color: '#00C98D', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{distStr(atm.distanceKm)}</span>}
            </div>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }}>{atm.address}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <StatusDot status={atm.status} />
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.2)' }}>·</span>
              <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{atm.type}</span>
            </div>
          </div>
        </div>
        {isActive && (
          <button className="btn-primary" style={{ marginTop: 10, fontSize: 13, padding: '9px' }}
            onClick={e => { e.stopPropagation(); handleRoute(atm); if (!isDesktop()) setShowSidebar(false); }}
            disabled={routeLoading}
          >
            {routeLoading ? <Spinner size={14} color="#0D1520" /> : <IconNavArrow size={14} color="#0D1520" />}
            {routeLoading ? 'Đang tính...' : 'Chỉ đường'}
          </button>
        )}
      </div>
    );
  };

  // ── ATM Detail Panel ──────────────────────────────────────────────────────
  const AtmDetail = ({ atm, isSheet = false }) => {
    const meta = getBankMeta(atm.bankKey);
    const isSaved = savedAtms.has(atm.id);
    const inner = (
      <div>
        {isSheet && <div className="bs-handle" />}
        <div style={{ padding: isSheet ? '14px 16px 28px' : (popupCollapsed ? '12px 16px' : '14px 16px') }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: popupCollapsed ? 0 : 14, position: 'relative' }}>
            <div style={{ width: popupCollapsed ? 36 : 48, height: popupCollapsed ? 36 : 48, borderRadius: 11, background: meta.bg, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${meta.color}33`, transition: 'all 0.2s' }}>
              <span style={{ fontSize: popupCollapsed ? 11 : 14, fontWeight: 800, color: meta.color }}>{meta.label}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingRight: isSheet ? 24 : 54 }}>
              <div style={{ fontSize: popupCollapsed ? 13.5 : 14.5, fontWeight: 700, color: '#E2E8F0', lineHeight: 1.35, marginBottom: popupCollapsed ? 0 : 3 }}>{atm.name}</div>
              {!popupCollapsed && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{atm.address}</div>}
            </div>
            <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: 6, alignItems: 'center' }}>
              {!isSheet && (
                <button onClick={e => { e.stopPropagation(); setPopupCollapsed(!popupCollapsed); }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconChevron size={12} color="rgba(255,255,255,0.5)" dir={popupCollapsed ? 'down' : 'up'} />
                </button>
              )}
              <button onClick={e => { e.stopPropagation(); clearRoute(); }} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: 26, height: 26, borderRadius: '50%', cursor: 'pointer', color: 'rgba(255,255,255,0.5)', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconX size={13} />
              </button>
            </div>
          </div>
          {!popupCollapsed && (
            <>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' }}>
                <StatusDot status={atm.status} />
                {atm.distanceKm != null && <span style={{ fontSize: 11.5, fontWeight: 600, color: '#00C98D', background: 'rgba(0,201,141,0.1)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(0,201,141,0.2)' }}>{distStr(atm.distanceKm)}</span>}
                {atm.type && <span style={{ fontSize: 11.5, fontWeight: 500, color: 'rgba(255,255,255,0.45)', background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 6 }}>{atm.type}</span>}
                {atm.rating > 0 && <span style={{ fontSize: 11.5, fontWeight: 600, color: '#FBBF24', background: 'rgba(251,191,36,0.1)', padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}><IconStar size={11} color="#FBBF24" filled /> {atm.rating.toFixed(1)}</span>}
                {!atm.isCustomPlace && (
                  <button onClick={() => toggleSave(atm)} style={{ fontSize: 11.5, fontWeight: 600, color: isSaved ? '#FBBF24' : 'rgba(255,255,255,0.45)', background: isSaved ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 6, border: isSaved ? '1px solid rgba(251,191,36,0.2)' : '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
                    <IconStar size={11} color={isSaved ? '#FBBF24' : 'rgba(255,255,255,0.3)'} filled={isSaved} />
                    {isSaved ? 'Đã lưu' : 'Lưu'}
                  </button>
                )}
              </div>
              <button className="btn-primary" onClick={() => { handleRoute(atm); if (!isDesktop()) setShowSidebar(false); }} disabled={routeLoading}>
                {routeLoading ? <><Spinner size={15} color="#0D1520" /> Đang tính...</> : <><IconNavArrow size={14} color="#0D1520" /> Chỉ đường đến đây</>}
              </button>
            </>
          )}
        </div>
      </div>
    );
    if (isSheet) return <div className="bottom-sheet">{inner}</div>;
    return <div className="map-popup" style={{ left: 16 }}>{inner}</div>;
  };

  const modes = [['car', '🚗', 'Ô tô'], ['bike', '🛵', 'Xe máy'], ['foot', '🚶', 'Đi bộ']];

  // ─── RENDER ──────────────────────────────────────────────────────────────
  const content = (
    <div className="atm-root">
      <style>{GLOBAL_CSS}</style>

      <button className="mob-toggle map-fab" onClick={() => setShowSidebar(true)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {showSidebar && !isDesktop() && (
        <div onClick={() => setShowSidebar(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 25, animation: 'fadeIn .2s', backdropFilter: 'blur(2px)' }} />
      )}

      {/* ══════ SIDEBAR ══════ */}
      <aside className={`sidebar${showSidebar ? ' open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,rgba(0,201,141,0.2),rgba(0,201,141,0.08))', border: '1px solid rgba(0,201,141,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 17 }}>🏧</span>
              </div>
              <div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800, fontSize: 17, color: '#E2E8F0', lineHeight: 1 }}>ATM<span style={{ color: '#00C98D' }}>Map</span></div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                  {loading ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Spinner size={10} color="rgba(255,255,255,0.3)" /> Đang tải...</span>
                    : scanning ? <span style={{ color: '#A78BFA', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#A78BFA', animation: 'pulse 1s infinite', display: 'inline-block' }} />Đang quét thêm...</span>
                      : <span>{filtered.length} địa điểm</span>}
                </div>
              </div>
            </div>
            <button className="map-fab" onClick={() => setShowSidebar(false)} style={{ display: isDesktop() ? 'none' : 'flex', width: 34, height: 34, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: 'none' }}>
              <IconX size={15} color="rgba(255,255,255,0.5)" />
            </button>
          </div>

          <button className="btn-primary" onClick={() => fetchLocation()} disabled={geoLoading} style={{ marginBottom: geoError ? 8 : 12 }}>
            {geoLoading ? <><Spinner size={14} color="#0D1520" /> Đang lấy vị trí...</> : <><IconLocation size={14} color="#0D1520" /> {coords ? 'Cập nhật vị trí' : 'Lấy vị trí của tôi'}</>}
          </button>

          {geoError && <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 8, padding: '7px 10px', fontSize: 11.5, color: '#FBBF24', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><span>⚠️</span> {geoError}</div>}

          <div ref={searchRef} style={{ position: 'relative', marginBottom: 12 }}>
            <div className="search-wrap">
              <IconSearch size={15} color="rgba(255,255,255,0.3)" />
              <input className="search-input" value={search} onChange={e => handleSearchChange(e.target.value)} onFocus={() => suggestions.length && setShowSuggestions(true)} placeholder="Tìm ngân hàng, ATM, địa điểm..." />
              {suggestLoading && <Spinner size={13} />}
              {search && !suggestLoading && <button onClick={() => { setSearch(''); setSuggestions([]); setShowSuggestions(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2 }}><IconX size={13} /></button>}
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggest-box">
                {suggestions.map((s, i) => {
                  const dist = s.atm?.distanceKm ?? (s.lat && s.lng && coords ? haversineKm(coords.lat, coords.lng, s.lat, s.lng) : null);
                  const meta = s.atm ? getBankMeta(s.atm.bankKey) : null;
                  return (
                    <div key={s.placeId ?? i} className="suggest-row" onClick={() => handleSuggestionClick(s)}>
                      <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: meta ? meta.bg : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: meta ? 10 : 13, fontWeight: 700, color: meta ? meta.color : 'rgba(255,255,255,0.5)' }}>
                        {meta ? meta.label : '📍'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.mainText}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.secondaryText}</div>
                      </div>
                      {dist != null && <span style={{ fontSize: 11, color: '#00C98D', fontWeight: 700, flexShrink: 0 }}>{distStr(dist)}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: 'rgba(255,255,255,0.45)' }}>Bán kính tìm kiếm</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#00C98D', fontVariantNumeric: 'tabular-nums' }}>{searchRadius >= 1000 ? `${(searchRadius / 1000).toFixed(searchRadius % 1000 ? 1 : 0)} km` : `${searchRadius} m`}</span>
            </div>
            <input type="range" className="rad-slider" min={1000} max={20000} step={1000} value={searchRadius} onChange={e => handleRadiusChange(Number(e.target.value))} />
          </div>

          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 4 }}>
            {['Tất cả', 'Cây ATM', 'Ngân hàng'].map(t => <button key={t} className={`chip${filterType === t ? ' on' : ''}`} onClick={() => setFilterType(t)}>{t}</button>)}
            <button className={`chip${showBankFilter ? ' on' : ''}`} onClick={() => setShowBankFilter(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <IconFilter size={11} color={showBankFilter ? '#00C98D' : 'rgba(255,255,255,0.4)'} />
              Ngân hàng
              <IconChevron size={11} color={showBankFilter ? '#00C98D' : 'rgba(255,255,255,0.4)'} dir={showBankFilter ? 'up' : 'down'} />
            </button>
          </div>

          {showBankFilter && (
            <div style={{ marginTop: 8, display: 'flex', gap: 5, flexWrap: 'wrap', animation: 'slideDown .15s', paddingBottom: 4 }}>
              {ALL_BANKS.map(b => (
                <button key={b} className={`chip${filterBank === b ? ' on' : ''}`} onClick={() => setFilterBank(b)} style={{ fontSize: 11, padding: '4px 9px' }}>
                  {b === 'Tất cả' ? 'Tất cả' : <span style={{ color: filterBank === b ? '#00C98D' : getBankMeta(b).color, fontWeight: 700 }}>{getBankMeta(b).label}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-list">
          {loading && Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} />)}
          {!loading && !coords && atms.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px 20px' }}>
              <div style={{ fontSize: 44, marginBottom: 14 }}>📍</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', marginBottom: 8 }}>Chưa có vị trí</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>Nhấn <strong style={{ color: '#00C98D' }}>Lấy vị trí của tôi</strong> để bắt đầu</div>
            </div>
          )}
          {!loading && atms.length > 0 && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#E2E8F0', marginBottom: 6 }}>Không tìm thấy kết quả</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 16 }}>Thử xóa bộ lọc hoặc mở rộng bán kính</div>
              <button className="btn-ghost" onClick={() => { setSearch(''); setFilterBank('Tất cả'); setFilterType('Tất cả'); }} style={{ margin: '0 auto' }}>Xóa bộ lọc</button>
            </div>
          )}
          {!loading && filtered.map((atm, idx) => <AtmCard key={atm.placeId ?? atm.id} atm={atm} idx={idx} />)}
        </div>
      </aside>

      {/* ══════ MAP ══════ */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

        {(panLoading || scanning) && !navigating && (
          <div className="map-pill" style={{ top: 16, left: '50%', transform: 'translateX(-50%)' }}>
            <Spinner size={13} color={scanning ? '#A78BFA' : '#00C98D'} />
            {panLoading ? 'Đang tải ATM...' : 'Đang quét khu vực mới...'}
          </div>
        )}

        {navigating && (
          <div className="map-pill" style={{ top: 16, left: '50%', transform: 'translateX(-50%)', background: 'rgba(0,201,141,0.15)', color: '#00C98D', borderColor: 'rgba(0,201,141,0.3)' }}>
            <IconNavArrow size={13} color="#00C98D" />
            Đang dẫn đường · Nhấn Dừng để kết thúc
          </div>
        )}

        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 8, zIndex: 15 }}>
          <button className={`map-fab${geoLoading ? ' active' : ''}`} onClick={() => fetchLocation()} title="Vị trí của tôi">
            {geoLoading ? <Spinner size={16} color="#00C98D" /> : <IconLocation size={17} />}
          </button>
        </div>

        <div className="travel-wrap" style={{ top: 16, left: isDesktop() ? 16 : 70 }}>
          {modes.map(([mode, icon, label]) => (
            <button key={mode} className={`travel-btn${travelMode === mode ? ' on' : ''}`} onClick={() => setTravelMode(mode)}>
              {icon} {label}
            </button>
          ))}
        </div>

        {selectedAtm && isDesktop() && (
          <div style={{ position: 'absolute', top: 70, left: 16, zIndex: 20 }}>
            <AtmDetail atm={selectedAtm} />
          </div>
        )}

        {selectedAtm && !isDesktop() && !routeInfo && (
          <AtmDetail atm={selectedAtm} isSheet />
        )}

        {routeInfo && !routeInfo.error && (
          <div className="route-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(0,201,141,0.1)', border: '1px solid rgba(0,201,141,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20 }}>
                {navigating ? '🚗' : '🧭'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 1 }}>{navigating ? 'Đang dẫn đến' : 'Đường đến'}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#E2E8F0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedAtm?.name}</div>
                <div style={{ fontSize: 13, color: '#00C98D', marginTop: 1, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{routeInfo.duration} · {routeInfo.distance}</div>

                {/* NEW: Turn-by-turn instruction banner */}
                {navigating && currentStep && (
                  <div className="step-banner">
                    ↱ {currentStep.instruction}
                    {currentStep.distanceM > 0 && (
                      <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>
                        · {currentStep.distanceM < 1000
                          ? `${currentStep.distanceM}m`
                          : `${(currentStep.distanceM / 1000).toFixed(1)}km`}
                      </span>
                    )}
                  </div>
                )}

                {/* NEW: Reroute flash badge */}
                {rerouteFlash && (
                  <div className="reroute-badge">
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#A78BFA', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                    Đã tính lại đường đi
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
              {!navigating
                ? <button className="btn-primary" onClick={startNavigation} disabled={!routeCoords.length} style={{ width: 'auto', padding: '9px 16px', fontSize: 13 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="#0D1520"><polygon points="5,3 19,12 5,21" /></svg>
                  Bắt đầu
                </button>
                : <button className="btn-danger" onClick={stopNavigation} style={{ padding: '9px 16px', fontSize: 13 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="4" y="4" width="16" height="16" rx="2" /></svg>
                  Dừng
                </button>
              }
              <button onClick={clearRoute} className="map-fab" style={{ width: 38, height: 38, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
                <IconX size={14} />
              </button>
            </div>
          </div>
        )}

        {routeInfo?.error && (
          <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', background: 'rgba(255,92,122,0.1)', color: '#FF5C7A', padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 20, whiteSpace: 'nowrap', border: '1px solid rgba(255,92,122,0.2)' }}>
            ⚠️ {routeInfo.error}
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return content;
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#080E18' }}>
      <Navbar
        title={<span style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 800 }}>ATM<span style={{ color: '#00C98D' }}>Map</span></span>}
        actions={
          <button onClick={() => navigate('/')} className="btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }}>
            🏠 <span className="hide-sm">Trang chủ</span>
            <style>{`@media(max-width:480px){.hide-sm{display:none}}`}</style>
          </button>
        }
      />
      <div style={{ flex: 1, overflow: 'hidden' }}>{content}</div>
    </div>
  );
}