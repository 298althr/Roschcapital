import React, { useState, useEffect } from 'react';
import { PiggyBank, Plus, TrendingUp, Calendar, DollarSign, AlertCircle, CheckCircle, X } from 'lucide-react';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import apiClient from '../lib/apiClient';

const FixedDepositsPage = () => {
  const [deposits, setDeposits] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawDeposit, setWithdrawDeposit] = useState(null);
  const [backupCode, setBackupCode] = useState('');
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [formData, setFormData] = useState({
    accountId: '',
    principalAmount: '',
    interestRate: '5.5',
    termMonths: '12',
    autoRenew: false
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [depositsRes, accountsRes, statsRes] = await Promise.all([
        apiClient.get('/fixed-deposits'),
        apiClient.get('/accounts'),
        apiClient.get('/fixed-deposits/stats')
      ]);
      setDeposits(depositsRes.data || []);
      setAccounts(accountsRes.accounts || []);
      setStats(statsRes.data || {});
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDeposit = async (e) => {
    e.preventDefault();
    
    try {
      await apiClient.post('/fixed-deposits', formData);
      alert('Fixed deposit created successfully!');
      setShowCreateModal(false);
      setFormData({
        accountId: '',
        principalAmount: '',
        interestRate: '5.5',
        termMonths: '12',
        autoRenew: false
      });
      fetchData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to create fixed deposit');
    }
  };

  const openWithdrawModal = (deposit) => {
    setWithdrawDeposit(deposit);
    setBackupCode('');
    setWithdrawReason('');
    setShowWithdrawModal(true);
  };

  const handleWithdrawRequest = async (e) => {
    e.preventDefault();
    
    if (!backupCode) {
      alert('Please enter your backup code');
      return;
    }

    setWithdrawing(true);
    try {
      const response = await apiClient.post(`/fixed-deposits/${withdrawDeposit.id}/withdraw-request`, {
        backupCode,
        reason: withdrawReason
      });
      alert(response.message || 'Withdrawal request submitted successfully!');
      setShowWithdrawModal(false);
      setWithdrawDeposit(null);
      setBackupCode('');
      setWithdrawReason('');
      fetchData();
      setSelectedDeposit(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to submit withdrawal request');
    } finally {
      setWithdrawing(false);
    }
  };

  const calculateMaturityAmount = () => {
    const principal = parseFloat(formData.principalAmount) || 0;
    const rate = parseFloat(formData.interestRate) || 0;
    const months = parseInt(formData.termMonths) || 0;
    const years = months / 12;
    return principal * (1 + (rate / 100) * years);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysRemaining = (maturityDate) => {
    const today = new Date();
    const maturity = new Date(maturityDate);
    const diffTime = maturity - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' },
      WITHDRAWAL_PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Withdrawal Pending' },
      MATURED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Matured' },
      WITHDRAWN: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Withdrawn' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
    };
    const badge = badges[status] || badges.ACTIVE;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <UserDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Fixed Deposits</h1>
            <p className="text-neutral-600 mt-1">Grow your savings with guaranteed returns</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Fixed Deposit
          </button>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-neutral-600">Active Deposits</h3>
                <PiggyBank className="w-5 h-5 text-primary-600" />
              </div>
              <p className="text-2xl font-bold text-neutral-900">{stats.activeDeposits || 0}</p>
              <p className="text-xs text-neutral-500 mt-1">{formatCurrency(stats.totalInvested || 0)} invested</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-neutral-600">Expected Returns</h3>
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.expectedReturns || 0)}</p>
              <p className="text-xs text-neutral-500 mt-1">From active deposits</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-neutral-600">Total Deposits</h3>
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-neutral-900">{stats.totalDeposits || 0}</p>
              <p className="text-xs text-neutral-500 mt-1">All time</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-neutral-600">Matured</h3>
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-neutral-900">{stats.maturedDeposits || 0}</p>
              <p className="text-xs text-neutral-500 mt-1">Completed</p>
            </div>
          </div>
        )}

        {/* Deposits List */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">Your Fixed Deposits</h2>
          </div>
          <div className="divide-y divide-neutral-200">
            {deposits.length === 0 ? (
              <div className="p-12 text-center">
                <PiggyBank className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No Fixed Deposits Yet</h3>
                <p className="text-neutral-600 mb-4">Start growing your savings with guaranteed returns</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Deposit
                </button>
              </div>
            ) : (
              deposits.map((deposit) => {
                const daysRemaining = calculateDaysRemaining(deposit.maturityDate);
                const isMatured = daysRemaining <= 0;
                const interestEarned = deposit.maturityAmount - deposit.principalAmount;

                return (
                  <div key={deposit.id} className="p-6 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-neutral-900">{deposit.depositNumber}</h3>
                          {getStatusBadge(deposit.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div>
                            <p className="text-xs text-neutral-500">Principal Amount</p>
                            <p className="text-sm font-medium text-neutral-900">{formatCurrency(deposit.principalAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Interest Rate</p>
                            <p className="text-sm font-medium text-green-600">{deposit.interestRate}% p.a.</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Maturity Amount</p>
                            <p className="text-sm font-medium text-neutral-900">{formatCurrency(deposit.maturityAmount)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500">Interest Earned</p>
                            <p className="text-sm font-medium text-green-600">+{formatCurrency(interestEarned)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6 mt-4 text-sm text-neutral-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>Maturity: {formatDate(deposit.maturityDate)}</span>
                          </div>
                          {deposit.status === 'ACTIVE' && (
                            <div className={`flex items-center gap-2 ${isMatured ? 'text-green-600' : ''}`}>
                              <AlertCircle className="w-4 h-4" />
                              <span>{isMatured ? 'Ready to withdraw' : `${daysRemaining} days remaining`}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => setSelectedDeposit(deposit)}
                          className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                        {deposit.status === 'ACTIVE' && (
                          <button
                            onClick={() => openWithdrawModal(deposit)}
                            className="px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            Withdraw
                          </button>
                        )}
                        {deposit.status === 'WITHDRAWAL_PENDING' && (
                          <span className="px-4 py-2 text-sm font-medium text-yellow-600">
                            Pending Withdrawal
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Create Deposit Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-neutral-900">Create Fixed Deposit</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleCreateDeposit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Select Account
                  </label>
                  <select
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  >
                    <option value="">Choose an account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.accountName || account.accountType} - {account.accountNumber} (Balance: {formatCurrency(account.availableBalance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Principal Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">$</span>
                    <input
                      type="number"
                      value={formData.principalAmount}
                      onChange={(e) => setFormData({ ...formData, principalAmount: e.target.value })}
                      className="w-full pl-8 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0.00"
                      min="100"
                      step="0.01"
                      required
                    />
                  </div>
                  <p className="text-xs text-neutral-500 mt-1">Minimum: $100</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Interest Rate (% p.a.)
                    </label>
                    <input
                      type="number"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      min="0.1"
                      max="15"
                      step="0.1"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Term (Months)
                    </label>
                    <select
                      value={formData.termMonths}
                      onChange={(e) => setFormData({ ...formData, termMonths: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      required
                    >
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                      <option value="24">24 Months</option>
                      <option value="36">36 Months</option>
                      <option value="60">60 Months</option>
                    </select>
                  </div>
                </div>

                {formData.principalAmount && (
                  <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-primary-900 mb-2">Maturity Summary</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Principal Amount:</span>
                        <span className="font-medium text-neutral-900">{formatCurrency(parseFloat(formData.principalAmount))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-600">Interest Earned:</span>
                        <span className="font-medium text-green-600">
                          +{formatCurrency(calculateMaturityAmount() - parseFloat(formData.principalAmount))}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-primary-200">
                        <span className="font-medium text-neutral-900">Maturity Amount:</span>
                        <span className="font-bold text-primary-600 text-lg">{formatCurrency(calculateMaturityAmount())}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRenew"
                    checked={formData.autoRenew}
                    onChange={(e) => setFormData({ ...formData, autoRenew: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="autoRenew" className="text-sm text-neutral-700">
                    Auto-renew at maturity
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Create Fixed Deposit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Deposit Details Modal */}
        {selectedDeposit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-neutral-900">Fixed Deposit Details</h2>
                  <button
                    onClick={() => setSelectedDeposit(null)}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-500">Deposit Number</label>
                    <p className="text-neutral-900 font-medium">{selectedDeposit.depositNumber}</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedDeposit.status)}</div>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Account Number</label>
                    <p className="text-neutral-900 font-medium">{selectedDeposit.account.accountNumber}</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Account Type</label>
                    <p className="text-neutral-900 font-medium">{selectedDeposit.account.accountType}</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Principal Amount</label>
                    <p className="text-neutral-900 font-medium text-lg">{formatCurrency(selectedDeposit.principalAmount)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Interest Rate</label>
                    <p className="text-green-600 font-medium text-lg">{selectedDeposit.interestRate}% p.a.</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Term</label>
                    <p className="text-neutral-900 font-medium">{selectedDeposit.termMonths} months</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Maturity Amount</label>
                    <p className="text-neutral-900 font-medium text-lg">{formatCurrency(selectedDeposit.maturityAmount)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Created Date</label>
                    <p className="text-neutral-900 font-medium">{formatDate(selectedDeposit.createdAt)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500">Maturity Date</label>
                    <p className="text-neutral-900 font-medium">{formatDate(selectedDeposit.maturityDate)}</p>
                  </div>
                  {selectedDeposit.withdrawnAt && (
                    <>
                      <div>
                        <label className="text-xs text-neutral-500">Withdrawn Amount</label>
                        <p className="text-neutral-900 font-medium">{formatCurrency(selectedDeposit.withdrawnAmount)}</p>
                      </div>
                      <div>
                        <label className="text-xs text-neutral-500">Withdrawn Date</label>
                        <p className="text-neutral-900 font-medium">{formatDate(selectedDeposit.withdrawnAt)}</p>
                      </div>
                    </>
                  )}
                </div>

                {selectedDeposit.status === 'ACTIVE' && (
                  <div className="pt-4 border-t border-neutral-200">
                    <button
                      onClick={() => {
                        setSelectedDeposit(null);
                        openWithdrawModal(selectedDeposit);
                      }}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      Request Withdrawal
                    </button>
                    <p className="text-xs text-neutral-500 mt-2 text-center">
                      Withdrawal requires backup code verification. Processing takes minimum 3 weeks.
                    </p>
                  </div>
                )}
                {selectedDeposit.status === 'WITHDRAWAL_PENDING' && (
                  <div className="pt-4 border-t border-neutral-200">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                      <p className="text-yellow-800 font-medium">Withdrawal Request Pending</p>
                      <p className="text-xs text-yellow-600 mt-1">
                        Your withdrawal request is being processed. This takes a minimum of 3 weeks.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Request Modal */}
        {showWithdrawModal && withdrawDeposit && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-neutral-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-neutral-900">Request Withdrawal</h2>
                  <button
                    onClick={() => {
                      setShowWithdrawModal(false);
                      setWithdrawDeposit(null);
                    }}
                    className="text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleWithdrawRequest} className="p-6 space-y-6">
                {/* Warning Banner */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">Important Notice</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        Withdrawal processing takes a <strong>minimum of 3 weeks</strong>. 
                        Early withdrawal will only return the principal amount without interest.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Deposit Summary */}
                <div className="bg-neutral-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Deposit Number:</span>
                    <span className="font-medium">{withdrawDeposit.depositNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Principal Amount:</span>
                    <span className="font-medium">{formatCurrency(withdrawDeposit.principalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Maturity Amount:</span>
                    <span className="font-medium text-green-600">{formatCurrency(withdrawDeposit.maturityAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Maturity Date:</span>
                    <span className="font-medium">{formatDate(withdrawDeposit.maturityDate)}</span>
                  </div>
                </div>

                {/* Backup Code Input */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Backup Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter your backup code"
                    required
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Enter one of your backup codes to verify this withdrawal request
                  </p>
                </div>

                {/* Reason (Optional) */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Reason for Withdrawal (Optional)
                  </label>
                  <textarea
                    value={withdrawReason}
                    onChange={(e) => setWithdrawReason(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Why are you withdrawing early?"
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWithdrawModal(false);
                      setWithdrawDeposit(null);
                    }}
                    className="flex-1 px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                    disabled={withdrawing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    disabled={withdrawing}
                  >
                    {withdrawing ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default FixedDepositsPage;
