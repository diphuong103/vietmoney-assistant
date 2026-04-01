import { useState } from 'react';
import Pagination from '../../components/common/Pagination';

const MOCK_USERS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: ['Lan Nguyen','Mai Tran','Tuan Le','Phuong Hoang','Duc Pham','Hoa Vo',
         'Minh Bui','Thu Dang','Nam Ly','Linh Do','Khoa Ngo','An Dinh'][i],
  email: `user${i + 1}@email.com`,
  role: i === 0 ? 'admin' : 'user',
  joined: '2025-0' + ((i % 9) + 1) + '-' + String((i * 3 + 1) % 28 + 1).padStart(2, '0'),
}));

const PAGE_SIZE = 5;

export default function UserManagementPage() {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(MOCK_USERS.length / PAGE_SIZE);
  const visible = MOCK_USERS.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ padding: 32 }}>
      <h1 style={{ fontFamily: 'Syne, sans-serif', fontSize: 24, marginBottom: 28 }}>
        User Management
      </h1>

      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)',
        borderRadius: 20, overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg3)', fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
              {['Name', 'Email', 'Role', 'Joined'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((u, i) => (
              <tr key={u.id} style={{ borderTop: '1px solid var(--border)' }}>
                <td style={{ padding: '14px 16px', fontWeight: 500 }}>{u.name}</td>
                <td style={{ padding: '14px 16px', color: 'var(--muted)', fontSize: 13 }}>{u.email}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    fontSize: 11, padding: '3px 10px', borderRadius: 20, fontWeight: 700,
                    background: u.role === 'admin' ? 'rgba(200,242,61,0.12)' : 'rgba(255,255,255,0.05)',
                    color: u.role === 'admin' ? 'var(--accent)' : 'var(--muted)',
                  }}>{u.role}</span>
                </td>
                <td style={{ padding: '14px 16px', color: 'var(--muted)', fontSize: 13 }}>{u.joined}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </div>
  );
}
