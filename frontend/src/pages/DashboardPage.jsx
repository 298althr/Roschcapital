import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import { MetricCard } from '../components/ui/MetricCard';
import { ActionButton } from '../components/ui/ActionButton';
import { ErrorState } from '../components/ui/ErrorState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { TransactionHistoryModal } from '../components/TransactionHistoryModal';
import AccountCreationModal from '../components/modals/AccountCreationModal';
import { formatDate } from '../utils/dateFormatter';
import {
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Send,
  Download,
  Plus,
  Clock,
  PiggyBank,
  DollarSign,
  Landmark,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [kyc, setKyc] = useState(null);
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [showCreateAccountModal, setShowCreateAccountModal] = useState(false);
  const [searchParams] = useSearchParams();
  const impersonateToken = searchParams.get('impersonate');
  
  // If impersonation token is provided, set it in localStorage temporarily
  useEffect(() => {
    if (impersonateToken) {
      // Store original token
      const originalToken = localStorage.getItem('accessToken');
      if (originalToken) {
        sessionStorage.setItem('originalToken', originalToken);
      }
      // Set impersonation token
      localStorage.setItem('accessToken', impersonateToken);
      // Remove the query param from URL without reload
      window.history.replaceState({}, '', '/dashboard');
    }
    
    // Cleanup on unmount - restore original token if this was impersonation
    return () => {
      const originalToken = sessionStorage.getItem('originalToken');
      if (originalToken) {
        localStorage.setItem('accessToken', originalToken);
        sessionStorage.removeItem('originalToken');
      }
    };
  }, [impersonateToken]);


  useEffect(() => {
    const fetchDashboardAndKyc = async () => {
      try {
        setLoading(true);
        setError(null);

        const [dashboardResponse, kycResponse] = await Promise.all([
          apiClient.get('/dashboard'),
          apiClient
            .get('/kyc/status')
            .catch((err) => {
              console.error('Error fetching KYC status:', err);
              return null;
            }),
        ]);

        if (dashboardResponse?.success) {
          setDashboard(dashboardResponse.dashboard);
        } else {
          setError('Failed to load dashboard');
        }

        if (kycResponse) {
          setKyc(kycResponse);
        }
      } catch (err) {
        console.error('Error fetching dashboard:', err);
        setError('Unable to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardAndKyc();
  }, []);

  const formatCurrency = (amount) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  if (loading) {
    return (
      <UserDashboardLayout>
        <LoadingSkeleton variant="premium" />
      </UserDashboardLayout>
    );
  }

  if (error) {
    return (
      <UserDashboardLayout>
        <div className="max-w-4xl mx-auto py-12">
          <ErrorState
            title="Unable to load dashboard"
            message={error}
            onRetry={() => window.location.reload()}
          />
        </div>
      </UserDashboardLayout>
    );
  }

  const summary = dashboard?.summary || {};

  return (
    <UserDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Hero Section - Total Balance */}
        <div className="bg-gradient-to-br from-purple-700 via-purple-800 to-primary-800 rounded-2xl p-4 sm:p-6 md:p-10 text-white shadow-xl relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-purple-100 text-xs sm:text-sm font-medium uppercase tracking-wide">
                    Total Balance
                  </p>
                  <div className="group relative">
                    <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center cursor-help">
                      <span className="text-white text-xs">?</span>
                    </div>
                    <div className="absolute left-0 top-6 w-64 bg-slate-900 text-white text-xs rounded-lg p-3 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                      <p className="font-semibold mb-2">Balance Types:</p>
                      <p className="mb-1"><span className="text-green-400">Available:</span> Spendable money</p>
                      <p className="mb-1"><span className="text-yellow-400">Pending:</span> Transactions clearing</p>
                      <p><span className="text-purple-400">Current:</span> Available + Pending</p>
                    </div>
                  </div>
                </div>
                <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-2 tracking-tight break-all sm:break-normal">
                  {formatCurrency(summary.totalBalance || 0)}
                </h1>
                <div className="flex gap-4 mb-2">
                  <div>
                    <p className="text-purple-100/70 text-xs">Available</p>
                    <p className="text-green-300 text-sm font-semibold">
                      {formatCurrency(summary.availableBalance || summary.totalBalance || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-purple-100/70 text-xs">Pending</p>
                    <p className="text-yellow-300 text-sm font-semibold">
                      {formatCurrency(summary.pendingBalance || 0)}
                    </p>
                  </div>
                </div>
                <p className="text-purple-100 text-sm">
                  Across {summary.accountCount || 0} accounts • Last updated just now
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <ActionButton
                  variant="outline"
                  size="md"
                  icon={Download}
                  onClick={() => navigate('/statements')}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Download Statement
                </ActionButton>
              </div>
            </div>
          </div>
        </div>

        {/* KYC Alert (if not verified) */}
        {kyc?.kycStatus !== 'VERIFIED' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-900 mb-1">
                Complete your KYC verification
              </h3>
              <p className="text-sm text-amber-700 mb-3">
                Verify your identity to unlock full banking features including higher transfer limits and card issuance.
              </p>
              <ActionButton
                variant="primary"
                size="sm"
                onClick={() => navigate('/kyc')}
              >
                Complete Verification
              </ActionButton>
            </div>
          </div>
        )}


        <TransactionHistoryModal 
          isOpen={showTransactionHistory} 
          onClose={() => setShowTransactionHistory(false)} 
        />

        {/* Financial Overview - Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Monthly Income */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              {summary.monthlyIncome > 0 && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  +{Math.round((summary.monthlyIncome / (summary.totalBalance || 1)) * 100)}%
                </span>
              )}
            </div>
            <h3 className="text-sm font-medium text-neutral-600 mb-1">Monthly Income</h3>
            <p className="text-2xl font-bold text-neutral-900 mb-3">{formatCurrency(summary.monthlyIncome || 0)}</p>
            {/* Mini Line Chart */}
            <div className="h-12 relative">
              <svg width="100%" height="100%" viewBox="0 0 100 48" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0,40 L15,35 L30,28 L45,32 L60,20 L75,15 L90,18 L100,10 L100,48 L0,48 Z" fill="url(#incomeGradient)"/>
                <polyline points="0,40 15,35 30,28 45,32 60,20 75,15 90,18 100,10" fill="none" stroke="#10B981" strokeWidth="2"/>
              </svg>
            </div>
            <p className="text-xs text-neutral-500 mt-2">This month's credits</p>
          </div>

          {/* Monthly Expenses */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5 text-red-600" />
              </div>
              {summary.monthlyExpenses > 0 && (
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  -{Math.round((summary.monthlyExpenses / (summary.totalBalance || 1)) * 100)}%
                </span>
              )}
            </div>
            <h3 className="text-sm font-medium text-neutral-600 mb-1">Monthly Expenses</h3>
            <p className="text-2xl font-bold text-neutral-900 mb-3">{formatCurrency(summary.monthlyExpenses || 0)}</p>
            {/* Net Flow */}
            <div className="flex items-center gap-3">
              <div className={`text-sm font-semibold ${(summary.monthlyIncome - summary.monthlyExpenses) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                Net: {formatCurrency((summary.monthlyIncome || 0) - (summary.monthlyExpenses || 0))}
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">This month's debits</p>
          </div>

          {/* Loan Status */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Landmark className="w-5 h-5 text-amber-600" />
              </div>
              <span className="text-xs font-medium text-neutral-600 bg-neutral-100 px-2 py-1 rounded-full">
                {summary.loanBalance > 0 ? 'Active' : 'No Loans'}
              </span>
            </div>
            <h3 className="text-sm font-medium text-neutral-600 mb-1">Loan Balance</h3>
            <p className="text-2xl font-bold text-neutral-900 mb-3">{formatCurrency(summary.loanBalance || 0)}</p>
            {/* Payment Progress */}
            {summary.loanOriginalAmount > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-neutral-500">Paid</span>
                  <span className="font-medium text-neutral-900">
                    {formatCurrency(summary.loanTotalPaid || 0)} / {formatCurrency(summary.loanOriginalAmount || 0)}
                  </span>
                </div>
                <div className="h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-500 rounded-full" 
                    style={{ width: `${Math.round((summary.loanTotalPaid / summary.loanOriginalAmount) * 100)}%` }}
                  />
                </div>
                {summary.nextLoanPayment && (
                  <p className="text-xs text-neutral-500">
                    Next payment: {new Date(summary.nextLoanPayment).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expenses Breakdown */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900">Expenses Breakdown</h2>
            <p className="text-sm text-neutral-500 mt-0.5">Where your money goes this month</p>
          </div>
          <div className="p-6">
            {summary.expensesBreakdown && summary.expensesBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dynamic Pie Chart */}
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                      {(() => {
                        const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#6B7280', '#EC4899', '#14B8A6'];
                        const circumference = 2 * Math.PI * 40;
                        let offset = 0;
                        return summary.expensesBreakdown.map((item, i) => {
                          const dashArray = (item.percent / 100) * circumference;
                          const circle = (
                            <circle 
                              key={i}
                              cx="50" 
                              cy="50" 
                              r="40" 
                              fill="none" 
                              stroke={colors[i % colors.length]} 
                              strokeWidth="20" 
                              strokeDasharray={`${dashArray} ${circumference}`}
                              strokeDashoffset={-offset}
                            />
                          );
                          offset += dashArray;
                          return circle;
                        });
                      })()}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-2xl font-bold text-neutral-900">{formatCurrency(summary.monthlyExpenses || 0)}</p>
                      <p className="text-xs text-neutral-500">Total</p>
                    </div>
                  </div>
                </div>
                {/* Dynamic Legend */}
                <div className="space-y-3">
                  {(() => {
                    const colorClasses = ['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-neutral-500', 'bg-pink-500', 'bg-teal-500'];
                    return summary.expensesBreakdown.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${colorClasses[i % colorClasses.length]}`}/>
                        <div className="flex-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-neutral-700">{item.label}</span>
                            <span className="text-sm font-medium text-neutral-900">{formatCurrency(item.amount)}</span>
                          </div>
                          <div className="mt-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div className={`h-full ${colorClasses[i % colorClasses.length]} rounded-full`} style={{ width: `${item.percent}%` }}/>
                          </div>
                        </div>
                        <span className="text-xs text-neutral-500 w-10 text-right">{item.percent}%</span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">No expenses this month</h3>
                <p className="text-sm text-neutral-500">Your expense breakdown will appear here once you have transactions</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm">
          <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Recent Activity</h2>
              <p className="text-sm text-neutral-500 mt-0.5">Your latest transactions</p>
            </div>
            <ActionButton
              variant="ghost"
              size="sm"
              onClick={() => setShowTransactionHistory(true)}
            >
              View All
            </ActionButton>
          </div>

          <div className="divide-y divide-neutral-100">
            {dashboard?.recentTransactions && dashboard.recentTransactions.length > 0 ? (
              dashboard.recentTransactions.slice(0, 5).map((txn) => (
                <div
                  key={txn.id}
                  className="px-6 py-4 hover:bg-neutral-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        txn.type === 'credit' || parseFloat(txn.amount) > 0
                          ? 'bg-emerald-100'
                          : 'bg-neutral-100'
                      }`}
                    >
                      {txn.type === 'credit' || parseFloat(txn.amount) > 0 ? (
                        <ArrowDownRight className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-neutral-600" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {txn.description}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {formatDate(txn.date, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    {/* Amount */}
                    <div
                      className={`text-sm font-semibold ${
                        txn.type === 'credit' || parseFloat(txn.amount) > 0
                          ? 'text-emerald-600'
                          : 'text-neutral-900'
                      }`}
                    >
                      {formatCurrency(txn.amount)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  No recent transactions
                </h3>
                <p className="text-sm text-neutral-500 mb-4">
                  Your transaction history will appear here
                </p>
                <ActionButton
                  variant="primary"
                  size="sm"
                  icon={Send}
                  onClick={() => navigate('/payments')}
                >
                  Make a Payment
                </ActionButton>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => setShowCreateAccountModal(true)}
            className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Plus className="w-6 h-6 text-purple-700" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Open New Account</h3>
            <p className="text-sm text-neutral-600">
              Start saving or manage your finances with a new account
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <CreditCard className="w-6 h-6 text-purple-700" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Request New Card</h3>
            <p className="text-sm text-neutral-600">
              Get a debit or credit card for your accounts
            </p>
          </div>
        </div>
      </div>

      {/* Account Creation Modal */}
      <AccountCreationModal
        isOpen={showCreateAccountModal}
        onClose={() => setShowCreateAccountModal(false)}
        onSuccess={() => {
          setShowCreateAccountModal(false);
          // Refresh dashboard data
          window.location.reload();
        }}
      />

    </UserDashboardLayout>
  );
};

export default DashboardPage;
