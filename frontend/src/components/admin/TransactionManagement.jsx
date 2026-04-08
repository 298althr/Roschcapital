import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, ArrowDownLeft, Search, Filter, Download, Eye, Edit, Trash2, 
  Plus, X, Save, Users, ChevronLeft, ChevronRight, Calendar, FileText,
  CheckCircle, AlertCircle, Clock, Copy
} from 'lucide-react';
import apiClient from '../../lib/apiClient';

// Category options
const CATEGORIES = [
  'ENTERTAINMENT', 'INSURANCE', 'UTILITIES', 'GROCERIES', 'TRANSPORTATION',
  'DINING', 'SHOPPING', 'HOUSING', 'BANKING', 'INTEREST', 'LOAN_PAYMENT',
  'CONTRACTOR', 'SALARY', 'TRANSFER', 'OTHER'
];

export const TransactionManagement = () => {
  // View state
  const [view, setView] = useState('users'); // 'users' or 'transactions'
  const [selectedUser, setSelectedUser] = useState(null);
  
  // Users list state
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userSearch, setUserSearch] = useState('');
  
  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [txLoading, setTxLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 100, total: 0, pages: 0 });
  
  // Filters
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [txSearch, setTxSearch] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showBulkCreate, setShowBulkCreate] = useState(false);
  
  // Selection for bulk operations
  const [selectedTxIds, setSelectedTxIds] = useState([]);
  
  // Merchant logos
  const [merchants, setMerchants] = useState([]);
  const [categoryIcons, setCategoryIcons] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'DEBIT',
    amount: '',
    description: '',
    category: 'OTHER',
    merchantLogo: '',
    status: 'COMPLETED',
    createdAt: new Date().toISOString().slice(0, 16),
    accountId: ''
  });
  
  // Bulk form state
  const [bulkTransactions, setBulkTransactions] = useState([{
    type: 'DEBIT',
    amount: '',
    description: '',
    category: 'OTHER',
    merchantLogo: '',
    createdAt: ''
  }]);
  
  const [editingTx, setEditingTx] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchMerchants();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchUserTransactions();
    }
  }, [selectedUser, pagination.page, filterType, filterCategory, startDate, endDate]);

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await apiClient.get('/mybanker/users-with-transactions');
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchMerchants = async () => {
    try {
      const response = await apiClient.get('/mybanker/merchant-logos');
      setMerchants(response.merchants || []);
      setCategoryIcons(response.categoryIcons || {});
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
    }
  };

  const fetchUserTransactions = async () => {
    if (!selectedUser) return;
    
    try {
      setTxLoading(true);
      const params = new URLSearchParams();
      params.append('page', pagination.page);
      params.append('limit', pagination.limit);
      if (filterType !== 'all') params.append('type', filterType);
      if (filterCategory !== 'all') params.append('category', filterCategory);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await apiClient.get(`/mybanker/users/${selectedUser.id}/transactions?${params.toString()}`);
      setTransactions(response.transactions || []);
      setPagination(prev => ({ ...prev, ...response.pagination }));
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setTxLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setView('transactions');
    setPagination(prev => ({ ...prev, page: 1 }));
    setSelectedTxIds([]);
  };

  const handleBackToUsers = () => {
    setView('users');
    setSelectedUser(null);
    setTransactions([]);
    setSelectedTxIds([]);
  };

  const handleCreateTransaction = async () => {
    try {
      if (!formData.accountId) {
        alert('Please select an account');
        return;
      }
      await apiClient.post(`/mybanker/users/${selectedUser.id}/transactions`, formData);
      setShowCreateModal(false);
      setFormData({
        type: 'DEBIT',
        amount: '',
        description: '',
        category: 'OTHER',
        merchantLogo: '',
        status: 'COMPLETED',
        createdAt: new Date().toISOString().slice(0, 16),
        accountId: selectedUser?.accounts?.[0]?.id || ''
      });
      fetchUserTransactions();
      fetchUsers(); // Refresh user balances
    } catch (error) {
      console.error('Failed to create transaction:', error);
      alert('Failed to create transaction: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleUpdateTransaction = async () => {
    try {
      await apiClient.put(`/mybanker/transactions/${editingTx.id}`, {
        type: formData.type,
        amount: formData.amount,
        description: formData.description,
        category: formData.category,
        status: formData.status,
        createdAt: formData.createdAt ? new Date(formData.createdAt).toISOString() : undefined
        // merchantLogo temporarily disabled until schema migration
      });
      setShowEditModal(false);
      setEditingTx(null);
      fetchUserTransactions();
    } catch (error) {
      console.error('Failed to update transaction:', error);
      alert('Failed to update transaction: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteTransaction = async (txId) => {
    try {
      await apiClient.delete(`/mybanker/transactions/${txId}`);
      setShowDeleteConfirm(null);
      fetchUserTransactions();
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete transaction:', error);
      alert('Failed to delete transaction');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedTxIds.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedTxIds.length} transactions?`)) {
      return;
    }
    
    try {
      await apiClient.delete('/mybanker/transactions/bulk', {
        data: { transactionIds: selectedTxIds }
      });
      setSelectedTxIds([]);
      fetchUserTransactions();
      fetchUsers();
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      alert('Failed to delete transactions');
    }
  };

  const handleBulkCreate = async () => {
    try {
      const validTransactions = bulkTransactions.filter(tx => tx.amount && tx.description);
      if (validTransactions.length === 0) {
        alert('Please add at least one valid transaction');
        return;
      }
      
      await apiClient.post(`/mybanker/users/${selectedUser.id}/transactions/bulk`, {
        transactions: validTransactions
      });
      
      setShowBulkCreate(false);
      setBulkTransactions([{
        type: 'DEBIT',
        amount: '',
        description: '',
        category: 'OTHER',
        merchantLogo: '',
        createdAt: ''
      }]);
      fetchUserTransactions();
      fetchUsers();
    } catch (error) {
      console.error('Failed to bulk create:', error);
      alert('Failed to create transactions');
    }
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      params.append('format', 'csv');
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || ''}/api/v1/mybanker/users/${selectedUser.id}/transactions/export?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions_${selectedUser.email}_${Date.now()}.csv`;
      a.click();
    } catch (error) {
      console.error('Failed to export:', error);
      alert('Failed to export transactions');
    }
  };

  const openEditModal = (tx) => {
    setEditingTx(tx);
    setFormData({
      type: tx.type,
      amount: tx.amount,
      description: tx.description || '',
      category: tx.category || 'OTHER',
      merchantLogo: tx.merchantLogo || '',
      status: tx.status,
      createdAt: new Date(tx.createdAt).toISOString().slice(0, 16)
    });
    setShowEditModal(true);
  };

  const addBulkRow = () => {
    setBulkTransactions([...bulkTransactions, {
      type: 'DEBIT',
      amount: '',
      description: '',
      category: 'OTHER',
      merchantLogo: '',
      createdAt: ''
    }]);
  };

  const removeBulkRow = (index) => {
    setBulkTransactions(bulkTransactions.filter((_, i) => i !== index));
  };

  const cloneBulkRow = (index) => {
    const rowToClone = bulkTransactions[index];
    setBulkTransactions([...bulkTransactions, { ...rowToClone }]);
  };

  const updateBulkRow = (index, field, value) => {
    const updated = [...bulkTransactions];
    updated[index][field] = value;
    setBulkTransactions(updated);
  };

  const toggleSelectTx = (txId) => {
    setSelectedTxIds(prev => 
      prev.includes(txId) 
        ? prev.filter(id => id !== txId)
        : [...prev, txId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedTxIds.length === transactions.length) {
      setSelectedTxIds([]);
    } else {
      setSelectedTxIds(transactions.map(tx => tx.id));
    }
  };

  const filteredUsers = users.filter(user => {
    const search = userSearch.toLowerCase();
    return (
      user.email?.toLowerCase().includes(search) ||
      user.firstName?.toLowerCase().includes(search) ||
      user.lastName?.toLowerCase().includes(search)
    );
  });

  const filteredTransactions = transactions.filter(tx => {
    const search = txSearch.toLowerCase();
    return (
      tx.description?.toLowerCase().includes(search) ||
      tx.reference?.toLowerCase().includes(search) ||
      tx.category?.toLowerCase().includes(search)
    );
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTypeColor = (type) => {
    return type === 'CREDIT' ? 'text-green-400' : 'text-red-400';
  };

  const getStatusBadge = (status) => {
    const styles = {
      COMPLETED: 'bg-green-500/10 text-green-400 border-green-500/20',
      PENDING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      FAILED: 'bg-red-500/10 text-red-400 border-red-500/20'
    };
    return styles[status] || styles.PENDING;
  };

  // Users List View
  if (view === 'users') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Transaction Management</h2>
            <p className="text-slate-400 text-sm">Select a user to manage their transactions</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Users Grid */}
        {usersLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map(user => (
              <div
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-indigo-500 cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </div>
                  )}
                  <div>
                    <div className="text-white font-medium">{user.firstName} {user.lastName}</div>
                    <div className="text-slate-400 text-sm">{user.email}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-slate-400">Balance</div>
                    <div className="text-white font-semibold">{formatCurrency(user.totalBalance)}</div>
                  </div>
                  <div>
                    <div className="text-slate-400">Transactions</div>
                    <div className="text-white font-semibold">{user.totalTransactions}</div>
                  </div>
                </div>
                <div className="mt-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    user.accountStatus === 'ACTIVE' 
                      ? 'bg-green-500/10 text-green-400' 
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {user.accountStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Transactions View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToUsers}
            className="p-2 hover:bg-slate-700 rounded-lg transition"
          >
            <ChevronLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {selectedUser?.firstName} {selectedUser?.lastName}'s Transactions
            </h2>
            <p className="text-slate-400 text-sm">{selectedUser?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Bulk Create
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={txSearch}
              onChange={(e) => setTxSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPagination(p => ({...p, page: 1})); }}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="CREDIT">Credit</option>
            <option value="DEBIT">Debit</option>
          </select>
          <select
            value={filterCategory}
            onChange={(e) => { setFilterCategory(e.target.value); setPagination(p => ({...p, page: 1})); }}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setPagination(p => ({...p, page: 1})); }}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => { setEndDate(e.target.value); setPagination(p => ({...p, page: 1})); }}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
            placeholder="End Date"
          />
          {selectedTxIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              <Trash2 className="w-4 h-4" />
              Delete ({selectedTxIds.length})
            </button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        {txLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedTxIds.length === transactions.length && transactions.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-700/50 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedTxIds.includes(tx.id)}
                            onChange={() => toggleSelectTx(tx.id)}
                            className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-white text-sm">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {new Date(tx.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {tx.merchantLogo ? (
                              <img src={tx.merchantLogo} alt="" className="w-6 h-6 rounded" />
                            ) : (
                              <span className="text-lg">{categoryIcons[tx.category] || '📄'}</span>
                            )}
                            <span className="text-white">{tx.description}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                            {tx.category || 'OTHER'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            {tx.type === 'CREDIT' ? (
                              <ArrowDownLeft className="w-4 h-4 text-green-400" />
                            ) : (
                              <ArrowUpRight className="w-4 h-4 text-red-400" />
                            )}
                            <span className={getTypeColor(tx.type)}>{tx.type}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`font-semibold ${getTypeColor(tx.type)}`}>
                            {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadge(tx.status)}`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openEditModal(tx)}
                              className="p-1.5 hover:bg-slate-600 rounded transition"
                            >
                              <Edit className="w-4 h-4 text-slate-400" />
                            </button>
                            <button
                              onClick={() => setShowDeleteConfirm(tx.id)}
                              className="p-1.5 hover:bg-red-600/20 rounded transition"
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
            <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
              <div className="text-sm text-slate-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="p-2 hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400" />
                </button>
                <span className="text-slate-400">Page {pagination.page} of {pagination.pages}</span>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.pages}
                  className="p-2 hover:bg-slate-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Transaction Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Create Transaction</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-700 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Account Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Account *</label>
                <select
                  value={formData.accountId}
                  onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">Select Account</option>
                  {selectedUser?.accounts?.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountName} - ****{acc.accountNumber?.slice(-4)} (${Number(acc.balance).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="DEBIT">Debit (Expense)</option>
                    <option value="CREDIT">Credit (Income)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="Netflix - Monthly Subscription"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Merchant Logo URL (optional)</label>
                <input
                  type="text"
                  value={formData.merchantLogo}
                  onChange={(e) => setFormData({ ...formData, merchantLogo: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.createdAt}
                  onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              
              {/* Merchant Presets */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Quick Select Merchant</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {merchants.slice(0, 20).map(merchant => (
                    <button
                      key={merchant.key}
                      onClick={() => setFormData({
                        ...formData,
                        description: merchant.name,
                        category: merchant.category,
                        merchantLogo: merchant.logo || ''
                      })}
                      className="px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition"
                    >
                      {merchant.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTransaction}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Create Transaction
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Edit Transaction</h3>
              <button onClick={() => { setShowEditModal(false); setEditingTx(null); }} className="p-1 hover:bg-slate-700 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="DEBIT">Debit</option>
                    <option value="CREDIT">Credit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="COMPLETED">Completed</option>
                    <option value="PENDING">Pending</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.createdAt}
                  onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Merchant Logo URL (optional)</label>
                <input
                  type="text"
                  value={formData.merchantLogo}
                  onChange={(e) => setFormData({ ...formData, merchantLogo: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowEditModal(false); setEditingTx(null); }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTransaction}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Create Modal */}
      {showBulkCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-4xl mx-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Bulk Create Transactions</h3>
              <button onClick={() => setShowBulkCreate(false)} className="p-1 hover:bg-slate-700 rounded">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {bulkTransactions.map((tx, index) => (
                <div key={index} className="grid grid-cols-6 gap-2 items-end p-3 bg-slate-900 rounded-lg">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Type</label>
                    <select
                      value={tx.type}
                      onChange={(e) => updateBulkRow(index, 'type', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                    >
                      <option value="DEBIT">Debit</option>
                      <option value="CREDIT">Credit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={tx.amount}
                      onChange={(e) => updateBulkRow(index, 'amount', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={tx.description}
                      onChange={(e) => updateBulkRow(index, 'description', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                      placeholder="Description"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Category</label>
                    <select
                      value={tx.category}
                      onChange={(e) => updateBulkRow(index, 'category', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Date</label>
                    <input
                      type="datetime-local"
                      value={tx.createdAt}
                      onChange={(e) => updateBulkRow(index, 'createdAt', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-800 border border-slate-700 rounded text-white text-sm"
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => cloneBulkRow(index)}
                      title="Clone this row"
                      className="p-1.5 hover:bg-indigo-600/20 rounded transition"
                    >
                      <Copy className="w-4 h-4 text-indigo-400" />
                    </button>
                    <button
                      onClick={() => removeBulkRow(index)}
                      disabled={bulkTransactions.length === 1}
                      className="p-1.5 hover:bg-red-600/20 rounded transition disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <button
              onClick={addBulkRow}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowBulkCreate(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCreate}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                Create {bulkTransactions.filter(t => t.amount && t.description).length} Transactions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-white mb-4">Delete Transaction?</h3>
            <p className="text-slate-400 mb-6">
              This action cannot be undone. The account balance will be adjusted accordingly.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTransaction(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;
