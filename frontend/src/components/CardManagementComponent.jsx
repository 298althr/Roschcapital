import React, { useState } from 'react';
import apiClient from '../lib/apiClient';

/**
 * CardManagementComponent - Manages a single card
 * Mobile-first, responsive design with dark theme
 */
export const CardManagementComponent = ({ card, onUpdate, onDelete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [newLimit, setNewLimit] = useState(card.dailyLimit);

  const maskCardNumber = (cardNumber) => {
    const last4 = cardNumber.slice(-4);
    return `•••• •••• •••• ${last4}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)}`;
  };

  const formatCardNumber = (cardNumber) => {
    if (!cardNumber) return '•••• •••• •••• ••••';
    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.match(/.{1,4}/g)?.join(' ') || cardNumber;
  };

  const handleFreeze = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.put(`/cards/${card.id}/freeze`);
      if (response.success) {
        onUpdate({ ...card, isFrozen: true });
      } else {
        setError('Failed to freeze card');
      }
    } catch (err) {
      console.error('Error freezing card:', err);
      setError('Unable to freeze card');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfreeze = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.put(`/cards/${card.id}/unfreeze`);
      if (response.success) {
        onUpdate({ ...card, isFrozen: false });
      } else {
        setError('Failed to unfreeze card');
      }
    } catch (err) {
      console.error('Error unfreezing card:', err);
      setError('Unable to unfreeze card');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimit = async () => {
    if (newLimit < 0) {
      setError('Limit must be positive');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.put(`/cards/${card.id}/limit`, {
        dailyLimit: parseFloat(newLimit),
      });
      if (response.success) {
        onUpdate({ ...card, dailyLimit: parseFloat(newLimit) });
        setShowLimitModal(false);
      } else {
        setError('Failed to update limit');
      }
    } catch (err) {
      console.error('Error updating limit:', err);
      setError('Unable to update limit');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate this card?')) return;

    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.put(`/cards/${card.id}/deactivate`);
      if (response.success) {
        onDelete(card.id);
      } else {
        setError('Failed to deactivate card');
      }
    } catch (err) {
      console.error('Error deactivating card:', err);
      setError('Unable to deactivate card');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Realistic Card Display - Using Template Image */}
      <div 
        className="relative rounded-2xl overflow-hidden shadow-2xl"
        style={{ 
          width: '324px', 
          height: '204px',
          fontFamily: "'OCR A Std', 'OCR-A', 'Courier New', monospace"
        }}
      >
        {/* Template background image with color filter for debit cards */}
        <img 
          src="/card-template.png" 
          alt="Card Template" 
          className="absolute inset-0 w-full h-full object-cover"
          style={card.cardType !== 'CREDIT' ? { filter: 'hue-rotate(200deg) saturate(1.2)' } : {}}
        />
        
        {/* Card type label - cover template's "Credit card" text for debit cards */}
        {card.cardType !== 'CREDIT' && (
          <>
            {/* Background to cover the original "Credit card" text */}
            <div 
              className="absolute"
              style={{ 
                top: '8%', 
                right: '4%',
                width: '80px',
                height: '20px',
                background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
                borderRadius: '4px'
              }}
            />
            {/* Debit card text */}
            <div 
              className="absolute text-white"
              style={{ 
                top: '8%', 
                right: '5%',
                fontSize: '12px',
                letterSpacing: '0.05em',
                fontWeight: '400',
                fontFamily: "'OCR B Std', 'OCR-B', 'Courier New', monospace",
                fontStyle: 'italic'
              }}
            >
              Debit card
            </div>
          </>
        )}
        
        {/* Card number - single line, positioned at 50% from top */}
        <div 
          className="absolute text-white whitespace-nowrap"
          style={{ 
            top: '50%', 
            left: '6%',
            fontSize: '16px',
            letterSpacing: '0.14em',
            fontWeight: '400',
            fontFamily: "'OCR A Std', 'OCR-A', 'Courier New', monospace"
          }}
        >
          {formatCardNumber(card.cardNumber)}
        </div>
        
        {/* Expiry date - positioned next to template's VALID THRU */}
        <div 
          className="absolute text-white"
          style={{ 
            top: '66%', 
            left: '68%',
            fontSize: '15px',
            letterSpacing: '0.08em',
            fontWeight: '400',
            fontFamily: "'OCR A Std', 'OCR-A', 'Courier New', monospace"
          }}
        >
          {formatDate(card.expiry)}
        </div>
        
        {/* Cardholder name - positioned at 84% from top */}
        <div 
          className="absolute text-white uppercase whitespace-nowrap"
          style={{ 
            top: '84%', 
            left: '6%',
            fontSize: '13px',
            letterSpacing: '0.18em',
            fontWeight: '400',
            fontFamily: "'OCR A Std', 'OCR-A', 'Courier New', monospace"
          }}
        >
          {card.cardholderName || 'CARDHOLDER NAME'}
        </div>
        
        {/* Status overlay for inactive cards */}
        {!card.isActive && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white text-xl font-bold tracking-wider">INACTIVE</span>
          </div>
        )}
        
        {/* Frozen overlay */}
        {card.isFrozen && (
          <div className="absolute inset-0 bg-blue-900/70 flex items-center justify-center">
            <span className="text-white text-lg font-bold tracking-wider">FROZEN</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Status Info */}
      {card.isFrozen && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-4 py-3 rounded-lg text-sm">
          ⚠️ This card is currently frozen and cannot be used for transactions.
        </div>
      )}

      {/* Card Details */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 space-y-3">
        <h3 className="text-lg font-bold text-white">Card Details</h3>

        <div className="space-y-2">
          <div className="flex justify-between items-center pb-2 border-b border-slate-600">
            <span className="text-slate-400">Status</span>
            <span className={`font-medium ${card.isActive ? 'text-green-400' : 'text-red-400'}`}>
              {card.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-600">
            <span className="text-slate-400">Frozen</span>
            <span className={`font-medium ${card.isFrozen ? 'text-yellow-400' : 'text-green-400'}`}>
              {card.isFrozen ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-600">
            <span className="text-slate-400">Daily Limit</span>
            <span className="text-white font-medium">${parseFloat(card.dailyLimit || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pb-2 border-b border-slate-600">
            <span className="text-slate-400">Created</span>
            <span className="text-white font-medium">{new Date(card.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Last Updated</span>
            <span className="text-white font-medium">{new Date(card.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => setShowLimitModal(true)}
          disabled={loading || !card.isActive}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          Update Daily Limit
        </button>

        {card.isFrozen ? (
          <button
            onClick={handleUnfreeze}
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Unfreeze Card
          </button>
        ) : (
          <button
            onClick={handleFreeze}
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
          >
            Freeze Card
          </button>
        )}

        <button
          onClick={handleDeactivate}
          disabled={loading || !card.isActive}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
        >
          Deactivate Card
        </button>
      </div>

      {/* Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 max-w-sm w-full border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Update Daily Limit</h3>

            <div className="mb-6">
              <label className="block text-slate-300 text-sm font-medium mb-2">
                New Daily Limit (USD)
              </label>
              <input
                type="number"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                min="0"
                step="10"
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateLimit}
                disabled={loading}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
              >
                {loading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardManagementComponent;