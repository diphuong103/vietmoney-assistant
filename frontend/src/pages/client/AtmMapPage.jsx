import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import atmApi from '../../api/atmApi';

export default function AtmMapPage() {
  const [atms, setAtms]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [coords, setCoords]   = useState(null);
  const [geoError, setGeoError] = useState('');

  useEffect(() => {
    // Lấy vị trí GPS
    if (!navigator.geolocation) {
      setGeoError('Trình duyệt không hỗ trợ GPS.');
      loadAtms(21.0285, 105.8542); // fallback to Hanoi
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const c = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(c);
        loadAtms(c.lat, c.lng);
      },
      () => {
        setGeoError('Không thể lấy vị trí. Hiển thị ATM tại Hà Nội.');
        loadAtms(21.0285, 105.8542); // fallback
      },
      { timeout: 8000 }
    );
  }, []);

  const loadAtms = async (lat, lng) => {
    setLoading(true);
    try {
      const res = await atmApi.getNearby(lat, lng);
      setAtms(res.data?.data ?? []);
    } catch {
      setAtms([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page active" id="page-atm">
      <Navbar
        title={<>ATM<span style={{ color: 'var(--accent)' }}>Map</span></>}
        actions={
          coords && (
            <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'DM Mono, monospace' }}>
              {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </span>
          )
        }
      />

      <div style={{ padding: '12px 20px' }}>
        {/* GPS status */}
        {geoError && (
          <div style={{
            background: 'rgba(242,196,61,0.08)', border: '1px solid rgba(242,196,61,0.3)',
            borderRadius: 12, padding: '10px 14px', fontSize: 12,
            color: 'var(--gold)', marginBottom: 12,
          }}>
            📍 {geoError}
          </div>
        )}

        {/* Location badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginBottom: 16, padding: '10px 14px',
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 12,
        }}>
          <span style={{ fontSize: 20 }}>📍</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Vị trí hiện tại</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>
              {coords
                ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                : 'Đang xác định...'
              }
            </div>
          </div>
          <div style={{
            marginLeft: 'auto', padding: '4px 10px',
            background: 'rgba(200,242,61,0.1)', border: '1px solid rgba(200,242,61,0.2)',
            borderRadius: 8, fontSize: 11, color: 'var(--accent)', fontWeight: 600,
          }}>
            {atms.length} ATMs
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            <div style={{ fontSize: 28, animation: 'pulse 1.5s infinite' }}>🏧</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Đang tìm ATM gần bạn...</div>
          </div>
        )}

        {!loading && atms.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            <span style={{ fontSize: 48 }}>🗺️</span>
            <p style={{ fontSize: 14, marginTop: 12 }}>Không tìm thấy ATM xung quanh.</p>
          </div>
        )}

        {/* ATM list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {atms.map((atm, i) => (
            <div
              key={atm.id ?? i}
              style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 14, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'transform 0.15s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: 'rgba(200,242,61,0.1)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 22,
                flexShrink: 0,
              }}>
                🏧
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>
                  {atm.name ?? 'ATM'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                  {atm.address ?? `${(atm.lat ?? 0).toFixed(4)}, ${(atm.lng ?? 0).toFixed(4)}`}
                </div>
              </div>
              <div style={{
                fontSize: 11, color: 'var(--accent)',
                fontFamily: 'DM Mono, monospace',
              }}>
                {atm.distance ?? '~nearby'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
