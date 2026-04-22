import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import atmApi from '../../api/atmApi';

/* ──────────────────────────────────────────────────────────────────────────
   CONFIG — thay YOUR_GOOGLE_MAPS_API_KEY bằng key thật của bạn
   Bật các API trong GCP Console:
     • Maps JavaScript API
     • Directions API
     • (tuỳ chọn) Geocoding API
────────────────────────────────────────────────────────────────────────── */
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
const FALLBACK_CENTER = { lat: 21.0285, lng: 105.8542 }; // Hà Nội

/* ── Bank meta ─────────────────────────────────────────────────────────── */
const BANK_META = {
  Vietcombank: { color: '#007b3e', emoji: '🟢', short: 'VCB' },
  Techcombank: { color: '#d02128', emoji: '🔴', short: 'TCB' },
  BIDV: { color: '#003087', emoji: '🔵', short: 'BIDV' },
  MBBank: { color: '#6c2d91', emoji: '💜', short: 'MB' },
  Agribank: { color: '#e8261a', emoji: '🌾', short: 'AGB' },
};
const BANKS = ['Tất cả', ...Object.keys(BANK_META)];

/* ── Helpers ───────────────────────────────────────────────────────────── */
function getBankKey(atm) {
  for (const k of Object.keys(BANK_META)) {
    if ((atm.name ?? '').toLowerCase().includes(k.toLowerCase()) ||
      (atm.bank ?? '').toLowerCase().includes(k.toLowerCase())) return k;
  }
  return null;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── Load Google Maps script (singleton) ──────────────────────────────── */
function loadGoogleMaps() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(window.google.maps); return; }
    if (document.getElementById('gmap-script')) {
      const iv = setInterval(() => {
        if (window.google?.maps) { clearInterval(iv); resolve(window.google.maps); }
      }, 80);
      return;
    }
    const s = document.createElement('script');
    s.id = 'gmap-script';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry`;
    s.async = true; s.defer = true;
    s.onload = () => resolve(window.google.maps);
    s.onerror = () => reject(new Error('Google Maps load failed'));
    document.head.appendChild(s);
  });
}

/* ── Custom SVG pin (data-URI) ────────────────────────────────────────── */
function makePinSvg(color, label, selected) {
  const W = selected ? 52 : 40;
  const H = selected ? 65 : 50;
  const svg = `
    <svg width="${W}" height="${H}" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
      ${selected ? `<circle cx="20" cy="16" r="26" fill="${color}" opacity="0.16"/>` : ''}
      <path d="M20 1C12.268 1 6 7.268 6 15c0 11 14 34 14 34S34 26 34 15C34 7.268 27.732 1 20 1z"
        fill="${color}" stroke="white" stroke-width="1.8"/>
      <circle cx="20" cy="15" r="8.5" fill="white" opacity="0.95"/>
      <text x="20" y="19" text-anchor="middle" font-size="8.5"
        font-family="Arial,sans-serif" font-weight="800" fill="${color}">${label}</text>
    </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

