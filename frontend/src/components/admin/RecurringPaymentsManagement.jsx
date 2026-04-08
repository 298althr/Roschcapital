import React, { useState, useEffect } from 'react';
import {
  Repeat,
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Filter,
  Save
} from 'lucide-react';
import apiClient from '../../lib/apiClient';

const RecurringPaymentsManagement = () => {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editForm, setEditForm] = useState({
    amount: '',
    status: '',
    frequency: '',
    nextExecutionDate: ''
  });

  useEffect(() => {
    fetchPayments();
  }, [filterStatus]);

  const fetchPayments = async () => {
    try {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await apiClient.get(`/recurring-payments/admin/all${params}`);
      setPayments(response.payments || []);
    } catch (err) {
      console.error('Failed to fetch payments:', err);
      setError('Failed to load recurring payments');
    }
    setIsLoading(false);
  };

  const handleUpdate = async (paymentId) => {
    setIsSubmitting(true);
    try {
      await apiClient.put(`/recurring-payments/admin/${paymentId}`, editForm);
      setSuccess('Payment updated successfully!');
      setShowEditModal(null);
      fetchPayments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update payment');
      setTimeout(() => setError(''), 3000);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (paymentId) => {
    if (!confirm('Are you sure you want to delete this recurring payment?')) return;
    
    try {
      await apiClient.delete(`/recurring-payments/admin/${paymentId}`);
      setSuccess('Payment deleted');
      fetchPayments();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete payment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openEditModal = (payment) => {
    setEditForm({
      amount: payment.amount,
      status: payment.status,
      frequency: payment.frequency,
      nextExecutionDate: payment.nextExecutionDate ? payment.nextExecutionDate.split('T')[0] : ''
    });
    setShowEditModal(payment);
  };

  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE: 'bg-green-500/10 text-green-400 border-green-500/20',
      PAUSED: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      CANCELLED: 'bg-red-500/10 text-red-400 border-red-500/20',
      COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    };
    return styles[status] || 'bg-slate-500/10 text-slate-400';
  };

  const getFrequencyLabel = (freq) => {
    const labels = {
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      BIWEEKLY: 'Bi-weekly',
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      YEARLY: 'Yearly'
    };
    return labels[freq] || freq;
  };

  const filteredPayments = payments.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    return (
      p.recipientName?.toLowerCase().includes(searchLower) ||
      p.user?.email?.toLowerCase().includes(searchLower) ||
      p.reference?.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const activeCount = payments.filter(p => p.status === 'ACTIVE').length;
  const pausedCount = payments.filter(p => p.status === 'PAUSED').length;
  const totalMonthly = payments
    .filter(p => p.status === 'ACTIVE')
    .reduce((sum, p) => {
      const amount = parseFloat(p.amount);
      switch (p.frequency) {
        case 'DAILY': return sum + (amount * 30);
        case 'WEEKLY': return sum + (amount * 4);
        case 'BIWEEKLY': return sum + (amount * 2);
        case 'MONTHLY': return sum + amount;
        case 'QUARTERLY': return sum + (amount / 3);
        case 'YEARLY': return sum + (amount / 12);
        default: return sum + amount;
      }
    }, 0);

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
          <h2 className="text-2xl font-bold text-white">Recurring Payments</h2>
          <p className="text-slate-400 text-sm">Manage all standing orders and recurring payments</p>
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
          <div className="text-slate-400 text-sm">Total Payments</div>
          <div className="text-2xl font-bold text-white mt-1">{payments.length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Active</div>
          <div className="text-2xl font-bold text-green-400 mt-1">{activeCount}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Paused</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pausedCount}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Est. Monthly Volume</div>
          <div className="text-2xl font-bold text-indigo-400 mt-1">${totalMonthly.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by recipient, user, or reference..."
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
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Recipient</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Frequency</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Next Run</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center text-slate-400">
                    No recurring payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-white text-sm">{payment.user?.firstName} {payment.user?.lastName}</div>
                      <div className="text-slate-400 text-xs">{payment.user?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white text-sm">{payment.recipientName}</div>
                      <div className="text-slate-400 text-xs">{payment.recipientBank || 'Internal'}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-white font-medium">${parseFloat(payment.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-slate-300 text-sm">{getFrequencyLabel(payment.frequency)}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-sm">
                        {payment.nextExecutionDate ? new Date(payment.nextExecutionDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="p-1.5 hover:bg-slate-600 text-slate-400 hover:text-white rounded transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(payment)}
                          className="p-1.5 hover:bg-slate-600 text-slate-400 hover:text-white rounded transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(payment.id)}
                          className="p-1.5 hover:bg-slate-600 text-red-400 hover:text-red-300 rounded transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Payment Details</h3>
              <button onClick={() => setSelectedPayment(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Reference</span>
                <span className="font-mono text-indigo-400">{selectedPayment.reference}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(selectedPayment.status)}`}>
                  {selectedPayment.status}
                </span>
              </div>
              <hr className="border-slate-700" />
              <div>
                <div className="text-sm text-slate-400 mb-1">User</div>
                <div className="text-white">{selectedPayment.user?.firstName} {selectedPayment.user?.lastName}</div>
                <div className="text-sm text-slate-400">{selectedPayment.user?.email}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">Recipient</div>
                <div className="text-white">{selectedPayment.recipientName}</div>
                {selectedPayment.recipientBank && (
                  <div className="text-sm text-slate-400">{selectedPayment.recipientBank}</div>
                )}
              </div>
              <hr className="border-slate-700" />
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Amount</span>
                <span className="text-xl font-bold text-white">${parseFloat(selectedPayment.amount).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Frequency</span>
                <span className="text-white">{getFrequencyLabel(selectedPayment.frequency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Executions</span>
                <span className="text-white">{selectedPayment.executionCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Failed Count</span>
                <span className={selectedPayment.failedCount > 0 ? 'text-red-400' : 'text-white'}>
                  {selectedPayment.failedCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Created</span>
                <span className="text-slate-300">{new Date(selectedPayment.createdAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Edit Payment (God Mode)</h3>
              <button onClick={() => setShowEditModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Frequency</label>
                <select
                  value={editForm.frequency}
                  onChange={(e) => setEditForm({...editForm, frequency: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="BIWEEKLY">Bi-weekly</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Next Execution Date</label>
                <input
                  type="date"
                  value={editForm.nextExecutionDate}
                  onChange={(e) => setEditForm({...editForm, nextExecutionDate: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowEditModal(null)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleUpdate(showEditModal.id)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecurringPaymentsManagement;
