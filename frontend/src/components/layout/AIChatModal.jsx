import { useState, useRef, useEffect } from 'react';
import useStreamChat from '../../hooks/useStreamChat';

// ── Source Card Component ────────────────────────────────────────────────────
function SourceCard({ source }) {
  return (
    <a
      href={source.url || '#'}
      target="_blank"
      rel="noreferrer"
      className="ai-source-card"
      title={source.title}
    >
      <span className="ai-source-icon">📄</span>
      <span className="ai-source-title">{source.title || source.source}</span>
      {source.url && <span className="ai-source-link">↗</span>}
    </a>
  );
}

// ── Streaming Cursor ─────────────────────────────────────────────────────────
function StreamCursor() {
  return <span className="ai-stream-cursor" />;
}

// ── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';

  return (
    <div className={`ai-msg ${isUser ? 'ai-msg--user' : 'ai-msg--bot'}`}>
      {!isUser && <div className="ai-msg-avatar">🤖</div>}
      <div className="ai-msg-body">
        <div className={`ai-msg-bubble ${isUser ? 'ai-msg-bubble--user' : 'ai-msg-bubble--bot'}`}>
          <div className="ai-msg-text">
            {msg.content}
            {msg.streaming && <StreamCursor />}
          </div>
        </div>

        {/* Source cards */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="ai-sources">
            <div className="ai-sources-label">📚 Nguồn tham khảo:</div>
            <div className="ai-sources-list">
              {msg.sources.map((s, i) => (
                <SourceCard key={i} source={s} />
              ))}
            </div>
          </div>
        )}
      </div>
      {isUser && <div className="ai-msg-avatar ai-msg-avatar--user">👤</div>}
    </div>
  );
}

// ── Main Modal Component ─────────────────────────────────────────────────────
export default function AIChatModal({ open, onClose }) {
  const { messages, sendMessage, isStreaming, stopStreaming, clearChat } =
    useStreamChat();
  const [input, setInput] = useState('');
  const msgsEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [open]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={`modal-overlay${open ? ' open' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="chat-modal ai-chat-modal">

        {/* ── Header ── */}
        <div className="ai-chat-header">
          <div className="ai-chat-header-left">
            <div className="ai-chat-logo">
              <span className="ai-chat-logo-icon">🧭</span>
            </div>
            <div className="ai-chat-header-info">
              <div className="ai-chat-header-title">Vietnam Discovery</div>
              <div className={`ai-chat-header-status ${isStreaming ? 'typing' : 'online'}`}>
                <span className="ai-status-dot" />
                {isStreaming ? 'Đang trả lời...' : 'Online'}
              </div>
            </div>
          </div>
          <div className="ai-chat-header-actions">
            <button
              className="ai-header-btn"
              onClick={clearChat}
              title="Xóa lịch sử chat"
            >
              🗑️
            </button>
            <button className="ai-header-btn ai-close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className="ai-chat-messages">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          <div ref={msgsEndRef} />
        </div>

        {/* ── Input Row ── */}
        <div className="ai-chat-input-row">
          {isStreaming ? (
            <button className="ai-stop-btn" onClick={stopStreaming}>
              ⏹ Dừng
            </button>
          ) : null}
          <input
            ref={inputRef}
            className="ai-chat-input"
            placeholder="Hỏi về du lịch, tỷ giá, mẹo tài chính..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
          />
          <button
            className="ai-send-btn"
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}