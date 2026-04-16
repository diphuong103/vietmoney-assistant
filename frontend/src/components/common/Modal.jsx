export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div
      className={`modal-overlay${open ? ' open' : ''}`}
      style={{ alignItems: 'center', justifyContent: 'center' }}
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      {children}
    </div>
  );
}
