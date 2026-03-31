import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useExchangeRate } from '../../hooks/useExchangeRate'
import { formatVND } from '../../utils/formatCurrency'
import budgetApi from '../../api/budgetApi'
import Spinner from '../../components/common/Spinner'

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { rates, isConnected } = useExchangeRate()
  const { data: budgets, isLoading } = useQuery({ queryKey: ['budgets'], queryFn: budgetApi.getAll })

  const quickLinks = [
    { to: '/scan', icon: '📷', label: 'Quét tiền', color: 'bg-red-500' },
    { to: '/exchange-rate', icon: '💱', label: 'Tỷ giá', color: 'bg-blue-500' },
    { to: '/atm', icon: '🏧', label: 'Tìm ATM', color: 'bg-green-500' },
    { to: '/price-wiki', icon: '📋', label: 'Bảng giá', color: 'bg-yellow-500' },
    { to: '/tourist-spots', icon: '🗺️', label: 'Du lịch', color: 'bg-purple-500' },
    { to: '/news', icon: '📰', label: 'Tin tức', color: 'bg-orange-500' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user?.fullName || user?.username}! 👋</h1>
        <p className="text-gray-500 text-sm mt-1">Chào mừng đến với VietMoney Assistant</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {quickLinks.map(link => (
          <Link key={link.to} to={link.to}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center text-2xl`}>{link.icon}</div>
            <span className="text-xs font-medium text-gray-600">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Exchange Rate Preview */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Tỷ giá hôm nay</h2>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['USD','EUR','JPY','KRW'].map(currency => (
            <div key={currency} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-gray-500 mb-1">{currency}/VND</div>
              <div className="font-semibold text-gray-900">{rates[currency] ? formatVND(1/rates[currency]) : '--'}</div>
            </div>
          ))}
        </div>
        <Link to="/exchange-rate" className="block text-center text-sm text-red-600 hover:underline mt-3">Xem đầy đủ →</Link>
      </div>

      {/* Budget Summary */}
      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Ngân sách của bạn</h2>
          <Link to="/budget" className="text-sm text-red-600 hover:underline">Quản lý →</Link>
        </div>
        {isLoading ? <div className="flex justify-center py-4"><Spinner /></div> :
          budgets?.data?.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <div className="text-3xl mb-2">💰</div>
              <p className="text-sm">Chưa có ngân sách nào</p>
              <Link to="/budget" className="text-sm text-red-600 hover:underline mt-1 block">Tạo ngay</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets?.data?.slice(0, 3).map(b => (
                <div key={b.id} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{b.name}</span>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{formatVND(b.totalAmount - b.spentAmount)}</div>
                    <div className="text-xs text-gray-400">còn lại</div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}
