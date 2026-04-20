/**
 * FloatingPopup — bottom-sheet popup modal, same visual pattern as AIChatModal.
 * Usage:
 *   <FloatingPopup open={open} onClose={() => setOpen(false)} title="ATM Map" icon="🗺️">
 *     <MyContent />
 *   </FloatingPopup>
 */
export default function FloatingPopup({ open, onClose, title, icon, children }) {
    const handleOverlay = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className={`modal-overlay${open ? ' open' : ''}`} onClick={handleOverlay}>
            <div className="floating-popup">
                {/* Header */}
                <div className="floating-popup-header">
                    {icon && <div className="floating-popup-icon">{icon}</div>}
                    <div className="floating-popup-title">{title}</div>
                    <button className="chat-close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Body */}
                <div className="floating-popup-body">
                    {children}
                </div>
            </div>
        </div>
    );
}
