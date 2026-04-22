import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, Search, Filter, Check, X, Clock, AlertCircle } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { BrandFeedbackModal } from '../modals/BrandFeedbackModal';

export const DepositManagement = () => {
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('deposits');
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });
  
  const [newDeposit, setNewDeposit] = useState({
    userEmail: '',
    amount: '',
    method: 'ADMIN_CREDIT',
    description: ''
  });

  useEffect(() => {
    fetchAllPendingTransactions();
  }, [filterStatus, activeTab]);

  const fetchAllPendingTransactions = async () => {
    setIsLoading(true);
    try {
      // Fetch deposits
      const depositsResponse = await apiClient.get(`/mybanker/deposits?status=${filterStatus}`);
      setDeposits(depositsResponse.deposits || []);
      
      // Fetch pending withdrawals (if endpoint exists)
      try {
        const withdrawalsResponse = await apiClient.get(`/mybanker/withdrawals?status=PENDING`);
        setWithdrawals(withdrawalsResponse.withdrawals || []);
      } catch (err) {
        console.log('Withdrawals endpoint not available');
        setWithdrawals([]);
      }
      
      // Fetch pending transfers
      try {
        const transfersResponse = await apiClient.get(`/admin/transfers/pending`);
        setTransfers(transfersResponse.transfers || []);
      } catch (err) {
        console.log('Transfers endpoint not available');
        setTransfers([]);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
    setIsLoading(false);
  };

  const fetchDeposits = fetchAllPendingTransactions;

  const handleCreateDeposit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/mybanker/deposits', newDeposit);
      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: 'Deposit Created',
        message: 'Deposit created successfully!'
      });
      setShowAddModal(false);
      setNewDeposit({ userEmail: '', amount: '', method: 'ADMIN_CREDIT', description: '' });
      fetchDeposits();
    } catch (error) {
      console.error('Failed to create deposit:', error);
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Creation Failed',
        message: error.response?.data?.error || 'Failed to create deposit'
      });
    }
  };

  const handleProcessDeposit = async (depositId) => {
    try {
      await apiClient.post(`/mybanker/deposits/${depositId}/approve`);
      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: 'Deposit Approved',
        message: 'Deposit processed successfully!'
      });
      fetchDeposits();
    } catch (error) {
      console.error('Failed to process deposit:', error);
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Processing Failed',
        message: 'Failed to process deposit'
      });
    }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    try {
      await apiClient.post(`/mybanker/withdrawals/${withdrawalId}/approve`);
      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: 'Withdrawal Approved',
        message: 'Withdrawal processed successfully!'
      });
      fetchAllPendingTransactions();
    } catch (error) {
      console.error('Failed to approve withdrawal:', error);
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Approval Failed',
        message: error.response?.data?.error || 'Failed to approve withdrawal'
      });
    }
  };

  const handleRejectWithdrawal = async (withdrawalId) => {
    try {
      await apiClient.post(`/mybanker/withdrawals/${withdrawalId}/reject`, { reason: 'Rejected by admin' });
      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: 'Withdrawal Rejected',
        message: 'Withdrawal has been rejected.'
      });
      fetchAllPendingTransactions();
    } catch (error) {
      console.error('Failed to reject withdrawal:', error);
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Rejection Failed',
        message: error.response?.data?.error || 'Failed to reject withdrawal'
      });
    }
  };

  const filteredDeposits = deposits.filter(deposit => 
    deposit.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deposit.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-amber-500/20 text-amber-400 border-amber-800',
      COMPLETED: 'bg-green-500/20 text-green-400 border-green-800',
      FAILED: 'bg-red-500/20 text-red-400 border-red-800'
    };
    return styles[status] || styles.PENDING;
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Transaction Management</h2>
          <p className="text-slate-400 text-sm">Manage deposits, withdrawals, and transfers</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          New Deposit
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg">
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('deposits')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'deposits'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Deposits ({deposits.filter(d => d.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'withdrawals'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Withdrawals ({withdrawals.length})
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex-1 px-6 py-3 font-medium transition-colors ${
              activeTab === 'transfers'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Transfers ({transfers.length})
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Method/Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {activeTab === 'deposits' && filteredDeposits.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No deposits found</p>
                </td>
              </tr>
            )}
            {activeTab === 'deposits' && filteredDeposits.map((deposit) => (
                <tr key={deposit.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{deposit.user?.firstName} {deposit.user?.lastName}</div>
                      <div className="text-slate-400 text-sm">{deposit.user?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-semibold">${parseFloat(deposit.amount || 0).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-300 text-sm">{deposit.method}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400 text-sm font-mono">{deposit.reference}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(deposit.status)}`}>
                      {deposit.status === 'PENDING' && <Clock className="w-3 h-3" />}
                      {deposit.status === 'COMPLETED' && <Check className="w-3 h-3" />}
                      {deposit.status === 'FAILED' && <X className="w-3 h-3" />}
                      {deposit.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400 text-sm">{deposit.createdAt ? new Date(deposit.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {deposit.status === 'PENDING' && (
                      <button
                        onClick={() => handleProcessDeposit(deposit.id)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
                      >
                        Process
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            
            {activeTab === 'withdrawals' && withdrawals.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No pending withdrawals</p>
                </td>
              </tr>
            )}
            {activeTab === 'withdrawals' && withdrawals.map((withdrawal) => (
              <tr key={withdrawal.id} className="hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="text-white font-medium">{withdrawal.user?.firstName} {withdrawal.user?.lastName}</div>
                    <div className="text-slate-400 text-sm">{withdrawal.user?.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-white font-semibold">${parseFloat(withdrawal.amount || 0).toLocaleString()}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-300 text-sm">{withdrawal.method || 'WITHDRAWAL'}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-400 text-sm font-mono">{withdrawal.reference}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(withdrawal.status)}`}>
                    {withdrawal.status === 'PENDING' && <Clock className="w-3 h-3" />}
                    {withdrawal.status === 'COMPLETED' && <Check className="w-3 h-3" />}
                    {withdrawal.status === 'FAILED' && <X className="w-3 h-3" />}
                    {withdrawal.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-slate-400 text-sm">{new Date(withdrawal.createdAt).toLocaleDateString()}</span>
                </td>
                <td className="px-6 py-4">
                  {withdrawal.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveWithdrawal(withdrawal.id)}
                        className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectWithdrawal(withdrawal.id)}
                        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            
            {activeTab === 'transfers' && transfers.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No pending transfers</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Deposit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">Create New Deposit</h3>
            <form onSubmit={handleCreateDeposit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">User Email *</label>
                <input
                  type="email"
                  required
                  value={newDeposit.userEmail}
                  onChange={(e) => setNewDeposit({...newDeposit, userEmail: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="user@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newDeposit.amount}
                  onChange={(e) => setNewDeposit({...newDeposit, amount: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Method</label>
                <select
                  value={newDeposit.method}
                  onChange={(e) => setNewDeposit({...newDeposit, method: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ADMIN_CREDIT">Admin Credit</option>
                  <option value="CASH">Cash</option>
                  <option value="CHECK">Check</option>
                  <option value="WIRE">Wire Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={newDeposit.description}
                  onChange={(e) => setNewDeposit({...newDeposit, description: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                >
                  Create Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      <BrandFeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
      />
    </div>
  );
};

export default DepositManagement;
