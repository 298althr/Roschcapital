import React, { useState, useEffect } from 'react';
import { X, CreditCard, Loader2 } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const CardCreationModal = ({ isOpen, onClose, onSuccess }) => {
  const [cardType, setCardType] = useState('debit');
  const [accountId, setAccountId] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  const [requestedLimit, setRequestedLimit] = useState('5000');
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdCard, setCreatedCard] = useState(null);
  const [backupCode, setBackupCode] = useState('');

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
      let response;
      
      if (cardType === 'debit') {
        response = await apiClient.post('/cards/debit', {
          accountId,
          cardHolderName,
          backupCode
        });
      } else {
        response = await apiClient.post('/cards/credit/apply', {
          requestedLimit: parseFloat(requestedLimit),
          cardHolderName,
          backupCode
        });
      }

      if (response.success) {
        setCreatedCard(response.card || response.application);
        setSuccess(true);
        
        setTimeout(() => {
          onSuccess && onSuccess(response.card || response.application);
          handleClose();
        }, 2500);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create card');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCardType('debit');
    setAccountId('');
    setCardHolderName('');
    setRequestedLimit('5000');
    setBackupCode('');
    setError('');
    setSuccess(false);
    setCreatedCard(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Request New Card</h2>
              <p className="text-sm text-slate-400">Debit or Credit Card</p>
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
          {success && createdCard && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-green-400 font-medium">
                    {cardType === 'debit' ? 'Card Created!' : 'Application Submitted!'}
                  </h3>
                  <p className="text-sm text-green-300/70 mt-1">
                    {cardType === 'debit' 
                      ? `Card Number: ${createdCard.cardNumber}`
                      : 'Your credit card application is under review'}
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
              {/* Card Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Card Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    cardType === 'debit'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="cardType"
                      value="debit"
                      checked={cardType === 'debit'}
                      onChange={(e) => setCardType(e.target.value)}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-white">Debit Card</div>
                      <div className="text-xs text-slate-400">Linked to account</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    cardType === 'credit'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                  }`}>
                    <input
                      type="radio"
                      name="cardType"
                      value="credit"
                      checked={cardType === 'credit'}
                      onChange={(e) => setCardType(e.target.value)}
                      className="text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-white">Credit Card</div>
                      <div className="text-xs text-slate-400">Requires approval</div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Card Holder Name */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Card Holder Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={cardHolderName}
                  onChange={(e) => setCardHolderName(e.target.value)}
                  placeholder="JOHN DOE"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                  required
                  maxLength={26}
                />
              </div>

              {/* Debit Card: Account Selection */}
              {cardType === 'debit' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Link to Account <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select account...</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.accountType} - ••••{account.accountNumber.slice(-4)} (${account.balance})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Credit Card: Requested Limit */}
              {cardType === 'credit' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Requested Credit Limit <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      type="number"
                      value={requestedLimit}
                      onChange={(e) => setRequestedLimit(e.target.value)}
                      min="1000"
                      max="50000"
                      step="100"
                      className="w-full pl-8 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Minimum: $1,000 | Maximum: $50,000
                  </p>
                </div>
              )}

              {/* Auth Token */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Auth Token <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit Auth Token"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-xl tracking-widest font-mono"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter one of your Auth Tokens to verify this action
                </p>
              </div>
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
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {cardType === 'debit' ? 'Creating...' : 'Submitting...'}
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    {cardType === 'debit' ? 'Create Card' : 'Apply for Credit'}
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

export default CardCreationModal;
