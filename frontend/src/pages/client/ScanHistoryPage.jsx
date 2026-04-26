import { useState, useEffect, useCallback } from 'react';
import Navbar from '../../components/layout/Navbar';
import scanApi from '../../api/scanApi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// ── Màu theo loại tiền ────────────────────────────────────────────────────────
const CURRENCY_COLOR = {
  VND: '#c8f23d', USD: '#60d960', SGD: '#4db8ff',
  MYR: '#ff9f43', THB: '#a29bfe', IDR: '#fd79a8', PHP: '#ffeaa7',
};
const CURRENCY_FLAG = {
  VND: '🇻🇳', USD: '🇺🇸', SGD: '🇸🇬',
  MYR: '🇲🇾', THB: '🇹🇭', IDR: '🇮🇩', PHP: '🇵🇭',
};

const getDenomColor = (denomination) => {
  if (denomination?.includes('FAKE') || denomination?.startsWith('[FAKE]')) return '#ff6b6b';
  const currency = Object.keys(CURRENCY_FLAG).find(c => denomination?.includes(c));
  return CURRENCY_COLOR[currency] ?? 'var(--accent)';
};

// ── Parse rawResult JSON safely ───────────────────────────────────────────────
const parseRaw = (raw) => {
  try { return JSON.parse(raw); } catch { return null; }
};

