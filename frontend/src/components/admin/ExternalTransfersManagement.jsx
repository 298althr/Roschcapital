import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  X,
  Eye,
  RotateCcw,
  Filter,
  DollarSign,
  Building2,
  User
} from 'lucide-react';
import apiClient from '../../lib/apiClient';

const ExternalTransfersManagement = () => {
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(null);
  const [showDeclineModal, setShowDeclineModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [declineReason, setDeclineReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchTransfers();
  }, [filterStatus]);

  const fetchTransfers = async () => {
    try {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await apiClient.get(`/transfers/admin/all${params}`);
      setTransfers(response.transfers || []);
    } catch (err) {
      console.error('Failed to fetch transfers:', err);
      setError('Failed to load transfers');
    }
    setIsLoading(false);
  };

  const handleApprove = async (transferId) => {
    setIsSubmitting(true);
    try {
      await apiClient.post(`/transfers/admin/${transferId}/approve`, { notes: adminNotes });
      setSuccess('Transfer approved successfully!');
      setShowApproveModal(null);
      setAdminNotes('');
      fetchTransfers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to approve transfer');
      setTimeout(() => setError(''), 3000);
    }
    setIsSubmitting(false);
  };

  const handleDecline = async (transferId) => {
    setIsSubmitting(true);
    try {
      await apiClient.post(`/transfers/admin/${transferId}/decline`, { 
        reason: declineReason,
        notes: adminNotes 
      });
      setSuccess('Transfer declined');
      setShowDeclineModal(null);
      setDeclineReason('');
      setAdminNotes('');
      fetchTransfers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to decline transfer');
      setTimeout(() => setError(''), 3000);
    }
    setIsSubmitting(false);
  };

  const handleReverse = async (transferId) => {
    if (!confirm('Are you sure you want to reverse this transfer? This will refund the amount to the sender.')) return;
    
    setIsSubmitting(true);
    try {
      await apiClient.post(`/transfers/admin/${transferId}/reverse`);
      setSuccess('Transfer reversed successfully');
      fetchTransfers();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to reverse transfer');
      setTimeout(() => setError(''), 3000);
    }
    setIsSubmitting(false);
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      APPROVED: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/20',
      DECLINED: 'bg-red-500/10 text-red-400 border-red-500/20',
      REVERSED: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    };
    return styles[status] || 'bg-slate-500/10 text-slate-400';
  };

  const filteredTransfers = transfers.filter(t => {
    const searchLower = searchTerm.toLowerCase();
    return (
      t.accountName?.toLowerCase().includes(searchLower) ||
      t.destinationBank?.toLowerCase().includes(searchLower) ||
      t.reference?.toLowerCase().includes(searchLower) ||
      t.user?.email?.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const pendingCount = transfers.filter(t => t.status === 'PENDING').length;
  const approvedCount = transfers.filter(t => t.status === 'APPROVED' || t.status === 'COMPLETED').length;
  const totalAmount = transfers.filter(t => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">External Transfers</h2>
          <p className="text-slate-400 text-sm">Review and approve external bank transfers</p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <p className="text-red-400">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-400">{success}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Total Transfers</div>
          <div className="text-2xl font-bold text-white mt-1">{transfers.length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Pending Review</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Approved</div>
          <div className="text-2xl font-bold text-green-400 mt-1">{approvedCount}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Total Processed</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">${totalAmount.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by recipient, bank, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="COMPLETED">Completed</option>
            <option value="DECLINED">Declined</option>
            <option value="REVERSED">Reversed</option>
          </select>
        </div>
      </div>

      {/* Transfers Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Reference</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Sender</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Recipient</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredTransfers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-400">
                    No transfers found
                  </td>
                </tr>
              ) : (
                filteredTransfers.map((transfer) => (
                  <tr key={transfer.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-indigo-400">{transfer.reference}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white text-sm">{transfer.user?.firstName} {transfer.user?.lastName}</div>
                      <div className="text-slate-400 text-xs">{transfer.user?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white text-sm">{transfer.accountName}</div>
                      <div className="text-slate-400 text-xs">{transfer.destinationBank}</div>
                      <div className="text-slate-500 text-xs">****{transfer.accountNumber?.slice(-4)}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-white font-medium">${parseFloat(transfer.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(transfer.status)}`}>
                        {transfer.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-sm">{new Date(transfer.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedTransfer(transfer)}
                          className="p-1.5 hover:bg-slate-600 text-slate-400 hover:text-white rounded transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {transfer.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => setShowApproveModal(transfer)}
                              className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowDeclineModal(transfer)}
                              className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition"
                              title="Decline"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {(transfer.status === 'APPROVED' || transfer.status === 'COMPLETED') && (
                          <button
                            onClick={() => handleReverse(transfer.id)}
                            className="p-1.5 hover:bg-slate-600 text-amber-400 hover:text-amber-300 rounded transition"
                            title="Reverse"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
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

      {/* View Details Modal */}
      {selectedTransfer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Transfer Details</h3>
              <button onClick={() => setSelectedTransfer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Reference</span>
                <span className="font-mono text-indigo-400">{selectedTransfer.reference}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(selectedTransfer.status)}`}>
                  {selectedTransfer.status}
                </span>
              </div>
              <hr className="border-slate-700" />
              <div>
                <div className="text-sm text-slate-400 mb-1">Sender</div>
                <div className="text-white">{selectedTransfer.user?.firstName} {selectedTransfer.user?.lastName}</div>
                <div className="text-sm text-slate-400">{selectedTransfer.user?.email}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Recipient</div>
                <div className="text-white">{selectedTransfer.accountName}</div>
                <div className="text-sm text-slate-400">{selectedTransfer.destinationBank}</div>
                <div className="text-sm text-slate-500">Account: {selectedTransfer.accountNumber}</div>
                <div className="text-sm text-slate-500">Routing: {selectedTransfer.routingNumber}</div>
              </div>
              <hr className="border-slate-700" />
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Amount</span>
                <span className="text-2xl font-bold text-white">${parseFloat(selectedTransfer.amount).toLocaleString()}</span>
              </div>
              {selectedTransfer.description && (
                <div>
                  <div className="text-sm text-slate-400 mb-1">Description</div>
                  <div className="text-white">{selectedTransfer.description}</div>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Created</span>
                <span className="text-slate-300">{new Date(selectedTransfer.createdAt).toLocaleString()}</span>
              </div>
              {selectedTransfer.processedAt && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Processed</span>
                  <span className="text-slate-300">{new Date(selectedTransfer.processedAt).toLocaleString()}</span>
                </div>
              )}
              {selectedTransfer.adminNotes && (
                <div>
                  <div className="text-sm text-slate-400 mb-1">Admin Notes</div>
                  <div className="text-slate-300 text-sm bg-slate-900 p-3 rounded-lg">{selectedTransfer.adminNotes}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Approve Transfer</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Amount</div>
                <div className="text-2xl font-bold text-white">${parseFloat(showApproveModal.amount).toLocaleString()}</div>
                <div className="text-slate-400 text-sm mt-2">To: {showApproveModal.accountName}</div>
                <div className="text-slate-500 text-xs">{showApproveModal.destinationBank}</div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Admin Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add any notes..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowApproveModal(null); setAdminNotes(''); }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApprove(showApproveModal.id)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Approve Transfer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Decline Transfer</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Amount</div>
                <div className="text-2xl font-bold text-white">${parseFloat(showDeclineModal.amount).toLocaleString()}</div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Reason for Decline *</label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Enter reason for declining..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowDeclineModal(null); setDeclineReason(''); }}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDecline(showDeclineModal.id)}
                  disabled={isSubmitting || !declineReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Processing...' : 'Decline Transfer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExternalTransfersManagement;
