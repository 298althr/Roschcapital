import React, { useState, useEffect } from 'react';
import { X, Shield, Copy, Check, Eye, EyeOff } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const BackupCodeModal = ({ isOpen, onClose, cardId, cardType = 'debit' }) => {
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cardDetails, setCardDetails] = useState(null);
  const [showCVV, setShowCVV] = useState(false);
  const [copied, setCopied] = useState({ number: false, cvv: false });
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (cardDetails && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0) {
      handleClose();
    }
  }, [cardDetails, timeLeft]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post(`/cards/${cardType}/${cardId}/details`, {
        backupCode
      });

      if (response.success) {
        setCardDetails(response.card);
        setTimeLeft(30);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid Auth Token');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied({ ...copied, [field]: true });
      setTimeout(() => setCopied({ ...copied, [field]: false }), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClose = () => {
    setBackupCode('');
    setError('');
    setCardDetails(null);
    setShowCVV(false);
    setCopied({ number: false, cvv: false });
    setTimeLeft(30);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Secure Verification</h2>
              <p className="text-sm text-slate-400">Enter Auth Token to view card details</p>
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
        <div className="p-6">
          {!cardDetails ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Warning */}
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                <p className="text-yellow-400 text-sm">
                  <span className="font-semibold">Security Notice:</span> Auth Tokens can only be used once. 
                  Make sure you're in a secure location before viewing sensitive card information.
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Backup Code Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Auth Token <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.replace(/\s/g, ''))}
                  placeholder="Enter 6-digit Auth Token"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white text-center text-2xl font-mono tracking-widest placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  maxLength={6}
                  required
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2">
                  Find your Auth Tokens in your account security settings
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || backupCode.length !== 6}
                className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Verify & View Details
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              {/* Countdown Timer */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-red-400 text-sm text-center">
                  <span className="font-semibold">Auto-closing in {timeLeft}s</span> for security
                </p>
              </div>

              {/* Card Details */}
              <div className="space-y-4">
                {/* Card Number */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-slate-400">Card Number</label>
                    <button
                      onClick={() => copyToClipboard(cardDetails.cardNumber, 'number')}
                      className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      {copied.number ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-white font-mono text-lg tracking-wider">
                    {cardDetails.cardNumber?.match(/.{1,4}/g)?.join(' ')}
                  </p>
                </div>

                {/* CVV */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-slate-400">CVV</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowCVV(!showCVV)}
                        className="text-slate-400 hover:text-white transition-colors"
                      >
                        {showCVV ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(cardDetails.cvv, 'cvv')}
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {copied.cvv ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-white font-mono text-lg">
                    {showCVV ? cardDetails.cvv : '•••'}
                  </p>
                </div>

                {/* Expiry Date */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <label className="text-xs text-slate-400 block mb-2">Expiry Date</label>
                  <p className="text-white font-mono text-lg">
                    {new Date(cardDetails.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}
                  </p>
                </div>

                {/* Card Holder */}
                <div className="bg-slate-900 rounded-lg p-4">
                  <label className="text-xs text-slate-400 block mb-2">Card Holder</label>
                  <p className="text-white text-lg uppercase">{cardDetails.cardHolderName}</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="w-full px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupCodeModal;
