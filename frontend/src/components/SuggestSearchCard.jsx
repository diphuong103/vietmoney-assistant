// components/SuggestSearchCard.jsx
export function SuggestSearchCard({ message, onConfirm, onDismiss }) {
    if (!message.suggestSearch) return null;

    return (
        <div className="suggest-card">
            <p>{message.content}</p>
            <div className="suggest-actions">
                <button
                    className="btn-confirm"
                    onClick={() => onConfirm(message.originalQuery)}
                >
                    ✓ Có, tìm kiếm
                </button>
                <button
                    className="btn-dismiss"
                    onClick={onDismiss}
                >
                    ✗ Không, cảm ơn
                </button>
            </div>
        </div>
    );
}

// Trong ChatWindow.jsx — render message list
{messages.map((msg) =>
    msg.suggestSearch ? (
        <SuggestSearchCard
            key={msg.id}
            message={msg}
            onConfirm={confirmWebSearch}   // → POST /chat/web-search
            onDismiss={dismissWebSearch}   // → xoá card, đợi câu hỏi mới
        />
    ) : (
        <ChatMessage key={msg.id} message={msg} />
    )
)}