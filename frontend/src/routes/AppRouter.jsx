import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import ClientLayout from '../components/layout/ClientLayout';
import AdminLayout from '../components/layout/AdminLayout';
import ProtectedRoute from '../components/common/ProtectedRoute';

// Auth pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import VerifyOtpPage from '../pages/auth/VerifyOtpPage';

// Client pages
import DashboardPage from '../pages/client/DashboardPage';
import NewsPage from '../pages/client/NewsPage';
import ScanPage from '../pages/client/ScanPage';
import ScanHistoryPage from '../pages/client/ScanHistoryPage';
import BudgetPage from '../pages/client/BudgetPage';
import ExchangeRatePage from '../pages/client/ExchangeRatePage';
import PriceWikiPage from '../pages/client/PriceWikiPage';
import CurrencyGuidePage from '../pages/client/CurrencyGuidePage';
import TravelPlanPage from '../pages/client/TravelPlanPage';
import AtmMapPage from '../pages/client/AtmMapPage';
import TouristSpotsPage from '../pages/client/TouristSpotsPage';
import ProfilePage from '../pages/client/ProfilePage';

// Admin pages
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import ArticleApprovalPage from '../pages/admin/ArticleApprovalPage';
import UserManagementPage from '../pages/admin/UserManagementPage';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />

        {/* Client (protected) */}
        <Route element={
          <ProtectedRoute>
            <ClientLayout />
          </ProtectedRoute>
        }>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/scan/history" element={<ScanHistoryPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/exchange" element={<ExchangeRatePage />} />
          <Route path="/wiki" element={<PriceWikiPage />} />
          <Route path="/wiki/guide" element={<CurrencyGuidePage />} />
          <Route path="/plans" element={<TravelPlanPage />} />
          <Route path="/spots" element={<TouristSpotsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* ATM Map standalone protected */}
        <Route path="/atm-map" element={
          <ProtectedRoute>
            <AtmMapPage />
          </ProtectedRoute>
        } />

        {/* Admin (admin only) */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<AdminDashboardPage />} />
          <Route path="articles" element={<ArticleApprovalPage />} />
          <Route path="users" element={<UserManagementPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
