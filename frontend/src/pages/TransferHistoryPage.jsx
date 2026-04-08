import React, { useState, useEffect } from 'react';
import { Loader2, Send, Filter, Search } from 'lucide-react';
import apiClient from '../lib/apiClient';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';

const TransferHistoryPage = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, APPROVED, DECLINED, REVERSED
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/transfers');
      if (response.success) {
        setTransfers(response.transfers || []);
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError('Failed to load transfer history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
      APPROVED: 'bg-green-500/10 text-green-400 border-green-500/20',
      DECLINED: 'bg-red-500/10 text-red-400 border-red-500/20',
      REVERSED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      COMPLETED: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${styles[status] || styles.PENDING}`}>
        {status}
      </span>
    );
  };

  const filteredTransfers = transfers.filter(transfer => {
    const matchesFilter = filter === 'ALL' || transfer.status === filter;
    const matchesSearch = searchTerm === '' || 
      transfer.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.destinationBank.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <UserDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Transfer History</h2>
          <p className="text-sm text-slate-500 mt-1">
            View all your domestic transfer requests
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by reference, recipient, or bank..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="DECLINED">Declined</option>
                <option value="REVERSED">Reversed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transfer List */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        ) : filteredTransfers.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchTerm || filter !== 'ALL' ? 'No transfers found' : 'No transfers yet'}
            </h3>
            <p className="text-slate-500">
              {searchTerm || filter !== 'ALL' 
                ? 'Try adjusting your search or filter' 
                : 'Your transfer history will appear here'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTransfers.map(transfer => (
              <div key={transfer.id} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                      <Send className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{transfer.accountName}</h3>
                      <p className="text-sm text-slate-500">{transfer.destinationBank}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-900">
                      ${transfer.amount.toFixed(2)}
                    </p>
                    {getStatusBadge(transfer.status)}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500">Reference</p>
                    <p className="text-sm font-mono font-semibold text-slate-900">{transfer.reference}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Account</p>
                    <p className="text-sm font-mono text-slate-900">••••{transfer.accountNumber.slice(-4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Submitted</p>
                    <p className="text-sm text-slate-900">
                      {new Date(transfer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">From Account</p>
                    <p className="text-sm text-slate-900">
                      {transfer.account.accountType} ••••{transfer.account.accountNumber.slice(-4)}
                    </p>
                  </div>
                </div>

                {transfer.description && (
                  <div className="bg-slate-50 rounded-lg p-3 mb-4">
                    <p className="text-xs text-slate-500 mb-1">Description</p>
                    <p className="text-sm text-slate-700">{transfer.description}</p>
                  </div>
                )}

                {transfer.adminNotes && (
                  <div className={`rounded-lg p-3 ${
                    transfer.status === 'DECLINED' || transfer.status === 'REVERSED'
                      ? 'bg-red-50 border border-red-100'
                      : 'bg-green-50 border border-green-100'
                  }`}>
                    <p className="text-xs text-slate-500 mb-1">
                      {transfer.status === 'DECLINED' ? 'Decline Reason' : 
                       transfer.status === 'REVERSED' ? 'Reversal Reason' : 'Admin Notes'}
                    </p>
                    <p className={`text-sm ${
                      transfer.status === 'DECLINED' || transfer.status === 'REVERSED'
                        ? 'text-red-700'
                        : 'text-green-700'
                    }`}>
                      {transfer.adminNotes}
                    </p>
                  </div>
                )}

                {transfer.estimatedCompletion && transfer.status === 'PENDING' && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                      Estimated Completion: {new Date(transfer.estimatedCompletion).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && transfers.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500">Total Transfers</p>
                <p className="text-2xl font-bold text-slate-900">{transfers.length}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {transfers.filter(t => t.status === 'PENDING').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {transfers.filter(t => t.status === 'APPROVED').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total Amount</p>
                <p className="text-2xl font-bold text-slate-900">
                  ${transfers.reduce((sum, t) => sum + parseFloat(t.amount), 0).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default TransferHistoryPage;
