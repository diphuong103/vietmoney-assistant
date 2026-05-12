import { NavLink } from 'react-router-dom';
import { t } from '../../utils/i18n';
import { useNotificationStore } from '../../store/notificationStore';

export default function BottomNav({ onOpenSearch }) {
  const { unreadCount } = useNotificationStore();

  const NAV_ITEMS = [
    { to: '/', icon: '🏠', label: t('nav_home') },
    { to: '/news', icon: '📰', label: t('nav_news') },
    { to: '/scan', icon: '📷', label: t('nav_scan') },
    { to: '/budget', icon: '💰', label: t('nav_budget') },
    { to: '/settings', icon: '⚙️', label: 'Cài đặt', badge: unreadCount },
  ];

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ to, icon, label, badge }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon" style={{ position: 'relative', display: 'inline-block' }}>
            {icon}
            {badge > 0 && (
              <span style={{
                position: 'absolute', top: -4, right: -6,
                minWidth: 14, height: 14,
                background: '#f23d6e', color: '#fff',
                fontSize: 9, fontWeight: 700, borderRadius: 7,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 2px', lineHeight: 1, pointerEvents: 'none',
              }}>
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </span>
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
      {/* Search button — mobile only (kept for backward compat with callers) */}
      <button
        className="nav-item nav-search-btn"
        onClick={() => onOpenSearch?.()}
        aria-label="Search"
      >
        <span className="nav-icon">🔍</span>
        <span className="nav-label">Search</span>
      </button>
    </nav>
  );
}
