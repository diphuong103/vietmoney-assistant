import { Toaster } from 'react-hot-toast'
import AppRouter from './routes/AppRouter';
import AuthProvider from './components/auth/AuthProvider';

export default function App() {
  return (
    <>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </>
  )
}
