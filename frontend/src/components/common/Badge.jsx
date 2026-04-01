export default function Badge({ children, color = 'accent' }) {
  const colors = {
    accent:  { bg: 'var(--accent)',  text: '#000' },
    blue:    { bg: 'var(--blue)',    text: '#000' },
    red:     { bg: 'var(--accent3)', text: '#fff' },
  };
  const { bg, text } = colors[color] ?? colors.accent;
  return (
    <span className="card-badge" style={{ background: bg, color: text }}>
      {children}
    </span>
  );
}
