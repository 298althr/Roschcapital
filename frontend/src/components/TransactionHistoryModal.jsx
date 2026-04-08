import React, { useState, useEffect } from 'react';
import { Modal } from './ui/Modal';
import apiClient from '../lib/apiClient';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  Filter, 
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { LoadingSkeleton } from './ui/LoadingSkeleton';

/**
 * Transaction History Modal
 * Shows last 30 days of transactions with filtering and search
 */
export const TransactionHistoryModal = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, credit, debit
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchTransactions();
    }
  }, [isOpen]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/transactions?limit=50');
      if (response.success) {
        const formattedTransactions = (response.transactions || []).map(tx => ({
          id: tx.id,
          description: tx.description || tx.type,
          amount: parseFloat(tx.amount) || 0,
          type: ['CREDIT', 'DEPOSIT'].includes(tx.type?.toUpperCase()) ? 'credit' : 'debit',
          category: tx.category || tx.type || 'Transaction',
          date: new Date(tx.createdAt).toLocaleDateString(),
          color: ['CREDIT', 'DEPOSIT'].includes(tx.type?.toUpperCase()) ? 'emerald' : 'red'
        }));
        setTransactions(formattedTransactions);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Unable to load transactions');
    } finally {
      setTimeout(() => setLoading(false), 300);
    }
  };

  // Calculate statistics
  const totalIncome = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0));
  const netChange = totalIncome - totalExpenses;

  // Filter transactions
  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         txn.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || txn.type === filterType;
    return matchesSearch && matchesType;
  });

  const getColorClasses = (color) => {
    const colors = {
      emerald: 'bg-emerald-100 text-emerald-600',
      red: 'bg-red-100 text-red-600',
    };
    return colors[color] || 'bg-neutral-100 text-neutral-600';
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Transaction History">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <LoadingSkeleton variant="card" className="h-24" />
            <LoadingSkeleton variant="card" className="h-24" />
            <LoadingSkeleton variant="card" className="h-24" />
          </div>
          <LoadingSkeleton variant="list" rows={5} />
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Transaction History">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownRight className="w-4 h-4 text-emerald-600" />
              <p className="text-xs text-emerald-600 font-medium">Total Income</p>
            </div>
            <p className="text-2xl font-bold text-emerald-900">+${totalIncome.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="w-4 h-4 text-red-600" />
              <p className="text-xs text-red-600 font-medium">Total Expenses</p>
            </div>
            <p className="text-2xl font-bold text-red-900">-${totalExpenses.toLocaleString()}</p>
          </div>
          <div className={`bg-gradient-to-br rounded-xl p-4 border ${netChange >= 0 ? 'from-blue-50 to-blue-100 border-blue-200' : 'from-amber-50 to-amber-100 border-amber-200'}`}>
            <div className="flex items-center gap-2 mb-1">
              {netChange >= 0 ? (
                <TrendingUp className="w-4 h-4 text-blue-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-amber-600" />
              )}
              <p className={`text-xs font-medium ${netChange >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>Net Change</p>
            </div>
            <p className={`text-2xl font-bold ${netChange >= 0 ? 'text-blue-900' : 'text-amber-900'}`}>
              {netChange >= 0 ? '+' : ''}${Math.abs(netChange).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-500" />
              <span className="text-sm font-medium text-neutral-700">Type:</span>
            </div>
            <div className="flex gap-2">
              {['all', 'credit', 'debit'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    filterType === type
                      ? 'bg-primary-600 text-white'
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'credit' ? 'Income' : 'Expenses'}
                </button>
              ))}
            </div>

            <button className="ml-auto px-3 py-1.5 text-xs font-medium rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        {/* Transactions List */}
        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {filteredTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="bg-neutral-50 hover:bg-neutral-100 rounded-xl p-4 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${getColorClasses(txn.color)}`}>
                      <DollarSign className="w-6 h-6" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{txn.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-neutral-500">{txn.category}</span>
                        <span className="text-xs text-neutral-400">•</span>
                        <span className="text-xs text-neutral-500">{txn.date}</span>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="text-right">
                      <p className={`text-base font-bold ${txn.type === 'credit' ? 'text-emerald-600' : 'text-neutral-900'}`}>
                        {txn.type === 'credit' ? '+' : ''}{txn.amount < 0 ? txn.amount : `$${txn.amount.toFixed(2)}`}
                      </p>
                      {txn.type === 'credit' && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                          <ArrowDownRight className="w-3 h-3" />
                          Income
                        </span>
                      )}
                    </div>
                  </div>
                </div>
            ))}
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-sm">No transactions found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
          <p className="text-xs text-neutral-500">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </p>
          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <Calendar className="w-4 h-4" />
            <span>Last 30 days</span>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default TransactionHistoryModal;
