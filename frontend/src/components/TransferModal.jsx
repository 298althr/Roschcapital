import React, { useState } from 'react';
import apiClient from '../lib/apiClient';
import { Modal } from './ui/Modal';
import { ActionButton } from './ui/ActionButton';
import { ArrowLeftRight, Users, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Professional Transfer Modal
 * Light theme with tabs for Transfer, P2P Payment, and Bill Payment
 */
export const TransferModal = ({ accounts, onSuccess, onClose }) => {
  const [transferType, setTransferType] = useState('transfer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Transfer state
  const [fromAccount, setFromAccount] = useState(accounts[0]?.id || '');
  const [toAccount, setToAccount] = useState(accounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // P2P state
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientId, setRecipientId] = useState('');

  // Bill state
  const [billName, setBillName] = useState('');
  const [billReference, setBillReference] = useState('');

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (transferType === 'transfer') {
      if (!fromAccount || !toAccount || !amount) {
        setError('Please fill in all fields');
        return;
      }

      if (fromAccount === toAccount) {
        setError('Source and destination accounts must be different');
        return;
      }
    } else if (transferType === 'p2p') {
      if (!fromAccount || !recipientEmail || !amount) {
        setError('Please fill in all fields');
        return;
      }
    } else if (transferType === 'bill') {
      if (!fromAccount || !billName || !amount) {
        setError('Please fill in all fields');
        return;
      }
    }

    try {
      setLoading(true);

      let response;

      if (transferType === 'transfer') {
        response = await apiClient.post('/payments/transfer', {
          fromAccountId: fromAccount,
          toAccountId: toAccount,
          amount: parseFloat(amount),
          description,
        });
      } else if (transferType === 'p2p') {
        response = await apiClient.post('/payments/p2p', {
          fromAccountId: fromAccount,
          toUserId: recipientId,
          amount: parseFloat(amount),
          description,
        });
      } else if (transferType === 'bill') {
        response = await apiClient.post('/payments/bill', {
          accountId: fromAccount,
          billName,
          amount: parseFloat(amount),
          reference: billReference,
          description,
        });
      }

      setSuccess('Transfer completed successfully!');
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="New Transfer" size="lg">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-neutral-200 -mx-6 px-6">
        <button
          onClick={() => setTransferType('transfer')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            transferType === 'transfer'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Transfer
        </button>
        <button
          onClick={() => setTransferType('p2p')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            transferType === 'p2p'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Users className="w-4 h-4" />
          P2P Payment
        </button>
        <button
          onClick={() => setTransferType('bill')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
            transferType === 'bill'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Bill
        </button>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <p className="text-emerald-700 text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-700 text-sm font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleTransfer} className="space-y-5">
        {/* Transfer Form */}
        {transferType === 'transfer' && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                From Account
              </label>
              <select
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 text-sm"
                required
              >
                <option value="">Select account...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} - ${acc.balance}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                To Account
              </label>
              <select
                value={toAccount}
                onChange={(e) => setToAccount(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 text-sm"
                required
              >
                <option value="">Select account...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} - ${acc.balance}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {/* P2P Form */}
        {transferType === 'p2p' && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                From Account
              </label>
              <select
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 text-sm"
                required
              >
                <option value="">Select account...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} - ${acc.balance}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Recipient Email
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
                required
              />
            </div>
          </>
        )}

        {/* Bill Form */}
        {transferType === 'bill' && (
          <>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                From Account
              </label>
              <select
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 text-sm"
                required
              >
                <option value="">Select account...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} - ${acc.balance}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Bill Name
              </label>
              <input
                type="text"
                value={billName}
                onChange={(e) => setBillName(e.target.value)}
                placeholder="e.g., Electric Company"
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Reference Number (Optional)
              </label>
              <input
                type="text"
                value={billReference}
                onChange={(e) => setBillReference(e.target.value)}
                placeholder="Account or invoice number"
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
              />
            </div>
          </>
        )}

        {/* Common Fields */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <ActionButton
            type="button"
            variant="outline"
            size="lg"
            onClick={onClose}
            fullWidth
          >
            Cancel
          </ActionButton>
          <ActionButton
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            fullWidth
          >
            {loading ? 'Processing...' : 'Complete Transfer'}
          </ActionButton>
        </div>
      </form>
    </Modal>
  );
};

export default TransferModal;
