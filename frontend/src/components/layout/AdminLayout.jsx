import { Outlet, NavLink, useNavigate } from 'react-router-dom';

const ADMIN_NAV = [
  { to: '/admin',          label: '📊 Dashboard'       },
  { to: '/admin/articles', label: '📝 Article Approval' },
  { to: '/admin/users',    label: '👥 User Management'  },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="app" style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '24px 0',
      }}>
        <div
          className="topbar-logo"
          style={{ padding: '0 20px 24px', cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Viet<span style={{ color: 'var(--accent)' }}>Money</span>
          <span style={{ color: 'var(--muted)', fontSize: 12 }}> Admin</span>
        </div>
        {ADMIN_NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/admin'}
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
      </aside>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
