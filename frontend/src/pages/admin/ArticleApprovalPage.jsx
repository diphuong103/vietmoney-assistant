import { useState } from 'react';

const MOCK_ARTICLES = [
  { id: 1, title: 'Top 5 Hidden Gems in Da Nang', author: 'Lan', time: '2h ago', status: 'pending' },
  { id: 2, title: 'Budget Travel Tips for Hội An', author: 'Mai', time: '5h ago', status: 'pending' },
  { id: 3, title: 'VND Exchange Rate Forecast',    author: 'Tuan', time: '1d ago', status: 'pending' },
];

export default function ArticleApprovalPage() {
  const [articles, setArticles] = useState(MOCK_ARTICLES);

  const update = (id, status) =>
    setArticles(prev => prev.map(a => a.id === id ? { ...a, status } : a));

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, marginBottom: 28 }}>
        Article Approval
      </h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {articles.map(a => (
          <div key={a.id} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{a.title}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>By {a.author} · {a.time}</div>
            </div>
            {a.status === 'pending' ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="submit-form-btn"
                  style={{ padding: '8px 16px', fontSize: 13, width: 'auto', marginTop: 0 }}
                  onClick={() => update(a.id, 'approved')}
                >✓ Approve</button>
                <button
                  onClick={() => update(a.id, 'rejected')}
                  style={{
                    padding: '8px 16px', fontSize: 13, borderRadius: 10, cursor: 'pointer',
                    background: 'rgba(242,61,110,0.12)', color: 'var(--accent3)',
                    border: '1px solid rgba(242,61,110,0.3)', fontWeight: 600,
                  }}
                >✕ Reject</button>
              </div>
            ) : (
              <span style={{
                fontSize: 12, padding: '4px 12px', borderRadius: 20, fontWeight: 600,
                background: a.status === 'approved' ? 'rgba(200,242,61,0.1)' : 'rgba(242,61,110,0.1)',
                color: a.status === 'approved' ? 'var(--accent)' : 'var(--accent3)',
              }}>{a.status}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
