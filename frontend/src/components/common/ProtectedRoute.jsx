import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const user = useAuthStore((s) => s.user);
  const isReady = useAuthStore((s) => s.isReady);

  // Safety: if AuthProvider hasn't finished yet, show nothing
  if (!isReady) return null;

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role?.toUpperCase() !== 'ADMIN') return <Navigate to="/" replace />;

  return children;
}
