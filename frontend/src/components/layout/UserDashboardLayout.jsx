import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  LayoutDashboard,
  CreditCard,
  Wallet,
  ArrowLeftRight,
  FileText,
  Settings,
  HelpCircle,
  Shield,
  LogOut,
  Bell,
  User,
  ChevronDown,
  ChevronRight,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  Globe,
  Home,
  Building2,
  Repeat,
  Landmark,
  PiggyBank,
} from 'lucide-react';
import { Logo } from '../ui/Logo';
import NotificationBell from '../NotificationBell';
import UserProfileModal from '../modals/UserProfileModal';

const navItemClasses = ({ isActive }) =>
  [
    'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-600 -ml-1 pl-3'
      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900',
  ].join(' ');

const UserDashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [paymentsExpanded, setPaymentsExpanded] = useState(false);
  const [transfersExpanded, setTransfersExpanded] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  // Auto-expand sections based on current route
  React.useEffect(() => {
    if (location.pathname.includes('/deposit') || location.pathname.includes('/withdrawal')) {
      setPaymentsExpanded(true);
    }
    if (location.pathname.includes('/transfer')) {
      setTransfersExpanded(true);
    }
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-30 w-72 bg-white border-r border-neutral-200 transform transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-100">
            <Logo size="md" />
            <button
              className="lg:hidden p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              onClick={closeSidebar}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
            {/* Overview Section */}
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Overview
              </div>
              <NavLink to="/dashboard" className={navItemClasses} onClick={closeSidebar}>
                <LayoutDashboard className="h-5 w-5" />
                <span>Dashboard</span>
              </NavLink>
            </div>

            {/* Banking Section */}
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Banking
              </div>
              <div className="space-y-1">
                <NavLink to="/accounts" className={navItemClasses} onClick={closeSidebar}>
                  <Wallet className="h-5 w-5" />
                  <span>Accounts</span>
                </NavLink>

                <NavLink to="/cards" className={navItemClasses} onClick={closeSidebar}>
                  <CreditCard className="h-5 w-5" />
                  <span>Cards</span>
                </NavLink>

                {/* Payments with sub-items */}
                <div>
                  <button
                    onClick={() => setPaymentsExpanded(!paymentsExpanded)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    aria-label="Payments - Pay merchants and fund your accounts"
                    title="Pay merchants and fund your accounts"
                  >
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5" />
                      <span>Payments</span>
                    </div>
                    {paymentsExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {paymentsExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      <NavLink
                        to="/payments/deposit"
                        className={navItemClasses}
                        onClick={closeSidebar}
                      >
                        <ArrowDownToLine className="h-4 w-4" />
                        <span>Deposit</span>
                      </NavLink>
                      <NavLink
                        to="/payments/withdrawal"
                        className={navItemClasses}
                        onClick={closeSidebar}
                      >
                        <ArrowUpFromLine className="h-4 w-4" />
                        <span>Withdrawal</span>
                      </NavLink>
                    </div>
                  )}
                </div>

                {/* Transfers with sub-items */}
                <div>
                  <button
                    onClick={() => setTransfersExpanded(!transfersExpanded)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                    aria-label="Transfers - Move money between your accounts or to other banks"
                    title="Move money between your accounts or to other banks"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowLeftRight className="h-5 w-5" />
                      <span>Transfers</span>
                    </div>
                    {transfersExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  {transfersExpanded && (
                    <div className="ml-8 mt-1 space-y-1">
                      <NavLink
                        to="/transfers/internal"
                        className={navItemClasses}
                        onClick={closeSidebar}
                      >
                        <Home className="h-4 w-4" />
                        <span>Internal Transfer</span>
                      </NavLink>
                      <NavLink
                        to="/transfers/local"
                        className={navItemClasses}
                        onClick={closeSidebar}
                      >
                        <Building2 className="h-4 w-4" />
                        <span>Local Transfer</span>
                      </NavLink>
                      <NavLink
                        to="/transfers/international"
                        className={navItemClasses}
                        onClick={closeSidebar}
                      >
                        <Globe className="h-4 w-4" />
                        <span>International Wire</span>
                      </NavLink>
                    </div>
                  )}
                </div>

                <NavLink to="/transaction-history" className={navItemClasses} onClick={closeSidebar}>
                  <FileText className="h-5 w-5" />
                  <span>Transaction History</span>
                </NavLink>

                <NavLink to="/recurring-payments" className={navItemClasses} onClick={closeSidebar}>
                  <Repeat className="h-5 w-5" />
                  <span>Recurring Payments</span>
                </NavLink>

                <NavLink to="/loans" className={navItemClasses} onClick={closeSidebar}>
                  <Landmark className="h-5 w-5" />
                  <span>Loans</span>
                </NavLink>

                <NavLink to="/fixed-deposits" className={navItemClasses} onClick={closeSidebar}>
                  <PiggyBank className="h-5 w-5" />
                  <span>Fixed Deposits</span>
                </NavLink>
              </div>
            </div>

            {/* Settings Section */}
            <div>
              <div className="px-3 mb-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Settings
              </div>
              <div className="space-y-1">
                <NavLink to="/kyc" className={navItemClasses} onClick={closeSidebar}>
                  <Shield className="h-5 w-5" />
                  <span>KYC Verification</span>
                </NavLink>

                <NavLink to="/settings" className={navItemClasses} onClick={closeSidebar}>
                  <Settings className="h-5 w-5" />
                  <span>Account Settings</span>
                </NavLink>

                <NavLink to="/support" className={navItemClasses} onClick={closeSidebar}>
                  <HelpCircle className="h-5 w-5" />
                  <span>Help & Support</span>
                </NavLink>
              </div>
            </div>
          </nav>

          {/* User Profile Footer */}
          <div className="border-t border-neutral-100 p-4">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-colors cursor-pointer group">
              {user?.profilePhoto ? (
                <img 
                  src={user.profilePhoto.startsWith('data:') || user.profilePhoto.startsWith('http') ? user.profilePhoto : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || ''}${user.profilePhoto}`}
                  alt="Profile"
                  className="h-10 w-10 rounded-full object-cover shadow-sm"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-bold shadow-sm ${user?.profilePhoto ? 'hidden' : ''}`}
              >
                {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-neutral-900 truncate">
                  {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email?.split('@')[0] || 'User'}
                </div>
                <div className="text-xs text-neutral-500 truncate">{user?.email || 'customer@roschcapital.com'}</div>
              </div>
              <ChevronDown className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-neutral-100 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              ☰
            </button>
            {/* Logo - visible on mobile when sidebar is closed */}
            <div className="lg:hidden">
              <Logo size="sm" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <NotificationBell isAdmin={false} />

            {/* User Menu */}
            <button 
              onClick={() => setShowProfileModal(true)}
              className="flex items-center gap-2 p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {user?.profilePhoto ? (
                <img 
                  src={user.profilePhoto.startsWith('data:') || user.profilePhoto.startsWith('http') ? user.profilePhoto : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || ''}${user.profilePhoto}`}
                  alt="Profile"
                  className="h-8 w-8 rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold ${user?.profilePhoto ? 'hidden' : ''}`}
              >
                {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto bg-neutral-50">{children}</main>
      </div>

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
      />
    </div>
  );
};

export default UserDashboardLayout;
