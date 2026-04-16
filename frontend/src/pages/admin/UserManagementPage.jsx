import { useState, useEffect, useCallback } from 'react';
import adminApi from '../../api/adminApi';
import Spinner from '../../components/common/Spinner';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  // Role modal
  const [roleModal, setRoleModal] = useState({ open: false, user: null, newRole: '' });

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ open: false, user: null });

  // Status modal
  const [statusModal, setStatusModal] = useState({ open: false, user: null });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUsers({ page: page - 1, size: PAGE_SIZE });
      const data = res.data.data;
      setUsers(data?.content || []);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      setError('Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async () => {
    setActionLoading(roleModal.user?.id);
    try {
      await adminApi.updateUserRole(roleModal.user.id, roleModal.newRole);
      toast.success(`Đã cập nhật quyền thành ${roleModal.newRole}`);
      setRoleModal({ open: false, user: null, newRole: '' });
      fetchUsers();
    } catch {
      toast.error('Cập nhật quyền thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    setActionLoading(deleteModal.user?.id);
    try {
      await adminApi.deleteUser(deleteModal.user.id);
      toast.success('Đã xoá người dùng.');
      setDeleteModal({ open: false, user: null });
      fetchUsers();
    } catch {
      toast.error('Xoá người dùng thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleStatus = async () => {
    setActionLoading(statusModal.user?.id);
    try {
      await adminApi.toggleUserStatus(statusModal.user.id);
      toast.success(statusModal.user.enabled ? 'Đã khoá tài khoản.' : 'Đã mở khoá tài khoản.');
      setStatusModal({ open: false, user: null });
      fetchUsers();
    } catch {
      toast.error('Thay đổi trạng thái thất bại.');
    } finally {
      setActionLoading(null);
    }
  };

  // Client-side search filter
  const filteredUsers = search.trim()
    ? users.filter(u =>
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase())
    )
    : users;

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, marginBottom: 24, fontWeight: 700 }}>
        👥 Quản lý người dùng
      </h1>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          placeholder="🔍 Tìm theo tên, email, username..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            background: 'var(--bg3)', border: '1px solid var(--border)',
            borderRadius: 12, color: 'var(--text)', padding: '10px 14px',
            fontSize: 13, outline: 'none', width: '100%', maxWidth: 400,
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
          <button className="submit-form-btn" style={{ width: 'auto', padding: '8px 20px' }} onClick={fetchUsers}>Thử lại</button>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 14,
        }}>
          {search ? `Không tìm thấy người dùng nào với "${search}"` : 'Chưa có người dùng nào'}
        </div>
      ) : (
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 20, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg3)', fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                {['Người dùng', 'Email', 'Quyền', 'Trạng thái', 'Ngày tham gia', 'Thao tác'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} style={{ borderTop: '1px solid var(--border)', transition: 'background 0.15s' }}>
                  {/* User info cell */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: '50%',
                        background: u.avatarUrl
                          ? `url(${u.avatarUrl}) center/cover`
                          : 'linear-gradient(135deg, var(--accent), var(--accent2))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, fontWeight: 700, color: '#000', flexShrink: 0,
                      }}>
                        {!u.avatarUrl && (u.fullName?.[0] || u.username?.[0] || '?').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: 14 }}>{u.fullName || u.username}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>@{u.username}</div>
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td style={{ padding: '14px 16px', color: 'var(--muted)', fontSize: 13 }}>{u.email}</td>

                  {/* Role */}
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                      background: u.role === 'ADMIN' ? 'rgba(200,242,61,0.12)' : 'rgba(255,255,255,0.05)',
                      color: u.role === 'ADMIN' ? 'var(--accent)' : 'var(--muted)',
                      textTransform: 'uppercase',
                    }}>{u.role}</span>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: u.enabled ? 'var(--accent)' : 'var(--accent3)',
                      }} />
                      <span style={{ fontSize: 12, color: u.enabled ? 'var(--accent)' : 'var(--accent3)' }}>
                        {u.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                    {u.emailVerified && (
                      <span style={{ fontSize: 10, color: 'var(--accent2)' }}>✓ Email verified</span>
                    )}
                  </td>

                  {/* Joined */}
                  <td style={{ padding: '14px 16px', color: 'var(--muted)', fontSize: 13 }}>
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => setRoleModal({
                          open: true,
                          user: u,
                          newRole: u.role === 'ADMIN' ? 'CLIENT' : 'ADMIN',
                        })}
                        disabled={actionLoading === u.id}
                        style={{
                          padding: '6px 12px', fontSize: 11, borderRadius: 8, cursor: 'pointer',
                          background: 'rgba(61,143,242,0.12)', color: 'var(--blue)',
                          border: '1px solid rgba(61,143,242,0.25)', fontWeight: 600,
                        }}
                      >
                        {u.role === 'ADMIN' ? '↓ Client' : '↑ Admin'}
                      </button>
                      <button
                        onClick={() => setStatusModal({ open: true, user: u })}
                        disabled={actionLoading === u.id}
                        style={{
                          padding: '6px 12px', fontSize: 11, borderRadius: 8, cursor: 'pointer',
                          background: u.enabled ? 'rgba(242,169,61,0.12)' : 'rgba(61,242,100,0.12)',
                          color: u.enabled ? '#F2A93D' : '#3DF264',
                          border: `1px solid ${u.enabled ? 'rgba(242,169,61,0.25)' : 'rgba(61,242,100,0.25)'}`, fontWeight: 600,
                        }}
                      >
                        {u.enabled ? '🔒 Khoá' : '🔓 Mở'}
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, user: u })}
                        disabled={actionLoading === u.id}
                        style={{
                          padding: '6px 10px', fontSize: 11, borderRadius: 8, cursor: 'pointer',
                          background: 'rgba(242,61,110,0.08)', color: 'var(--accent3)',
                          border: '1px solid rgba(242,61,110,0.2)', fontWeight: 600,
                        }}
                      >🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && !loading && <Pagination page={page} totalPages={totalPages} onChange={setPage} />}

      {/* Role Change Confirm Modal */}
      <Modal open={roleModal.open} onClose={() => setRoleModal({ open: false, user: null, newRole: '' })}>
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 24, padding: 28, width: '90%', maxWidth: 400,
          margin: 'auto', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Thay đổi quyền?
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
            Đổi quyền của <strong style={{ color: 'var(--text)' }}>{roleModal.user?.fullName || roleModal.user?.username}</strong> từ{' '}
            <span style={{ color: 'var(--accent)' }}>{roleModal.user?.role}</span> sang{' '}
            <span style={{ color: 'var(--blue)' }}>{roleModal.newRole}</span>?
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => setRoleModal({ open: false, user: null, newRole: '' })}
              style={{
                padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
                background: 'var(--bg3)', color: 'var(--muted)',
                border: '1px solid var(--border)', fontWeight: 600, fontSize: 13,
              }}
            >Huỷ</button>
            <button
              className="submit-form-btn"
              onClick={handleRoleChange}
              disabled={actionLoading}
              style={{ width: 'auto', padding: '10px 24px', fontSize: 13, marginTop: 0 }}
            >
              {actionLoading ? <Spinner size={14} /> : 'Xác nhận'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={deleteModal.open} onClose={() => setDeleteModal({ open: false, user: null })}>
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 24, padding: 28, width: '90%', maxWidth: 400,
          margin: 'auto', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Xoá người dùng?
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
            Bạn có chắc muốn xoá <strong style={{ color: 'var(--text)' }}>{deleteModal.user?.fullName || deleteModal.user?.username}</strong>?<br />
            Hành động này không thể hoàn tác.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => setDeleteModal({ open: false, user: null })}
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

      {/* Toggle Status Modal */}
      <Modal open={statusModal.open} onClose={() => setStatusModal({ open: false, user: null })}>
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 24, padding: 28, width: '90%', maxWidth: 400,
          margin: 'auto', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>{statusModal.user?.enabled ? '🔒' : '🔓'}</div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            {statusModal.user?.enabled ? 'Khoá tài khoản?' : 'Mở khoá tài khoản?'}
          </h3>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
            Bạn có chắc muốn {statusModal.user?.enabled ? 'khoá' : 'mở khoá'} <strong style={{ color: 'var(--text)' }}>{statusModal.user?.fullName || statusModal.user?.username}</strong>?
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button
              onClick={() => setStatusModal({ open: false, user: null })}
              style={{
                padding: '10px 24px', borderRadius: 10, cursor: 'pointer',
                background: 'var(--bg3)', color: 'var(--muted)',
                border: '1px solid var(--border)', fontWeight: 600, fontSize: 13,
              }}
            >Huỷ</button>
            <button
              onClick={handleToggleStatus}
              disabled={actionLoading}
              className="submit-form-btn"
              style={{ width: 'auto', padding: '10px 24px', marginTop: 0 }}
            >
              {actionLoading ? <Spinner size={14} /> : 'Xác nhận'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
