import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminApi from '../../api/adminApi';
import Spinner from '../../components/common/Spinner';

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, articlesRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getPendingArticles({ page: 0, size: 5 }),
      ]);
      setStats(statsRes.data.data);
      setRecentArticles(articlesRes.data.data?.content || []);
    } catch (err) {
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const statCards = stats ? [
    { label: 'Tổng người dùng', value: stats.totalUsers?.toLocaleString() || '0', icon: '👥', color: 'var(--blue)' },
    { label: 'Bài viết', value: stats.totalArticles?.toLocaleString() || '0', icon: '📝', color: 'var(--accent)' },
    { label: 'Chờ duyệt', value: stats.pendingArticles?.toLocaleString() || '0', icon: '⏳', color: 'var(--gold)' },
    { label: 'Scan hôm nay', value: stats.totalScansToday?.toLocaleString() || '0', icon: '📷', color: 'var(--accent2)' },
  ] : [];

  if (loading) {
    return (
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 80 }}>
        <Spinner size={36} />
        <span style={{ color: 'var(--muted)', fontSize: 14 }}>Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, textAlign: 'center', paddingTop: 80 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
        <div style={{ color: 'var(--accent3)', marginBottom: 16 }}>{error}</div>
        <button className="submit-form-btn" style={{ width: 'auto', padding: '10px 24px' }} onClick={fetchData}>
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, marginBottom: 28, fontWeight: 700 }}>
        📊 Admin Dashboard
      </h1>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        {statCards.map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '22px 20px',
            transition: 'all 0.2s', cursor: 'default',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 32, fontWeight: 600, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5, fontSize: 13 }}>
          Thao tác nhanh
        </h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="submit-form-btn"
            style={{ width: 'auto', padding: '10px 20px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
            onClick={() => navigate('/admin/articles')}
          >
            📝 Duyệt bài viết
            {stats?.pendingArticles > 0 && (
              <span style={{
                background: 'var(--accent3)', color: '#fff', borderRadius: 20,
                padding: '2px 8px', fontSize: 11, fontWeight: 700,
              }}>{stats.pendingArticles}</span>
            )}
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            style={{
              padding: '10px 20px', fontSize: 13, borderRadius: 12, cursor: 'pointer',
              background: 'rgba(61,143,242,0.12)', color: 'var(--blue)',
              border: '1px solid rgba(61,143,242,0.3)', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            👥 Quản lý người dùng
          </button>
        </div>
      </div>

      {/* Recent Pending Articles */}
      <div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 13, fontWeight: 700, marginBottom: 14, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1.5 }}>
          Bài viết chờ duyệt gần đây
        </h2>
        {recentArticles.length === 0 ? (
          <div style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 16, padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 14,
          }}>
            ✅ Không có bài viết nào đang chờ duyệt
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentArticles.map(a => (
              <div key={a.id} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: 16, padding: '14px 18px',
                display: 'flex', alignItems: 'center', gap: 14,
                transition: 'border-color 0.2s',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12,
                  background: 'rgba(242,196,61,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0,
                }}>📝</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {a.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                    Bởi {a.author?.fullName || a.author?.username || 'N/A'} · {new Date(a.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                  background: 'rgba(242,196,61,0.12)', color: 'var(--gold)',
                }}>Pending</span>
              </div>
            ))}
            {recentArticles.length > 0 && (
              <button
                onClick={() => navigate('/admin/articles')}
                style={{
                  background: 'transparent', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '10px', cursor: 'pointer',
                  color: 'var(--accent)', fontSize: 13, fontWeight: 600,
                  transition: 'all 0.2s', fontFamily: 'Syne, sans-serif',
                }}
              >
                Xem tất cả →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
