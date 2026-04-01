import Navbar from '../../components/layout/Navbar';

export default function AtmMapPage() {
  return (
    <div className="page active" id="page-atm">
      <Navbar
        title={<>ATM<span style={{ color: 'var(--accent)' }}>Map</span></>}
      />
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12, color: 'var(--muted)', padding: 40,
        textAlign: 'center',
      }}>
        <span style={{ fontSize: 48 }}>🗺️</span>
        <p style={{ fontSize: 16 }}>ATM Map coming soon!</p>
        <p style={{ fontSize: 13 }}>We're integrating nearby ATM locations for your convenience.</p>
      </div>
    </div>
  );
}
