import React, { useState, useEffect } from 'react';
import { X, DollarSign, ArrowUpRight, ArrowDownLeft, CreditCard } from 'lucide-react';
import apiClient from '../../lib/apiClient';

export const CreditDebitModal = ({ isOpen, onClose, user, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: 'CREDIT',
    amount: '',
    description: '',
    accountId: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [accounts, setAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Fetch user accounts when modal opens
  useEffect(() => {
    if (isOpen && user) {
      fetchUserAccounts();
    }
  }, [isOpen, user]);

  const fetchUserAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await apiClient.get(`/mybanker/users/${user.id}/accounts`);
      setAccounts(response.accounts || []);
      
      // Auto-select primary account if available
      const primaryAccount = response.accounts?.find(acc => acc.isPrimary);
      if (primaryAccount) {
        setFormData(prev => ({ ...prev, accountId: primaryAccount.id }));
        setSelectedAccount(primaryAccount);
      } else if (response.accounts?.length > 0) {
        // Select first account if no primary
        setFormData(prev => ({ ...prev, accountId: response.accounts[0].id }));
        setSelectedAccount(response.accounts[0]);
      }
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      setError('Failed to load user accounts');
    }
    setLoadingAccounts(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update selected account when account selection changes
    if (name === 'accountId') {
      const account = accounts.find(acc => acc.id === value);
      setSelectedAccount(account);
    }
    
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.accountId) {
      setError('Please select an account');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please enter a description');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(`/mybanker/users/${user.id}/credit-debit`, {
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        accountId: formData.accountId
      });

      onSuccess();
      onClose();
      
      // Reset form
      setFormData({
        type: 'CREDIT',
        amount: '',
        description: '',
        accountId: ''
      });
      setSelectedAccount(null);
    } catch (error) {
      console.error('Credit/Debit error:', error);
      setError(error.response?.data?.error || 'Failed to process transaction');
    }
    setIsSubmitting(false);
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">Credit/Debit Money</h3>
            <p className="text-slate-400 text-sm">
              {user.firstName} {user.lastName} - {user.accountNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Account Selection */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Select Account *
            </label>
            {loadingAccounts ? (
              <div className="bg-slate-900 rounded-lg p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
              </div>
            ) : accounts.length === 0 ? (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
                <p className="text-red-400 text-sm">No accounts found for this user</p>
              </div>
            ) : (
              <select
                name="accountId"
                value={formData.accountId}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select an account...</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.accountName} - {account.accountNumber} (${parseFloat(account.balance || 0).toFixed(2)})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Current Balance */}
          {selectedAccount && (
            <div className="bg-slate-900 rounded-lg p-4">
              <div className="text-slate-400 text-sm mb-1">Current Balance</div>
              <div className="text-2xl font-bold text-white">
                ${parseFloat(selectedAccount.balance || 0).toFixed(2)}
              </div>
              <div className="text-slate-400 text-xs mt-1">
                {selectedAccount.accountName} • {selectedAccount.accountNumber}
              </div>
            </div>
          )}

          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Transaction Type *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'CREDIT' }))}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  formData.type === 'CREDIT'
                    ? 'bg-green-500/10 border-green-500 text-green-400'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <ArrowDownLeft className="w-5 h-5" />
                <span className="font-semibold">Credit</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'DEBIT' }))}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  formData.type === 'DEBIT'
                    ? 'bg-red-500/10 border-red-500 text-red-400'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <ArrowUpRight className="w-5 h-5" />
                <span className="font-semibold">Debit</span>
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {formData.type === 'CREDIT' ? 'Add money to user account' : 'Remove money from user account'}
            </p>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Amount *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 text-lg font-semibold"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description/Reason *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter reason for this transaction..."
              rows="3"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Preview */}
          {formData.amount && parseFloat(formData.amount) > 0 && selectedAccount && (
            <div className="bg-slate-900 rounded-lg p-4 border-2 border-dashed border-slate-700">
              <div className="text-slate-400 text-sm mb-2">New Balance Preview</div>
              <div className="text-2xl font-bold text-white">
                ${(
                  parseFloat(selectedAccount.balance || 0) + 
                  (formData.type === 'CREDIT' ? parseFloat(formData.amount) : -parseFloat(formData.amount))
                ).toFixed(2)}
              </div>
              <div className={`text-sm mt-1 ${formData.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                {formData.type === 'CREDIT' ? '+' : '-'}${parseFloat(formData.amount).toFixed(2)}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-6 py-3 rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
                formData.type === 'CREDIT'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isSubmitting ? 'Processing...' : `${formData.type === 'CREDIT' ? 'Credit' : 'Debit'} $${formData.amount || '0.00'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreditDebitModal;
