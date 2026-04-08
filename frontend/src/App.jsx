import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import { LandingPageV2 } from './pages/LandingPageV2';
import LoginPage from './pages/LoginPage';
import BankerLoginPage from './pages/BankerLoginPage';
import RegisterPage from './pages/RegisterPage';
import DecLoginPage from './pages/DecLoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import DashboardPage from './pages/DashboardPage';
import AccountsPage from './pages/AccountsPage';
import CardsPage from './pages/CardsPage';
import PaymentsPage from './pages/PaymentsPage';
import DepositPage from './pages/DepositPage';
import WithdrawalPage from './pages/WithdrawalPage';
import DomesticTransferPage from './pages/DomesticTransferPage';
import InternationalTransferPage from './pages/InternationalTransferPage';
import SettingsPage from './pages/SettingsPage';
import AdminDashboard from './pages/AdminDashboard';
import KYCUploadPage from './pages/KYCUploadPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import SupportPage from './pages/SupportTicketsPage';
import LoansPage from './pages/LoansPage';
import FixedDepositsPage from './pages/FixedDepositsPage';
import ExternalTransfersPage from './pages/ExternalTransfersPage';
import RecurringPaymentsPage from './pages/RecurringPaymentsPage';
import StatementPage from './pages/StatementPage';

export default function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPageV2 />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/banker-login" element={<BankerLoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dec-login" element={<DecLoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <SupportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loans"
            element={
              <ProtectedRoute>
                <LoansPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/fixed-deposits"
            element={
              <ProtectedRoute>
                <FixedDepositsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/statements"
            element={
              <ProtectedRoute>
                <StatementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/accounts"
            element={
              <ProtectedRoute>
                <AccountsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cards"
            element={
              <ProtectedRoute>
                <CardsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <PaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/deposit"
            element={
              <ProtectedRoute>
                <DepositPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payments/withdrawal"
            element={
              <ProtectedRoute>
                <WithdrawalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transfers/internal"
            element={
              <ProtectedRoute>
                <DomesticTransferPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transfers/local"
            element={
              <ProtectedRoute>
                <ExternalTransfersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transfers/international"
            element={
              <ProtectedRoute>
                <InternationalTransferPage />
              </ProtectedRoute>
            }
          />
          {/* Legacy routes for backward compatibility */}
          <Route
            path="/transfers/domestic"
            element={
              <ProtectedRoute>
                <DomesticTransferPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transfers/external"
            element={
              <ProtectedRoute>
                <ExternalTransfersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/recurring-payments"
            element={
              <ProtectedRoute>
                <RecurringPaymentsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/transaction-history"
            element={
              <ProtectedRoute>
                <TransactionHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mybanker"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/kyc"
            element={
              <ProtectedRoute>
                <KYCUploadPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to landing page */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}
