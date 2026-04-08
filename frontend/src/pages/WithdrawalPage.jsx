import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import { ActionButton } from '../components/ui/ActionButton';
import WithdrawalModal from '../components/modals/WithdrawalModal';
import { ArrowUpFromLine, CheckCircle, AlertCircle, AlertTriangle, Clock, XCircle, Wallet, History, RefreshCw, Loader2 } from 'lucide-react';

export const WithdrawalPage = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsRes, withdrawalsRes] = await Promise.all([
        apiClient.get('/accounts'),
        apiClient.get('/payments/withdrawals').catch(() => ({ withdrawals: [] }))
      ]);
      
      if (accountsRes.success) {
        setAccounts(accountsRes.accounts);
      }
      setWithdrawals(withdrawalsRes.withdrawals || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Unable to load data');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock },
      COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
      REJECTED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle }
    };
    return styles[status] || styles.PENDING;
  };

  // Stats
  const pendingCount = withdrawals.filter(w => w.status === 'PENDING').length;
  const completedCount = withdrawals.filter(w => w.status === 'COMPLETED').length;
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'COMPLETED')
    .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);

  if (loading) {
    return (
      <UserDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Withdraw Funds</h1>
            <p className="text-neutral-500 mt-1">Withdraw money from your account</p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-4 py-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Withdrawal Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center mx-auto mb-4">
              <ArrowUpFromLine className="w-10 h-10 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Request Withdrawal</h2>
            <p className="text-neutral-600 max-w-md mx-auto">
              Withdraw funds to your crypto wallet or bank account. All withdrawals require admin approval.
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-900 mb-1">Important Notice</p>
                  <p className="text-xs text-amber-700">
                    Withdrawals are processed within 1-3 business days after admin approval. Please ensure you have sufficient funds and provide correct wallet/account details.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowWithdrawalModal(true)}
              className="w-full px-6 py-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-medium rounded-xl transition-all shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 flex items-center justify-center gap-2"
            >
              <ArrowUpFromLine className="w-5 h-5" />
              Start Withdrawal
            </button>
          </div>
        </div>

        {/* Recent Withdrawals */}
        {withdrawals.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
            <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-neutral-400" />
                <h3 className="font-semibold text-neutral-900">Recent Withdrawals</h3>
              </div>
            </div>
            <div className="divide-y divide-neutral-100">
              {withdrawals.slice(0, 5).map((withdrawal) => {
                const statusStyle = getStatusBadge(withdrawal.status);
                const StatusIcon = statusStyle.icon;
                return (
                  <div key={withdrawal.id} className="p-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusStyle.bg}`}>
                          <Wallet className={`w-5 h-5 ${statusStyle.text}`} />
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900">
                            ${parseFloat(withdrawal.amount).toLocaleString()}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {withdrawal.gateway?.name || 'Withdrawal'} • {new Date(withdrawal.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        {withdrawal.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <WithdrawalModal
        isOpen={showWithdrawalModal}
        onClose={() => { setShowWithdrawalModal(false); fetchData(); }}
        accounts={accounts}
      />
    </UserDashboardLayout>
  );
};

export default WithdrawalPage;
