import React, { useState, useEffect } from 'react';
import { X, CreditCard, TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const CardDetailsModal = ({ isOpen, onClose, card, cardType }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && card) {
      fetchTransactions();
    }
  }, [isOpen, card]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const endpoint = cardType === 'credit'
        ? `/cards/credit/${card.id}/transactions?limit=5`
        : `/cards/debit/${card.id}/transactions?limit=5`;
      
      const response = await apiClient.get(endpoint);
      if (response.success) {
        setTransactions(response.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching card transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(Math.abs(amount));
  };

  const getTransactionIcon = (type) => {
    const lowerType = type?.toLowerCase();
    if (lowerType === 'credit' || lowerType === 'deposit') {
      return <TrendingUp className="w-5 h-5 text-green-500" />;
    }
    return <TrendingDown className="w-5 h-5 text-red-500" />;
  };

  const getTransactionColor = (type) => {
    const lowerType = type?.toLowerCase();
    if (lowerType === 'credit' || lowerType === 'deposit') {
      return 'text-green-600';
    }
    return 'text-red-600';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Card Details</h3>
              <p className="text-sm text-slate-600">
                {card?.cardHolderName} •••• {card?.cardNumber?.slice(-4)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Card Info */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Card Type</p>
              <p className="text-sm font-semibold text-slate-900 capitalize">{cardType}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Status</p>
              <p className={`text-sm font-semibold ${card?.isActive ? 'text-green-600' : 'text-slate-400'}`}>
                {card?.isFrozen ? 'Frozen' : card?.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Expires</p>
              <p className="text-sm font-semibold text-slate-900">
                {card?.expiryDate ? new Date(card.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }) : 'N/A'}
              </p>
            </div>
            {cardType === 'debit' && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Daily Limit</p>
                <p className="text-sm font-semibold text-slate-900">
                  ${card?.dailyLimit?.toLocaleString() || '0'}
                </p>
              </div>
            )}
            {cardType === 'credit' && card?.creditLimit && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Credit Limit</p>
                <p className="text-sm font-semibold text-slate-900">
                  ${card?.creditLimit?.toLocaleString() || '0'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-slate-900">Recent Transactions</h4>
            <span className="text-xs text-slate-500">Last 5 transactions</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No transactions yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {transaction.description || transaction.type}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <p className="text-xs text-slate-500">
                          {formatDate(transaction.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <p className={`text-sm font-bold ${getTransactionColor(transaction.type)}`}>
                      {transaction.type?.toLowerCase() === 'credit' || transaction.type?.toLowerCase() === 'deposit' ? '+' : '-'}
                      {formatAmount(transaction.amount)}
                    </p>
                    <p className="text-xs text-slate-500 capitalize">{transaction.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardDetailsModal;
