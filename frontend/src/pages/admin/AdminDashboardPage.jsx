export default function AdminDashboardPage() {
  const stats = [
    { label: 'Total Users',   value: '1,284', icon: '👥', color: 'var(--blue)'   },
    { label: 'Articles',      value: '342',   icon: '📝', color: 'var(--accent)'  },
    { label: 'Pending Posts', value: '17',    icon: '⏳', color: 'var(--gold)'    },
    { label: 'Scans Today',   value: '89',    icon: '📷', color: 'var(--accent2)' },
  ];

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, marginBottom: 28 }}>
        Admin Dashboard
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            background: 'var(--bg2)', border: '1px solid var(--border)',
            borderRadius: 20, padding: '22px 20px',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 28, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
