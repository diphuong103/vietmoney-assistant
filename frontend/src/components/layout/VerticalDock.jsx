import { useNavigate, useLocation } from 'react-router-dom';

// ── SVG Icon Components ──────────────────────────────────────────────────────

const IconScrollTop = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
        <line x1="12" y1="9" x2="12" y2="21" />
        <line x1="4" y1="3" x2="20" y2="3" />
    </svg>
);

const IconHome = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
);

const IconNews = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
        <line x1="10" y1="6" x2="18" y2="6" />
        <line x1="10" y1="10" x2="18" y2="10" />
        <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
);

const IconScanner = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const IconATM = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);

const IconWallet = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="3" ry="3" />
        <line x1="1" y1="10" x2="23" y2="10" />
        <circle cx="18" cy="15" r="1.5" />
    </svg>
);

const IconExchange = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline points="7 23 3 19 7 15" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
);

const IconPlanner = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9z" />
        <path d="M14.5 13l2 2.5L20 11" />
    </svg>
);

const IconWiki = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="8" y1="7" x2="16" y2="7" />
        <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
);

const IconSearch = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

// ── Dock Items Config ────────────────────────────────────────────────────────

const DOCK_ITEMS = [
    { id: 'scroll-top', icon: IconScrollTop, label: 'Scroll to Top', action: 'scrollTop' },
    { id: 'home', icon: IconHome, label: 'Home', path: '/' },
    { id: 'search', icon: IconSearch, label: 'Search', action: 'openSearch' },
    null, // separator
    { id: 'scanner', icon: IconScanner, label: 'AI Scanner', path: '/scan' },
    { id: 'atm-map', icon: IconATM, label: 'ATM Finder', path: '/atm-map' },
    { id: 'wallet', icon: IconWallet, label: 'Budget & Wallet', path: '/budget' },
    { id: 'exchange', icon: IconExchange, label: 'Exchange Rates', path: '/exchange' },
    null, // separator
    { id: 'planner', icon: IconPlanner, label: 'Travel Planner', action: 'openPlans' },
    { id: 'news', icon: IconNews, label: 'Travel News', path: '/news' },
    { id: 'wiki', icon: IconWiki, label: 'Travel Wiki', path: '/wiki' },
];

// ── VerticalDock Component ───────────────────────────────────────────────────

export default function VerticalDock({ onOpenPlans, onOpenSearch }) {
    const navigate = useNavigate();
    const location = useLocation();

    const handleClick = (item) => {
        if (item.action === 'scrollTop') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else if (item.action === 'openPlans') {
            onOpenPlans?.();
        } else if (item.action === 'openSearch') {
            onOpenSearch?.();
        } else if (item.path) {
            navigate(item.path);
        }
    };

    return (
        <nav className="vertical-dock" aria-label="Quick access dock">
            {DOCK_ITEMS.map((item, idx) => {
                if (item === null) {
                    return <div key={`sep-${idx}`} className="vdock-separator" />;
                }

                const Icon = item.icon;
                const isActive = item.path && location.pathname === item.path;

                return (
                    <button
                        key={item.id}
                        className={`vdock-item${isActive ? ' vdock-item--active' : ''}`}
                        onClick={() => handleClick(item)}
                        aria-label={item.label}
                    >
                        <span className="vdock-icon"><Icon /></span>
                        <span className="vdock-tooltip">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
