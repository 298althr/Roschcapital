import React, { useState, useEffect } from 'react';
import { Download, ChevronDown, ChevronUp, FileText, Loader2 } from 'lucide-react';
import apiClient from '../lib/apiClient';

/**
 * TransactionListComponent - Displays a list of transactions
 * Mobile-first, responsive design with dark theme
 */
export const TransactionListComponent = ({ accountId, limit = 20 }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const url = accountId
          ? `/transactions?accountId=${accountId}&limit=${limit}&offset=${offset}`
          : `/transactions?limit=${limit}&offset=${offset}`;

        const response = await apiClient.get(url);

        if (response.success) {
          setTransactions(response.transactions);
          setHasMore(offset + limit < response.total);
        } else {
          setError('Failed to load transactions');
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Unable to load transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [accountId, offset, limit]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getTypeIcon = (type) => {
    const normalizedType = type?.toLowerCase();
    return normalizedType === 'debit' || normalizedType === 'withdrawal' || normalizedType === 'payment' ? '↓' : '↑';
  };

  const getTypeColor = (type) => {
    const normalizedType = type?.toLowerCase();
    return normalizedType === 'debit' || normalizedType === 'withdrawal' || normalizedType === 'payment' ? 'text-red-400' : 'text-green-400';
  };

  const handleDownloadReceipt = async (transactionId) => {
    try {
      setDownloadingId(transactionId);
      
      // Get the auth token
      const token = localStorage.getItem('accessToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://gatwickbank-production.up.railway.app/api/v1';
      
      // Fetch the PDF as a blob
      const response = await fetch(`${apiBaseUrl}/transactions/${transactionId}/receipt`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `RoschCapital_Receipt_${transactionId}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading receipt:', err);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-8 text-center">
        <p className="text-slate-400">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => (
        <div
          key={transaction.id}
          className="bg-slate-700 border border-slate-600 rounded-lg overflow-hidden transition duration-150"
        >
          {/* Main Transaction Row - Clickable */}
          <div 
            className="p-4 hover:bg-slate-600 cursor-pointer"
            onClick={() => toggleExpand(transaction.id)}
          >
            <div className="flex items-center justify-between">
              {/* Left: Icon and Description */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center text-lg font-bold ${getTypeColor(
                    transaction.type
                  )}`}
                >
                  {getTypeIcon(transaction.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white font-medium truncate">
                    {transaction.merchantName || transaction.description}
                  </p>
                  <p className="text-xs text-slate-400">
                    {transaction.category && `${transaction.category} • `}
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
              </div>

              {/* Right: Amount, Status, and Expand Icon */}
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 text-right">
                  <p
                    className={`text-lg font-bold ${getTypeColor(transaction.type)}`}
                  >
                    {(transaction.type?.toLowerCase() === 'debit' || 
                      transaction.type?.toLowerCase() === 'withdrawal' || 
                      transaction.type?.toLowerCase() === 'payment') ? '-' : '+'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </p>
                  <p className={`text-xs capitalize ${getStatusColor(transaction.status)}`}>
                    {transaction.status}
                  </p>
                </div>
                <div className="text-slate-400">
                  {expandedId === transaction.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          {expandedId === transaction.id && (
            <div className="border-t border-slate-600 bg-slate-800 p-4">
              {/* Transaction Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Reference</p>
                  <p className="text-sm text-white font-mono">{transaction.reference || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Type</p>
                  <p className="text-sm text-white capitalize">{transaction.type}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Description</p>
                  <p className="text-sm text-white">{transaction.description || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Category</p>
                  <p className="text-sm text-white">{transaction.category || 'General'}</p>
                </div>
                {transaction.merchantName && (
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Merchant</p>
                    <p className="text-sm text-white">{transaction.merchantName}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400 mb-1">Date & Time</p>
                  <p className="text-sm text-white">
                    {new Date(transaction.createdAt).toLocaleString('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </p>
                </div>
              </div>

              {/* Download Receipt Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownloadReceipt(transaction.id);
                }}
                disabled={downloadingId === transaction.id}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition duration-200"
              >
                {downloadingId === transaction.id ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Generating Receipt...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download Receipt (PDF)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Pagination */}
      {hasMore && (
        <button
          onClick={() => setOffset(offset + limit)}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          Load More Transactions
        </button>
      )}
    </div>
  );
};

export default TransactionListComponent;
