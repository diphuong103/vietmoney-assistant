import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import atmApi from '../../api/atmApi';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';

const MAPTILES_KEY = import.meta.env.VITE_GOONG_MAPTILES_KEY || '';
const FALLBACK_CENTER = { lat: 21.0285, lng: 105.8542 };

/* ── Bank metadata ───────────────────────────────────MAPTILES_KEY───────────────────── */
const BANK_META = {
  Vietcombank: { color: '#007b3e', emoji: '🟢', short: 'VCB', bg: '#dcfce7' },
  Techcombank: { color: '#d02128', emoji: '🔴', short: 'TCB', bg: '#fee2e2' },
  BIDV: { color: '#003087', emoji: '🔵', short: 'BIDV', bg: '#dbeafe' },
  MBBank: { color: '#6c2d91', emoji: '💜', short: 'MB', bg: '#ede9fe' },
  Agribank: { color: '#b45309', emoji: '🌾', short: 'AGB', bg: '#fef3c7' },
  TPBank: { color: '#7c3aed', emoji: '💛', short: 'TPB', bg: '#f5f3ff' },
  VPBank: { color: '#1a7f5e', emoji: '🌿', short: 'VPB', bg: '#d1fae5' },
  HDBank: { color: '#0ea5e9', emoji: '🩵', short: 'HDB', bg: '#e0f2fe' },
  ACB: { color: '#d97706', emoji: '🟡', short: 'ACB', bg: '#fffbeb' },
  Sacombank: { color: '#ef4444', emoji: '❤️', short: 'STB', bg: '#fee2e2' },
  VIB: { color: '#3b82f6', emoji: '💙', short: 'VIB', bg: '#eff6ff' },
  MSB: { color: '#0891b2', emoji: '🌊', short: 'MSB', bg: '#e0f2fe' },
  SeABank: { color: '#e11d48', emoji: '🌸', short: 'SEA', bg: '#fff1f2' },
  OCB: { color: '#16a34a', emoji: '🍃', short: 'OCB', bg: '#f0fdf4' },
  VietinBank: { color: '#dc2626', emoji: '🏛️', short: 'CTG', bg: '#fee2e2' },
};
const BANKS = ['Tất cả', ...Object.keys(BANK_META)];

