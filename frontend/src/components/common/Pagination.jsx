export default function Pagination({ page, totalPages, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', padding: '16px 0' }}>
      <button
        className="icon-btn"
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
      >‹</button>
      <span style={{ color: 'var(--muted)', fontSize: 13, alignSelf: 'center' }}>
        {page} / {totalPages}
      </span>
      <button
        className="icon-btn"
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
      >›</button>
    </div>
  );
}
