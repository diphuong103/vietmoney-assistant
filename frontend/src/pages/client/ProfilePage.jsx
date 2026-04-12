import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import authApi, { clearSession, getStoredUser } from '../../api/authApi';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';

const NATIONALITIES = ['Vietnamese','Korean','Japanese','Chinese','American','French','German','British','Australian','Other'];
const CITIES = ['Hà Nội','Hồ Chí Minh','Đà Nẵng','Hội An','Huế','Nha Trang','Phú Quốc','Hạ Long','Cần Thơ','Đà Lạt'];

export default function ProfilePage() {
  const navigate = useNavigate();
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [loggingOut, setLogout] = useState(false);
  const [form, setForm]         = useState({
    fullName: '', nationality: '', travelDestination: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Try to load from API first, fallback to localStorage
      try {
        const res = await authApi.getMe();
        const u = res.data?.data ?? res.data;
        setUser(u);
        setForm({
          fullName: u?.fullName ?? '',
          nationality: u?.nationality ?? '',
          travelDestination: u?.travelDestination ?? '',
        });
      } catch {
        // Fallback to localStorage
        const stored = getStoredUser();
        setUser(stored);
        if (stored) {
          setForm({
            fullName: stored.fullName ?? '',
            nationality: stored.nationality ?? '',
            travelDestination: stored.travelDestination ?? '',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axiosClient.put('/users/me', form);
      const updated = res.data?.data ?? res.data;
      setUser(updated);
      localStorage.setItem('user', JSON.stringify(updated));
      setEditing(false);
      toast.success('Cập nhật thành công!');
    } catch {
      // toast auto
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLogout(true);
    try {
      await authApi.logout();
    } catch { /* ignore */ }
    clearSession();
    setLogout(false);
    navigate('/login');
  };

  const resolveAvatar = (u) => {
    if (u?.avatarUrl) return u.avatarUrl;
    const seed = u?.id ?? u?.username ?? 'guest';
    return `https://api.dicebear.com/8.x/thumbs/svg?seed=${seed}&radius=50`;
  };

  /* ── styles ─────────── */
  const inputStyle = {
    width: '100%', background: 'var(--bg3)',
    border: '1px solid var(--border)', borderRadius: 10,
    color: 'var(--text)', padding: '10px 12px', fontSize: 14,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
  };

  if (loading) {
    return (
      <div className="page active" id="page-profile">
        <Navbar title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>} subtitle="Profile" />
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <div style={{ fontSize: 28, animation: 'pulse 1.5s infinite' }}>👤</div>
          <div style={{ fontSize: 13, marginTop: 8 }}>Đang tải...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="page active" id="page-profile">
      <Navbar
        title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>}
        subtitle="Profile"
        actions={
          user && !editing && (
            <button className="icon-btn" onClick={() => setEditing(true)} title="Chỉnh sửa">✏️</button>
          )
        }
      />
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Avatar + Name */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <img
            src={resolveAvatar(user)}
            alt="Avatar"
            style={{
              width: 80, height: 80, borderRadius: '50%',
              border: '3px solid var(--accent)', objectFit: 'cover',
            }}
            onError={e => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(user?.fullName ?? 'U')}`;
            }}
          />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 20, fontWeight: 700 }}>
              {user?.fullName ?? user?.username ?? 'Traveler'}
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 2 }}>
              {user?.email ?? ''}
            </div>
            <div style={{
              display: 'inline-block', marginTop: 6, padding: '3px 10px',
              background: 'rgba(200,242,61,0.1)', border: '1px solid rgba(200,242,61,0.2)',
              borderRadius: 8, fontSize: 11, color: 'var(--accent)', fontWeight: 600,
            }}>
              {user?.role ?? 'CLIENT'}
            </div>
          </div>
        </div>

        {/* Info / Edit form */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 16,
        }}>
          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', marginBottom: 4 }}>
                  Họ và Tên
                </label>
                <input
                  value={form.fullName}
                  onChange={e => setForm(f => ({...f, fullName: e.target.value}))}
                  style={inputStyle}
                  placeholder="Nhập họ và tên"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', marginBottom: 4 }}>
                  Quốc tịch
                </label>
                <select
                  value={form.nationality}
                  onChange={e => setForm(f => ({...f, nationality: e.target.value}))}
                  style={{...inputStyle, cursor: 'pointer'}}
                >
                  <option value="">-- Chọn --</option>
                  {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontFamily: 'DM Mono, monospace', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--muted)', marginBottom: 4 }}>
                  Điểm đến du lịch
                </label>
                <select
                  value={form.travelDestination}
                  onChange={e => setForm(f => ({...f, travelDestination: e.target.value}))}
                  style={{...inputStyle, cursor: 'pointer'}}
                >
                  <option value="">-- Chọn --</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setEditing(false)} style={{
                  flex: 1, padding: '10px', background: 'var(--bg3)', color: 'var(--text)',
                  border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer',
                  fontWeight: 600, fontSize: 13,
                }}>Hủy</button>
                <button onClick={handleSave} disabled={saving} style={{
                  flex: 1, padding: '10px', background: 'var(--accent)', color: '#000',
                  border: 'none', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: 13,
                }}>
                  {saving ? '⏳ Đang lưu...' : '💾 Lưu'}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '👤', label: 'Username', value: user?.username },
                { icon: '📧', label: 'Email', value: user?.email },
                { icon: '🌍', label: 'Quốc tịch', value: user?.nationality ?? '—' },
                { icon: '✈️', label: 'Điểm đến', value: user?.travelDestination ?? '—' },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 0',
                  borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
                }}>
                  <span style={{ fontSize: 18, width: 28, textAlign: 'center' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: '100%', padding: '13px',
            background: 'rgba(242,61,110,0.08)', color: '#f23d6e',
            border: '1px solid rgba(242,61,110,0.25)', borderRadius: 12,
            cursor: loggingOut ? 'not-allowed' : 'pointer',
            fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
            transition: 'background 0.2s',
          }}
        >
          {loggingOut ? '⏳ Đang đăng xuất...' : '🚪 Đăng xuất'}
        </button>
      </div>
    </div>
  );
}
