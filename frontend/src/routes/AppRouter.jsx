import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import ClientLayout from '../components/layout/ClientLayout'
import AdminLayout from '../components/layout/AdminLayout'

// Auth pages
import LoginPage from '../pages/auth/LoginPage'
import RegisterPage from '../pages/auth/RegisterPage'
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage'
import VerifyOtpPage from '../pages/auth/VerifyOtpPage'

// Client pages
import DashboardPage from '../pages/client/DashboardPage'
import BudgetPage from '../pages/client/BudgetPage'
import ProfilePage from '../pages/client/ProfilePage'
import ExchangeRatePage from '../pages/client/ExchangeRatePage'
import ScanPage from '../pages/client/ScanPage'
import ScanHistoryPage from '../pages/client/ScanHistoryPage'
import AtmMapPage from '../pages/client/AtmMapPage'
import NewsPage from '../pages/client/NewsPage'
import TouristSpotsPage from '../pages/client/TouristSpotsPage'
import TravelPlanPage from '../pages/client/TravelPlanPage'
import PriceWikiPage from '../pages/client/PriceWikiPage'

// Admin pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage'
import UserManagementPage from '../pages/admin/UserManagementPage'
import ArticleApprovalPage from '../pages/admin/ArticleApprovalPage'

function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (requiredRole && user?.role !== requiredRole) return <Navigate to="/dashboard" replace />
  return children
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        {/* Client */}
        <Route path="/" element={<ProtectedRoute><ClientLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="budget" element={<BudgetPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="exchange-rate" element={<ExchangeRatePage />} />
          <Route path="scan" element={<ScanPage />} />
          <Route path="scan/history" element={<ScanHistoryPage />} />
          <Route path="atm" element={<AtmMapPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="tourist-spots" element={<TouristSpotsPage />} />
          <Route path="travel-plan" element={<TravelPlanPage />} />
          <Route path="price-wiki" element={<PriceWikiPage />} />
        </Route>

        {/* Admin */}
        <Route path="/admin" element={<ProtectedRoute requiredRole="ADMIN"><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="articles" element={<ArticleApprovalPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
