import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/layout/Navbar';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useTranslation } from 'react-i18next';
import { getLanguage, setLanguage } from '../../utils/i18n';
import { clearSession } from '../../api/authApi';
import authApi from '../../api/authApi';
import NotificationPanel from '../../components/common/NotificationPanel';

const LANGS = [
    { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt' },
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'ko', flag: '🇰🇷', name: '한국어' },
];

// ── Reusable setting row ───────────────────────────────────────
function SettingSection({ title, children }) {
    return (
        <div style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            overflow: 'hidden',
        }}>
            <div style={{
                padding: '10px 16px',
                fontSize: 11,
                fontFamily: 'DM Mono, monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: 'var(--muted)',
                borderBottom: '1px solid var(--border)',
                background: 'var(--bg3)',
            }}>
                {title}
            </div>
            {children}
        </div>
    );
}

function SettingRow({ icon, label, sublabel, action, last }) {
    return (
        <div style={{
            display: 'flex', alignItems: 'center', padding: '13px 16px',
            borderBottom: last ? 'none' : '1px solid var(--border)',
            gap: 12,
        }}>
            <span style={{ fontSize: 20, width: 28, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{label}</div>
                {sublabel && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sublabel}</div>}
            </div>
            <div style={{ flexShrink: 0 }}>{action}</div>
        </div>
    );
}

// ── ThemeToggle (standalone, reads localStorage) ──────────────
function ThemeToggleControl() {
    const { t } = useTranslation();
    const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));

    const toggle = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
        // Dispatch storage event so ClientLayout syncs (single-page)
        window.dispatchEvent(new StorageEvent('storage', { key: 'theme' }));
    };

    return (
        <button
            onClick={toggle}
            style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: dark ? 'rgba(200,242,61,0.12)' : 'rgba(255,255,255,0.08)',
                border: `1px solid ${dark ? 'rgba(200,242,61,0.3)' : 'var(--border)'}`,
                borderRadius: 20, padding: '5px 12px',
                cursor: 'pointer', transition: 'all 0.2s',
                fontSize: 13, fontWeight: 600,
                color: dark ? 'var(--accent)' : 'var(--text)',
            }}
        >
            {dark ? `🌙 ${t('theme_dark', 'Tối')}` : `☀️ ${t('theme_light', 'Sáng')}`}
        </button>
    );
}

