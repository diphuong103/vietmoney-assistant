import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import scanApi from '../../api/scanApi';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export default function ScanHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await scanApi.getHistory();
      setHistory(res.data?.data ?? []);
    } catch {
      // toast auto-handled by axiosClient
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const handleDelete = async (id) => {
    try {
      await scanApi.deleteHistory(id);
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch {
      // toast auto-handled
    }
  };

  return (
    <div className="page active" id="page-scan-history">
      <Navbar
        title={<>Scan<span style={{ color: 'var(--accent)' }}>History</span></>}
        actions={
          history.length > 0 && (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>
              {history.length} scans
            </span>
          )
        }
      />
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>
            <div style={{ fontSize: 28, marginBottom: 8, animation: 'pulse 1.5s infinite' }}>⏳</div>
            <div style={{ fontSize: 13 }}>Đang tải...</div>
          </div>
        )}

        {!loading && history.length === 0 && (
          <div style={{
            textAlign: 'center', padding: 40, color: 'var(--muted)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 48 }}>📷</span>
            <p style={{ fontSize: 15, fontWeight: 600 }}>Chưa có lịch sử scan</p>
            <p style={{ fontSize: 13 }}>Bắt đầu scan tiền để xem kết quả ở đây.</p>
          </div>
        )}

        {history.map((h) => (
          <div className="txn-item" key={h.id} style={{ position: 'relative' }}>
            <div className="txn-icon" style={{ background: 'rgba(200,242,61,0.1)' }}>📷</div>
            <div className="txn-detail">
              <div className="txn-name">{h.detectedDenomination ?? 'Unknown'}</div>
              <div className="txn-cat">
                {h.confidence ? `Confidence: ${(h.confidence * 100).toFixed(0)}%` : ''}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="txn-cat" style={{ fontSize: 12 }}>
                {h.scannedAt ? dayjs(h.scannedAt).fromNow() : ''}
              </div>
              <button
                onClick={() => handleDelete(h.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--accent3)', fontSize: 14, padding: 4,
                }}
                title="Xóa"
              >🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
