import React, { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';

/**
 * ReceiptComponent - Display payment receipt with details
 * Shows transaction details and allows printing/sharing
 */
export const ReceiptComponent = ({ paymentId, onBack }) => {
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/payments/${paymentId}/receipt`);

        if (response.success) {
          setPayment(response.payment);
        } else {
          setError('Failed to load receipt');
        }
      } catch (err) {
        console.error('Error fetching receipt:', err);
        setError('Unable to load receipt');
      } finally {
        setLoading(false);
      }
    };

    fetchReceipt();
  }, [paymentId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPaymentTypeIcon = (type) => {
    switch (type) {
      case 'transfer':
        return '↔️';
      case 'p2p':
        return '👤';
      case 'bill':
        return '📄';
      case 'refund':
        return '↩️';
      default:
        return '💳';
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'transfer':
        return 'Account Transfer';
      case 'p2p':
        return 'Peer-to-Peer Payment';
      case 'bill':
        return 'Bill Payment';
      case 'refund':
        return 'Refund';
      default:
        return 'Payment';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
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

  if (!payment) {
    return (
      <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-8 text-center">
        <p className="text-slate-400">Receipt not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Receipt Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-blue-400 hover:text-blue-300 transition duration-200 flex items-center gap-2"
        >
          ← Back to Payments
        </button>
        <button
          onClick={() => window.print()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          🖨️ Print Receipt
        </button>
      </div>

      {/* Receipt Card */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center border-b border-slate-700 pb-6">
          <div className="text-5xl mb-4">{getPaymentTypeIcon(payment.type)}</div>
          <h1 className="text-3xl font-bold text-white mb-2">{getTypeLabel(payment.type)}</h1>
          <p className="text-slate-400">Receipt</p>
        </div>

        {/* Amount Section */}
        <div className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 border border-blue-500/30 rounded-lg p-6 text-center">
          <p className="text-slate-400 text-sm mb-2">Amount</p>
          <p className="text-4xl font-bold text-white">{formatCurrency(payment.amount)}</p>
        </div>

        {/* Transaction Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Transaction Details</h2>

          {/* Reference & Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Reference</p>
              <p className="text-sm font-mono text-white">{payment.reference}</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Date & Time</p>
              <p className="text-sm text-white">{formatDate(payment.createdAt)}</p>
            </div>
          </div>

          {/* Description */}
          {payment.description && (
            <div className="bg-slate-700 rounded-lg p-3">
              <p className="text-xs text-slate-400 mb-1">Description</p>
              <p className="text-sm text-white">{payment.description}</p>
            </div>
          )}

          {/* Status */}
          <div className="bg-slate-700 rounded-lg p-3">
            <p className="text-xs text-slate-400 mb-1">Status</p>
            <span
              className={`inline-block text-sm font-semibold px-3 py-1 rounded ${
                payment.status === 'completed'
                  ? 'bg-green-500/20 text-green-400'
                  : payment.status === 'pending'
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-red-500/20 text-red-400'
              }`}
            >
              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
            </span>
          </div>
        </div>

        {/* From/To Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white">Transaction Parties</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* From Account */}
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-xs text-red-400 mb-2 font-semibold">FROM</p>
              {payment.fromAccount && (
                <>
                  <p className="text-sm text-white font-medium capitalize">
                    {payment.fromAccount.accountType} Account
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Account: ••{payment.fromAccount.accountNumber.slice(-4)}
                  </p>
                  {payment.fromAccount.user && (
                    <>
                      <p className="text-xs text-slate-400">
                        {payment.fromAccount.user.firstName} {payment.fromAccount.user.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{payment.fromAccount.user.email}</p>
                    </>
                  )}
                </>
              )}
            </div>

            {/* To Account */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-xs text-green-400 mb-2 font-semibold">TO</p>
              {payment.toAccount && (
                <>
                  <p className="text-sm text-white font-medium capitalize">
                    {payment.toAccount.accountType} Account
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Account: ••{payment.toAccount.accountNumber.slice(-4)}
                  </p>
                  {payment.toAccount.user && (
                    <>
                      <p className="text-xs text-slate-400">
                        {payment.toAccount.user.firstName} {payment.toAccount.user.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{payment.toAccount.user.email}</p>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 pt-6 text-center">
          <p className="text-xs text-slate-500 mb-4">
            This is a digital receipt. Please keep it for your records.
          </p>
          <p className="text-xs text-slate-600">Rosch Capital Bank • {new Date().getFullYear()}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 max-w-2xl mx-auto">
        <button
          onClick={() => {
            const receiptText = `
RECEIPT
${getTypeLabel(payment.type)}

Amount: ${formatCurrency(payment.amount)}
Reference: ${payment.reference}
Date: ${formatDate(payment.createdAt)}
Status: ${payment.status}
Description: ${payment.description}

From: ${payment.fromAccount?.accountType} (••${payment.fromAccount?.accountNumber.slice(-4)})
To: ${payment.toAccount?.accountType} (••${payment.toAccount?.accountNumber.slice(-4)})

Generated by Rosch Capital Bank
            `;
            navigator.clipboard.writeText(receiptText);
            alert('Receipt copied to clipboard!');
          }}
          className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          📋 Copy Receipt
        </button>
        <button
          onClick={onBack}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          Back to Payments
        </button>
      </div>
    </div>
  );
};

export default ReceiptComponent;
