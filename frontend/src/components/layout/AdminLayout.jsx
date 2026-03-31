import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function AdminLayout() {
  const { logout } = useAuth()
  const links = [
    { to: '/admin', label: 'Tổng quan', icon: '📊', end: true },
    { to: '/admin/users', label: 'Người dùng', icon: '👥' },
    { to: '/admin/articles', label: 'Bài viết', icon: '📝' },
  ]
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-red-400">VietMoney Admin</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}>
              <span>{l.icon}</span>{l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <button onClick={logout}
            className="w-full px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            🚪 Đăng xuất
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 bg-gray-50 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
