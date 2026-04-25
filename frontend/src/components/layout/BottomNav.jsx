import { NavLink } from 'react-router-dom';
import { t } from '../../utils/i18n';

export default function BottomNav({ onOpenSearch }) {
  const NAV_ITEMS = [
    { to: '/', icon: '🏠', label: t('nav_home') },
    { to: '/news', icon: '📰', label: t('nav_news') },
    { to: '/scan', icon: '📷', label: t('nav_scan') },
    { to: '/budget', icon: '💰', label: t('nav_budget') },
    { to: '/exchange', icon: '💱', label: t('nav_rates') },
  ];

  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(({ to, icon, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <span className="nav-icon">{icon}</span>
          <span className="nav-label">{label}</span>
        </NavLink>
      ))}
      {/* Search button — mobile only */}
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
