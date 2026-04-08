import React, { useState, useEffect } from 'react';
import { X, DollarSign, Loader2 } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const CreditCardFundingModal = ({ isOpen, onClose, creditCard, onSuccess }) => {
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

  const fetchAccounts = async () => {
    try {
      const response = await apiClient.get('/accounts');
      if (response.success) {
        setAccounts(response.accounts);
        if (response.accounts.length > 0) {
          setAccountId(response.accounts[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post(`/cards/credit/${creditCard.id}/fund`, {
        accountId,
        amount: parseFloat(amount)
      });

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess && onSuccess(response.funding);
          handleClose();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process payment');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAccountId('');
    setAmount('');
    setError('');
    setSuccess(false);
    onClose();
  };

  const selectedAccount = accounts.find(a => a.id === accountId);
  const maxPayment = Math.min(
    selectedAccount?.availableBalance || 0,
    creditCard?.currentBalance || 0
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Make Payment</h2>
              <p className="text-sm text-slate-400">Pay your credit card balance</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-green-400 font-medium">Payment Successful!</h3>
                  <p className="text-sm text-green-300/70 mt-1">
                    Your payment has been processed
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {!success && (
            <>
              {/* Credit Card Info */}
              <div className="bg-slate-900 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Card</span>
                  <span className="text-white font-mono">{creditCard?.cardNumber}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Current Balance</span>
                  <span className="text-red-400 font-semibold">${creditCard?.currentBalance?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Available Credit</span>
                  <span className="text-green-400 font-semibold">${creditCard?.availableCredit?.toFixed(2)}</span>
                </div>
                {creditCard?.minimumPayment > 0 && (
                  <div className="flex justify-between text-sm pt-2 border-t border-slate-700">
                    <span className="text-slate-400">Minimum Payment</span>
                    <span className="text-yellow-400 font-semibold">${creditCard?.minimumPayment?.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {/* Payment From Account */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Pay From Account <span className="text-red-400">*</span>
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select account...</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.accountType} - ••••{account.accountNumber.slice(-4)} (Available: ${account.availableBalance?.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Amount */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Payment Amount <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="0.01"
                    max={maxPayment}
                    step="0.01"
                    className="w-full pl-8 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className="text-slate-500">
                    Max: ${maxPayment.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAmount(maxPayment.toString())}
                    className="text-purple-400 hover:text-purple-300"
                  >
                    Pay Full Balance
                  </button>
                </div>
              </div>

              {/* Quick Amount Buttons */}
              {creditCard?.minimumPayment > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAmount(creditCard.minimumPayment.toString())}
                    className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Min Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount((creditCard.currentBalance / 2).toFixed(2))}
                    className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Half Balance
                  </button>
                  <button
                    type="button"
                    onClick={() => setAmount(creditCard.currentBalance.toString())}
                    className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
                  >
                    Full Balance
                  </button>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          {!success && (
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !amount || parseFloat(amount) <= 0}
                className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    Make Payment
                  </>
                )}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreditCardFundingModal;
