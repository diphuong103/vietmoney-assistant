import { useState, useEffect, useCallback } from 'react';
import adminApi from '../../api/adminApi';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'pending', label: '⏳ Chờ duyệt' },
  { key: 'approved', label: '✅ Đã duyệt' },
  { key: 'rejected', label: '❌ Từ chối' },
];

export default function ArticleApprovalPage() {
  const [articles, setArticles] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');

  // Reject modal
  const [rejectModal, setRejectModal] = useState({ open: false, articleId: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ open: false, articleId: null, title: '' });

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getArticles({ status: activeTab, page: page - 1, size: 10 });
      const data = res.data.data;
      let content = data?.content || [];

      // Client-side filtering by search
      if (search.trim()) {
        content = content.filter(a =>
          a.title?.toLowerCase().includes(search.toLowerCase()) ||
          a.author?.fullName?.toLowerCase().includes(search.toLowerCase())
        );
      }

      setArticles(content);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      setError('Không thể tải danh sách bài viết.');
    } finally {
      setLoading(false);
    }
  }, [page, activeTab, search]);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const handleApprove = async (id) => {
    setActionLoading(id);
    try {
      await adminApi.approveArticle(id);
      toast.success('Đã phê duyệt bài viết!');
      fetchArticles();
    } catch {
      toast.error('Phê duyệt thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Vui lòng nhập lý do từ chối.');
      return;
    }
    setActionLoading(rejectModal.articleId);
    try {
      await adminApi.rejectArticle(rejectModal.articleId, rejectReason);
      toast.success('Đã từ chối bài viết.');
      setRejectModal({ open: false, articleId: null });
      setRejectReason('');
      fetchArticles();
    } catch {
      toast.error('Từ chối thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setActionLoading(deleteModal.articleId);
    try {
      await adminApi.deleteArticle(deleteModal.articleId);
      toast.success('Đã xoá bài viết.');
      setDeleteModal({ open: false, articleId: null, title: '' });
      fetchArticles();
    } catch {
      toast.error('Xoá thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, marginBottom: 24, fontWeight: 700 }}>
        📝 Quản lý bài viết
      </h1>

      {/* Tabs + Search */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 4, background: 'var(--bg3)', borderRadius: 14, padding: 4, border: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setActiveTab(t.key); setPage(1); }}
              style={{
                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: activeTab === t.key ? 'var(--accent)' : 'transparent',
                color: activeTab === t.key ? '#000' : 'var(--muted)',
                border: 'none', fontFamily: 'Syne, sans-serif', transition: 'all 0.2s',
              }}
            >{t.label}</button>
          ))}
        </div>
        <input
          type="text"
          placeholder="🔍 Tìm theo tiêu đề..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 12, color: 'var(--text)', padding: '10px 14px',
            fontSize: 13, outline: 'none', flex: '1', minWidth: 200,
            transition: 'border-color 0.2s',
          }}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spinner size={32} />
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ color: 'var(--accent3)', marginBottom: 12 }}>{error}</div>
          <button className="submit-form-btn" style={{ width: 'auto', padding: '8px 20px' }} onClick={fetchArticles}>Thử lại</button>
        </div>
      ) : articles.length === 0 ? (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 14,
        }}>
          {activeTab === 'pending' ? '✅ Không có bài viết nào đang chờ duyệt' : `Không có bài viết nào ở trạng thái "${activeTab}"`}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {articles.map(a => (
            <div key={a.id} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: 16, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16,
              transition: 'border-color 0.2s',
            }}>
              {/* Article info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 15 }}>{a.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <span>👤 {a.author?.fullName || a.author?.username || 'N/A'}</span>
                  <span>📅 {a.createdAt ? new Date(a.createdAt).toLocaleDateString('vi-VN') : 'N/A'}</span>
                  {a.tags && <span>🏷️ {a.tags}</span>}
                </div>
              </div>

              {/* Actions */}
              {a.status === 'PENDING' ? (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    className="submit-form-btn"
                    disabled={actionLoading === a.id}
                    style={{ padding: '8px 16px', fontSize: 13, width: 'auto', marginTop: 0, opacity: actionLoading === a.id ? 0.6 : 1 }}
                    onClick={() => handleApprove(a.id)}
                  >
                    {actionLoading === a.id ? <Spinner size={14} /> : '✓ Duyệt'}
                  </button>
                  <button
                    onClick={() => setRejectModal({ open: true, articleId: a.id })}
                    disabled={actionLoading === a.id}
                    style={{
                      padding: '8px 16px', fontSize: 13, borderRadius: 10, cursor: 'pointer',
                      background: 'rgba(242,61,110,0.12)', color: 'var(--accent3)',
                      border: '1px solid rgba(242,61,110,0.3)', fontWeight: 600,
                    }}
                  >✕ Từ chối</button>
                  <button
                    onClick={() => setDeleteModal({ open: true, articleId: a.id, title: a.title })}
                    disabled={actionLoading === a.id}
                    style={{
                      padding: '8px 12px', fontSize: 13, borderRadius: 10, cursor: 'pointer',
                      background: 'rgba(255,255,255,0.05)', color: 'var(--muted)',
                      border: '1px solid var(--border)', fontWeight: 600,
                    }}
                  >🗑️</button>
                </div>
              ) : (
                <span style={{
                  fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 600,
                  background: a.status === 'APPROVED' ? 'rgba(200,242,61,0.1)' : 'rgba(242,61,110,0.1)',
                  color: a.status === 'APPROVED' ? 'var(--accent)' : 'var(--accent3)',
                  textTransform: 'capitalize',
                }}>{a.status?.toLowerCase()}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && !loading && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}

      {/* Reject Reason Modal */}
      <Modal open={rejectModal.open} onClose={() => { setRejectModal({ open: false, articleId: null }); setRejectReason(''); }}>
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 24, padding: 28, width: '90%', maxWidth: 420,
          margin: 'auto', position: 'relative',
        }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>
            Lý do từ chối
          </h3>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối bài viết..."
            style={{
              width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
              borderRadius: 12, color: 'var(--text)', padding: 14,
              fontSize: 14, minHeight: 100, resize: 'vertical', outline: 'none',
              fontFamily: 'DM Sans, sans-serif',
            }}
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
            <button
              onClick={() => { setRejectModal({ open: false, articleId: null }); setRejectReason(''); }}
              style={{
                padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
                background: 'var(--bg3)', color: 'var(--muted)',
                border: '1px solid var(--border)', fontWeight: 600, fontSize: 13,
              }}
            >Huỷ</button>
            <button
              className="submit-form-btn"
              onClick={handleReject}
              disabled={actionLoading}
              style={{
                width: 'auto', padding: '10px 20px', fontSize: 13, marginTop: 0,
                background: 'var(--accent3)',
              }}
            >
              {actionLoading ? <Spinner size={14} /> : 'Xác nhận từ chối'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, articleId: null, title: '' })}>
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 24, padding: 28, width: '90%', maxWidth: 420,
          margin: 'auto', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Xoá bài viết?
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
            Bạn có chắc muốn xoá bài viết <strong style={{ color: 'var(--text)' }}>"{deleteModal.title}"</strong>?<br />
            Hành động này không thể hoàn tác.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => setDeleteModal({ open: false, articleId: null, title: '' })}
              style={{
                padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
                background: 'var(--bg3)', color: 'var(--muted)',
                border: '1px solid var(--border)', fontWeight: 600, fontSize: 13,
              }}
            >Huỷ</button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              style={{
                padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
                background: 'rgba(242,61,110,0.15)', color: 'var(--accent3)',
                border: '1px solid rgba(242,61,110,0.4)', fontWeight: 700, fontSize: 13,
              }}
            >
              {actionLoading ? <Spinner size={14} /> : 'Xoá'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
