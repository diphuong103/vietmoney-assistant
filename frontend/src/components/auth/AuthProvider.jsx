import { useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

export default function AuthProvider({ children }) {
    const { isReady, verifyAuth } = useAuthStore();

    useEffect(() => {
        verifyAuth();
    }, [verifyAuth]);

    if (!isReady) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                Loading...
            </div>
        );
    }

    return children;
}