import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import apiClient from '../lib/apiClient';
import AccountDetailsComponent from '../components/AccountDetailsComponent';
import CryptoAccountPage from './CryptoAccountPage';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import AccountCreationModal from '../components/modals/AccountCreationModal';
import { RefreshCw } from 'lucide-react';
import CryptoAccountCard from '../components/CryptoAccountCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

/**
 * AccountsPage - Shows all user accounts
 * Mobile-first, responsive design with dark theme
 */
export const AccountsPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/accounts');

        if (response.success) {
          setAccounts(response.accounts);
        } else {
          setError('Failed to load accounts');
        }
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setError('Unable to load accounts');
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const handleAccountCreated = (newAccount) => {
    setAccounts([newAccount, ...accounts]);
    setShowCreateModal(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (selectedAccountId) {
    const selectedAccount = accounts.find(acc => acc.id === selectedAccountId);
    
    // Show crypto account page for crypto wallets
    if (selectedAccount?.accountType === 'CRYPTO_WALLET') {
      return (
        <CryptoAccountPage
          accountId={selectedAccountId}
          onBack={() => setSelectedAccountId(null)}
        />
      );
    }
    
    // Show regular account details for other accounts
    return (
      <UserDashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Account details</h2>
            <p className="text-sm text-slate-500 mt-1">
              View transactions and information for this account.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <AccountDetailsComponent
              accountId={selectedAccountId}
              onBack={() => setSelectedAccountId(null)}
            />
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  if (loading && accounts.length === 0) {
    return (
      <UserDashboardLayout>
        <LoadingSkeleton variant="premium" />
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Accounts</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage all your Rosch Capital Bank accounts in one place.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <LoadingSkeleton variant="card" count={3} />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        ) : !accounts || accounts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
            <p className="text-slate-500 mb-4">No accounts found yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors"
            >
              Create account
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) =>
              account.accountType === 'CRYPTO_WALLET' ? (
                <CryptoAccountCard
                  key={account.id}
                  account={account}
                  onClick={() => setSelectedAccountId(account.id)}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                />
              ) : (
                <button
                  type="button"
                  key={account.id}
                  onClick={() => setSelectedAccountId(account.id)}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-md transition-colors text-left"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">
                        {account.accountType.charAt(0).toUpperCase() + account.accountType.slice(1)} Account
                      </p>
                      <h3 className="text-lg font-semibold text-slate-900">
                        •••• {account.accountNumber.slice(-4)}
                      </h3>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                        account.isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {account.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mb-4 pb-4 border-b border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Current Balance</p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatCurrency(account.balance)}
                    </p>
                    <div className="flex gap-4 mt-2">
                      <div>
                        <p className="text-[10px] text-slate-400">Available</p>
                        <p className="text-xs font-medium text-green-600">
                          {formatCurrency(account.availableBalance || 0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Pending</p>
                        <p className="text-xs font-medium text-yellow-600">
                          {formatCurrency(account.pendingBalance || 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Currency</span>
                      <span className="text-slate-900 font-medium">{account.currency}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <p className="text-[11px] text-blue-600 font-medium flex items-center gap-1">
                      View details
                      <span aria-hidden>→</span>
                    </p>
                  </div>
                </button>
              )
            )}
          </div>
        )}

        {!loading && !error && accounts && accounts.length > 0 && (
          <div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-sm font-medium text-blue-700 border border-dashed border-blue-200"
            >
              + Add new account
            </button>
          </div>
        )}
      </div>

      {/* Account Creation Modal */}
      <AccountCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleAccountCreated}
      />
    </UserDashboardLayout>
  );
};

export default AccountsPage;