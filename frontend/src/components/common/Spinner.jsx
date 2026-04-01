export default function Spinner({ size = 24 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      border: '3px solid var(--border)',
      borderTopColor: 'var(--accent)',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }} />
  );
}