// ── Main ──────────────────────────────────────────────────────
export default function SettingsPage() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const { user } = useAuthStore();
    const { unreadCount, connected, fetch: fetchNotifs } = useNotificationStore();
    const [activeLang, setActiveLang] = useState(i18n.language || getLanguage());
    const [loggingOut, setLoggingOut] = useState(false);
    const [notifPanelOpen, setNotifPanelOpen] = useState(false);

    useEffect(() => {
        fetchNotifs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleLangChange = (code) => {
        setActiveLang(code);
        setLanguage(code);
        // Page reload is no longer needed globally if all components use useTranslation
    };

    const handleLogout = async () => {
        setLoggingOut(true);
        try { await authApi.logout(); } catch { /* ignore */ }
        clearSession();
        navigate('/login');
    };

    return (
        <div className="page active" id="page-settings">
            <Navbar
                title={<>Viet<span style={{ color: 'var(--accent)' }}>Money</span></>}
                subtitle={t('settings_title', 'Cài đặt')}
            />

            <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* ── Appearance ── */}
                <SettingSection title={t('appearance_section', 'Giao diện')}>
                    <SettingRow
                        icon="🎨"
                        label={t('theme_label', 'Chủ đề')}
                        sublabel={t('theme_sublabel', 'Chuyển đổi sáng / tối')}
                        action={<ThemeToggleControl />}
                        last
                    />
                </SettingSection>

                {/* ── Language ── */}
                <SettingSection title={t('language_section', 'Ngôn ngữ')}>
                    {LANGS.map((l, i) => (
                        <SettingRow
                            key={l.code}
                            icon={l.flag}
                            label={l.name}
                            sublabel={activeLang === l.code ? t('in_use', 'Đang sử dụng') : null}
                            last={i === LANGS.length - 1}
                            action={
                                <button
                                    onClick={() => handleLangChange(l.code)}
                                    disabled={activeLang === l.code}
                                    style={{
                                        padding: '5px 14px',
                                        borderRadius: 20,
                                        border: activeLang === l.code
                                            ? '1px solid var(--accent)'
                                            : '1px solid var(--border)',
                                        background: activeLang === l.code
                                            ? 'rgba(200,242,61,0.12)'
                                            : 'transparent',
                                        color: activeLang === l.code ? 'var(--accent)' : 'var(--muted)',
                                        fontSize: 12, fontWeight: 600,
                                        cursor: activeLang === l.code ? 'default' : 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {activeLang === l.code ? `✓ ${t('in_use_btn', 'Đang dùng')}` : t('select_btn', 'Chọn')}
                                </button>
                            }
                        />
                    ))}
                </SettingSection>

                {/* ── Notifications ── */}
                <SettingSection title={t('notif_section', 'Thông báo')}>
                    <SettingRow
                        icon="🔔"
                        label={t('notif_label', 'Thông báo')}
                        sublabel={
                            connected
                                ? `${t('notif_connected', 'Đang kết nối')} · ${unreadCount > 0 ? t('notif_unread', { count: unreadCount, defaultValue: '{{count}} chưa đọc' }) : t('notif_read_all', 'Đã đọc hết')}`
                                : t('notif_disconnected', 'Chưa kết nối WebSocket')
                        }
                        action={
                            <button
                                onClick={() => setNotifPanelOpen(true)}
                                style={{
                                    padding: '5px 14px',
                                    borderRadius: 20,
                                    border: '1px solid var(--border)',
                                    background: unreadCount > 0 ? 'rgba(242,61,110,0.08)' : 'transparent',
                                    color: unreadCount > 0 ? '#f23d6e' : 'var(--muted)',
                                    fontSize: 12, fontWeight: 600,
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    display: 'flex', alignItems: 'center', gap: 5,
                                }}
                            >
                                {unreadCount > 0 && (
                                    <span style={{
                                        background: '#f23d6e', color: '#fff',
                                        borderRadius: 8, fontSize: 10, fontWeight: 700,
                                        padding: '1px 5px', lineHeight: 1.4,
                                    }}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                                {t('view_btn', 'Xem')}
                            </button>
                        }
                        last
                    />
                </SettingSection>

                {/* ── Account ── */}
                <SettingSection title={t('account_section', 'Tài khoản')}>
                    <SettingRow
                        icon="👤"
                        label={user?.fullName ?? user?.username ?? t('user_default', 'Người dùng')}
                        sublabel={user?.email ?? ''}
                        action={
                            <button
                                onClick={() => navigate('/profile')}
                                style={{
                                    padding: '5px 14px', borderRadius: 20,
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: 'var(--muted)', fontSize: 12, fontWeight: 600,
                                    cursor: 'pointer', transition: 'all 0.2s',
                                }}
                            >
                                {t('edit_btn', 'Chỉnh sửa')} →
                            </button>
                        }
                    />
                    <SettingRow
                        icon="🔑"
                        label={t('change_password_label', 'Đổi mật khẩu')}
                        sublabel={t('change_password_sublabel', 'Truy cập trang quên mật khẩu')}
                        last
                        action={
                            <button
                                onClick={() => navigate('/forgot-password')}
                                style={{
                                    padding: '5px 14px', borderRadius: 20,
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    color: 'var(--muted)', fontSize: 12, fontWeight: 600,
                                    cursor: 'pointer',
                                }}
                            >
                                {t('reset_btn', 'Đặt lại')} →
                            </button>
                        }
                    />
                </SettingSection>

                {/* ── App info ── */}
                <SettingSection title={t('app_info_section', 'Thông tin ứng dụng')}>
                    <SettingRow icon="📱" label="VietMoney Assistant" sublabel="v1.0.0 · Built with ❤️" action={null} last />
                </SettingSection>

                {/* ── Logout ── */}
                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    style={{
                        width: '100%', padding: '13px',
                        background: 'rgba(242,61,110,0.08)',
                        color: '#f23d6e',
                        border: '1px solid rgba(242,61,110,0.25)',
                        borderRadius: 12,
                        cursor: loggingOut ? 'not-allowed' : 'pointer',
                        fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: 15,
                        transition: 'background 0.2s',
                    }}
                >
                    {loggingOut ? `⏳ ${t('logging_out', 'Đang đăng xuất...')}` : `🚪 ${t('logout', 'Đăng xuất')}`}
                </button>
            </div>

            {/* Notification panel slide-in */}
            <NotificationPanel open={notifPanelOpen} onClose={() => setNotifPanelOpen(false)} />
        </div>
    );
}
