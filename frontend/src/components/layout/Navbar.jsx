import { useNavigate } from 'react-router-dom';

export default function Navbar({ title, subtitle, actions }) {
  return (
    <div className="topbar">
      <div className="topbar-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} title="Về trang chủ">
        {title}
        {subtitle && (
          <span style={{ color: 'var(--muted)', fontSize: '14px', fontWeight: 400 }}>
            {' '}/ {subtitle}
          </span>
        )}
      </div>
      <div className="topbar-actions">
        {actions}
      </div>
    </div>
  );
}
