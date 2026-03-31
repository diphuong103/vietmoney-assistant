import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useExchangeRateStore } from '../../store/exchangeRateStore'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { isConnected } = useExchangeRateStore()
  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <span className="text-2xl">🇻🇳</span>
          <span className="font-bold text-lg text-red-600">VietMoney</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to="/exchange-rate" className="text-gray-600 hover:text-red-600 transition-colors">Tỷ giá</Link>
          <Link to="/scan" className="text-gray-600 hover:text-red-600 transition-colors">Quét tiền</Link>
          <Link to="/atm" className="text-gray-600 hover:text-red-600 transition-colors">ATM</Link>
          <Link to="/news" className="text-gray-600 hover:text-red-600 transition-colors">Tin tức</Link>
        </nav>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} title={isConnected ? 'Live' : 'Offline'} />
          <Link to="/profile" className="text-sm text-gray-700 dark:text-gray-200 hover:text-red-600">{user?.fullName || user?.username}</Link>
          <button onClick={logout} className="text-sm text-gray-500 hover:text-red-600">Đăng xuất</button>
        </div>
      </div>
    </header>
  )
}
