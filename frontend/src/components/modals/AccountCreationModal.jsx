import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { ActionButton } from '../ui/ActionButton';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';

const AccountCreationModal = ({ isOpen, onClose, onSuccess }) => {
  const [accountType, setAccountType] = useState('CHECKING');
  const [accountName, setAccountName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [createdAccount, setCreatedAccount] = useState(null);

  const accountTypes = [
    { value: 'CHECKING', label: 'Checking Account', description: 'For everyday transactions' },
    { value: 'SAVINGS', label: 'Savings Account', description: 'For saving money' },
    { value: 'BUSINESS', label: 'Business Account', description: 'For business transactions' },
    { value: 'CRYPTO_WALLET', label: 'Crypto Wallet', description: 'For cryptocurrency holdings' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/accounts', {
        accountType,
        accountName: accountName.trim() || undefined,
      });

      if (response.success) {
        setCreatedAccount(response.account);
        setSuccess(true);
        
        setTimeout(() => {
          onSuccess && onSuccess(response.account);
          handleClose();
        }, 2000);
      } else {
        setError(response.error || 'Failed to create account');
      }
    } catch (err) {
      console.error('Account creation error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAccountType('CHECKING');
    setAccountName('');
    setError('');
    setSuccess(false);
    setCreatedAccount(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-neutral-200 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Plus className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-900">New Account</h2>
              <p className="text-sm text-neutral-500">Open a new bank account</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {success && createdAccount ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-neutral-900">Success!</h3>
                <p className="text-neutral-500 mt-1">Your {createdAccount.accountType.toLowerCase()} account has been created.</p>
                <div className="mt-4 p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                  <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Account Number</p>
                  <p className="text-lg font-mono font-bold text-neutral-900">{createdAccount.accountNumber}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                  <p className="text-red-600 text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <label className="block text-sm font-bold text-neutral-700">
                  Account Type
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {accountTypes.map((type) => (
                    <label
                      key={type.value}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        accountType === type.value
                          ? 'border-indigo-600 bg-indigo-50/30'
                          : 'border-neutral-100 bg-neutral-50 hover:border-neutral-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="accountType"
                        value={type.value}
                        checked={accountType === type.value}
                        onChange={(e) => setAccountType(e.target.value)}
                        className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-neutral-300"
                      />
                      <div className="flex-1">
                        <div className="font-bold text-neutral-900">{type.label}</div>
                        <div className="text-xs text-neutral-500 leading-relaxed">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-neutral-700 mb-2">
                  Preferred Account Name <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. My Savings"
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                  maxLength={50}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <ActionButton
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={handleClose}
                  fullWidth
                  disabled={loading}
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  fullWidth
                  icon={Plus}
                >
                  Create Account
                </ActionButton>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default AccountCreationModal;