function getBankKey(atm) {
  if (atm.bankKey && BANK_META[atm.bankKey]) return atm.bankKey;
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
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function decodePolyline(encoded) {
  const coords = [];
  let index = 0, lat = 0, lng = 0;
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

function createMarkerEl(color, label, selected = false) {
  const size = selected ? 56 : 42;
  const el = document.createElement('div');
  el.style.cssText = `width:${size}px;height:${size * 1.3}px;cursor:pointer;transition:all .2s cubic-bezier(.34,1.56,.64,1);`;
  const shadow = selected ? `filter:drop-shadow(0 4px 12px ${color}88)` : `filter:drop-shadow(0 2px 6px ${color}55)`;
  el.innerHTML = `
    <svg width="${size}" height="${size * 1.3}" viewBox="0 0 42 55" xmlns="http://www.w3.org/2000/svg" style="${shadow}">
      ${selected ? `<circle cx="21" cy="17" r="28" fill="${color}" opacity="0.15"/>` : ''}
      <path d="M21 2C12.716 2 6 8.716 6 17c0 12 15 36 15 36S36 29 36 17C36 8.716 29.284 2 21 2z"
        fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="21" cy="16" r="9.5" fill="white" opacity="0.97"/>
      <text x="21" y="20.5" text-anchor="middle" font-size="${label.length > 3 ? 7 : 8.5}"
        font-family="'DM Sans',Arial,sans-serif" font-weight="900" fill="${color}">${label}</text>
    </svg>`;
  return el;
}

/* ─────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
──────────────────────────────────────────────────────────────────────────── */
export default function AtmMapPage({ embedded = false }) {
  const navigate = useNavigate();

  const [atms, setAtms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords] = useState(null);
  const [geoError, setGeoError] = useState('');
  const [geoLoading, setGeoLoading] = useState(false);
  const [savedAtms, setSavedAtms] = useState(new Set());
  const [isMockData, setIsMockData] = useState(false);

  const [mapReady, setMapReady] = useState(false);
  const [selectedAtm, setSelectedAtm] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [travelMode, setTravelMode] = useState('car');

  /* ── Search & Autocomplete ─────────────────────────────────────── */
  const [search, setSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const searchRef = useRef(null);
  const suggestTimer = useRef(null);

  /* ── Filter ────────────────────────────────────────────────────── */
  const [filterBank, setFilterBank] = useState('Tất cả');
  const [filterStatus, setFilterStatus] = useState({ open: true, closed: true });
  const [filterType, setFilterType] = useState('Tất cả');
  const [showFilters, setShowFilters] = useState(false);

  /* ── New: Radius / Panel / Hover ────────────────────────────────── */
  const [searchRadius, setSearchRadius] = useState(10000); // default 10 km
  const [panelMinimized, setPanelMinimized] = useState(false);
  const [hoveredAtmId, setHoveredAtmId] = useState(null);

  /* ── Nearest ATM ID ─────────────────────────────────────────────── */
  const nearestAtmId = useMemo(() => atms.length > 0 ? atms[0].id : null, [atms]);

  /* ── Mobile Responsive State ───────────────────────────────────── */
  const [showLeftPanel, setShowLeftPanel] = useState(window.innerWidth > 768);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setShowLeftPanel(true);
      } else {
        if (!selectedAtm) {
          // Keep the left panel collapsed by default on mobile unless they are already viewing something
        }
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedAtm]);

  const mapDivRef = useRef(null);
  const gMapRef = useRef(null);
  const markersRef = useRef({});
  const clustersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const listRef = useRef(null);
  const mapCentered = useRef(false); // prevent flyTo after first lock
  const customPlaceMarkerRef = useRef(null);
  const panCenterRef = useRef(null);  // last fetch center for pan-threshold
  const panTimerRef = useRef(null);   // debounce timer for pan re-fetch

  /* ── Pan re-fetch state ──────────────────────────────────────────── */
  const [panLoading, setPanLoading] = useState(false);

  /* ── Travel mode collapsed ──────────────────────────────────────── */
  const [travelCollapsed, setTravelCollapsed] = useState(false);

  /* ════════════════════════════════════════════════════════════════════
     1. Load ATMs từ backend
  ════════════════════════════════════════════════════════════════════ */
  const loadAtms = useCallback(async (lat, lng, radius) => {
    setLoading(true);
    try {
      const res = await atmApi.getNearby(lat, lng, radius ?? searchRadius);
      const raw = res.data?.data ?? [];
      const hasMock = raw.some(a => a.isMock);
      setIsMockData(hasMock);
      const enriched = raw.map(a => {
        const aLat = a.lat ?? a.latitude ?? 0;
        const aLng = a.lng ?? a.longitude ?? 0;
        return { ...a, bankKey: a.bankKey || getBankKey(a), distanceKm: haversineKm(lat, lng, aLat, aLng) };
      });
      enriched.sort((a, b) => a.distanceKm - b.distanceKm);
      setAtms(enriched);
    } catch {
      setAtms([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchRadius]);

  /* ════════════════════════════════════════════════════════════════════
     2. GPS Location — stable, no-jump strategy
  ════════════════════════════════════════════════════════════════════ */
  const applyPosition = useCallback((pos, forceCenter = false) => {
    const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setCoords(c);
    setGeoLoading(false);
    setGeoError('');
    loadAtms(c.lat, c.lng);
    // Seed panCenterRef so the first pan is measured from GPS location
    panCenterRef.current = { lat: c.lat, lng: c.lng };
    // Only fly to location on first lock OR when user explicitly clicks GPS button
    if (gMapRef.current && (!mapCentered.current || forceCenter)) {
      mapCentered.current = true;
      gMapRef.current.flyTo({ center: [c.lng, c.lat], zoom: 16.5, speed: 1.4 });
    }
  }, [loadAtms]);

  const fetchLocation = useCallback((forceCenter = true) => {
    setGeoLoading(true);
    setGeoError('');
    if (!navigator.geolocation) {
      setGeoError('Trình duyệt không hỗ trợ GPS.');
      setGeoLoading(false);
      loadAtms(FALLBACK_CENTER.lat, FALLBACK_CENTER.lng);
      return;
    }

    let settled = false;

    // Strategy 1: Cached position — instant display (max 60s old)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!settled) {
          settled = true;
          applyPosition(pos, forceCenter);
        }
      },
      () => { /* ignore cache miss */ },
      { maximumAge: 60_000, timeout: 0 },
    );

    // Strategy 2: Fresh high-accuracy GPS (15s timeout)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        settled = true;
        applyPosition(pos, forceCenter);
      },
      () => {
        // Strategy 3: Fallback low accuracy (WiFi/cell)
        navigator.geolocation.getCurrentPosition(
          (pos) => { if (!settled) { settled = true; applyPosition(pos, forceCenter); } },
          (err) => {
            if (!settled) {
              settled = true;
              setGeoError('Không thể lấy vị trí: ' + err.message);
              setGeoLoading(false);
              loadAtms(FALLBACK_CENTER.lat, FALLBACK_CENTER.lng);
            }
          },
          { enableHighAccuracy: false, timeout: 10_000, maximumAge: 120_000 },
        );
      },
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
    );
  }, [loadAtms, applyPosition]);

  useEffect(() => { fetchLocation(); }, [fetchLocation]);
  useEffect(() => {
    (async () => {
      try {
        const res = await atmApi.getSaved();
        setSavedAtms(new Set((res.data?.data || []).map(a => a.id)));
      } catch { /* ignore */ }
    })();
  }, []);

  /* ── Re-fetch when radius changes ─────────────────────────────── */
  const radiusTimer = useRef(null);
  const handleRadiusChange = useCallback((val) => {
    setSearchRadius(val);
    clearTimeout(radiusTimer.current);
    radiusTimer.current = setTimeout(() => {
      const c = coords ?? FALLBACK_CENTER;
      loadAtms(c.lat, c.lng, val);
    }, 400);
  }, [coords, loadAtms]);

  /* ════════════════════════════════════════════════════════════════════
     3. Init Goong Map
  ════════════════════════════════════════════════════════════════════ */
  useEffect(() => {
    if (!mapDivRef.current || gMapRef.current) return;

    // Guard: không có key thì không khởi tạo map
    if (!MAPTILES_KEY) {
      setLoading(false);
      return;
    }

    goongjs.accessToken = MAPTILES_KEY;

    const center = coords ?? FALLBACK_CENTER;
    const map = new goongjs.Map({
      container: mapDivRef.current,
      style: 'https://tiles.goong.io/assets/goong_map_web.json',
      center: [center.lng, center.lat],
      zoom: 14,
    });

    map.addControl(new goongjs.NavigationControl(), 'bottom-right');
    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
      });
      map.addLayer({
        id: 'route-line', type: 'line', source: 'route',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#2563eb', 'line-width': 5, 'line-opacity': 0.9 }
      });
      gMapRef.current = map;
      setMapReady(true);

      // ── Radius circle source + layers ──
      map.addSource('radius-circle', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'Point', coordinates: [center.lng, center.lat] } }
      });
      // Filled circle
      map.addLayer({
        id: 'radius-fill', type: 'circle', source: 'radius-circle',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['zoom'],
            10, 1, 12, 30, 14, 100, 16, 400, 18, 1600
          ],
          'circle-color': '#2563eb',
          'circle-opacity': 0.06,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#2563eb',
          'circle-stroke-opacity': 0.35
        }
      }, 'route-line'); // insert below route layer

      // ── Map pan/drag re-fetch: moveend + 500m threshold + 800ms debounce ──
      map.on('moveend', () => {
        const center = map.getCenter();
        const newLat = center.lat, newLng = center.lng;
        const prev = panCenterRef.current;
        if (prev) {
          // Haversine approx distance (degrees) — quick check before fetch
          const dLat = (newLat - prev.lat) * Math.PI / 180;
          const dLng = (newLng - prev.lng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(prev.lat * Math.PI / 180) * Math.cos(newLat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
          const distKm = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          if (distKm < 0.5) return; // < 500m, skip
        }
        clearTimeout(panTimerRef.current);
        panTimerRef.current = setTimeout(() => {
          panCenterRef.current = { lat: newLat, lng: newLng };
          setPanLoading(true);
          loadAtms(newLat, newLng).finally(() => setPanLoading(false));
        }, 800);
      });
    });

    return () => { try { map.remove(); } catch { /**/ } };
  }, [mapDivRef.current]);

  /* ── User location marker ─────────────────────────────────────── */
  useEffect(() => {
    if (!mapReady || !coords || !gMapRef.current) return;
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="position:relative; width:22px; height:22px;">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:40px;height:40px;border-radius:50%;border:2.5px solid rgba(37,99,235,0.4);animation:pulseRing 1.8s ease-out infinite;pointer-events:none;"></div>
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:16px;height:16px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(37,99,235,.65);"></div>
      </div>
    `;
    if (userMarkerRef.current) userMarkerRef.current.remove();
    userMarkerRef.current = new goongjs.Marker({ element: el }).setLngLat([coords.lng, coords.lat]).addTo(gMapRef.current);
  }, [mapReady, coords]);

  /* ── Update radius circle on map when coords or radius changes ────── */
  useEffect(() => {
    if (!mapReady || !gMapRef.current) return;
    const map = gMapRef.current;
    if (!map.getSource('radius-circle')) return;

    const center = coords ?? FALLBACK_CENTER;
    // Build a GeoJSON Polygon circle (64 points) for accurate km radius
    const radiusKm = searchRadius / 1000;
    const points = 64;
    const coords2Rad = (deg) => deg * Math.PI / 180;
    const distanceX = radiusKm / (111.32 * Math.cos(coords2Rad(center.lat)));
    const distanceY = radiusKm / 110.574;
    const circleCoords = [];
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      circleCoords.push([
        center.lng + distanceX * Math.cos(angle),
        center.lat + distanceY * Math.sin(angle),
      ]);
    }

    // Swap source to Polygon-based for accurate km display
    try {
      if (!map.getLayer('radius-border')) {
        // Re-add as fill layer if not present
        map.removeLayer('radius-fill');
        map.removeSource('radius-circle');
        map.addSource('radius-circle', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [circleCoords] }
          }
        });
        map.addLayer({
          id: 'radius-fill', type: 'fill', source: 'radius-circle',
          paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.06 }
        }, 'route-line');
        map.addLayer({
          id: 'radius-border', type: 'line', source: 'radius-circle',
          paint: {
            'line-color': '#2563eb',
            'line-width': 2,
            'line-opacity': 0.45,
            'line-dasharray': [4, 3]
          }
        }, 'route-line');
      } else {
        // Just update data
        map.getSource('radius-circle').setData({
          type: 'Feature',
          geometry: { type: 'Polygon', coordinates: [circleCoords] }
        });
      }
    } catch { /* map not ready */ }
  }, [mapReady, coords, searchRadius]);



  /* ── Custom Place Marker ────────────────────────────────────────── */
  useEffect(() => {
    if (!mapReady || !gMapRef.current || !selectedAtm?.isCustomPlace) {
      if (customPlaceMarkerRef.current) {
        customPlaceMarkerRef.current.remove();
        customPlaceMarkerRef.current = null;
      }
      return;
    }
    const color = '#ef4444'; // Red marker for custom searched places
    const el = createMarkerEl(color, '📌', true);
    customPlaceMarkerRef.current = new goongjs.Marker({ element: el })
      .setLngLat([selectedAtm.lng, selectedAtm.lat])
      .addTo(gMapRef.current);

    return () => {
      if (customPlaceMarkerRef.current) {
        customPlaceMarkerRef.current.remove();
        customPlaceMarkerRef.current = null;
      }
    };
  }, [mapReady, selectedAtm]);

  /* ── Draw ATM markers + clustering ─────────────────────────────── */
  useEffect(() => {
    if (!mapReady || !gMapRef.current) return;
    Object.values(markersRef.current).forEach(({ marker }) => marker.remove());
    markersRef.current = {};
    // Remove old clusters
    clustersRef.current.forEach(c => c.remove());
    clustersRef.current = [];

    const bounds = [];
    atms.forEach(atm => {
      const lat = atm.lat ?? atm.latitude;
      const lng = atm.lng ?? atm.longitude;
      if (!lat || !lng) return;
      const atmKey = atm.placeId ?? atm.id; // ← stable unique key
      bounds.push([lng, lat]);
      const isNearest = atmKey === nearestAtmId;
      const meta = BANK_META[atm.bankKey] ?? { color: '#64748b', short: 'ATM' };
      const color = atm.status !== 'closed' ? meta.color : '#9ca3af';
      const label = atm.type === 'Ngân hàng' ? '🏦' : (meta.short ?? 'ATM');
      const el = createMarkerEl(color, label, false);
      if (isNearest) {
        el.style.animation = 'pulseNearest 2s ease-in-out infinite';
        el.style.zIndex = '100';
      }
      const marker = new goongjs.Marker({ element: el }).setLngLat([lng, lat]).addTo(gMapRef.current);
      el.addEventListener('click', (e) => { e.stopPropagation(); handleSelectAtm(atm); });
      el.addEventListener('mouseenter', () => setHoveredAtmId(atmKey));
      el.addEventListener('mouseleave', () => setHoveredAtmId(null));
      markersRef.current[atmKey] = { marker, el, atm };
    });

    // ── DOM-based clustering for >20 markers ──
    if (atms.length > 20 && gMapRef.current) {
      const map = gMapRef.current;
      const updateClusters = () => {
        clustersRef.current.forEach(c => c.remove());
        clustersRef.current = [];
        const GRID = 60;
        const cells = {};
        Object.values(markersRef.current).forEach(({ marker, el, atm }) => {
          if (el.style.display === 'none') return;
          const pos = map.project(marker.getLngLat());
          const key = `${Math.floor(pos.x / GRID)}_${Math.floor(pos.y / GRID)}`;
          if (!cells[key]) cells[key] = [];
          cells[key].push({ marker, el, atm, pos });
        });
        Object.values(cells).forEach(group => {
          if (group.length < 3) {
            group.forEach(g => { g.el.style.display = ''; });
            return;
          }
          let avgLng = 0, avgLat = 0;
          group.forEach(g => {
            g.el.style.display = 'none';
            const ll = g.marker.getLngLat();
            avgLng += ll.lng; avgLat += ll.lat;
          });
          avgLng /= group.length; avgLat /= group.length;
          const clEl = document.createElement('div');
          clEl.style.cssText = `width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;display:flex;align-items:center;justify-content:center;font-family:'DM Sans',sans-serif;font-weight:800;font-size:15px;border:3px solid white;box-shadow:0 4px 16px rgba(37,99,235,.35);cursor:pointer;transition:all .2s;`;
          clEl.textContent = group.length;
          clEl.addEventListener('mouseenter', () => { clEl.style.transform = 'scale(1.15)'; });
          clEl.addEventListener('mouseleave', () => { clEl.style.transform = 'scale(1)'; });
          clEl.addEventListener('click', () => {
            map.flyTo({ center: [avgLng, avgLat], zoom: Math.min(map.getZoom() + 2, 18), speed: 1.2 });
          });
          const clMarker = new goongjs.Marker({ element: clEl }).setLngLat([avgLng, avgLat]).addTo(map);
          clustersRef.current.push(clMarker);
        });
      };
      map.on('zoom', updateClusters);
      map.on('move', updateClusters);
      updateClusters();
      const cleanup = () => { map.off('zoom', updateClusters); map.off('move', updateClusters); };
      markersRef.current._clusterCleanup = cleanup;
    }

    return () => {
      if (markersRef.current._clusterCleanup) markersRef.current._clusterCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, atms, nearestAtmId]);

  /* ── Highlight selected / hovered marker ────────────────────────── */
  useEffect(() => {
    if (!mapReady) return;
    const selKey = selectedAtm ? (selectedAtm.placeId ?? selectedAtm.id) : null;
    Object.values(markersRef.current).forEach(({ el, atm }) => {
      if (!atm) return;
      const atmKey = atm.placeId ?? atm.id;
      const isSel = atmKey === selKey;
      const isHov = atmKey === hoveredAtmId;
      const isNearest = atmKey === nearestAtmId;
      const meta = BANK_META[atm.bankKey] ?? { color: '#64748b', short: 'ATM' };
      const color = atm.status !== 'closed' ? meta.color : '#9ca3af';
      const label = atm.type === 'Ngân hàng' ? '🏦' : (meta.short ?? 'ATM');
      const size = isSel ? 52 : isHov ? 48 : 40;
      el.style.width = `${size}px`;
      el.style.height = `${size * 1.25}px`;
      el.style.zIndex = isSel ? '200' : isHov ? '150' : isNearest ? '100' : '10';
      el.style.transition = 'all .2s cubic-bezier(.34,1.56,.64,1)';
      el.innerHTML = createMarkerEl(color, label, isSel).innerHTML;
    });
  }, [mapReady, selectedAtm, hoveredAtmId, nearestAtmId]);


  /* ── Filter ATMs ──────────────────────────────────────────────── */
  const filtered = atms.filter(a => {
    const q = search.toLowerCase();
    if (q && !(a.name ?? '').toLowerCase().includes(q) && !(a.address ?? '').toLowerCase().includes(q)) return false;
    if (filterBank !== 'Tất cả' && a.bankKey !== filterBank) return false;
    if (!filterStatus.open && a.status !== 'closed') return false;
    if (!filterStatus.closed && a.status === 'closed') return false;
    if (filterType !== 'Tất cả' && a.type !== filterType) return false;
    return true;
  });

  useEffect(() => {
    if (!mapReady) return;
    const keys = new Set(filtered.map(a => a.placeId ?? a.id));
    Object.values(markersRef.current).forEach(({ marker, atm }) => {
      const atmKey = atm?.placeId ?? atm?.id;
      marker.getElement().style.display = keys.has(atmKey) ? '' : 'none';
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, mapReady]);



  /* ════════════════════════════════════════════════════════════════════
     Handlers
  ════════════════════════════════════════════════════════════════════ */
  const handleSelectAtm = useCallback(async (atm) => {
    setRouteInfo(null);
    setShowSuggestions(false);
    if (window.innerWidth <= 768) setShowLeftPanel(false);
    if (gMapRef.current?.getSource?.('route')) {
      gMapRef.current.getSource('route').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
    }

    // ── Enrich lat/lng if missing (ATM from AutoComplete only) ──
    let enrichedAtm = atm;
    if ((atm.lat == null || atm.lng == null) && atm.placeId) {
      try {
        const res = await atmApi.getPlaceDetail(atm.placeId);
        const loc = res.data?.data?.geometry?.location ?? res.data?.data;
        const lat = loc?.lat;
        const lng = loc?.lng;
        if (lat && lng) {
          enrichedAtm = { ...atm, lat, lng };
          // Update the atm in the list state too
          setAtms(prev => prev.map(a =>
            a.placeId === atm.placeId ? { ...a, lat, lng } : a
          ));
        }
      } catch { /* fallback: use atm as-is */ }
    }

    setSelectedAtm(enrichedAtm);

    const lat = enrichedAtm.lat ?? enrichedAtm.latitude;
    const lng = enrichedAtm.lng ?? enrichedAtm.longitude;
    if (gMapRef.current && lat && lng) {
      if (window.innerWidth <= 768) {
        gMapRef.current.flyTo({ center: [lng, lat], zoom: 16, speed: 1.1, offset: [0, -100] });
      } else {
        gMapRef.current.flyTo({ center: [lng, lat], zoom: 16, speed: 1.1 });
      }
    }

    setTimeout(() => {
      const el = listRef.current?.querySelector(`[data-id="${enrichedAtm.id}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  }, []);

  /* ════════════════════════════════════════════════════════════════════
     Autocomplete search
  ════════════════════════════════════════════════════════════════════ */
  const handleSearchChange = useCallback((val) => {
    setSearch(val);
    clearTimeout(suggestTimer.current);
    if (!val.trim() || val.length < 2) { setSuggestions([]); setShowSuggestions(false); return; }
    // Local filter first
    const c = coords ?? FALLBACK_CENTER;
    const localMatches = atms
      .filter(a => a.name.toLowerCase().includes(val.toLowerCase()) || (a.address || '').toLowerCase().includes(val.toLowerCase()))
      .slice(0, 5)
      .map(a => ({ placeId: a.placeId || a.id, mainText: a.name, secondaryText: a.address, atm: a, lat: a.lat, lng: a.lng }));
    if (localMatches.length > 0) { setSuggestions(localMatches); setShowSuggestions(true); }

    // Debounce API call (300ms per spec)
    suggestTimer.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await atmApi.getAutocomplete(val, c.lat, c.lng);
        const apiSugs = res.data?.data ?? [];
        if (apiSugs.length > 0) {
          setSuggestions(apiSugs);
          setShowSuggestions(true);
        }
      } catch { /* ignore */ }
      setSuggestLoading(false);
    }, 300);
  }, [atms, coords]);

  const handleSuggestionClick = useCallback(async (sug) => {
    setShowSuggestions(false);
    setSearch(sug.mainText || sug.description || '');

    if (sug.atm) {
      // Local ATM — fly directly
      handleSelectAtm(sug.atm);
      return;
    }

    // API suggestion — fetch coordinates via Place Detail
    if (sug.placeId && gMapRef.current) {
      try {
        const res = await atmApi.getPlaceDetail(sug.placeId);
        const loc = res.data?.data?.geometry?.location ?? res.data?.data;
        const lat = loc?.lat ?? sug.lat;
        const lng = loc?.lng ?? sug.lng;
        if (lat && lng) {
          handleSelectAtm({
            id: sug.placeId,
            name: sug.mainText || sug.description || 'Địa điểm tìm kiếm',
            address: sug.secondaryText || '',
            lat,
            lng,
            bankKey: 'SEARCH',
            type: 'Địa điểm',
            status: 'opened',
            isCustomPlace: true
          });
        }
      } catch {
        // If detail fails, try with lat/lng from suggestion directly
        if (sug.lat && sug.lng) {
          handleSelectAtm({
            id: sug.placeId || 'search-' + Date.now(),
            name: sug.mainText || sug.description || 'Địa điểm tìm kiếm',
            address: sug.secondaryText || '',
            lat: sug.lat,
            lng: sug.lng,
            bankKey: 'SEARCH',
            type: 'Địa điểm',
            status: 'opened',
            isCustomPlace: true
          });
        }
      }
    }
  }, [handleSelectAtm]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (!searchRef.current?.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleRoute = useCallback(async (atm) => {
    if (!coords) return;
    const lat = atm.lat ?? atm.latitude, lng = atm.lng ?? atm.longitude;
    setRouteLoading(true);
    setRouteInfo(null);
    try {
      const res = await atmApi.getDirection(`${coords.lat},${coords.lng}`, `${lat},${lng}`, travelMode);
      const data = res.data?.data ?? res.data;
      const route = data?.routes?.[0];
      if (!route) throw new Error('No route');

      // Build coordinates from various sources
      let coordinates = [];
      const encoded = route.overview_polyline?.points;
      if (encoded) {
        coordinates = decodePolyline(encoded);
      } else {
        const steps = route.legs?.[0]?.steps ?? [];
        for (const s of steps) {
          if (s._coords) coordinates.push(...s._coords);
          else if (s.polyline?.points) coordinates.push(...decodePolyline(s.polyline.points));
        }
        // If no steps, straight line
        if (coordinates.length === 0) {
          const sLoc = route.legs?.[0]?.start_location;
          const eLoc = route.legs?.[0]?.end_location;
          if (sLoc && eLoc) coordinates = [[sLoc.lng, sLoc.lat], [eLoc.lng, eLoc.lat]];
        }
      }

      if (gMapRef.current?.getSource?.('route')) {
        gMapRef.current.getSource('route').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates } });
        if (coordinates.length > 1) {
          const lngs = coordinates.map(c => c[0]), lats = coordinates.map(c => c[1]);
          const bounds = [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
          const isMobile = window.innerWidth <= 768;
          gMapRef.current.fitBounds(bounds, {
            padding: {
              top: 80,
              bottom: isMobile ? 220 : 80, // More bottom padding on mobile for popup
              left: isMobile ? 20 : 420,  // More left padding on desktop for sidebar
              right: 20
            },
            maxZoom: 17
          });
        }
      }

      const leg = route.legs?.[0];
      const durationSec = leg?.duration?.value ?? 0;
      const distMeters = leg?.distance?.value ?? 0;
      setRouteInfo({
        duration: durationSec < 3600 ? `${Math.round(durationSec / 60)} phút` : `${(durationSec / 3600).toFixed(1)} giờ`,
        distance: distMeters < 1000 ? `${distMeters} m` : `${(distMeters / 1000).toFixed(1)} km`,
      });
    } catch (e) {
      setRouteInfo({ error: 'Không thể tính đường đi.' });
    } finally {
      setRouteLoading(false);
    }
  }, [coords, travelMode]);

  const handleClearRoute = () => {
    if (gMapRef.current?.getSource?.('route')) gMapRef.current.getSource('route').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
    setRouteInfo(null);
    setSelectedAtm(null);
  };

  const distStr = (atm) => {
    if (atm.distanceKm != null) return atm.distanceKm < 1 ? `${Math.round(atm.distanceKm * 1000)} m` : `${atm.distanceKm.toFixed(1)} km`;
    return '';
  };

  /* ════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════ */
  const content = (
    <div className="atm-map-root" style={{ height: embedded ? '100%' : 'calc(100vh - 60px)', flex: 1, position: 'relative' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#d1d5db;border-radius:10px}
        @keyframes popUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popUpMobile{from{opacity:0;transform:translateY(100%)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulseRing{0%{transform:translate(-50%,-50%) scale(0.6);opacity:1}100%{transform:translate(-50%,-50%) scale(1.8);opacity:0}}
        @keyframes shimmer{0%,100%{opacity:.55}50%{opacity:1}}
        @keyframes spinR{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes pulseBlue{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)}70%{box-shadow:0 0 0 8px rgba(37,99,235,0)}}
        @keyframes pulseNearest{0%,100%{transform:scale(1);filter:drop-shadow(0 0 0 transparent)}50%{transform:scale(1.12);filter:drop-shadow(0 0 8px rgba(37,99,235,.4))}}
        @keyframes staggerIn{from{opacity:0;transform:translateX(-10px)}to{opacity:1;transform:translateX(0)}}
        @keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
        
        .atm-map-root{display:flex;width:100%;font-family:'DM Sans','Segoe UI',sans-serif;background:#f8fafc;overflow:hidden;flex-direction:row;}
        
        .left-panel{display:flex;flex-direction:column;background:white;z-index:20;flex-shrink:0;box-shadow:4px 0 28px rgba(0,0,0,.08);width:400px;max-width:44vw;height:100%;transition:transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);}
        
        .atm-card{transition:all .18s;cursor:pointer;border-radius:14px;padding:12px 14px;margin-bottom:8px;border:1.5px solid #e2e8f0;background:white;}
        .atm-card:hover{background:#f0f9ff;box-shadow:0 2px 12px rgba(37,99,235,.1);}
        .atm-card.sel{background:#eff6ff;border-color:#3b82f6;box-shadow:0 2px 12px rgba(59,130,246,.18);}
        .atm-card.nearest{border-color:#2563eb;background:linear-gradient(135deg,#eff6ff,#dbeafe);}
        .route-btn{transition:all .15s;width:100%;margin-top:9px;padding:7px;border-radius:9px;border:1.5px solid #e2e8f0;background:white;font-size:12px;font-weight:600;color:#374151;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px;font-family:inherit;}
        .route-btn:hover{background:#2563eb;color:white;border-color:#2563eb;}
        .map-fab{transition:all .2s;width:48px;height:48px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.4);background:rgba(255,255,255,0.8);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.08);}
        .map-fab:hover{background:rgba(255,255,255,0.95);transform:scale(1.1);box-shadow:0 6px 18px rgba(0,0,0,.15);}
        .gps-btn{display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:12px;border:none;font-weight:700;font-size:14px;cursor:pointer;transition:all .2s;font-family:inherit;}
        .gps-btn:hover{transform:translateY(-1px);box-shadow:0 4px 16px rgba(37,99,235,.3);}
        .suggest-item{padding:10px 14px;cursor:pointer;display:flex;align-items:center;gap:10px;border-bottom:1px solid #f1f5f9;transition:background .1s;}
        .suggest-item:hover{background:#f0f9ff;}
        .filter-chip{padding:5px 12px;border-radius:20px;border:1.5px solid #e2e8f0;background:white;font-size:11px;font-weight:600;cursor:pointer;color:#374151;transition:all .15s;white-space:nowrap;}
        .filter-chip.active{border-color:#2563eb;background:#eff6ff;color:#2563eb;}
        
        .popup-card{position:absolute;top:20px;left:430px;z-index:20;background:rgba(255,255,255,0.7);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);border-radius:20px;box-shadow:0 8px 40px rgba(0,0,0,.15);border:1px solid rgba(255,255,255,0.5);animation:popUp .25s cubic-bezier(.34,1.56,.64,1);min-width:360px;max-width:460px;padding:22px;}
        .route-banner{position:absolute;bottom:30px;left:430px;z-index:20;background:linear-gradient(135deg,rgba(30,64,175,0.85),rgba(37,99,235,0.85));backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);color:white;border-radius:18px;box-shadow:0 8px 24px rgba(37,99,235,.35);display:flex;align-items:center;animation:popUp .3s cubic-bezier(.34,1.56,.64,1);min-width:360px;padding:16px 22px;gap:16px;border:1px solid rgba(255,255,255,0.3);}
        .travel-mode-container{background:rgba(255,255,255,0.7);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.5);}
        .legend-card{background:rgba(255,255,255,0.7);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.5);}
        .travel-btn{border:1px solid rgba(226,232,240,0.5);background:rgba(255,255,255,0.5);border-radius:8px;padding:5px 10px;font-size:11px;font-weight:600;cursor:pointer;color:#374151;transition:all .15s;display:flex;align-items:center;gap:5px;}
        .travel-btn.active{border-color:rgba(37,99,235,0.6);background:rgba(239,246,255,0.9);color:#2563eb;}
        .mock-banner{background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fcd34d;border-radius:10px;padding:10px 14px;font-size:11.5px;color:#92400e;display:flex;align-items:center;gap:8px;margin:8px 14px;}
        
        .radius-slider{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;background:linear-gradient(90deg,#2563eb,#93c5fd);outline:none;}
        .radius-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;width:18px;height:18px;border-radius:50%;background:#2563eb;cursor:pointer;box-shadow:0 2px 6px rgba(37,99,235,.3);border:2px solid white;}
        .radius-slider::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:#2563eb;cursor:pointer;box-shadow:0 2px 6px rgba(37,99,235,.3);border:2px solid white;}
        
        .minimized-pill{position:absolute;top:16px;left:16px;z-index:25;background:rgba(255,255,255,0.9);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,0.6);border-radius:16px;padding:10px 16px;box-shadow:0 4px 20px rgba(0,0,0,.12);display:flex;align-items:center;gap:10px;cursor:pointer;animation:scaleIn .2s ease;transition:all .2s;}
        .minimized-pill:hover{box-shadow:0 6px 24px rgba(0,0,0,.18);transform:scale(1.03);}
        
        .toggle-panel-btn{display:none;}
        .backdrop{display:none;}
        
        /* Mobile overrides */
        @media(max-width:768px){
          .atm-map-root{display:block;}
          .left-panel{position:absolute;top:0;left:0;width:100%;max-width:380px;height:100%;z-index:30;transform:translateX(-100%);box-shadow:none;border-right:1px solid #e2e8f0;}
          .left-panel.show{transform:translateX(0);box-shadow:4px 0 28px rgba(0,0,0,.15);}
          
          .backdrop{display:block;position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.3);z-index:25;opacity:0;pointer-events:none;transition:opacity 0.3s;}
          .backdrop.show{opacity:1;pointer-events:all;}
          
          /* Floating toggle button */
          .toggle-panel-btn{display:flex;position:absolute;top:16px;left:16px;z-index:15;background:rgba(255,255,255,0.85);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.6);border-radius:12px;width:46px;height:46px;align-items:center;justify-content:center;font-size:18px;color:#0f172a;box-shadow:0 4px 12px rgba(0,0,0,.12);cursor:pointer;transition:all .2s;}
          .toggle-panel-btn:active{transform:scale(0.95);}
          
          /* Popup card at bottom on mobile */
          .popup-card{top:auto;bottom:0;left:0;width:100%;min-width:unset;max-width:none;border-radius:24px 24px 0 0;padding:24px 20px 30px;animation:popUpMobile .3s cubic-bezier(.34,1.56,.64,1);border-bottom:none;border-left:none;border-right:none;}
          /* Route info at bottom */
          .route-banner{bottom:0;left:0;transform:none;width:100%;min-width:unset;max-width:none;border-radius:24px 24px 0 0;padding:20px 24px 30px;animation:popUpMobile .3s cubic-bezier(.34,1.56,.64,1);border-left:none;border-right:none;border-bottom:none;}
          
          /* Readjust positions when popup is visible */
          .map-fab{transform:translateY(0);}
        }
        .mapboxgl-ctrl-bottom-left{display:none;}
      `}</style>

      {/* ── Mobile menu toggle button ─────────────────────────────────────────── */}
      <button className="toggle-panel-btn" onClick={() => setShowLeftPanel(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>

      {/* ── Backdrop for mobile sidebar ─────────────────────────────────────── */}
      <div className={`backdrop ${showLeftPanel ? 'show' : ''}`} onClick={() => setShowLeftPanel(false)} />

      {/* ── Minimized pill (desktop) ─────────────────────────────────── */}
      {panelMinimized && window.innerWidth > 768 && (
        <div className="minimized-pill" onClick={() => { setPanelMinimized(false); setShowLeftPanel(true); }}>
          <span style={{ fontSize: 18 }}>🏧</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>ATM<span style={{ color: '#2563eb' }}>Map</span></span>
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{filtered.length} kết quả</span>
          <span style={{ fontSize: 14, color: '#2563eb' }}>▶</span>
        </div>
      )}

      {/* ══ LEFT PANEL ═══════════════════════════════════════════════ */}
      <div className={`left-panel ${showLeftPanel && !panelMinimized ? 'show' : ''}`} style={panelMinimized && window.innerWidth > 768 ? { display: 'none' } : {}}>

        {/* ── Header + GPS ─────────────────────────────────────────── */}
        <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🏧</div>
              <div>
                <div style={{ fontFamily: 'Syne,sans-serif', fontWeight: 800, fontSize: 20, color: '#0f172a', lineHeight: 1 }}>ATM<span style={{ color: '#2563eb' }}>Map</span></div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{loading ? 'Đang tải...' : `${filtered.length} địa điểm`}</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Minimize panel button (desktop) */}
              <button onClick={() => { setPanelMinimized(true); setShowLeftPanel(false); }}
                title="Thu nhỏ"
                style={{ display: window.innerWidth > 768 ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: 8, fontSize: 14, color: '#64748b', cursor: 'pointer', transition: 'all .15s' }}>
                ▼
              </button>
              {/* Close button on mobile */}
              <button className="close-panel-mobile" onClick={() => setShowLeftPanel(false)} style={{ display: window.innerWidth <= 768 ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: 'none', width: 32, height: 32, borderRadius: 8, fontSize: 20, color: '#64748b', cursor: 'pointer' }}>×</button>
            </div>
          </div>

          {/* GPS Button — prominent */}
          <button className="gps-btn" onClick={fetchLocation} disabled={geoLoading}
            style={{ width: '100%', background: geoLoading ? '#93c5fd' : 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', animation: coords ? 'none' : 'pulseBlue 2s infinite', marginBottom: 10 }}>
            {geoLoading
              ? <><span style={{ display: 'inline-block', animation: 'spinR 1s linear infinite' }}>⏳</span> Đang lấy vị trí...</>
              : <><span>📍</span> {coords ? 'Cập nhật vị trí của tôi' : 'Cho phép lấy vị trí GPS'}</>}
          </button>

          {geoError && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '7px 10px', fontSize: 11, color: '#92400e', marginBottom: 8 }}>
              ⚠️ {geoError}
            </div>
          )}

          {/* Search with autocomplete ─────────────────────────────── */}
          <div ref={searchRef} style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, transition: 'border .2s' }}
              onFocus={() => search && setShowSuggestions(true)}>
              <span style={{ fontSize: 14, color: '#94a3b8', flexShrink: 0 }}>🔍</span>
              <input
                value={search}
                onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Tìm ATM, ngân hàng, địa điểm..."
                style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, color: '#0f172a', fontFamily: 'inherit', outline: 'none' }} />
              {suggestLoading && <span style={{ fontSize: 12, animation: 'spinR 1s linear infinite', display: 'inline-block' }}>⏳</span>}
              {search && !suggestLoading && (
                <button onClick={() => { setSearch(''); setSuggestions([]); setShowSuggestions(false); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#94a3b8', padding: 0, lineHeight: 1 }}>×</button>
              )}
            </div>

            {/* Dropdown suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
                background: 'white', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,.14)',
                border: '1px solid #e2e8f0', maxHeight: 240, overflowY: 'auto', animation: 'fadeIn .15s'
              }}>
                {suggestions.map((s, i) => {
                  let dist = null;
                  if (s.atm && s.atm.distanceKm != null) {
                    dist = s.atm.distanceKm;
                  } else if (s.lat && s.lng && coords) {
                    dist = haversineKm(coords.lat, coords.lng, s.lat, s.lng);
                  }

                  return (
                    <div key={s.placeId || i} className="suggest-item" onClick={() => handleSuggestionClick(s)}>
                      <span style={{ fontSize: 16, flexShrink: 0 }}>
                        {s.atm ? (BANK_META[s.atm.bankKey]?.emoji ?? '🏧') : '📍'}
                      </span>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.mainText}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.secondaryText}</div>
                      </div>
                      {dist != null && (
                        <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 600, flexShrink: 0, fontFamily: 'monospace' }}>
                          {dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Radius Slider ───────────────────────────────────────── */}
          <div style={{ marginTop: 10, padding: '0 2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>📏 Bán kính tìm kiếm</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', fontFamily: 'monospace' }}>{searchRadius >= 1000 ? `${(searchRadius / 1000).toFixed(searchRadius % 1000 === 0 ? 0 : 1)} km` : `${searchRadius} m`}</span>
            </div>
            <input
              type="range"
              className="radius-slider"
              min={1000}
              max={20000}
              step={1000}
              value={searchRadius}
              onChange={e => handleRadiusChange(Number(e.target.value))}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#94a3b8', marginTop: 2 }}>
              <span>1 km</span>
              <span>10 km</span>
              <span>20 km</span>
            </div>
          </div>
        </div>

        {/* ── Mock data banner ─────────────────────────────────────── */}
        {isMockData && (
          <div className="mock-banner">
            <span style={{ fontSize: 16 }}>🔑</span>
            <span><b>Chế độ Demo</b> — Thêm Goong API key vào <code>application.yml</code> để xem ATM thực</span>
          </div>
        )}

        {/* ── Quick filter chips ───────────────────────────────────── */}
        <div style={{ padding: '8px 12px 0', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 8 }}>
            {/* Type */}
            {['Tất cả', 'Cây ATM', 'Ngân hàng'].map(t => (
              <button key={t} className={`filter-chip${filterType === t ? ' active' : ''}`} onClick={() => setFilterType(t)}>{t}</button>
            ))}
            {/* Status */}
            <button className={`filter-chip${filterStatus.open && !filterStatus.closed ? ' active' : ''}`}
              onClick={() => setFilterStatus(s => s.open && !s.closed ? { open: true, closed: true } : { open: true, closed: false })}>
              🟢 Đang mở
            </button>
            {/* Bank filter toggle */}
            <button className={`filter-chip${showFilters ? ' active' : ''}`} onClick={() => setShowFilters(v => !v)}>
              🏦 Ngân hàng {showFilters ? '▲' : '▼'}
            </button>
          </div>

          {/* Bank filter expanded */}
          {showFilters && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingBottom: 10, animation: 'fadeIn .15s' }}>
              {BANKS.map(b => (
                <button key={b} className={`filter-chip${filterBank === b ? ' active' : ''}`}
                  onClick={() => setFilterBank(b)}
                  style={{ fontSize: 10 }}>
                  {BANK_META[b]?.emoji ?? ''} {b}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── ATM List ─────────────────────────────────────────────── */}
        <div style={{ padding: '6px 10px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#374151', textTransform: 'uppercase', letterSpacing: '.5px' }}>Danh sách ATM</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{filtered.length}/{atms.length} kết quả</span>
        </div>

        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '2px 8px 16px' }}>
          {/* Skeleton loading */}
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ background: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 8, height: 100, animation: `shimmer 1.4s ease-in-out ${i * 0.1}s infinite` }} />
          ))}

          {/* GPS prompt when no coords */}
          {!loading && !coords && atms.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 48 }}>📍</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 12, color: '#374151' }}>Cho phép truy cập vị trí</div>
              <div style={{ fontSize: 12, marginTop: 6 }}>Nhấn nút GPS ở trên để tìm ATM gần bạn</div>
            </div>
          )}

          {!loading && filtered.length === 0 && atms.length > 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: '#94a3b8' }}>
              <div style={{ fontSize: 48, lineHeight: 1.2 }}>🔍🏧💨</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginTop: 12, color: '#374151' }}>Không tìm thấy ATM nào</div>
              <div style={{ fontSize: 12, marginTop: 6, lineHeight: 1.5 }}>Thử mở rộng bán kính tìm kiếm<br />hoặc thay đổi bộ lọc</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                {searchRadius < 10000 && (
                  <button onClick={() => handleRadiusChange(Math.min(searchRadius + 2000, 10000))}
                    style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                    📏 Mở rộng bán kính
                  </button>
                )}
                <button onClick={() => { setSearch(''); setFilterBank('Tất cả'); setFilterType('Tất cả'); }}
                  style={{ padding: '7px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
                  🧹 Xóa bộ lọc
                </button>
              </div>
            </div>
          )}

          {!loading && filtered.map((atm, idx) => {
            const meta = BANK_META[atm.bankKey] ?? { color: '#64748b', emoji: '🏧', bg: '#f1f5f9' };
            const isOpen = atm.status !== 'closed';
            const isSel = selectedAtm?.id === atm.id;
            const isNearest = atm.id === nearestAtmId;
            const isHov = atm.id === hoveredAtmId;
            return (
              <div key={atm.id} data-id={atm.id}
                className={`atm-card${isSel ? ' sel' : ''}${isNearest ? ' nearest' : ''}`}
                style={{ animation: `staggerIn .3s cubic-bezier(.34,1.56,.64,1) ${idx * 0.04}s both`, background: isHov && !isSel ? '#f0f9ff' : undefined }}
                onClick={() => handleSelectAtm(atm)}
                onMouseEnter={() => setHoveredAtmId(atm.id)}
                onMouseLeave={() => setHoveredAtmId(null)}>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  {/* Bank icon */}
                  <div style={{ width: 42, height: 42, borderRadius: 12, flexShrink: 0, background: meta.bg ?? meta.color + '1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {meta.emoji}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Name + distance */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', lineHeight: 1.3, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {isNearest && <span style={{ fontSize: 10, marginRight: 4 }}>⭐</span>}
                        {atm.name}
                      </div>
                      <span style={{ fontSize: 11, color: '#2563eb', fontWeight: 700, flexShrink: 0, fontFamily: 'monospace' }}>
                        {distStr(atm)}
                      </span>
                    </div>

                    {/* Address */}
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      📍 {atm.address}
                    </div>

                    {/* Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: isOpen ? '#dcfce7' : '#fee2e2', color: isOpen ? '#15803d' : '#dc2626' }}>
                        ● {isOpen ? 'Đang mở' : 'Đã đóng'}
                      </span>
                      <span style={{ fontSize: 10, color: '#94a3b8', padding: '2px 6px', borderRadius: 20, background: '#f1f5f9' }}>
                        {atm.type}
                      </span>
                      {atm.rating > 0 && (
                        <span style={{ fontSize: 10, color: '#d97706', fontWeight: 600 }}>⭐ {atm.rating.toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direction button */}
                <button className="route-btn"
                  onClick={e => { e.stopPropagation(); handleSelectAtm(atm); handleRoute(atm); }}>
                  🧭 Chỉ đường
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ RIGHT: Goong Map ════════════════════════════════════════ */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div ref={mapDivRef} style={{ width: '100%', height: '100%' }} />

        {/* Pan re-fetch loading badge */}
        {panLoading && (
          <div style={{
            position: 'absolute', top: 74, left: '50%', transform: 'translateX(-50%)',
            zIndex: 30, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
            borderRadius: 20, padding: '6px 16px', boxShadow: '0 4px 16px rgba(0,0,0,.12)',
            display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, fontWeight: 600,
            color: '#2563eb', animation: 'fadeIn .2s',
            border: '1px solid rgba(37,99,235,0.15)'
          }}>
            <span style={{ display: 'inline-block', animation: 'spinR 1s linear infinite' }}>🔄</span>
            Đang tải ATM khu vực này...
          </div>
        )}

        {/* FAB cluster */}
        <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 15, transition: 'transform 0.3s' }}
          className={selectedAtm && window.innerWidth <= 768 ? 'fab-hide-mobile' : ''}>
          <button className="map-fab" onClick={fetchLocation} disabled={geoLoading} title="Vị trí của tôi"
            style={{ animation: geoLoading ? 'spinR 1s linear infinite' : 'none' }}>
            {geoLoading ? '⏳' : '🎯'}
          </button>
        </div>

        {/* Travel mode selector */}
        <div className="travel-mode-container" style={{ position: 'absolute', top: 20, left: window.innerWidth <= 768 ? 70 : 430, zIndex: 15, borderRadius: 12, padding: '8px 10px', boxShadow: '0 4px 16px rgba(0,0,0,.12)', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.3s' }}>
          <button onClick={() => setTravelCollapsed(!travelCollapsed)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
            {travelCollapsed ? '👁️' : '➖'}
          </button>
          {!travelCollapsed && [['car', '🚗', 'Ô tô'], ['bike', '🚲', 'Xe Máy'], ['foot', '🚶', 'Đi bộ']].map(([mode, icon, label]) => (
            <button key={mode} className={`travel-btn${travelMode === mode ? ' active' : ''}`} onClick={() => setTravelMode(mode)} title={label}>
              {icon} <span style={{ display: window.innerWidth <= 400 ? 'none' : 'inline' }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className={selectedAtm && window.innerWidth <= 768 ? 'legend-card fab-hide-mobile' : 'legend-card'} style={{ position: 'absolute', bottom: routeInfo && window.innerWidth > 768 ? 110 : (window.innerWidth <= 768 && (selectedAtm || routeInfo) ? 230 : 36), right: 20, borderRadius: 14, padding: '12px 16px', boxShadow: '0 4px 16px rgba(0,0,0,.1)', zIndex: 10, transition: 'bottom 0.3s' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: 6 }}>Chú thích</div>
          {[['#16a34a', '🟢', 'Đang mở'], ['#9ca3af', '⚫', 'Đã đóng'], ['#2563eb', '🔵', 'Vị trí bạn']].map(([col, ico, lbl]) => (
            <div key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <span style={{ fontSize: 10 }}>{ico}</span>
              <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>{lbl}</span>
            </div>
          ))}
        </div>

        {/* Selected ATM popup */}
        {selectedAtm && (
          <div className="popup-card">
            <button onClick={handleClearRoute} style={{ position: 'absolute', top: 12, right: 14, background: 'none', border: 'none', fontSize: 26, cursor: 'pointer', color: '#9ca3af', lineHeight: 1 }}>×</button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, flexShrink: 0, background: (BANK_META[selectedAtm.bankKey]?.bg ?? '#f1f5f9'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                {BANK_META[selectedAtm.bankKey]?.emoji ?? '🏧'}
              </div>
              <div style={{ minWidth: 0, paddingRight: 22, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#111', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedAtm.name}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {selectedAtm.address}</div>
              </div>
            </div>

            {/* Info chips */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: selectedAtm.status !== 'closed' ? '#dcfce7' : '#fee2e2', color: selectedAtm.status !== 'closed' ? '#15803d' : '#dc2626' }}>
                ● {selectedAtm.status !== 'closed' ? 'Đang mở' : 'Đã đóng'}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: '#f0f9ff', color: '#0369a1' }}>📏 {distStr(selectedAtm)}</span>
              {selectedAtm.rating > 0 && <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: '#fffbeb', color: '#d97706' }}>⭐ {selectedAtm.rating.toFixed(1)}</span>}
              {!selectedAtm.isCustomPlace && (
                <button onClick={async () => {
                  if (savedAtms.has(selectedAtm.id)) {
                    await atmApi.unsaveAtm(selectedAtm.id);
                    setSavedAtms(prev => { const n = new Set(prev); n.delete(selectedAtm.id); return n; });
                  } else {
                    await atmApi.saveAtm({ atmId: selectedAtm.id, name: selectedAtm.name, address: selectedAtm.address, lat: selectedAtm.lat, lng: selectedAtm.lng, bankKey: selectedAtm.bankKey });
                    setSavedAtms(prev => new Set([...prev, selectedAtm.id]));
                  }
                }} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20, border: '1px solid #e5e7eb', background: savedAtms.has(selectedAtm.id) ? '#fef08a' : '#fff', cursor: 'pointer', color: '#374151' }}>
                  {savedAtms.has(selectedAtm.id) ? '⭐ Đã lưu' : '☆ Lưu'}
                </button>
              )}
            </div>

            {/* ── Action buttons row ─────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              {/* Call button */}
              {selectedAtm.phone && (
                <a href={`tel:${selectedAtm.phone}`}
                  style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1.5px solid #dcfce7', background: '#f0fdf4', color: '#15803d', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s', cursor: 'pointer' }}>
                  📞 Gọi
                </a>
              )}
              {/* Google Maps button */}
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${(selectedAtm.lat ?? selectedAtm.latitude)},${(selectedAtm.lng ?? selectedAtm.longitude)}&travelmode=driving`}
                target="_blank" rel="noopener noreferrer"
                style={{ flex: 1, padding: '10px', borderRadius: 12, border: '1.5px solid #dbeafe', background: '#eff6ff', color: '#1d4ed8', fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all .15s', cursor: 'pointer' }}>
                🗺️ Google Maps
              </a>
            </div>

            <button onClick={() => handleRoute(selectedAtm)} disabled={routeLoading}
              style={{ width: '100%', padding: '14px', borderRadius: 14, border: 'none', background: routeLoading ? '#93c5fd' : 'linear-gradient(135deg,#f97316,#ea580c)', color: 'white', fontWeight: 700, fontSize: 15, cursor: routeLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 16px rgba(249,115,22,.3)', fontFamily: 'inherit' }}>
              {routeLoading ? <><span style={{ display: 'inline-block', animation: 'spinR 1s linear infinite' }}>⏳</span> Đang tính...</> : '🧭 Chỉ đường đến đây'}
            </button>
          </div>
        )}

        {/* Route info banner */}
        {routeInfo && !routeInfo.error && (
          <div className="route-banner">
            <span style={{ fontSize: 32 }}>🧭</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, opacity: .8, fontWeight: 500 }}>Đường đến</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedAtm?.name}</div>
              <div style={{ fontSize: 14, opacity: .95, marginTop: 4, fontWeight: 600 }}>⏱ {routeInfo.duration} · 📏 {routeInfo.distance}</div>
            </div>
            <button onClick={handleClearRoute} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: 'white', borderRadius: '50%', width: 38, height: 38, cursor: 'pointer', fontSize: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>×</button>
          </div>
        )}

        {routeInfo?.error && (
          <div style={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', background: '#fee2e2', color: '#dc2626', padding: '10px 18px', borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 20, boxShadow: '0 4px 16px rgba(0,0,0,.12)' }}>
            ⚠️ {routeInfo.error}
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return content;
  return (
    <div className="page active" id="page-atm" style={{ paddingBottom: 0, height: '100vh', overflow: 'hidden' }}>
      <Navbar
        title={<>ATM<span style={{ color: '#2563eb' }}>Map</span></>}
        actions={
          <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text)', padding: '6px 12px', borderRadius: '8px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
            <span style={{ fontSize: 16 }}>🏠</span> <span className="hide-on-mobile">Về trang chủ</span>
            <style>{`@media(max-width:480px){.hide-on-mobile{display:none}}`}</style>
          </button>
        }
      />
      {content}
    </div>
  );
}
