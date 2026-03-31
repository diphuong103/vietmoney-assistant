import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import articleApi from '../../api/articleApi'
import Button from '../../components/common/Button'
import Badge from '../../components/common/Badge'
import { fromNow } from '../../utils/formatDate'
import toast from 'react-hot-toast'

export default function ArticleApprovalPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ['pending-articles'], queryFn: () => articleApi.admin.getPending() })
  const approveMut = useMutation({
    mutationFn: articleApi.admin.approve,
    onSuccess: () => { qc.invalidateQueries(['pending-articles']); toast.success('Đã phê duyệt!') }
  })
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => articleApi.admin.reject(id, reason),
    onSuccess: () => { qc.invalidateQueries(['pending-articles']); toast.success('Đã từ chối!') }
  })

  const articles = data?.data?.content || []
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Phê duyệt bài viết</h1>
      <div className="space-y-4">
        {isLoading ? <div className="text-center py-8 text-gray-400">Đang tải...</div> :
          articles.length === 0 ? <div className="bg-white rounded-xl p-8 text-center text-gray-400">Không có bài viết nào chờ duyệt</div> :
          articles.map(a => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">bởi {a.author?.username} · {fromNow(a.createdAt)}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{a.content?.substring(0, 150)}...</p>
                </div>
                <Badge variant="warning">Chờ duyệt</Badge>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={() => approveMut.mutate(a.id)}>✓ Phê duyệt</Button>
                <Button variant="danger" size="sm" onClick={() => rejectMut.mutate({ id: a.id, reason: 'Vi phạm quy định' })}>✕ Từ chối</Button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  )
}
