import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../store/notificationStore';

// Notification type → icon mapping
const TYPE_ICON = {
    BUDGET_WARNING: '⚠️',
    BUDGET_EXCEEDED: '🚨',
    TRANSACTION_CREATED: '💳',
    ARTICLE_APPROVED: '✅',
    ARTICLE_REJECTED: '❌',
    TRAVEL_REMINDER: '✈️',
};

function timeAgo(dateStr) {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.round(diff / 60000);
    if (m < 1) return 'Vừa xong';
    if (m < 60) return `${m} phút trước`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} giờ trước`;
    return `${Math.round(h / 24)} ngày trước`;
}

export default function NotificationPanel({ open, onClose }) {
    const navigate = useNavigate();
    const { notifications, unreadCount, markAllRead, markRead } = useNotificationStore();
    const panelRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open, onClose]);

    const handleClick = async (notif) => {
        if (!notif.read) await markRead(notif.id);
        onClose();
        if (notif.link) navigate(notif.link);
    };

    if (!open) return null;

    return (
        <div
            ref={panelRef}
            style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                width: 340,
                maxHeight: '80vh',
                background: 'var(--bg2)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 9999,
                overflow: 'hidden',
                animation: 'notifSlideIn 0.2s ease',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px 10px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 18 }}>🔔</span>
                    <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15 }}>
                        Thông báo
                    </span>
                    {unreadCount > 0 && (
                        <span style={{
                            background: 'var(--accent)', color: '#000',
                            fontSize: 11, fontWeight: 700, borderRadius: 10, padding: '1px 7px',
                        }}>{unreadCount}</span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Đánh dấu tất cả
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        style={{ fontSize: 18, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
                    >
                        ×
                    </button>
                </div>
            </div>

            {/* List */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
                        <div style={{ fontSize: 36, marginBottom: 8 }}>🔕</div>
                        Chưa có thông báo nào
                    </div>
                ) : notifications.map((notif) => (
                    <button
                        key={notif.id}
                        onClick={() => handleClick(notif)}
                        style={{
                            width: '100%', display: 'flex', alignItems: 'flex-start', gap: 12,
                            padding: '12px 16px',
                            background: notif.read ? 'transparent' : 'rgba(200,242,61,0.04)',
                            border: 'none', borderBottom: '1px solid var(--border)',
                            cursor: 'pointer', textAlign: 'left',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = notif.read ? 'transparent' : 'rgba(200,242,61,0.04)'; }}
                    >
                        {/* Icon */}
                        <div style={{
                            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18,
                        }}>
                            {TYPE_ICON[notif.type] ?? '🔔'}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                <span style={{
                                    fontSize: 13, fontWeight: notif.read ? 500 : 700,
                                    color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                                    maxWidth: 200,
                                }}>
                                    {notif.title}
                                </span>
                                {!notif.read && (
                                    <span style={{
                                        width: 7, height: 7, borderRadius: '50%',
                                        background: 'var(--accent)', flexShrink: 0,
                                    }} />
                                )}
                            </div>
                            <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.4 }}>{notif.body}</div>
                            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, opacity: 0.7 }}>
                                {timeAgo(notif.createdAt)}
                                {notif.link && <span style={{ color: 'var(--accent)', marginLeft: 6 }}>→ xem</span>}
                            </div>
                        </div>
                    </button>
                ))}
            </div>

            <style>{`
        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
