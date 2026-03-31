import { NavLink } from 'react-router-dom'

const items = [
  { to: '/dashboard', icon: '🏠', label: 'Trang chủ' },
  { to: '/budget', icon: '💰', label: 'Ngân sách' },
  { to: '/scan', icon: '📷', label: 'Quét tiền' },
  { to: '/exchange-rate', icon: '💱', label: 'Tỷ giá' },
  { to: '/profile', icon: '👤', label: 'Hồ sơ' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {items.map(item => (
          <NavLink key={item.to} to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 text-xs transition-colors ${
                isActive ? 'text-red-600' : 'text-gray-500'
              }`}>
            <span className="text-xl">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
