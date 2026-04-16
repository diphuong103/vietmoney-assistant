import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const ADMIN_NAV = [
  { to: '/admin', label: '📊 Dashboard' },
  { to: '/admin/articles', label: '📝 Quản lý bài viết' },
  { to: '/admin/users', label: '👥 Quản lý người dùng' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    logout();
    navigate('/login');
  };

  const sidebarStyle = {
    width: 240,
    background: 'var(--bg2)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 0',
    position: 'relative',
    zIndex: 100,
    transition: 'transform 0.3s ease',
  };

  return (
    <div className="app" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)', zIndex: 90,
            display: 'none',
          }}
          className="admin-overlay"
        />
      )}

      {/* Sidebar */}
      <aside style={sidebarStyle} className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div
          className="topbar-logo"
          style={{ padding: '0 20px 20px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Viet<span style={{ color: 'var(--accent)' }}>Money</span>
          <span style={{ color: 'var(--muted)', fontSize: 12, marginLeft: 4 }}>Admin</span>
        </div>

        {/* Admin info */}
        {user && (
          <div style={{
            padding: '12px 20px', margin: '0 12px 16px',
            background: 'var(--bg3)', borderRadius: 12,
            border: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#000', flexShrink: 0,
              }}>
                {(user.fullName?.[0] || user.name?.[0] || 'A').toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {user.fullName || user.name || 'Admin'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>ADMIN</div>
              </div>
            </div>
          </div>
        )}

        {/* Nav links */}
        <nav style={{ flex: 1 }}>
          {ADMIN_NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/admin'}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: 'block', padding: '12px 20px',
                color: isActive ? 'var(--accent)' : 'var(--muted)',
                background: isActive ? 'rgba(200,242,61,0.06)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                fontSize: 14, fontWeight: 500, transition: 'all 0.2s',
                textDecoration: 'none',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div style={{ padding: '16px 12px 8px', borderTop: '1px solid var(--border)', marginTop: 'auto' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
              background: 'transparent', color: 'var(--muted)',
              border: 'none', fontSize: 13, fontWeight: 500,
              transition: 'all 0.2s', textAlign: 'left',
            }}
          >
            🏠 Về trang chủ
          </button>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '10px 12px', borderRadius: 10, cursor: 'pointer',
              background: 'rgba(242,61,110,0.08)', color: 'var(--accent3)',
              border: '1px solid rgba(242,61,110,0.15)', fontSize: 13, fontWeight: 600,
              transition: 'all 0.2s', textAlign: 'left', marginTop: 4,
            }}
          >
            🚪 Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        {/* Mobile hamburger */}
        <button
          className="admin-hamburger"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed', top: 16, left: 16, zIndex: 110,
            width: 40, height: 40, borderRadius: 12,
            background: 'var(--bg3)', border: '1px solid var(--border)',
            color: 'var(--text)', fontSize: 18,
            display: 'none', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <Outlet />
      </main>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed !important;
            left: 0; top: 0; bottom: 0;
            transform: translateX(-100%);
            box-shadow: 4px 0 20px rgba(0,0,0,0.4);
          }
          .admin-sidebar.open {
            transform: translateX(0) !important;
          }
          .admin-overlay {
            display: block !important;
          }
          .admin-hamburger {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
}
