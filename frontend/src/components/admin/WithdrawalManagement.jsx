import React, { useState, useEffect } from 'react';
import {
  ArrowUpFromLine,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  X,
  Loader2,
  AlertCircle,
  User,
  Wallet,
  Calendar,
  DollarSign,
  Building2,
  RefreshCw
} from 'lucide-react';
import apiClient from '../../lib/apiClient';

const WithdrawalManagement = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, [statusFilter]);

  const fetchWithdrawals = async () => {
    try {
      setIsLoading(true);
      const params = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';
      const response = await apiClient.get(`/mybanker/withdrawals${params}`);
      setWithdrawals(response.withdrawals || []);
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
      setError('Failed to load withdrawals');
    }
    setIsLoading(false);
  };

  const handleApprove = async (withdrawal) => {
    if (!confirm(`Approve withdrawal of $${parseFloat(withdrawal.amount).toLocaleString()} for ${withdrawal.user?.firstName} ${withdrawal.user?.lastName}?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      await apiClient.post(`/mybanker/withdrawals/${withdrawal.id}/approve`, {
        notes: 'Approved by admin'
      });
      setSuccess('Withdrawal approved successfully');
      fetchWithdrawals();
      setShowDetailsModal(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to approve withdrawal');
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      await apiClient.post(`/mybanker/withdrawals/${selectedWithdrawal.id}/reject`, {
        reason: rejectReason
      });
      setSuccess('Withdrawal rejected');
      setShowRejectModal(false);
      setShowDetailsModal(false);
      setRejectReason('');
      fetchWithdrawals();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reject withdrawal');
    }
    setIsProcessing(false);
  };

  const openRejectModal = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowRejectModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle }
    };
    const style = styles[status] || styles.PENDING;
    const Icon = style.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {status}
      </span>
    );
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesSearch = 
      w.user?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.user?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.reference?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Stats
  const pendingCount = withdrawals.filter(w => w.status === 'PENDING').length;
  const completedCount = withdrawals.filter(w => w.status === 'COMPLETED').length;
  const totalPending = withdrawals
    .filter(w => w.status === 'PENDING')
    .reduce((sum, w) => sum + parseFloat(w.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Withdrawal Management</h2>
          <p className="text-slate-400 text-sm">Review and process withdrawal requests</p>
        </div>
        <button
          onClick={fetchWithdrawals}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <ArrowUpFromLine className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Requests</p>
              <p className="text-2xl font-bold text-white">{withdrawals.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pending</p>
              <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Completed</p>
              <p className="text-2xl font-bold text-green-400">{completedCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Pending Amount</p>
              <p className="text-2xl font-bold text-blue-400">${totalPending.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Gateway</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Reference</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <ArrowUpFromLine className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-400">No withdrawal requests found</p>
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                          {withdrawal.user?.firstName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {withdrawal.user?.firstName} {withdrawal.user?.lastName}
                          </p>
                          <p className="text-sm text-slate-400">{withdrawal.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-lg font-bold text-white">
                        ${parseFloat(withdrawal.amount).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300">{withdrawal.gateway?.name || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded">
                        {withdrawal.reference}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-300">
                        {new Date(withdrawal.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(withdrawal.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setSelectedWithdrawal(withdrawal); setShowDetailsModal(true); }}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-600 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {withdrawal.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(withdrawal)}
                              className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRejectModal(withdrawal)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-lg border border-slate-700 shadow-2xl">
            <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Withdrawal Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Amount */}
              <div className="text-center pb-4 border-b border-slate-700">
                <p className="text-4xl font-bold text-white mb-2">
                  ${parseFloat(selectedWithdrawal.amount).toLocaleString()}
                </p>
                {getStatusBadge(selectedWithdrawal.status)}
              </div>
              
              {/* Details */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400 flex items-center gap-2">
                    <User className="w-4 h-4" /> User
                  </span>
                  <span className="text-white font-medium">
                    {selectedWithdrawal.user?.firstName} {selectedWithdrawal.user?.lastName}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Wallet className="w-4 h-4" /> Account
                  </span>
                  <span className="text-white font-medium">
                    {selectedWithdrawal.account?.accountNumber || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Gateway
                  </span>
                  <span className="text-white font-medium">
                    {selectedWithdrawal.gateway?.name || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Date
                  </span>
                  <span className="text-white font-medium">
                    {new Date(selectedWithdrawal.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-slate-400">Reference</span>
                  <code className="text-purple-400 text-sm">{selectedWithdrawal.reference}</code>
                </div>
                {selectedWithdrawal.description && (
                  <div className="pt-2 border-t border-slate-700">
                    <span className="text-slate-400 text-sm">Description</span>
                    <p className="text-white mt-1">{selectedWithdrawal.description}</p>
                  </div>
                )}
                {selectedWithdrawal.rejectionReason && (
                  <div className="pt-2 border-t border-slate-700">
                    <span className="text-red-400 text-sm">Rejection Reason</span>
                    <p className="text-white mt-1">{selectedWithdrawal.rejectionReason}</p>
                  </div>
                )}
              </div>
              
              {/* Actions */}
              {selectedWithdrawal.status === 'PENDING' && (
                <div className="flex gap-3 pt-4 border-t border-slate-700">
                  <button
                    onClick={() => openRejectModal(selectedWithdrawal)}
                    className="flex-1 px-4 py-3 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-xl font-medium transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(selectedWithdrawal)}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
            <div className="border-b border-slate-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Reject Withdrawal</h3>
              <button
                onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm">
                  You are about to reject a withdrawal of <strong>${parseFloat(selectedWithdrawal.amount).toLocaleString()}</strong> for {selectedWithdrawal.user?.firstName} {selectedWithdrawal.user?.lastName}.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Rejection Reason *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="Enter reason for rejection..."
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowRejectModal(false); setRejectReason(''); }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={isProcessing || !rejectReason.trim()}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WithdrawalManagement;
