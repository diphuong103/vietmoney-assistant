import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

/**
 * AuthProvider — gates the entire app behind auth verification.
 *
 * Flow:
 *   1. On mount → calls verifyAuth()
 *   2. While verifying → shows full-screen loading spinner
 *   3. Once isReady → renders children (router, pages, etc.)
 *
 * This ensures NO private API calls fire before the token is verified.
 */
export default function AuthProvider({ children }) {
    const isReady = useAuthStore((s) => s.isReady);
    const verifyAuth = useAuthStore((s) => s.verifyAuth);

    useEffect(() => {
        verifyAuth();
    }, [verifyAuth]);

    if (!isReady) {
        return (
            <div
                style={{
                    position: 'fixed',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg, #0a0a1a)',
                    zIndex: 99999,
                    gap: 16,
                }}
            >
                {/* Spinner */}
                <div
                    style={{
                        width: 40,
                        height: 40,
                        border: '3px solid rgba(200, 242, 61, 0.15)',
                        borderTopColor: 'var(--accent, #c8f23d)',
                        borderRadius: '50%',
                        animation: 'authSpin 0.8s linear infinite',
                    }}
                />
                <div
                    style={{
                        fontFamily: "'Syne', sans-serif",
                        fontSize: 18,
                        fontWeight: 700,
                        color: 'var(--text, #e8e8ec)',
                        letterSpacing: 1,
                    }}
                >
                    Viet<span style={{ color: 'var(--accent, #c8f23d)' }}>Money</span>
                </div>
                <div
                    style={{
                        fontSize: 12,
                        color: 'var(--muted, #6b6b80)',
                        fontFamily: "'DM Mono', monospace",
                    }}
                >
                    Đang xác thực...
                </div>

                {/* Inline keyframes for the spinner */}
                <style>{`
          @keyframes authSpin {
            to { transform: rotate(360deg); }
          }
        `}</style>
            </div>
        );
    }

    return children;
}
