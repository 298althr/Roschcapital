import React, { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { BrandFeedbackModal } from './BrandFeedbackModal';

const ChangePINModal = ({ isOpen, onClose, card, cardType }) => {
  const [currentPIN, setCurrentPIN] = useState('');
  const [newPIN, setNewPIN] = useState('');
  const [confirmPIN, setConfirmPIN] = useState('');
  const [showCurrentPIN, setShowCurrentPIN] = useState(false);
  const [showNewPIN, setShowNewPIN] = useState(false);
  const [showConfirmPIN, setShowConfirmPIN] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (currentPIN.length !== 4 || !/^\d{4}$/.test(currentPIN)) {
      setError('Current PIN must be 4 digits');
      return;
    }

    if (newPIN.length !== 4 || !/^\d{4}$/.test(newPIN)) {
      setError('New PIN must be 4 digits');
      return;
    }

    if (newPIN !== confirmPIN) {
      setError('New PIN and confirmation do not match');
      return;
    }

    if (currentPIN === newPIN) {
      setError('New PIN must be different from current PIN');
      return;
    }

    try {
      setLoading(true);
      const endpoint = cardType === 'credit' 
        ? `/cards/credit/${card.id}/change-pin`
        : `/cards/debit/${card.id}/change-pin`;

      await apiClient.put(endpoint, {
        currentPin: currentPIN,
        newPin: newPIN
      });

      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: 'PIN Changed',
        message: 'Your card PIN has been updated successfully'
      });

      // Reset form
      setCurrentPIN('');
      setNewPIN('');
      setConfirmPIN('');
      
      // Close modal after delay
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      console.error('Error changing PIN:', err);
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'PIN Change Failed',
        message: err.response?.data?.error || 'Failed to change PIN. Please check your current PIN and try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Change Card PIN</h3>
                <p className="text-sm text-slate-500">
                  {card?.cardHolderName} •••• {card?.cardNumber?.slice(-4)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Current PIN */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Current PIN
              </label>
              <div className="relative">
                <input
                  type={showCurrentPIN ? 'text' : 'password'}
                  value={currentPIN}
                  onChange={(e) => setCurrentPIN(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  placeholder="••••"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-widest"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPIN(!showCurrentPIN)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showCurrentPIN ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* New PIN */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                New PIN
              </label>
              <div className="relative">
                <input
                  type={showNewPIN ? 'text' : 'password'}
                  value={newPIN}
                  onChange={(e) => setNewPIN(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  placeholder="••••"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-widest"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPIN(!showNewPIN)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showNewPIN ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm New PIN */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm New PIN
              </label>
              <div className="relative">
                <input
                  type={showConfirmPIN ? 'text' : 'password'}
                  value={confirmPIN}
                  onChange={(e) => setConfirmPIN(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  placeholder="••••"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-center text-2xl tracking-widest"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPIN(!showConfirmPIN)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPIN ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>Security Tip:</strong> Choose a PIN that is easy for you to remember but hard for others to guess. Avoid using obvious combinations like 1234 or your birth year.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Changing...' : 'Change PIN'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Feedback Modal */}
      <BrandFeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
      />
    </>
  );
};

export default ChangePINModal;