/* ────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────────────────── */
export default function AtmMapPage({ embedded = false }) {
  const navigate = useNavigate();

  /* ── State — giữ nguyên logic gốc ─────────────────────────────────── */
  const [atms, setAtms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [savedAtms, setSavedAtms] = useState(new Set());

  /* ── Map state ─────────────────────────────────────────────────────── */
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [selectedAtm, setSelectedAtm] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null); // { duration, distance }

  /* ── Filter state ──────────────────────────────────────────────────── */
  const [search, setSearch] = useState('');
  const [filterBank, setFilterBank] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState({ open: true, closed: true });
  const [filterType, setFilterType] = useState('Tất cả');

  /* ── Refs ──────────────────────────────────────────────────────────── */
  const mapDivRef = useRef(null);
  const gMapRef = useRef(null);
  const markersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const dirServiceRef = useRef(null);
  const dirRendererRef = useRef(null);
  const listRef = useRef(null);

  /* ═══════════════════════════════════════════════════════════════════
     1. GPS + Load ATMs  (logic gốc giữ nguyên 100%)
  ═══════════════════════════════════════════════════════════════════ */
  const loadAtms = async (lat, lng) => {
    setLoading(true);
    try {
      const res = await atmApi.getNearby(lat, lng);
      const raw = res.data?.data ?? [];
      const enriched = raw.map(a => {
        const aLat = a.lat ?? a.latitude ?? 0;
        const aLng = a.lng ?? a.longitude ?? 0;
        return {
          ...a,
          bankKey: getBankKey(a),
          distanceKm: haversineKm(lat, lng, aLat, aLng),
        };
      });
      enriched.sort((a, b) => a.distanceKm - b.distanceKm);
      setAtms(enriched);
    } catch {
      setAtms([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocation = useCallback(() => {
    setLoading(true);
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Trình duyệt không hỗ trợ GPS.');
      loadAtms(FALLBACK_CENTER.lat, FALLBACK_CENTER.lng);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        loadAtms(c.lat, c.lng);
        if (gMapRef.current) {
          gMapRef.current.panTo(c);
          gMapRef.current.setZoom(15);
        }
      },
      (err) => {
        setGeoError('Lỗi lấy vị trí: ' + err.message);
        loadAtms(FALLBACK_CENTER.lat, FALLBACK_CENTER.lng);
      },
      { timeout: 8000, enableHighAccuracy: true },
    );
  }, []);

  useEffect(() => {
    fetchLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSavedAtms = async () => {
    try {
      const res = await atmApi.getSaved();
      const savedList = res.data?.data || [];
      setSavedAtms(new Set(savedList.map((atm) => atm.id)));
    } catch (err) {
      console.log('Failed to load saved atms', err);
    }
  };

  useEffect(() => {
    loadSavedAtms();
  }, []);

  /* ═══════════════════════════════════════════════════════════════════
     2. Init Google Map
  ═══════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!mapDivRef.current) return;
    loadGoogleMaps()
      .then((maps) => {
        const center = coords ?? FALLBACK_CENTER;
        const map = new maps.Map(mapDivRef.current, {
          center,
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: { position: maps.ControlPosition.RIGHT_BOTTOM },
          styles: MAP_STYLE,
        });
        gMapRef.current = map;
        dirServiceRef.current = new maps.DirectionsService();
        dirRendererRef.current = new maps.DirectionsRenderer({
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: '#2563eb',
            strokeWeight: 5,
            strokeOpacity: 0.88,
          },
        });
        dirRendererRef.current.setMap(map);
        setMapReady(true);
      })
      .catch(() => setMapError('Không thể tải Google Maps. Kiểm tra API key.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapDivRef.current]);

  /* ═══════════════════════════════════════════════════════════════════
     3. User location marker
  ═══════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!mapReady || !coords) return;
    const maps = window.google.maps;
    if (userMarkerRef.current) userMarkerRef.current.setMap(null);
    userMarkerRef.current = new maps.Marker({
      position: coords,
      map: gMapRef.current,
      title: 'Vị trí của tôi',
      zIndex: 999,
      icon: {
        path: maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#2563eb',
        fillOpacity: 1,
        strokeColor: 'white',
        strokeWeight: 2.5,
      },
    });
    gMapRef.current.panTo(coords);
  }, [mapReady, coords]);

  /* ═══════════════════════════════════════════════════════════════════
     4. Draw ATM markers
  ═══════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!mapReady || atms.length === 0) return;
    const maps = window.google.maps;

    // Xoá markers cũ
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    atms.forEach(atm => {
      const lat = atm.lat ?? atm.latitude;
      const lng = atm.lng ?? atm.longitude;
      if (!lat || !lng) return;

      const meta = BANK_META[atm.bankKey] ?? { color: '#64748b', short: 'ATM' };
      const isOpen = atm.status !== 'closed';
      const color = isOpen ? meta.color : '#9ca3af';
      const label = atm.type === 'Ngân hàng' ? '🏛' : meta.short;

      const marker = new maps.Marker({
        position: { lat, lng },
        map: gMapRef.current,
        title: atm.name,
        zIndex: 10,
        icon: {
          url: makePinSvg(color, label, false),
          anchor: new maps.Point(20, 50),
          scaledSize: new maps.Size(40, 50),
        },
      });

      marker._atm = atm;
      marker.addListener('click', () => handleSelectAtm(atm));
      markersRef.current.push(marker);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, atms]);

  /* ═══════════════════════════════════════════════════════════════════
     5. Highlight selected marker
  ═══════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!mapReady) return;
    const maps = window.google.maps;
    markersRef.current.forEach(m => {
      const atm = m._atm;
      const isSel = atm?.id === selectedAtm?.id;
      const meta = BANK_META[atm?.bankKey] ?? { color: '#64748b', short: 'ATM' };
      const isOpen = atm?.status !== 'closed';
      const color = isOpen ? meta.color : '#9ca3af';
      const label = atm?.type === 'Ngân hàng' ? '🏛' : meta.short;
      m.setIcon({
        url: makePinSvg(color, label, isSel),
        anchor: new maps.Point(isSel ? 26 : 20, isSel ? 65 : 50),
        scaledSize: new maps.Size(isSel ? 52 : 40, isSel ? 65 : 50),
      });
      m.setZIndex(isSel ? 200 : 10);
    });
  }, [mapReady, selectedAtm]);

  /* ═══════════════════════════════════════════════════════════════════
     6. Sync filter → marker visibility
  ═══════════════════════════════════════════════════════════════════ */
  const filtered = atms.filter(a => {
    const q = search.toLowerCase();
    if (q && !(a.name ?? '').toLowerCase().includes(q) &&
      !(a.address ?? '').toLowerCase().includes(q)) return false;
    if (filterBank !== 'Tất cả' && a.bankKey !== filterBank) return false;
    if (!filterStatus.open && a.status !== 'closed') return false;
    if (!filterStatus.closed && a.status === 'closed') return false;
    if (filterType !== 'Tất cả' && a.type !== filterType) return false;
    return true;
  });

  useEffect(() => {
    if (!mapReady) return;
    const ids = new Set(filtered.map(a => a.id));
    markersRef.current.forEach(m => m.setVisible(ids.has(m._atm?.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, mapReady]);

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const handleSelectAtm = useCallback((atm) => {
    setSelectedAtm(atm);
    setRouteInfo(null);
    if (dirRendererRef.current) dirRendererRef.current.setDirections({ routes: [] });
    const lat = atm.lat ?? atm.latitude;
    const lng = atm.lng ?? atm.longitude;
    if (gMapRef.current) gMapRef.current.panTo({ lat, lng });
  }, []);

  const handleRoute = useCallback((atm) => {
    if (!coords || !dirServiceRef.current) return;
    const lat = atm.lat ?? atm.latitude;
    const lng = atm.lng ?? atm.longitude;
    dirServiceRef.current.route(
      {
        origin: coords,
        destination: { lat, lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === 'OK') {
          dirRendererRef.current.setDirections(result);
          const leg = result.routes[0]?.legs[0];
          setRouteInfo({
            duration: leg?.duration?.text ?? '',
            distance: leg?.distance?.text ?? '',
          });
          gMapRef.current.fitBounds(result.routes[0].bounds, { top: 80, bottom: 80, left: 20, right: 20 });
        }
      },
    );
  }, [coords]);

  const handleLocateMe = () => {
    fetchLocation();
  };

  const handleClearRoute = () => {
    if (dirRendererRef.current) dirRendererRef.current.setDirections({ routes: [] });
    setRouteInfo(null);
    setSelectedAtm(null);
  };

  /* ── Distance string helper ────────────────────────────────────────── */
  const distStr = (atm) => {
    if (atm.distanceKm != null)
      return atm.distanceKm < 1
        ? `${Math.round(atm.distanceKm * 1000)} m`
        : `${atm.distanceKm.toFixed(1)} km`;
    return atm.distance ?? '';
  };

  /* ════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════ */
  const content = (
    <div className="map-container" style={{ height: embedded ? '100%' : 'calc(100vh - 60px)', flex: 1 }}>

      <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
          *{box-sizing:border-box;margin:0;padding:0}
          ::-webkit-scrollbar{width:5px}
          ::-webkit-scrollbar-track{background:transparent}
          ::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:10px}
          .atm-card{transition:all .18s}
          .atm-card:hover{background:#f0f9ff!important;box-shadow:0 2px 12px rgba(37,99,235,.1)}
          .atm-card.sel{background:#eff6ff!important;border-color:#3b82f6!important;box-shadow:0 2px 12px rgba(59,130,246,.18)}
          .route-btn{transition:all .15s}
          .route-btn:hover{background:#2563eb!important;color:white!important;border-color:#2563eb!important}
          .map-fab{transition:all .2s}
          .map-fab:hover{background:#f1f5f9!important;transform:scale(1.1);box-shadow:0 6px 18px rgba(0,0,0,.18)!important}
          input:focus,select:focus{outline:none}
          @keyframes popUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
          @keyframes shimmer{0%,100%{opacity:.6}50%{opacity:1}}

          /* Responsive Classes */
          .map-container {
            display: flex;
            width: 100%;
            font-family: 'DM Sans', 'Segoe UI', sans-serif;
            background: #f8f9fa;
            overflow: hidden;
            flex-direction: row;
          }
          .left-panel {
            display: flex;
            flex-direction: column;
            background: white;
            z-index: 10;
            flex-shrink: 0;
            box-shadow: 4px 0 28px rgba(0,0,0,.08);
            width: 420px;
            max-width: 45vw;
            height: 100%;
          }
          .popup-card {
            position: absolute;
            top: 24px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 20;
            background: white;
            border-radius: 18px;
            box-shadow: 0 8px 32px rgba(0,0,0,.16);
            border: 1px solid #e2e8f0;
            animation: popUp .25s cubic-bezier(0.34,1.56,0.64,1);
            min-width: 380px;
            max-width: 480px;
            padding: 24px;
          }
          .route-info-banner {
            position: absolute;
            bottom: 32px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 20;
            background: linear-gradient(135deg,#1e40af,#2563eb);
            color: white;
            border-radius: 18px;
            box-shadow: 0 8px 24px rgba(37,99,235,.45);
            display: flex;
            align-items: center;
            animation: popUp .3s cubic-bezier(0.34,1.56,0.64,1);
            min-width: 380px;
            padding: 16px 24px;
            gap: 18px;
          }

          /* Mobile */
          @media (max-width: 768px) {
            .map-container { flex-direction: column-reverse; }
            .left-panel {
              width: 100%;
              max-width: 100%;
              height: 50%;
              box-shadow: 0 -4px 20px rgba(0,0,0,.1);
              border-top: 1px solid #e2e8f0;
              z-index: 25;
            }
            .popup-card {
              width: calc(100% - 32px);
              min-width: unset;
              max-width: 400px;
              padding: 16px 18px;
            }
            .route-info-banner {
              width: calc(100% - 32px);
              min-width: unset;
              max-width: 400px;
              bottom: unset;
              top: 16px;
              padding: 14px 18px;
              gap: 14px;
            }
            /* Move legend when route banner is on top in mobile */
            .map-legend { bottom: 24px !important; }
            /* Adjust FAB */
            .fab-container { top: 90px !important; right: 12px !important; }
          }
        `}</style>

      {/* ══ LEFT PANEL ═══════════════════════════════════════════════ */}
      <div className="left-panel">

        {/* Header */}
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg,#1d4ed8,#2563eb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20
            }}>🏧</div>
            <div>
              <div style={{
                fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 22,
                color: '#0f172a', lineHeight: 1
              }}>
                ATM<span style={{ color: '#2563eb' }}>Map</span>
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                {loading ? 'Đang tìm kiếm...' : `${filtered.length} địa điểm`}
              </div>
            </div>
            <button onClick={fetchLocation} style={{
              marginLeft: 'auto', background: '#eff6ff', color: '#2563eb',
              border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 12px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all .2s'
            }}>
              <span>📍</span> Lấy vị trí
            </button>
          </div>

          {/* GPS warning */}
          {geoError && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a',
              borderRadius: 10, padding: '8px 12px', fontSize: 11,
              color: '#92400e', marginBottom: 12
            }}>
              📍 {geoError}
            </div>
          )}

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12
          }}>
            <span style={{ fontSize: 14, color: '#94a3b8', flexShrink: 0 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Tìm kiếm tên ngân hàng hoặc địa điểm..."
              style={{
                flex: 1, border: 'none', background: 'transparent',
                fontSize: 12.5, color: '#0f172a', fontFamily: 'inherit'
              }} />
            {search && (
              <button onClick={() => setSearch('')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 16, color: '#94a3b8', padding: 0, lineHeight: 1
                }}>×</button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div style={{ padding: '12px 18px 14px', borderBottom: '1px solid #f1f5f9' }}>
          {/* Bank */}
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: '#64748b',
              letterSpacing: '.6px', marginBottom: 6, textTransform: 'uppercase'
            }}>Ngân hàng</div>
            <div style={{ position: 'relative' }}>
              <select value={filterBank} onChange={e => setFilterBank(e.target.value)}
                style={{
                  width: '100%', padding: '8px 32px 8px 10px', borderRadius: 10,
                  border: '1.5px solid #e2e8f0', background: '#f8fafc',
                  fontSize: 13, color: '#0f172a', fontFamily: 'inherit',
                  cursor: 'pointer', appearance: 'none'
                }}>
                {BANKS.map(b => <option key={b}>{b}</option>)}
              </select>
              <span style={{
                position: 'absolute', right: 10, top: '50%',
                transform: 'translateY(-50%)', pointerEvents: 'none',
                fontSize: 10, color: '#94a3b8'
              }}>▾</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 18 }}>
            {/* Status */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: '#64748b',
                letterSpacing: '.6px', marginBottom: 7, textTransform: 'uppercase'
              }}>Trạng thái</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[['open', 'Đang hoạt động', '#16a34a'], ['closed', 'Đã đóng cửa', '#dc2626']].map(([k, lbl, col]) => (
                  <label key={k} onClick={() => setFilterStatus(s => ({ ...s, [k]: !s[k] }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      fontSize: 12, color: '#374151', cursor: 'pointer', userSelect: 'none'
                    }}>
                    <div style={{
                      width: 15, height: 15, borderRadius: 4, flexShrink: 0, transition: 'all .15s',
                      border: `2px solid ${filterStatus[k] ? col : '#d1d5db'}`,
                      background: filterStatus[k] ? col : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {filterStatus[k] && <span style={{ color: 'white', fontSize: 8, fontWeight: 900 }}>✓</span>}
                    </div>
                    {lbl}
                  </label>
                ))}
              </div>
            </div>

            {/* Type */}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: '#64748b',
                letterSpacing: '.6px', marginBottom: 7, textTransform: 'uppercase'
              }}>Loại hình</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {['Tất cả', 'Cây ATM', 'Ngân hàng'].map(t => (
                  <label key={t} onClick={() => setFilterType(t)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      fontSize: 12, color: '#374151', cursor: 'pointer', userSelect: 'none'
                    }}>
                    <div style={{
                      width: 15, height: 15, borderRadius: '50%', flexShrink: 0, transition: 'all .15s',
                      border: `2px solid ${filterType === t ? '#2563eb' : '#d1d5db'}`,
                      background: filterType === t ? '#2563eb' : 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {filterType === t && <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'white' }} />}
                    </div>
                    {t}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* List header */}
        <div style={{
          padding: '9px 18px 4px', display: 'flex',
          alignItems: 'center', justifyContent: 'space-between'
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: '#374151',
            textTransform: 'uppercase', letterSpacing: '.5px'
          }}>Kết quả</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{filtered.length} địa điểm</span>
        </div>

        {/* ATM List */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 16px' }}>

          {/* Skeleton */}
          {loading && Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{
              background: '#f8fafc', borderRadius: 14, padding: 14,
              marginBottom: 8, height: 96, animation: `shimmer 1.4s ease-in-out ${i * 0.12}s infinite`
            }} />
          ))}

          {/* Empty */}
          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 44 }}>🗺️</div>
              <div style={{ fontSize: 13, marginTop: 10 }}>Không tìm thấy địa điểm nào</div>
            </div>
          )}

          {/* Cards */}
          {!loading && filtered.map(atm => {
            const meta = BANK_META[atm.bankKey] ?? { color: '#64748b', emoji: '🏧' };
            const isOpen = atm.status !== 'closed';
            const isSel = selectedAtm?.id === atm.id;

            return (
              <div key={atm.id}
                className={`atm-card${isSel ? ' sel' : ''}`}
                onClick={() => handleSelectAtm(atm)}
                style={{
                  background: isSel ? '#eff6ff' : 'white',
                  border: `1.5px solid ${isSel ? '#3b82f6' : '#e2e8f0'}`,
                  borderRadius: 14, padding: '11px 13px', marginBottom: 8,
                  cursor: 'pointer', animation: 'popUp .22s ease forwards'
                }}>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                    background: meta.color + '1a', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 19
                  }}>
                    {meta.emoji}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.3,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160
                      }}>
                        {atm.name}
                      </div>
                      <span style={{
                        fontSize: 11, color: '#2563eb', fontWeight: 600,
                        flexShrink: 0, fontFamily: 'monospace'
                      }}>
                        {distStr(atm)}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 11, color: '#64748b', marginTop: 3, marginBottom: 6,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {atm.address}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        background: isOpen ? '#dcfce7' : '#fee2e2',
                        color: isOpen ? '#16a34a' : '#dc2626'
                      }}>
                        ● {isOpen ? 'Đang hoạt động' : 'Đã đóng cửa'}
                      </span>
                      {atm.open && (
                        <span style={{ fontSize: 10, color: '#94a3b8' }}>🕐 {atm.open}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chỉ đường button */}
                <button className="route-btn"
                  onClick={e => { e.stopPropagation(); handleSelectAtm(atm); handleRoute(atm); }}
                  style={{
                    width: '100%', marginTop: 9, padding: '7px', borderRadius: 9,
                    border: '1.5px solid #e2e8f0', background: 'white',
                    fontSize: 12, fontWeight: 600, color: '#374151', cursor: 'pointer',
                    fontFamily: 'inherit', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', gap: 5
                  }}>
                  🧭 Chỉ đường
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ RIGHT: Google Map ══════════════════════════════════════════ */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Map div — Google Maps renders here */}
        <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

        {/* Map load error */}
        {mapError && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: '#f1f5f9', flexDirection: 'column', gap: 12
          }}>
            <span style={{ fontSize: 44 }}>🗺️</span>
            <p style={{ color: '#64748b', fontSize: 14 }}>{mapError}</p>
          </div>
        )}

        {/* FAB top-right */}
        <div className="fab-container" style={{
          position: 'absolute', top: 24, right: 24,
          display: 'flex', flexDirection: 'column', gap: 10, zIndex: 15, transition: 'top .3s'
        }}>
          <button className="map-fab" onClick={handleLocateMe} title="Vị trí của tôi"
            style={{
              width: 48, height: 48, borderRadius: '50%', border: '1.5px solid #e2e8f0',
              background: 'white', fontSize: 20, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,.12)'
            }}>🎯</button>
          <button className="map-fab" title="Xem bản đồ"
            style={{
              width: 48, height: 48, borderRadius: '50%', border: '1.5px solid #e2e8f0',
              background: 'white', fontSize: 20, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,.12)'
            }}>🗺️</button>
        </div>

        {/* Legend */}
        <div className="map-legend" style={{
          position: 'absolute', bottom: routeInfo ? 100 : 32, right: 24,
          background: 'white', borderRadius: 14, padding: '14px 18px',
          boxShadow: '0 4px 16px rgba(0,0,0,.1)', border: '1px solid #e2e8f0',
          zIndex: 10, transition: 'bottom .3s'
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: '#64748b',
            textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 7
          }}>Chú thích</div>
          {[['#16a34a', 'Đang hoạt động'], ['#9ca3af', 'Đã đóng cửa'], ['#2563eb', 'Vị trí của tôi']].map(([col, lbl]) => (
            <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: col, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#374151' }}>{lbl}</span>
            </div>
          ))}
        </div>

        {/* ── Selected ATM Popup (top-center) ─────────────────────── */}
        {selectedAtm && (
          <div className="popup-card">
            <button onClick={handleClearRoute}
              style={{
                position: 'absolute', top: 12, right: 16, background: 'none',
                border: 'none', fontSize: 24, cursor: 'pointer', color: '#9ca3af', lineHeight: 1
              }}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: (BANK_META[selectedAtm.bankKey]?.color ?? '#64748b') + '1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
              }}>
                {BANK_META[selectedAtm.bankKey]?.emoji ?? '🏧'}
              </div>
              <div style={{ minWidth: 0, paddingRight: 24 }}>
                <div className="popup-title" style={{
                  fontWeight: 700, fontSize: 16, color: '#111', lineHeight: 1.3,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%'
                }}>
                  {selectedAtm.name}
                </div>
                <div className="popup-address" style={{
                  fontSize: 13, color: '#6b7280', marginTop: 4,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {selectedAtm.address}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
              <button
                onClick={async () => {
                  if (savedAtms.has(selectedAtm.id)) {
                    await atmApi.unsaveAtm(selectedAtm.id);
                    setSavedAtms(prev => { const next = new Set(prev); next.delete(selectedAtm.id); return next; });
                  } else {
                    await atmApi.saveAtm({
                      atmId: selectedAtm.id,
                      name: selectedAtm.name,
                      address: selectedAtm.address,
                      lat: selectedAtm.lat ?? selectedAtm.latitude,
                      lng: selectedAtm.lng ?? selectedAtm.longitude,
                      bankKey: selectedAtm.bankKey
                    });
                    setSavedAtms(prev => new Set([...prev, selectedAtm.id]));
                  }
                }}
                style={{
                  padding: '4px 12px', borderRadius: 20, border: '1px solid #e5e7eb',
                  background: savedAtms.has(selectedAtm.id) ? '#fef08a' : '#fff',
                  cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#374151',
                  display: 'flex', alignItems: 'center', gap: 4
                }}>
                {savedAtms.has(selectedAtm.id) ? '⭐ Đã lưu' : '☆ Lưu'}
              </button>

              <span style={{
                fontSize: 13, fontWeight: 600, padding: '4px 12px', borderRadius: 20,
                background: selectedAtm.status !== 'closed' ? '#dcfce7' : '#fee2e2',
                color: selectedAtm.status !== 'closed' ? '#16a34a' : '#dc2626',
                display: 'flex', alignItems: 'center'
              }}>
                ● {selectedAtm.status !== 'closed' ? 'Đang hoạt động' : 'Đã đóng cửa'}
              </span>
              {selectedAtm.open && (
                <span style={{ fontSize: 13, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
                  🕐 {selectedAtm.open}
                </span>
              )}
            </div>

            <button className="popup-btn" onClick={() => handleRoute(selectedAtm)}
              style={{
                width: '100%', padding: '12px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg,#f97316,#ea580c)',
                color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 4px 12px rgba(249,115,22,.4)', fontFamily: 'inherit'
              }}>
              🧭 Chỉ đường đến đây
            </button>
          </div>
        )}

        {/* ── Route info banner (bottom-center) ───────────────────── */}
        {routeInfo && (
          <div className="route-info-banner">
            <span style={{ fontSize: 32 }}>🧭</span>
            <div>
              <div style={{ fontSize: 12, opacity: .75 }}>Đường đến</div>
              <div className="route-title" style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>
                {selectedAtm?.name}
              </div>
              <div className="route-desc" style={{ fontSize: 14, opacity: .9, marginTop: 4 }}>
                {routeInfo.duration} · {routeInfo.distance}
              </div>
            </div>
            <button onClick={handleClearRoute}
              style={{
                marginLeft: 'auto', background: 'rgba(255,255,255,.15)',
                border: 'none', color: 'white', borderRadius: '50%',
                width: 36, height: 36, cursor: 'pointer', fontSize: 20, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>×</button>
          </div>
        )}
      </div>
    </div>
  );

  /* ── embedded mode vs full page ───────────────────────────────────── */
  if (embedded) return content;

  return (
    <div className="page active" id="page-atm" style={{ paddingBottom: 0, height: '100vh', overflow: 'hidden' }}>
      <Navbar
        title={<>ATM<span style={{ color: '#2563eb' }}>Map</span></>}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => navigate('/')}
              style={{
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                color: 'var(--text)', padding: '6px 12px', borderRadius: '8px',
                fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px',
                cursor: 'pointer'
              }}>
              <span style={{ fontSize: 16 }}>🏠</span> <span>Về trang chủ</span>
            </button>
          </div>
        }
      />
      {content}
    </div>
  );
}

/* ── Google Maps custom style (warm clean light) ─────────────────────── */
const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f5f0e8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f0e8' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b7280' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e5e7eb' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#fef9c3' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#fde68a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#bfdbfe' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#93c5fd' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#ecfdf5' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d1fae5' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#e2e8f0' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d1d5db' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.text', stylers: [{ visibility: 'off' }] },
];