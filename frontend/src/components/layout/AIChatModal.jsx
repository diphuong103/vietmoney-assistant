import { useState, useRef, useEffect } from 'react';

// ── Static responses (giống index1.html) ─────────────────────────────────────
const CHAT_RESPONSES = [
  "The current USD/VND rate is approximately ₫25,420. It's been relatively stable this week! 💱",
  "A bowl of Phở typically costs ₫40,000–₫70,000 at local street stalls. Very affordable! 🍜",
  "The ₫20,000 and ₫500,000 notes look similar in color. Always check the printed number! ⚠️",
  "ATMs in Vietnam usually have a ₫3,000,000–₫5,000,000 per-transaction limit. Check your bank's foreign fees too. 🏧",
  "Grab is the most convenient transport app in Vietnam. A 3km ride usually costs ₫25,000–₫40,000. 🛺",
  "Hội An old town has a fixed entry ticket: ₫120,000 (≈$4.73) that covers 5 attraction tickets. 🏮",
  "In Vietnam, bargaining is expected at markets but NOT at restaurants with menus or convenience stores. 🛍️",
  "Tip: always carry small denomination notes (₫10k–₫50k) for street food and small purchases! 💡",
];

export default function AIChatModal({ open, onClose }) {
  const [messages, setMessages] = useState([
    { id: 0, from: 'bot', text: "👋 Hi! I'm your travel money assistant. Ask me about exchange rates, prices, or local tips!" },
  ]);
  const [input, setInput]     = useState('');
  const [busy, setBusy]       = useState(false);
  const [status, setStatus]   = useState('● Online');
  const [chatIdx, setChatIdx] = useState(0);

  const msgsRef  = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom on new message
  useEffect(() => {
    if (msgsRef.current) {
      msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const sendChat = () => {
    if (busy || !input.trim()) return;

    const userText = input.trim();
    const nextId   = Date.now();

    // Add user message
    setMessages(prev => [...prev, { id: nextId, from: 'user', text: userText }]);
    setInput('');
    setBusy(true);
    setStatus('● Typing...');

    // Add typing indicator
    setMessages(prev => [...prev, { id: nextId + 1, from: 'typing' }]);

    // Bot reply after delay
    setTimeout(() => {
      setMessages(prev => {
        const filtered = prev.filter(m => m.from !== 'typing');
        return [...filtered, {
          id: nextId + 2,
          from: 'bot',
          text: CHAT_RESPONSES[chatIdx % CHAT_RESPONSES.length],
        }];
      });
      setChatIdx(i => i + 1);
      setBusy(false);
      setStatus('● Online');
    }, 1000 + Math.random() * 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChat();
    }
  };

  // Close on overlay click
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={`modal-overlay${open ? ' open' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="chat-modal">

        {/* Header */}
        <div className="chat-header">
          <div className="chat-avatar">🤖</div>
          <div className="chat-header-info">
            <div className="name">VietMoney AI</div>
            <div className="status" style={{ color: busy ? 'var(--muted)' : 'var(--accent)' }}>
              {status}
            </div>
          </div>
          <button className="chat-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Messages */}
        <div className="chat-messages" ref={msgsRef}>
          {messages.map(msg => {
            if (msg.from === 'typing') {
              return (
                <div key="typing" className="msg">
                  <div className="msg-bubble chat-typing">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              );
            }
            return (
              <div key={msg.id} className={`msg${msg.from === 'user' ? ' user' : ''}`}>
                <div className="msg-bubble">{msg.text}</div>
              </div>
            );
          })}
        </div>

        {/* Input row */}
        <div className="chat-input-row">
          <input
            ref={inputRef}
            className="chat-input"
            placeholder="Ask about rates, prices..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
          />
          <button
            className="chat-send"
            onClick={sendChat}
            disabled={busy || !input.trim()}
          >
            ➤
          </button>
        </div>

      </div>
    </div>
  );
}