import Navbar from '../../components/layout/Navbar';

export default function TouristSpotsPage() {
  return (
    <div className="page active" id="page-tourist">
      <Navbar
        title={<>Tourist<span style={{ color: 'var(--accent)' }}>Spots</span></>}
      />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12, color: 'var(--muted)', padding: 40,
        textAlign: 'center',
      }}>
        <span style={{ fontSize: 48 }}>🏯</span>
        <p style={{ fontSize: 16 }}>Tourist Spots</p>
        <p style={{ fontSize: 13 }}>Discover popular attractions near you.</p>
      </div>
    </div>
  );
}
