import { useNavigate } from 'react-router-dom';

export default function Navbar({ title, subtitle, actions }) {
  const navigate = useNavigate();
  return (
    <div className="topbar">
      <a
        className="topbar-logo"
        href="/"
        onClick={e => { e.preventDefault(); navigate('/'); }}
        style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
        title="Về trang chủ"
      >
        {title}
        {subtitle && (
          <span style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: 400 }}>
            {' '}/ {subtitle}
          </span>
        )}
      </a>
      <div className="topbar-actions">
        {actions}
      </div>
    </div>
  );
}
