import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight, ArrowDownLeft, Search, Filter, Download, Eye, Edit, Trash2, Plus, X, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const PAGE_SIZE = 30;

export const TransactionMonitor = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    fetchTransactions();
  }, [filterType, filterStatus, dateRange]);

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      params.append('dateRange', dateRange);
      
      const response = await apiClient.get('/admin/activity');
      setTransactions(response.transactions || []);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    }
    setIsLoading(false);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const searchLower = searchTerm.toLowerCase();
      return (
        tx.reference?.toLowerCase().includes(searchLower) ||
        tx.description?.toLowerCase().includes(searchLower) ||
        tx.user?.email?.toLowerCase().includes(searchLower)
      );
    });
  }, [transactions, searchTerm]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE));
  const paginatedTransactions = useMemo(() => {
    const start = currentPage * PAGE_SIZE;
    return filteredTransactions.slice(start, start + PAGE_SIZE);
  }, [filteredTransactions, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm, filterType, filterStatus, dateRange]);

  const getTypeIcon = (type) => {
    return type === 'CREDIT' || type === 'DEPOSIT' ? (
      <ArrowDownLeft className="w-5 h-5 text-green-400" />
    ) : (
      <ArrowUpRight className="w-5 h-5 text-red-400" />
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'PENDING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'FAILED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const totalVolume = transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0);
  const completedCount = transactions.filter(tx => tx.status === 'COMPLETED').length;
  const pendingCount = transactions.filter(tx => tx.status === 'PENDING').length;

  const handleEditClick = (tx) => {
    setEditingTransaction(tx.id);
    setEditForm({
      type: tx.type,
      amount: tx.amount,
      description: tx.description || '',
      status: tx.status
    });
  };

  const handleSaveEdit = async (txId) => {
    try {
      await apiClient.put(`/mybanker/transactions/${txId}`, editForm);
      setEditingTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      alert('Failed to update transaction');
    }
  };

  const handleDeleteTransaction = async (txId) => {
    try {
      await apiClient.delete(`/mybanker/transactions/${txId}`);
      setShowDeleteConfirm(null);
      fetchTransactions();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('Failed to delete transaction');
    }
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
          <h2 className="text-2xl font-bold text-white">Transaction Monitor</h2>
          <p className="text-slate-400 text-sm">Monitor all transactions across the platform</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Total Transactions</div>
          <div className="text-2xl font-bold text-white mt-1">{transactions.length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Total Volume</div>
          <div className="text-2xl font-bold text-white mt-1">${totalVolume.toFixed(2)}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Completed</div>
          <div className="text-2xl font-bold text-green-400 mt-1">{completedCount}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Pending</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{pendingCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="DEPOSIT">Deposit</option>
            <option value="WITHDRAWAL">Withdrawal</option>
            <option value="TRANSFER">Transfer</option>
            <option value="PAYMENT">Payment</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="COMPLETED">Completed</option>
            <option value="PENDING">Pending</option>
            <option value="FAILED">Failed</option>
          </select>

          {/* Date Range */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Reference</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    No transactions found
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-white font-mono text-sm">{tx.reference}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white">{tx.user?.firstName} {tx.user?.lastName}</div>
                      <div className="text-slate-400 text-sm">{tx.user?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(tx.type)}
                        <span className="text-white">{tx.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`font-semibold ${
                        tx.type === 'CREDIT' || tx.type === 'DEPOSIT' ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {tx.type === 'CREDIT' || tx.type === 'DEPOSIT' ? '+' : '-'}${parseFloat(tx.amount || 0).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(tx.status)}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-400 text-sm">
                        {new Date(tx.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleEditClick(tx)}
                          className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                          title="Edit transaction"
                        >
                          <Edit className="w-4 h-4 text-indigo-400" />
                        </button>
                        <button 
                          onClick={() => setShowDeleteConfirm(tx.id)}
                          className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-700 flex items-center justify-between">
          <p className="text-sm text-slate-400">
            Showing {currentPage * PAGE_SIZE + 1} - {Math.min((currentPage + 1) * PAGE_SIZE, filteredTransactions.length)} of {filteredTransactions.length} transactions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="p-2 rounded-lg border border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-sm font-medium text-slate-300">
              Page {currentPage + 1} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage >= totalPages - 1}
              className="p-2 rounded-lg border border-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-700 text-slate-300"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Edit Transaction</h3>
              <button onClick={() => setEditingTransaction(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Type</label>
                <select
                  value={editForm.type}
                  onChange={(e) => setEditForm({...editForm, type: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="CREDIT">Credit</option>
                  <option value="DEBIT">Debit</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="PAYMENT">Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Amount</label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({...editForm, amount: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
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
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingTransaction(null)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveEdit(editingTransaction)}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-sm">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Delete Transaction?</h3>
              <p className="text-slate-400 text-sm mb-6">This action cannot be undone. The transaction will be permanently removed.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteTransaction(showDeleteConfirm)}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionMonitor;
