import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/',         icon: '🏠', label: 'Home'   },
  { to: '/news',     icon: '📰', label: 'News'   },
  { to: '/scan',     icon: '📷', label: 'Scan'   },
  { to: '/budget',   icon: '💰', label: 'Budget' },
  { to: '/exchange', icon: '💱', label: 'Rates'  },
];

export default function BottomNav() {
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
    </nav>
  );
}
