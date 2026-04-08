import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import TransferModal from '../components/TransferModal';
import ReceiptComponent from '../components/ReceiptComponent';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

/**
 * PaymentsPage - Payments and transfers management
 * Mobile-first, responsive design with dark theme
 */
export const PaymentsPage = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'transfer'
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterMinAmount, setFilterMinAmount] = useState('');
  const [filterMaxAmount, setFilterMaxAmount] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch payments, stats, and accounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Build search params
        const params = new URLSearchParams();
        if (filterType !== 'all') params.append('type', filterType);
        if (filterStatus !== 'all') params.append('status', filterStatus);
        if (filterDateStart) params.append('startDate', filterDateStart);
        if (filterDateEnd) params.append('endDate', filterDateEnd);
        if (filterMinAmount) params.append('minAmount', filterMinAmount);
        if (filterMaxAmount) params.append('maxAmount', filterMaxAmount);
        if (searchTerm) params.append('searchTerm', searchTerm);
        params.append('limit', '20');
        params.append('offset', ((currentPage - 1) * 20).toString());

        const [paymentsRes, statsRes, accountsRes] = await Promise.all([
          apiClient.get(
            searchTerm || filterType !== 'all' || filterStatus !== 'all' || filterDateStart || filterMinAmount
              ? `/payments/search?${params}`
              : '/payments/history'
          ),
          apiClient.get('/payments/stats/overview'),
          apiClient.get('/accounts'),
        ]);

        if (paymentsRes.success) {
          setPayments(paymentsRes.payments || paymentsRes.data || []);
        }

        if (statsRes.success) {
          setStats(statsRes.stats);
        }

        if (accountsRes.success) {
          setAccounts(accountsRes.accounts);
        }
      } catch (err) {
        console.error('Error fetching payments:', err);
        setError('Unable to load payments');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchTerm, filterType, filterStatus, filterDateStart, filterDateEnd, filterMinAmount, filterMaxAmount, currentPage]);

  const handleTransferSuccess = async () => {
    setShowTransferModal(false);
    // Refresh payments
    try {
      const response = await apiClient.get('/payments/history');
      if (response.success) {
        setPayments(response.payments);
      }

      // Refresh stats
      const statsRes = await apiClient.get('/payments/stats/overview');
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.error('Error refreshing payments:', err);
    }
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

  const getPaymentIcon = (type) => {
    switch (type) {
      case 'transfer':
        return '↔️';
      case 'p2p':
        return '👤';
      case 'bill':
        return '📄';
      case 'refund':
        return '↩️';
      default:
        return '💳';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'transfer':
        return 'Transfer';
      case 'p2p':
        return 'P2P Payment';
      case 'bill':
        return 'Bill Payment';
      case 'refund':
        return 'Refund';
      default:
        return 'Payment';
    }
  };

  if (selectedPayment) {
    return (
      <UserDashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Payment details</h2>
            <p className="text-sm text-slate-500 mt-1">View full receipt information for this payment.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <ReceiptComponent
              paymentId={selectedPayment}
              onBack={() => setSelectedPayment(null)}
            />
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  if (loading && payments.length === 0) {
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
          <h2 className="text-xl font-semibold text-slate-900">Payments & Transfers</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage money transfers, bill payments, and view your payment history.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-1">Total payments</p>
              <p className="text-2xl font-semibold text-slate-900">{stats.totalPayments}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-1">Total sent</p>
              <p className="text-2xl font-semibold text-red-600">{formatCurrency(stats.totalSent)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-1">Total received</p>
              <p className="text-2xl font-semibold text-emerald-600">{formatCurrency(stats.totalReceived)}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <p className="text-xs font-medium text-slate-500 mb-1">Net flow</p>
              <p
                className={`text-2xl font-semibold ${
                  stats.totalReceived - stats.totalSent >= 0 ? 'text-emerald-600' : 'text-red-600'
                }`}
              >
                {formatCurrency(stats.totalReceived - stats.totalSent)}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl p-1 shadow-sm border border-slate-100 inline-flex">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transfer')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'transfer'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            New transfer
          </button>
        </div>

        {activeTab === 'transfer' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <TransferModal
              accounts={accounts}
              onSuccess={handleTransferSuccess}
              onClose={() => setActiveTab('history')}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-100">
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <button
                    type="button"
                    key={payment.id}
                    onClick={() => setSelectedPayment(payment.id)}
                    className="w-full text-left bg-slate-50 hover:bg-slate-100 border border-slate-100 hover:border-slate-200 rounded-xl px-4 py-3 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="text-xl mt-0.5">{getPaymentIcon(payment.type)}</div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">{getTypeLabel(payment.type)}</p>
                          <p className="text-xs text-slate-500 line-clamp-1">{payment.description}</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            {formatDate(payment.createdAt)} • Ref: {payment.reference}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
                        <div className="flex items-center justify-end gap-2 mt-1">
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                              payment.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                : payment.status === 'pending'
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-red-50 text-red-700 border-red-100'
                            }`}
                          >
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                          <span className="text-slate-400 group-hover:text-blue-500 transition-colors">
                            →
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-sm text-slate-500 mb-4">No payments yet.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('transfer')}
                  className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors"
                >
                  Make your first transfer
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default PaymentsPage;