import Button from './Button'

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center gap-2 justify-center mt-6">
      <Button variant="secondary" size="sm" onClick={() => onPageChange(page - 1)} disabled={page === 0}>← Trước</Button>
      <span className="text-sm text-gray-600">{page + 1} / {totalPages}</span>
      <Button variant="secondary" size="sm" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages - 1}>Tiếp →</Button>
    </div>
  )
}
