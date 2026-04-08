import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  Search, 
  Filter,
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  Calendar,
  Percent,
  User,
  Edit,
  Trash2,
  Eye,
  X,
  Save,
  Plus,
  AlertCircle
} from 'lucide-react';
import apiClient from '../../lib/apiClient';

const LoansManagement = () => {
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(null);
  const [showDeclineModal, setShowDeclineModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Realistic interest rates
  const defaultRates = {
    PERSONAL: 12.5,
    BUSINESS: 9.5,
    MORTGAGE: 6.5,
    AUTO: 8.0
  };

  const [approveForm, setApproveForm] = useState({
    interestRate: '',
    termMonths: ''
  });

  const [declineReason, setDeclineReason] = useState('');

  const [editForm, setEditForm] = useState({
    amount: '',
    interestRate: '',
    termMonths: '',
    status: '',
    purpose: ''
  });

  const [createForm, setCreateForm] = useState({
    userId: '',
    loanType: 'PERSONAL',
    amount: '',
    interestRate: '12.5',
    termMonths: 12,
    purpose: '',
    status: 'APPROVED'
  });

  useEffect(() => {
    fetchLoans();
    fetchUsers();
  }, [filterStatus]);

  const fetchLoans = async () => {
    try {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await apiClient.get(`/loans/admin/all${params}`);
      setLoans(response.loans || []);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
      setError('Failed to load loans');
    }
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/mybanker/users');
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleCreateLoan = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await apiClient.post('/mybanker/loans', createForm);
      setSuccess('Loan created successfully!');
      setShowCreateModal(false);
      setCreateForm({
        userId: '',
        loanType: 'PERSONAL',
        amount: '',
        interestRate: '12.5',
        termMonths: 12,
        purpose: '',
        status: 'APPROVED'
      });
      fetchLoans();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to create loan');
    }
    setIsSubmitting(false);
  };

  const calculateMonthlyPayment = (amount, rate, months) => {
    if (!amount || !rate || !months) return 0;
    const monthlyRate = rate / 100 / 12;
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
    const denominator = Math.pow(1 + monthlyRate, months) - 1;
    return (amount * numerator) / denominator;
  };

  const handleApprove = async (loanId) => {
    setIsSubmitting(true);
    try {
      await apiClient.post(`/loans/admin/${loanId}/approve`, approveForm);
      setSuccess('Loan approved successfully!');
      setShowApproveModal(null);
      setApproveForm({ interestRate: '', termMonths: '' });
      fetchLoans();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to approve loan');
      setTimeout(() => setError(''), 3000);
    }
    setIsSubmitting(false);
  };

  const handleDecline = async (loanId) => {
    setIsSubmitting(true);
    try {
      await apiClient.post(`/loans/admin/${loanId}/decline`, { reason: declineReason });
      setSuccess('Loan declined');
      setShowDeclineModal(null);
      setDeclineReason('');
      fetchLoans();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to decline loan');
      setTimeout(() => setError(''), 3000);
    }
    setIsSubmitting(false);
  };

  const handleEdit = async (loanId) => {
    setIsSubmitting(true);
    try {
      await apiClient.put(`/mybanker/loans/${loanId}`, editForm);
      setSuccess('Loan updated successfully!');
      setShowEditModal(null);
      fetchLoans();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to update loan');
      setTimeout(() => setError(''), 3000);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (loanId) => {
    if (!confirm('Are you sure you want to delete this loan?')) return;
    try {
      await apiClient.delete(`/mybanker/loans/${loanId}`);
      setSuccess('Loan deleted');
      fetchLoans();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to delete loan');
      setTimeout(() => setError(''), 3000);
    }
  };

  const openEditModal = (loan) => {
    setEditForm({
      amount: loan.amount,
      interestRate: loan.interestRate,
      termMonths: loan.termMonths,
      status: loan.status,
      purpose: loan.purpose || ''
    });
    setShowEditModal(loan);
  };

  const openApproveModal = (loan) => {
    setApproveForm({
      interestRate: loan.interestRate,
      termMonths: loan.termMonths
    });
    setShowApproveModal(loan);
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      APPROVED: 'bg-green-500/10 text-green-400 border-green-500/20',
      ACTIVE: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      PAID: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      DECLINED: 'bg-red-500/10 text-red-400 border-red-500/20',
      DEFAULTED: 'bg-red-500/10 text-red-400 border-red-500/20'
    };
    return styles[status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  const filteredLoans = loans.filter(loan => {
    const searchLower = searchTerm.toLowerCase();
    return (
      loan.user?.email?.toLowerCase().includes(searchLower) ||
      loan.user?.firstName?.toLowerCase().includes(searchLower) ||
      loan.user?.lastName?.toLowerCase().includes(searchLower) ||
      loan.loanType?.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const pendingCount = loans.filter(l => l.status === 'PENDING').length;
  const activeCount = loans.filter(l => l.status === 'ACTIVE' || l.status === 'APPROVED').length;
  const totalAmount = loans.filter(l => l.status === 'ACTIVE' || l.status === 'APPROVED')
    .reduce((sum, l) => sum + parseFloat(l.amount || 0), 0);

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
          <h2 className="text-2xl font-bold text-white">Loans Management</h2>
          <p className="text-slate-400 text-sm">Review and manage all loan applications</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-medium"
        >
          <Plus className="w-5 h-5" />
          Create Loan for User
        </button>
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
          <div className="text-slate-400 text-sm">Total Loans</div>
          <div className="text-2xl font-bold text-white mt-1">{loans.length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Pending Review</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Active Loans</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{activeCount}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Total Disbursed</div>
          <div className="text-2xl font-bold text-green-400 mt-1">${totalAmount.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by user or loan type..."
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
            <option value="ACTIVE">Active</option>
            <option value="PAID">Paid</option>
            <option value="DECLINED">Declined</option>
            <option value="DEFAULTED">Defaulted</option>
          </select>
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Term</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Applied</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-slate-400">
                    No loans found
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{loan.user?.firstName} {loan.user?.lastName}</div>
                      <div className="text-slate-400 text-sm">{loan.user?.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white">{loan.loanType}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-white font-medium">${parseFloat(loan.amount).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-slate-300">{parseFloat(loan.interestRate)}%</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-slate-300">{loan.termMonths}mo</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(loan.status)}`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-slate-400 text-sm">{new Date(loan.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {loan.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => openApproveModal(loan)}
                              className="p-1.5 bg-green-600 hover:bg-green-700 text-white rounded transition"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setShowDeclineModal(loan)}
                              className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded transition"
                              title="Decline"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => openEditModal(loan)}
                          className="p-1.5 hover:bg-slate-600 text-slate-400 hover:text-white rounded transition"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(loan.id)}
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

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Approve Loan</h3>
                <button onClick={() => setShowApproveModal(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Applicant</div>
                <div className="text-white font-medium">{showApproveModal.user?.firstName} {showApproveModal.user?.lastName}</div>
                <div className="text-slate-400 text-sm mt-2">Requested Amount</div>
                <div className="text-white font-medium">${parseFloat(showApproveModal.amount).toLocaleString()}</div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Interest Rate (% APR)</label>
                <input
                  type="number"
                  step="0.1"
                  value={approveForm.interestRate}
                  onChange={(e) => setApproveForm({...approveForm, interestRate: e.target.value})}
                  placeholder={`Default: ${showApproveModal.interestRate}%`}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Term (Months)</label>
                <input
                  type="number"
                  value={approveForm.termMonths}
                  onChange={(e) => setApproveForm({...approveForm, termMonths: e.target.value})}
                  placeholder={`Default: ${showApproveModal.termMonths} months`}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowApproveModal(null)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleApprove(showApproveModal.id)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Approving...' : 'Approve Loan'}
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
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Decline Loan</h3>
                <button onClick={() => setShowDeclineModal(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="text-slate-400 text-sm">Applicant</div>
                <div className="text-white font-medium">{showDeclineModal.user?.firstName} {showDeclineModal.user?.lastName}</div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Reason for Decline</label>
                <textarea
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Enter reason for declining this loan..."
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowDeclineModal(null)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDecline(showDeclineModal.id)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Declining...' : 'Decline Loan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Edit Loan (God Mode)</h3>
                <button onClick={() => setShowEditModal(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Amount ($)</label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={editForm.interestRate}
                  onChange={(e) => setEditForm({...editForm, interestRate: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Term (Months)</label>
                <input
                  type="number"
                  value={editForm.termMonths}
                  onChange={(e) => setEditForm({...editForm, termMonths: e.target.value})}
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
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAID">Paid</option>
                  <option value="DECLINED">Declined</option>
                  <option value="DEFAULTED">Defaulted</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Purpose</label>
                <textarea
                  value={editForm.purpose}
                  onChange={(e) => setEditForm({...editForm, purpose: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
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
                  onClick={() => handleEdit(showEditModal.id)}
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

      {/* Create Loan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Create Loan for User</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <form onSubmit={handleCreateLoan} className="p-6 space-y-4">
              {/* Select User */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Select User</label>
                <select
                  value={createForm.userId}
                  onChange={(e) => setCreateForm({...createForm, userId: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  required
                >
                  <option value="">-- Select a user --</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Loan Type */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Loan Type</label>
                <select
                  value={createForm.loanType}
                  onChange={(e) => setCreateForm({
                    ...createForm, 
                    loanType: e.target.value,
                    interestRate: defaultRates[e.target.value]
                  })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="PERSONAL">Personal (12.5% APR)</option>
                  <option value="BUSINESS">Business (9.5% APR)</option>
                  <option value="MORTGAGE">Mortgage (6.5% APR)</option>
                  <option value="AUTO">Auto (8.0% APR)</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Loan Amount ($)</label>
                <input
                  type="number"
                  value={createForm.amount}
                  onChange={(e) => setCreateForm({...createForm, amount: e.target.value})}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  required
                  min="1000"
                />
              </div>

              {/* Interest Rate */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Interest Rate (% APR)</label>
                <input
                  type="number"
                  step="0.1"
                  value={createForm.interestRate}
                  onChange={(e) => setCreateForm({...createForm, interestRate: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  required
                />
              </div>

              {/* Term */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Term (Months)</label>
                <select
                  value={createForm.termMonths}
                  onChange={(e) => setCreateForm({...createForm, termMonths: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value={6}>6 months</option>
                  <option value={12}>12 months</option>
                  <option value={24}>24 months</option>
                  <option value={36}>36 months</option>
                  <option value={48}>48 months</option>
                  <option value={60}>60 months (5 years)</option>
                  <option value={120}>120 months (10 years)</option>
                  <option value={180}>180 months (15 years)</option>
                  <option value={240}>240 months (20 years)</option>
                  <option value={360}>360 months (30 years)</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Initial Status</label>
                <select
                  value={createForm.status}
                  onChange={(e) => setCreateForm({...createForm, status: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="APPROVED">Approved (Credit account immediately)</option>
                  <option value="PENDING">Pending (Requires approval)</option>
                </select>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Purpose (Optional)</label>
                <textarea
                  value={createForm.purpose}
                  onChange={(e) => setCreateForm({...createForm, purpose: e.target.value})}
                  placeholder="Describe the purpose of this loan"
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                />
              </div>

              {/* Estimated Payment Preview */}
              {createForm.amount && parseFloat(createForm.amount) >= 1000 && (
                <div className="bg-indigo-900/20 border border-indigo-800 rounded-lg p-4">
                  <div className="text-indigo-300 text-sm font-medium mb-1">Estimated Monthly Payment</div>
                  <div className="text-2xl font-bold text-white">
                    ${calculateMonthlyPayment(
                      parseFloat(createForm.amount),
                      parseFloat(createForm.interestRate),
                      createForm.termMonths
                    ).toFixed(2)}/month
                  </div>
                  <div className="text-slate-400 text-sm mt-1">
                    Total repayment: ${(calculateMonthlyPayment(
                      parseFloat(createForm.amount),
                      parseFloat(createForm.interestRate),
                      createForm.termMonths
                    ) * createForm.termMonths).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !createForm.userId || !createForm.amount}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {isSubmitting ? 'Creating...' : 'Create Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoansManagement;
