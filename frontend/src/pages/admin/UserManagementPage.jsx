import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import adminApi from '../../api/adminApi'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import toast from 'react-hot-toast'

export default function UserManagementPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: adminApi.getUsers })
  const deleteMut = useMutation({
    mutationFn: adminApi.deleteUser,
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Đã xóa người dùng') }
  })

  const users = data?.data?.content || []
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý người dùng</h1>
        <Button variant="secondary" size="sm">📥 Import Excel</Button>
      </div>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-6 py-3 text-left">Người dùng</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Quốc tịch</th>
              <th className="px-6 py-3 text-left">Vai trò</th>
              <th className="px-6 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">Đang tải...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-3 font-medium">{u.fullName || u.username}</td>
                <td className="px-6 py-3 text-gray-500">{u.email}</td>
                <td className="px-6 py-3">{u.nationality || '--'}</td>
                <td className="px-6 py-3"><Badge variant={u.role === 'ADMIN' ? 'danger' : 'info'}>{u.role}</Badge></td>
                <td className="px-6 py-3 text-right">
                  <Button variant="danger" size="sm" onClick={() => deleteMut.mutate(u.id)}>Xóa</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
