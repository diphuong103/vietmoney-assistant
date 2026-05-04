export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div
      className={`modal-overlay${open ? ' open' : ''}`}
      onClick={e => e.target === e.currentTarget && onClose?.()}
    >
      {children}
    </div>
  );
}
