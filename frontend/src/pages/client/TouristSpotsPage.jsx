import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import touristApi from '../../api/touristApi';

const CATEGORY_CHIPS = [
  { key: 'all',           label: '🌟 Tất cả' },
  { key: 'heritage',      label: '🏛️ Di sản' },
  { key: 'nature',        label: '🌿 Thiên nhiên' },
  { key: 'temple',        label: '🛕 Đền chùa' },
  { key: 'entertainment', label: '🎢 Giải trí' },
  { key: 'art',           label: '🎨 Nghệ thuật' },
];

export default function TouristSpotsPage() {
  const [spots, setSpots]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [category, setCategory] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await touristApi.getSpots();
        setSpots(res.data?.data ?? []);
      } catch {
        setSpots([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = category === 'all'
    ? spots
    : spots.filter(s => s.category === category);

  return (
    <div className="page active" id="page-tourist">
      <Navbar
        title={<>Tourist<span style={{ color: 'var(--accent)' }}>Spots</span></>}
        actions={
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>
            {filtered.length} địa điểm
          </span>
        }
      />

      {/* Category chips */}
      <div style={{
        padding: '12px 20px 0', display: 'flex', gap: 8,
        overflowX: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {CATEGORY_CHIPS.map(ch => (
          <button
            key={ch.key}
            onClick={() => setCategory(ch.key)}
            style={{
              padding: '7px 14px', borderRadius: 20,
              border: category === ch.key ? '1px solid var(--accent)' : '1px solid var(--border)',
              background: category === ch.key ? 'rgba(200,242,61,0.1)' : 'var(--bg2)',
              color: category === ch.key ? 'var(--accent)' : 'var(--muted)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}
          >{ch.label}</button>
        ))}
      </div>

      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            <div style={{ fontSize: 28, marginBottom: 8, animation: 'pulse 1.5s infinite' }}>🏯</div>
            <div style={{ fontSize: 13 }}>Đang tải danh sách...</div>
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            <span style={{ fontSize: 48 }}>🏯</span>
            <p style={{ fontSize: 14, marginTop: 12 }}>Không có địa điểm nào trong danh mục này.</p>
          </div>
        )}

        {filtered.map((spot) => (
          <div
            key={spot.id}
            onClick={() => setSelected(selected?.id === spot.id ? null : spot)}
            style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {/* Image */}
            {spot.imageUrl && (
              <div style={{
                height: 140, background: `url(${spot.imageUrl}) center/cover no-repeat`,
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute', bottom: 8, left: 8,
                  background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
                  padding: '4px 10px', borderRadius: 8, fontSize: 11,
                  color: '#fff', fontWeight: 600,
                }}>
                  {spot.city}
                </div>
                {spot.rating && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    background: 'rgba(200,242,61,0.15)', backdropFilter: 'blur(6px)',
                    padding: '4px 8px', borderRadius: 8, fontSize: 12,
                    color: 'var(--accent)', fontWeight: 700,
                  }}>
                    ⭐ {spot.rating}
                  </div>
                )}
              </div>
            )}

            {/* Info */}
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, fontFamily: 'Syne, sans-serif' }}>
                {spot.name}
              </div>
              {spot.address && (
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                  📍 {spot.address}
                </div>
              )}
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)' }}>
                {spot.ticketPrice && <span>🎫 {spot.ticketPrice}</span>}
                {spot.openHours && <span>🕐 {spot.openHours}</span>}
              </div>

              {/* Expanded detail */}
              {selected?.id === spot.id && spot.description && (
                <div style={{
                  marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)',
                  fontSize: 13, color: 'var(--text)', lineHeight: 1.6,
                }}>
                  {spot.description}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
