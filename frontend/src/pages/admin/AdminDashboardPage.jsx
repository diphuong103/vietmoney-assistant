import { useQuery } from '@tanstack/react-query'
import adminApi from '../../api/adminApi'

export default function AdminDashboardPage() {
  const { data: stats } = useQuery({ queryKey: ['admin-stats'], queryFn: adminApi.getStats })
  const cards = [
    { label: 'Người dùng', value: stats?.data?.totalUsers || 0, icon: '👥', color: 'bg-blue-500' },
    { label: 'Bài chờ duyệt', value: stats?.data?.pendingArticles || 0, icon: '📝', color: 'bg-yellow-500' },
    { label: 'Tổng bài viết', value: stats?.data?.totalArticles || 0, icon: '📰', color: 'bg-green-500' },
    { label: 'Lượt scan hôm nay', value: stats?.data?.todayScans || 0, icon: '📷', color: 'bg-red-500' },
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tổng quan hệ thống</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(card => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm">
            <div className={`w-10 h-10 ${card.color} rounded-lg flex items-center justify-center text-xl mb-3`}>{card.icon}</div>
            <div className="text-2xl font-bold">{card.value}</div>
            <div className="text-sm text-gray-500">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