// ── Responsive breakpoint hook ────────────────────────────────────────────────
const useBreakpoint = () => {
  const [bp, setBp] = useState(() => {
    const w = window.innerWidth;
    return w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';
  });
  useEffect(() => {
    const fn = () => {
      const w = window.innerWidth;
      setBp(w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop');
    };
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return bp;
};

// ── Detail Panel (dùng cho cả modal và sidebar) ───────────────────────────────
function DetailPanel({ item, onClose }) {
  if (!item) return null;
  const fake  = item.detectedDenomination?.includes('FAKE') || item.detectedDenomination?.startsWith('[FAKE]');
  const color = getDenomColor(item.detectedDenomination);
  const pct   = item.confidence ? Math.round(item.confidence * 100) : null;
  const raw   = parseRaw(item.rawResult);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      {/* ── Ảnh ── */}
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '16/9',
        background: '#000', flexShrink: 0,
      }}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="Scan"
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: 'var(--muted)' }}>
            <div style={{ fontSize: 36 }}>📷</div>
            <div style={{ fontSize: 12 }}>Không có ảnh lưu</div>
          </div>
        )}

        {fake && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(20,20,180,0.92)', borderBottom: '2px solid #ff6b6b', padding: '6px 12px', textAlign: 'center' }}>
            <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>
              !! TIỀN GIẢ / VÀNG MÃ — KHÔNG SỬ DỤNG !!
            </span>
          </div>
        )}

        {/* Badge denomination */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(10,10,20,0.88)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '6px 10px', border: `1px solid ${color}44` }}>
          <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 9, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>DETECTED</div>
          <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 16, fontWeight: 700, color, lineHeight: 1 }}>
            {item.detectedDenomination ?? 'Unknown'}
          </div>
        </div>

        {/* Nút đóng (dùng khi là modal) */}
        {onClose && (
          <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        )}
      </div>

      {/* ── Info ── */}
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'DM Mono,monospace', color }}>
              {item.detectedDenomination ?? 'Unknown'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
              🕐 {item.scannedAt ? dayjs(item.scannedAt).format('HH:mm · DD/MM/YYYY') : ''}
              <span style={{ marginLeft: 6, opacity: 0.7 }}>({item.scannedAt ? dayjs(item.scannedAt).fromNow() : ''})</span>
            </div>
          </div>
          {fake && (
            <div style={{ background: 'rgba(255,107,107,0.15)', border: '1px solid rgba(255,107,107,0.4)', borderRadius: 8, padding: '5px 10px', textAlign: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 16 }}>⚠️</div>
              <div style={{ fontSize: 9, color: '#ff6b6b', fontWeight: 700, marginTop: 1 }}>FAKE</div>
            </div>
          )}
        </div>

        {/* Confidence bar */}
        {pct !== null && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Độ chính xác</span>
              <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'DM Mono,monospace' }}>{pct}%</span>
            </div>
            <div style={{ height: 5, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, boxShadow: `0 0 8px ${color}55`, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )}

        {/* Raw data tags */}
        {raw && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {raw.currency && (
              <span style={{ fontSize: 11, padding: '3px 10px', background: `${getDenomColor(raw.currency)}18`, border: `1px solid ${getDenomColor(raw.currency)}44`, borderRadius: 20, color: getDenomColor(raw.currency) }}>
                {CURRENCY_FLAG[raw.currency] ?? ''} {raw.currency}
              </span>
            )}
            {raw.authenticity && (
              <span style={{ fontSize: 11, padding: '3px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--muted)' }}>
                {raw.authenticity === 'real' ? '✅ Thật' : '❌ Giả'}
              </span>
            )}
            {raw.class && (
              <span style={{ fontSize: 11, padding: '3px 10px', background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--muted)', fontFamily: 'DM Mono,monospace' }}>
                {raw.class}
              </span>
            )}
          </div>
        )}

        {/* ImgBB link */}
        {item.imageUrl && (
          <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>🔗 Ảnh ImgBB</div>
            <a href={item.imageUrl} target="_blank" rel="noreferrer"
              style={{ fontSize: 11, color: 'var(--accent)', wordBreak: 'break-all', textDecoration: 'none' }}>
              {item.imageUrl}
            </a>
          </div>
        )}

        {/* Fake warning */}
        {fake && (
          <div style={{ background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 12, color: '#ff6b6b', fontWeight: 600, lineHeight: 1.5 }}>
              ⚠️ Tiền giả hoặc vàng mã được phát hiện. Tuyệt đối không sử dụng trong giao dịch.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── History Row Item ──────────────────────────────────────────────────────────
function HistoryItem({ h, isActive, onClick, onDelete }) {
  const fake  = h.detectedDenomination?.includes('FAKE') || h.detectedDenomination?.startsWith('[FAKE]');
  const color = getDenomColor(h.detectedDenomination);
  const pct   = h.confidence ? Math.round(h.confidence * 100) : null;

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', gap: 12, alignItems: 'center',
        padding: '11px 13px',
        background: isActive ? `${color}0d` : 'var(--bg2)',
        border: `1px solid ${isActive ? `${color}55` : fake ? 'rgba(255,107,107,0.3)' : 'var(--border)'}`,
        borderRadius: 13, cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: 52, height: 52, borderRadius: 9, overflow: 'hidden',
        flexShrink: 0, background: 'var(--bg3)',
        border: `1px solid ${fake ? 'rgba(255,107,107,0.4)' : 'var(--border)'}`,
        position: 'relative',
      }}>
        {h.imageUrl ? (
          <img src={h.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📷</div>
        )}
        {fake && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(220,50,50,0.88)', fontSize: 7, fontWeight: 700, color: '#fff', textAlign: 'center', padding: '1px 0' }}>FAKE</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color, fontFamily: 'DM Mono,monospace', marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {h.detectedDenomination ?? 'Unknown'}
        </div>
        {pct !== null && (
          <div style={{ height: 2, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
          </div>
        )}
        <div style={{ fontSize: 10, color: 'var(--muted)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {pct !== null && <span style={{ color, fontFamily: 'DM Mono,monospace', fontWeight: 600 }}>{pct}%</span>}
          <span>{h.scannedAt ? dayjs(h.scannedAt).fromNow() : ''}</span>
          {!h.imageUrl && <span style={{ opacity: 0.4 }}>· No image</span>}
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent3)', fontSize: 15, padding: 4, flexShrink: 0, opacity: 0.6, transition: 'opacity 0.15s' }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
        title="Xóa"
      >🗑️</button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ScanHistoryPage() {
  const bp = useBreakpoint();
  const [history, setHistory]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const isDesktop = bp === 'desktop';
  const isTablet  = bp === 'tablet';
  const isMobile  = bp === 'mobile';

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await scanApi.getHistory();
      setHistory(res.data?.data ?? []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      await scanApi.deleteHistory(id);
      setHistory(prev => prev.filter(h => h.id !== id));
      if (selected?.id === id) { setSelected(null); setModalOpen(false); }
    } catch {}
  };

  const handleSelect = (item) => {
    setSelected(item);
    if (isMobile || isTablet) setModalOpen(true);
  };

  // ── Desktop: 2-col layout ─────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <div className="page active" id="page-scan-history">
        <Navbar
          title={<>Scan<span style={{ color: 'var(--accent)' }}>History</span></>}
          actions={history.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{history.length} scans</span>
          )}
        />

        <div style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 20px 32px',
          display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20,
          alignItems: 'flex-start',
          height: 'calc(100vh - 64px)', // subtract navbar height
          boxSizing: 'border-box',
        }}>
          {/* ── Left: List ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflowY: 'auto', height: '100%', paddingRight: 4, paddingBottom: 20 }}>

            {loading && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                <div style={{ fontSize: 26, marginBottom: 8, animation: 'pulse 1.5s infinite' }}>⏳</div>
                <div style={{ fontSize: 13 }}>Đang tải...</div>
              </div>
            )}

            {!loading && history.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>📷</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Chưa có lịch sử scan</div>
                <div style={{ fontSize: 12 }}>Bắt đầu scan tiền để xem kết quả ở đây.</div>
              </div>
            )}

            {history.map(h => (
              <HistoryItem
                key={h.id}
                h={h}
                isActive={selected?.id === h.id}
                onClick={() => setSelected(h)}
                onDelete={() => handleDelete(h.id)}
              />
            ))}
          </div>

          {/* ── Right: Detail ── */}
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 16, overflow: 'hidden', height: '100%',
            display: 'flex', flexDirection: 'column',
          }}>
            {selected ? (
              <DetailPanel item={selected} onClose={null} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: 12, color: 'var(--muted)' }}>
                <div style={{ fontSize: 40 }}>👈</div>
                <div style={{ fontSize: 13 }}>Chọn một bản ghi để xem chi tiết</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Tablet: list + bottom sheet / slide-over ──────────────────────────────
  if (isTablet) {
    return (
      <div className="page active" id="page-scan-history">
        <Navbar
          title={<>Scan<span style={{ color: 'var(--accent)' }}>History</span></>}
          actions={history.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>{history.length} scans</span>
          )}
        />

        <div style={{ maxWidth: 720, margin: '0 auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 80 }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
              <div style={{ fontSize: 26, animation: 'pulse 1.5s infinite', marginBottom: 8 }}>⏳</div>
              <div style={{ fontSize: 13 }}>Đang tải...</div>
            </div>
          )}
          {!loading && history.length === 0 && <EmptyState />}
          {history.map(h => (
            <HistoryItem key={h.id} h={h} isActive={false}
              onClick={() => handleSelect(h)} onDelete={() => handleDelete(h.id)} />
          ))}
        </div>

        {/* Slide-over modal */}
        <SlideModal open={modalOpen} onClose={() => setModalOpen(false)}>
          <DetailPanel item={selected} onClose={() => setModalOpen(false)} />
        </SlideModal>
      </div>
    );
  }

  // ── Mobile: list + bottom sheet ───────────────────────────────────────────
  return (
    <div className="page active" id="page-scan-history">
      <Navbar
        title={<>Scan<span style={{ color: 'var(--accent)' }}>History</span></>}
        actions={history.length > 0 && (
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{history.length} scans</span>
        )}
      />

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 80 }}>
        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            <div style={{ fontSize: 26, animation: 'pulse 1.5s infinite', marginBottom: 8 }}>⏳</div>
            <div style={{ fontSize: 13 }}>Đang tải...</div>
          </div>
        )}
        {!loading && history.length === 0 && <EmptyState />}
        {history.map(h => (
          <HistoryItem key={h.id} h={h} isActive={false}
            onClick={() => handleSelect(h)} onDelete={() => handleDelete(h.id)} />
        ))}
      </div>

      {/* Bottom Sheet */}
      <BottomSheet open={modalOpen} onClose={() => setModalOpen(false)}>
        <DetailPanel item={selected} onClose={() => setModalOpen(false)} />
      </BottomSheet>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 44 }}>📷</span>
      <p style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>Chưa có lịch sử scan</p>
      <p style={{ fontSize: 12, margin: 0 }}>Bắt đầu scan tiền để xem kết quả ở đây.</p>
    </div>
  );
}

// ── Bottom Sheet (mobile) ─────────────────────────────────────────────────────
function BottomSheet({ open, onClose, children }) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
          zIndex: 40, opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s',
        }}
      />
      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'var(--bg2)', borderRadius: '20px 20px 0 0',
        zIndex: 50, maxHeight: '88vh', overflow: 'hidden',
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -4px 40px rgba(0,0,0,0.4)',
      }}>
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 2 }} />
        </div>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </>
  );
}

// ── Slide-over Modal (tablet) ─────────────────────────────────────────────────
function SlideModal({ open, onClose, children }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 40, opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(480px, 90vw)',
        background: 'var(--bg1, var(--bg2))',
        zIndex: 50, overflow: 'hidden',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-4px 0 40px rgba(0,0,0,0.4)',
      }}>
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {children}
        </div>
      </div>
    </>
  );
}