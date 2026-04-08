import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Wrench, Boxes, Landmark, DollarSign, Settings, LogOut,
  ChevronDown, ChevronRight, CreditCard, Coins, ArrowLeftRight,
  UserPlus, Bell, Menu, X, LayoutDashboard, Shield, Clock, 
  CheckCircle, TrendingUp, AlertCircle, FileText, Info, MessageSquare
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import UserManagement from '../components/admin/UserManagement';
import KYCReview from '../components/admin/KYCReview';
import TransactionMonitor from '../components/admin/TransactionMonitor';
import TransactionManagement from '../components/admin/TransactionManagement';
import AuditLogs from '../components/admin/AuditLogs';
import DepositManagement from '../components/admin/DepositManagement';
import ChequeManagement from '../components/admin/ChequeManagement';
import CreditCardApprovalsPage from './admin/CreditCardApprovalsPage';
import TransferApprovalsPage from './admin/TransferApprovalsPage';
import BackupCodesManagement from './admin/BackupCodesManagement';
import AddNewUser from './admin/AddNewUser';
import SystemInfo from './admin/SystemInfo';
import AdminSettings from './admin/AdminSettings';
import GatewayManagement from './admin/GatewayManagement';
import CardsManagement from '../components/admin/CardsManagement';
import LoansManagement from '../components/admin/LoansManagement';
import ExternalTransfersManagement from '../components/admin/ExternalTransfersManagement';
import RecurringPaymentsManagement from '../components/admin/RecurringPaymentsManagement';
import WithdrawalManagement from '../components/admin/WithdrawalManagement';
import FixedDepositsManagement from '../components/admin/FixedDepositsManagement';
import { SupportTicketsPage as AdminSupportTickets } from './admin/SupportTicketsPage';
import CurrencyManagement from './admin/CurrencyManagement';
import NotificationBell from '../components/NotificationBell';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');
  const [expandedMenus, setExpandedMenus] = useState({
    users: false,
    tools: false,
    managements: false,
    gateway: false,
    finances: false,
    configure: false
  });
  const { user } = useAuth();
  const isDevAdmin =
    user?.id === 'dev-admin' || user?.email === 'admin@roschcapital.test';
  const navigate = useNavigate();

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      const response = await apiClient.get('/mybanker/stats');
      setStats(response);
    } catch (err) {
      if (isDevAdmin) {
        const mockStats = {
          totalUsers: 42,
          pendingKYC: 3,
          activeAccounts: 18,
          securityAlerts: 1,
        };
        setStats(mockStats);
        setError('');
      } else {
        setError(err.response?.data?.error || 'Failed to load admin stats');
        if (err.response?.status === 403) {
          navigate('/dashboard');
        }
      }
    }
    setIsLoading(false);
  };

  const toggleMenu = (menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const MenuItem = ({ icon: Icon, label, onClick, active, hasSubmenu, expanded, children }) => (
    <div>
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-4 py-3 text-sm font-medium transition-colors ${
          active 
            ? 'bg-slate-700 text-white' 
            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </div>
        {hasSubmenu && (
          expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
        )}
      </button>
      {hasSubmenu && expanded && (
        <div className="bg-slate-800/50">
          {children}
        </div>
      )}
    </div>
  );

  const SubMenuItem = ({ label, onClick, active }) => (
    <button
      onClick={onClick}
      className={`w-full text-left px-12 py-2.5 text-sm transition-colors ${
        active 
          ? 'bg-slate-700 text-white' 
          : 'text-slate-400 hover:bg-slate-700 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-slate-800 transition-all duration-300 overflow-hidden flex flex-col`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Landmark className="w-8 h-8 text-indigo-400" />
            <div>
              <h2 className="text-white font-bold text-lg">Rosch Capital Bank</h2>
              <p className="text-slate-400 text-xs">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <MenuItem 
            icon={LayoutDashboard} 
            label="Overview" 
            active={activeSection === 'overview'}
            onClick={() => setActiveSection('overview')}
          />

          <MenuItem 
            icon={Users} 
            label="Users" 
            hasSubmenu
            expanded={expandedMenus.users}
            onClick={() => toggleMenu('users')}
          >
            <SubMenuItem 
              label="All Users" 
              active={activeSection === 'all-users'}
              onClick={() => setActiveSection('all-users')} 
            />
            <SubMenuItem label="Add New" onClick={() => setActiveSection('add-user')} />
            <SubMenuItem 
              label="Manage Users" 
              active={activeSection === 'manage-users'}
              onClick={() => setActiveSection('manage-users')} 
            />
          </MenuItem>

          <MenuItem 
            icon={Wrench} 
            label="Tools" 
            hasSubmenu
            expanded={expandedMenus.tools}
            onClick={() => toggleMenu('tools')}
          >
            <SubMenuItem label="Info" onClick={() => setActiveSection('info')} />
            <SubMenuItem label="Settings" onClick={() => setActiveSection('tool-settings')} />
          </MenuItem>

          <MenuItem 
            icon={Boxes} 
            label="Managements" 
            hasSubmenu
            expanded={expandedMenus.managements}
            onClick={() => toggleMenu('managements')}
          >
            <SubMenuItem label="Cards" onClick={() => setActiveSection('cards')} />
            <SubMenuItem label="Loans" onClick={() => setActiveSection('loans')} />
            <SubMenuItem label="Fixed Deposits" onClick={() => setActiveSection('fixed-deposits')} />
            <SubMenuItem label="External Transfers" onClick={() => setActiveSection('external-transfers')} />
            <SubMenuItem label="Recurring Payments" onClick={() => setActiveSection('recurring-payments')} />
            <SubMenuItem label="Currencies" onClick={() => setActiveSection('currencies')} />
            <SubMenuItem label="Exchanges" onClick={() => setActiveSection('exchanges')} />
          </MenuItem>

          <MenuItem 
            icon={Landmark} 
            label="Gateway" 
            hasSubmenu
            expanded={expandedMenus.gateway}
            onClick={() => toggleMenu('gateway')}
          >
            <SubMenuItem 
              label="Manage Gateways" 
              active={activeSection === 'payment-gateways'}
              onClick={() => setActiveSection('payment-gateways')} 
            />
          </MenuItem>

          <MenuItem 
            icon={DollarSign} 
            label="Finances" 
            hasSubmenu
            expanded={expandedMenus.finances}
            onClick={() => toggleMenu('finances')}
          >
            <SubMenuItem label="Deposit" active={activeSection === 'deposit'} onClick={() => setActiveSection('deposit')} />
            <SubMenuItem label="Withdrawal" active={activeSection === 'withdrawal'} onClick={() => setActiveSection('withdrawal')} />
            <SubMenuItem label="Cheque" active={activeSection === 'cheque'} onClick={() => setActiveSection('cheque')} />
            <SubMenuItem 
              label="Transactions" 
              active={activeSection === 'transactions'}
              onClick={() => setActiveSection('transactions')} 
            />
            <SubMenuItem 
              label="Transfer Approvals" 
              active={activeSection === 'transfer-approvals'}
              onClick={() => setActiveSection('transfer-approvals')} 
            />
          </MenuItem>

          <MenuItem 
            icon={FileText} 
            label="KYC Review" 
            active={activeSection === 'kyc-review'}
            onClick={() => setActiveSection('kyc-review')}
          />

          <MenuItem 
            icon={MessageSquare} 
            label="Support Tickets" 
            active={activeSection === 'support-tickets'}
            onClick={() => setActiveSection('support-tickets')}
          />

          <MenuItem 
            icon={Shield} 
            label="Audit Logs" 
            active={activeSection === 'audit-logs'}
            onClick={() => setActiveSection('audit-logs')}
          />

          <MenuItem 
            icon={Shield} 
            label="Backup Codes" 
            active={activeSection === 'backup-codes'}
            onClick={() => setActiveSection('backup-codes')}
          />

          <MenuItem 
            icon={Settings} 
            label="Configure" 
            hasSubmenu
            expanded={expandedMenus.configure}
            onClick={() => toggleMenu('configure')}
          >
            <SubMenuItem 
              label="Payment Gateways" 
              active={activeSection === 'payment-gateways'}
              onClick={() => setActiveSection('payment-gateways')} 
            />
            <SubMenuItem 
              label="Currencies" 
              active={activeSection === 'currencies'}
              onClick={() => setActiveSection('currencies')} 
            />
            <SubMenuItem 
              label="System Settings" 
              active={activeSection === 'tool-settings'}
              onClick={() => setActiveSection('tool-settings')} 
            />
          </MenuItem>

          <MenuItem 
            icon={LogOut} 
            label="Logout" 
            onClick={handleLogout}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                {sidebarOpen ? <X className="w-5 h-5 text-slate-300" /> : <Menu className="w-5 h-5 text-slate-300" />}
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">
                  {activeSection === 'overview' && 'Dashboard Overview'}
                  {activeSection === 'all-users' && 'All Users'}
                  {activeSection === 'manage-users' && 'Manage Users'}
                  {activeSection === 'add-user' && 'Add New User'}
                  {activeSection === 'kyc-review' && 'KYC Review'}
                  {activeSection === 'transactions' && 'Transaction Monitor'}
                  {activeSection === 'audit-logs' && 'Audit Logs'}
                  {activeSection === 'backup-codes' && 'Backup Codes Management'}
                  {activeSection === 'deposit' && 'Deposit Management'}
                  {activeSection === 'withdrawal' && 'Withdrawal Management'}
                  {activeSection === 'cheque' && 'Cheque Management'}
                  {activeSection === 'fixed-deposits' && 'Fixed Deposits Management'}
                  {activeSection === 'cards' && 'Cards Management'}
                  {activeSection === 'loans' && 'Loans Management'}
                  {activeSection === 'external-transfers' && 'External Transfers'}
                  {activeSection === 'recurring-payments' && 'Recurring Payments'}
                  {activeSection === 'transfer-approvals' && 'Transfer Approvals'}
                  {activeSection === 'info' && 'System Information'}
                  {activeSection === 'tool-settings' && 'Admin Settings'}
                  {activeSection === 'payment-gateways' && 'Payment Gateway Management'}
                  {!['overview', 'all-users', 'manage-users', 'add-user', 'kyc-review', 'transactions', 'audit-logs', 'backup-codes', 'deposit', 'cheque', 'cards', 'loans', 'external-transfers', 'recurring-payments', 'transfer-approvals', 'info', 'tool-settings', 'payment-gateways', 'currencies', 'support-tickets', 'withdrawal'].includes(activeSection) && 
                    activeSection.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                  }
                </h1>
                <p className="text-sm text-slate-400">Rosch Capital Bank Administration</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell isAdmin={true} />
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-700 rounded-lg">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">A</span>
                </div>
                <span className="text-white text-sm font-medium">Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-6 bg-red-900/20 border border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Overview Section */}
          {activeSection === 'overview' && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-indigo-500 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {stats?.totalUsers || 0}
                  </h3>
                  <p className="text-sm text-slate-400">Total Users</p>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-amber-500 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-amber-500/10 rounded-lg">
                      <Clock className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {stats?.pendingKYC || 0}
                  </h3>
                  <p className="text-sm text-slate-400">Pending KYC</p>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-green-500 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {stats?.activeAccounts || 0}
                  </h3>
                  <p className="text-sm text-slate-400">Active Accounts</p>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-red-500 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-500/10 rounded-lg">
                      <Shield className="w-6 h-6 text-red-400" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-1">
                    {stats?.securityAlerts || 0}
                  </h3>
                  <p className="text-sm text-slate-400">Security Alerts</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button 
                    onClick={() => setActiveSection('manage-users')}
                    className="p-6 bg-slate-700 border-2 border-slate-600 rounded-lg hover:border-indigo-500 transition-all text-left group"
                  >
                    <Users className="w-8 h-8 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-white mb-1">Manage Users</h3>
                    <p className="text-sm text-slate-400">View and manage user accounts</p>
                  </button>
                  <button 
                    onClick={() => setActiveSection('kyc-review')}
                    className="p-6 bg-slate-700 border-2 border-slate-600 rounded-lg hover:border-indigo-500 transition-all text-left group"
                  >
                    <FileText className="w-8 h-8 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-white mb-1">Review KYC</h3>
                    <p className="text-sm text-slate-400">Review pending KYC documents</p>
                  </button>
                  <button 
                    onClick={() => setActiveSection('audit-logs')}
                    className="p-6 bg-slate-700 border-2 border-slate-600 rounded-lg hover:border-indigo-500 transition-all text-left group"
                  >
                    <Shield className="w-8 h-8 text-indigo-400 mb-3 group-hover:scale-110 transition-transform" />
                    <h3 className="font-semibold text-white mb-1">Audit Logs</h3>
                    <p className="text-sm text-slate-400">View security and activity logs</p>
                  </button>
                </div>
              </div>

              <div className="bg-indigo-900/20 border border-indigo-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-indigo-300 mb-2 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Complete Admin Panel
                </h3>
                <p className="text-indigo-400 text-sm">
                  Full admin panel with user management, KYC review, transaction monitoring, and audit logs is now available. Navigate using the sidebar to access all features.
                </p>
              </div>
            </>
          )}

          {/* User Management Sections */}
          {(activeSection === 'all-users' || activeSection === 'manage-users') && <UserManagement />}
          {activeSection === 'add-user' && <AddNewUser />}

          {/* KYC Review */}
          {activeSection === 'kyc-review' && <KYCReview />}

          {/* Transaction Management */}
          {activeSection === 'transactions' && <TransactionManagement />}

          {/* Audit Logs */}
          {activeSection === 'audit-logs' && <AuditLogs />}

          {/* Support Tickets */}
          {activeSection === 'support-tickets' && <AdminSupportTickets />}

          {/* Backup Codes Management */}
          {activeSection === 'backup-codes' && <BackupCodesManagement />}

          {/* Deposit Management */}
          {activeSection === 'deposit' && <DepositManagement />}

          {/* Withdrawal Management */}
          {activeSection === 'withdrawal' && <WithdrawalManagement />}

          {/* Cheque Management */}
          {activeSection === 'cheque' && <ChequeManagement />}

          {/* Cards Management */}
          {activeSection === 'cards' && <CardsManagement />}

          {/* Loans Management */}
          {activeSection === 'loans' && <LoansManagement />}

          {/* Fixed Deposits Management */}
          {activeSection === 'fixed-deposits' && <FixedDepositsManagement />}

          {/* External Transfers Management */}
          {activeSection === 'external-transfers' && <ExternalTransfersManagement />}

          {/* Recurring Payments Management */}
          {activeSection === 'recurring-payments' && <RecurringPaymentsManagement />}

          {/* Transfer Approvals */}
          {activeSection === 'transfer-approvals' && <TransferApprovalsPage />}

          {/* Payment Gateways */}
          {activeSection === 'payment-gateways' && <GatewayManagement />}

          {/* Currencies */}
          {activeSection === 'currencies' && <CurrencyManagement />}

          {/* Tools */}
          {activeSection === 'info' && <SystemInfo />}
          {activeSection === 'tool-settings' && <AdminSettings />}

          {/* Other sections show placeholder */}
          {!['overview', 'all-users', 'manage-users', 'add-user', 'kyc-review', 'transactions', 'audit-logs', 'backup-codes', 'deposit', 'withdrawal', 'cheque', 'cards', 'loans', 'fixed-deposits', 'external-transfers', 'recurring-payments', 'transfer-approvals', 'info', 'tool-settings', 'payment-gateways', 'currencies', 'support-tickets'].includes(activeSection) && (
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Boxes className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Feature In Development</h3>
                <p className="text-slate-400">
                  The <span className="text-indigo-400 font-semibold">{activeSection.replace(/-/g, ' ')}</span> section is currently being built.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
