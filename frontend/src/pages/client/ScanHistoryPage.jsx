import Navbar from '../../components/layout/Navbar';

// In a real app, fetch from scanApi
const MOCK_HISTORY = [
  { amount: '₫500,000', converted: '≈ $19.67',  time: '2 min ago'  },
  { amount: '₫200,000', converted: '≈ $7.87',   time: '14 min ago' },
  { amount: '₫100,000', converted: '≈ $3.93',   time: '1 hr ago'   },
];

export default function ScanHistoryPage() {
  return (
    <div className="page active" id="page-scan-history">
      <Navbar
        title={<>Scan<span style={{ color: 'var(--accent)' }}>History</span></>}
      />
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {MOCK_HISTORY.map((h, i) => (
          <div className="txn-item" key={i}>
            <div className="txn-icon" style={{ background: 'rgba(200,242,61,0.1)' }}>📷</div>
            <div className="txn-detail">
              <div className="txn-name">{h.amount}</div>
              <div className="txn-cat">{h.converted}</div>
            </div>
            <div className="txn-cat" style={{ fontSize: 12 }}>{h.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
