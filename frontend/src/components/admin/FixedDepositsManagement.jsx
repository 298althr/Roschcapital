import React, { useState, useEffect } from 'react';
import { Search, PiggyBank, TrendingUp, Calendar, DollarSign, User, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const FixedDepositsManagement = () => {
  const [deposits, setDeposits] = useState([]);
  const [filteredDeposits, setFilteredDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedDeposit, setSelectedDeposit] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchDeposits();
    fetchStats();
  }, []);

  useEffect(() => {
    filterDeposits();
  }, [deposits, searchTerm, statusFilter]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/mybanker/fixed-deposits');
      setDeposits(response.data || []);
    } catch (error) {
      console.error('Failed to fetch fixed deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/mybanker/fixed-deposits/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const filterDeposits = () => {
    let filtered = deposits;

    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.depositNumber.toLowerCase().includes(term) ||
        d.user.email.toLowerCase().includes(term) ||
        `${d.user.firstName} ${d.user.lastName}`.toLowerCase().includes(term)
      );
    }

    setFilteredDeposits(filtered);
  };

  const handleWithdraw = async (depositId) => {
    if (!confirm('Are you sure you want to process this withdrawal?')) return;

    try {
      await apiClient.post(`/mybanker/fixed-deposits/${depositId}/withdraw`);
      alert('Fixed deposit withdrawn successfully');
      fetchDeposits();
      fetchStats();
      setSelectedDeposit(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to withdraw fixed deposit');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      ACTIVE: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      WITHDRAWAL_PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: AlertCircle },
      MATURED: { bg: 'bg-blue-100', text: 'text-blue-800', icon: TrendingUp },
      WITHDRAWN: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', icon: AlertCircle }
    };
    const badge = badges[status] || badges.ACTIVE;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    );
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Active Deposits</h3>
              <PiggyBank className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{stats.activeDeposits}</p>
            <p className="text-xs opacity-75 mt-1">{formatCurrency(stats.totalInvested)} invested</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Expected Returns</h3>
              <TrendingUp className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{formatCurrency(stats.expectedReturns)}</p>
            <p className="text-xs opacity-75 mt-1">From active deposits</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Deposits</h3>
              <DollarSign className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{stats.totalDeposits}</p>
            <p className="text-xs opacity-75 mt-1">All time</p>
          </div>

          <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Withdrawn</h3>
              <CheckCircle className="w-5 h-5 opacity-80" />
            </div>
            <p className="text-3xl font-bold">{stats.withdrawnDeposits}</p>
            <p className="text-xs opacity-75 mt-1">Completed</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-slate-800 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by deposit number, email, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="WITHDRAWAL_PENDING">Withdrawal Pending</option>
            <option value="MATURED">Matured</option>
            <option value="WITHDRAWN">Withdrawn</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Deposits Table */}
      <div className="bg-slate-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Deposit Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Principal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Interest Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Maturity Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Maturity Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                    No fixed deposits found
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((deposit) => {
                  const daysRemaining = calculateDaysRemaining(deposit.maturityDate);
                  const isMatured = daysRemaining <= 0;
                  
                  return (
                    <tr key={deposit.id} className="hover:bg-slate-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <PiggyBank className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm font-medium text-white">{deposit.depositNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {deposit.user.firstName} {deposit.user.lastName}
                          </div>
                          <div className="text-xs text-slate-400">{deposit.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        {formatCurrency(deposit.principalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-400 font-medium">
                        {deposit.interestRate}% p.a.
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                        {formatCurrency(deposit.maturityAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{formatDate(deposit.maturityDate)}</div>
                        {deposit.status === 'ACTIVE' && (
                          <div className={`text-xs ${isMatured ? 'text-green-400' : 'text-slate-400'}`}>
                            {isMatured ? 'Matured' : `${daysRemaining} days remaining`}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(deposit.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedDeposit(deposit)}
                            className="text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            View
                          </button>
                          {deposit.status === 'WITHDRAWAL_PENDING' && (
                            <button
                              onClick={() => handleWithdraw(deposit.id)}
                              className="text-green-400 hover:text-green-300 font-medium"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Details Modal */}
      {selectedDeposit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Fixed Deposit Details</h2>
                <button
                  onClick={() => setSelectedDeposit(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Deposit Number</label>
                  <p className="text-white font-medium">{selectedDeposit.depositNumber}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedDeposit.status)}</div>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Customer Name</label>
                  <p className="text-white font-medium">
                    {selectedDeposit.user.firstName} {selectedDeposit.user.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Email</label>
                  <p className="text-white font-medium">{selectedDeposit.user.email}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Account Number</label>
                  <p className="text-white font-medium">{selectedDeposit.account.accountNumber}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Account Type</label>
                  <p className="text-white font-medium">{selectedDeposit.account.accountType}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Principal Amount</label>
                  <p className="text-white font-medium text-lg">{formatCurrency(selectedDeposit.principalAmount)}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Interest Rate</label>
                  <p className="text-green-400 font-medium text-lg">{selectedDeposit.interestRate}% p.a.</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Term</label>
                  <p className="text-white font-medium">{selectedDeposit.termMonths} months</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Maturity Amount</label>
                  <p className="text-white font-medium text-lg">{formatCurrency(selectedDeposit.maturityAmount)}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Created Date</label>
                  <p className="text-white font-medium">{formatDate(selectedDeposit.createdAt)}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Maturity Date</label>
                  <p className="text-white font-medium">{formatDate(selectedDeposit.maturityDate)}</p>
                </div>
                {selectedDeposit.withdrawnAt && (
                  <>
                    <div>
                      <label className="text-xs text-slate-400">Withdrawn Amount</label>
                      <p className="text-white font-medium">{formatCurrency(selectedDeposit.withdrawnAmount)}</p>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400">Withdrawn Date</label>
                      <p className="text-white font-medium">{formatDate(selectedDeposit.withdrawnAt)}</p>
                    </div>
                  </>
                )}
              </div>

              {selectedDeposit.status === 'WITHDRAWAL_PENDING' && (
                <div className="pt-4 border-t border-slate-700 space-y-4">
                  <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4">
                    <p className="text-yellow-400 font-medium text-sm">Withdrawal Request Pending</p>
                    <p className="text-yellow-300/70 text-xs mt-1">
                      Requested: {selectedDeposit.withdrawalRequestedAt ? formatDate(selectedDeposit.withdrawalRequestedAt) : 'N/A'}
                    </p>
                    {selectedDeposit.withdrawalReason && (
                      <p className="text-slate-300 text-xs mt-2">
                        Reason: {selectedDeposit.withdrawalReason}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleWithdraw(selectedDeposit.id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Approve Withdrawal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FixedDepositsManagement;
