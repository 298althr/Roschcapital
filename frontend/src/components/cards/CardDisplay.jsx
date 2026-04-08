import React, { useState } from 'react';
import { CreditCard, Lock, Unlock, Eye, Snowflake, DollarSign, Key } from 'lucide-react';
import ChangePINModal from '../modals/ChangePINModal';

const CardDisplay = ({ card, type = 'debit', onViewDetails, onFreeze, onUnfreeze, onFund }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showChangePINModal, setShowChangePINModal] = useState(false);

  const getCardGradient = () => {
    if (card.isFrozen) return 'from-slate-600 to-slate-700';
    if (type === 'credit') return 'from-purple-600 to-indigo-700';
    return 'from-blue-600 to-cyan-700';
  };

  const getStatusBadge = () => {
    if (card.isFrozen) {
      return <span className="px-2 py-1 bg-blue-400/20 text-blue-300 text-xs rounded-full flex items-center gap-1">
        <Snowflake className="w-3 h-3" /> Frozen
      </span>;
    }
    if (type === 'credit' && card.approvalStatus === 'PENDING') {
      return <span className="px-2 py-1 bg-yellow-400/20 text-yellow-300 text-xs rounded-full">Pending Approval</span>;
    }
    if (type === 'credit' && card.approvalStatus === 'DECLINED') {
      return <span className="px-2 py-1 bg-red-400/20 text-red-300 text-xs rounded-full">Declined</span>;
    }
    if (card.isActive) {
      return <span className="px-2 py-1 bg-green-400/20 text-green-300 text-xs rounded-full">Active</span>;
    }
    return <span className="px-2 py-1 bg-slate-400/20 text-slate-300 text-xs rounded-full">Inactive</span>;
  };

  return (
    <div className="relative">
      {/* Card - Standard Credit Card Ratio 1.586:1 (85.6mm x 53.98mm) */}
      <div 
        className={`relative w-full aspect-[1.586/1] rounded-2xl bg-gradient-to-br ${getCardGradient()} p-6 text-white shadow-2xl overflow-hidden`}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>

        {/* Magnetic Stripe */}
        <div className="absolute top-12 left-0 right-0 h-10 bg-black/40" />

        {/* Bank Logo */}
        <div className="absolute top-4 right-6">
          <div className="text-xs font-bold tracking-wider opacity-90">GATWICK</div>
          <div className="text-[10px] opacity-70">BANK</div>
        </div>

        {/* Card Content */}
        <div className="relative h-full flex flex-col justify-between z-10">
          {/* Top Row */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs opacity-70 mb-1">{type === 'credit' ? 'Credit Card' : 'Debit Card'}</p>
              <p className="text-sm font-semibold">{card.cardBrand || 'MASTERCARD'}</p>
            </div>
            {getStatusBadge()}
          </div>

          {/* Card Number */}
          <div>
            {type === 'credit' && card.approvalStatus === 'PENDING' ? (
              <p className="text-2xl font-mono tracking-wider mb-1">
                **** **** **** ****
              </p>
            ) : (
              <p className="text-2xl font-mono tracking-wider mb-1">
                {card.cardNumber || '**** **** **** ****'}
              </p>
            )}
            {type === 'credit' && card.approvalStatus === 'APPROVED' && (
              <div className="flex gap-4 text-xs mt-2">
                <div>
                  <p className="opacity-70">Available</p>
                  <p className="font-semibold">${card.availableCredit?.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="opacity-70">Balance</p>
                  <p className="font-semibold">${card.currentBalance?.toFixed(2) || '0.00'}</p>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Row */}
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs opacity-70">Card Holder</p>
              <p className="text-sm font-semibold uppercase">{card.cardHolderName}</p>
            </div>
            <div className="text-right">
              <p className="text-xs opacity-70">Expires</p>
              <p className="text-sm font-semibold">
                {card.expiryDate ? new Date(card.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }) : 'MM/YY'}
              </p>
            </div>
          </div>
        </div>

        {/* EMV Chip */}
        <div className="absolute top-[4.5rem] left-6 w-12 h-10 bg-gradient-to-br from-yellow-200 to-yellow-400 rounded-md opacity-90 shadow-lg">
          <div className="grid grid-cols-3 gap-[2px] p-1 h-full">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-yellow-600/30 rounded-sm" />
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2">
        {card.isActive && !card.isFrozen && (
          <button
            onClick={() => onViewDetails(card)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
        )}
        
        {card.isActive && !card.isFrozen && (
          <button
            onClick={() => onFreeze(card)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            <Lock className="w-4 h-4" />
            Freeze
          </button>
        )}
        
        {card.isFrozen && (
          <button
            onClick={() => onUnfreeze(card)}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
          >
            <Unlock className="w-4 h-4" />
            Unfreeze
          </button>
        )}

        {type === 'credit' && card.isActive && card.currentBalance > 0 && (
          <button
            onClick={() => onFund(card)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-colors"
          >
            <DollarSign className="w-4 h-4" />
            Make Payment
          </button>
        )}

        {card.isActive && !card.isFrozen && (type === 'credit' ? card.approvalStatus === 'APPROVED' : true) && (
          <button
            onClick={() => setShowChangePINModal(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
          >
            <Key className="w-4 h-4" />
            Change PIN
          </button>
        )}
      </div>

      {/* Credit Card Info */}
      {type === 'credit' && card.approvalStatus === 'DECLINED' && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-sm text-red-400">
            <span className="font-semibold">Declined:</span> {card.declineReason}
          </p>
        </div>
      )}

      {type === 'credit' && card.approvalStatus === 'PENDING' && (
        <div className="mt-3 p-3 bg-slate-800 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">APR:</span>
            <span className="text-white font-semibold">{card.apr || 14}%</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Card details will be visible once approved by admin
          </p>
        </div>
      )}

      {type === 'credit' && card.approvalStatus === 'APPROVED' && card.isActive && (
        <div className="mt-3 p-3 bg-slate-800 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-400">Credit Limit:</span>
            <span className="text-white font-semibold">${card.creditLimit?.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">APR:</span>
            <span className="text-white font-semibold">{card.apr || 14}%</span>
          </div>
          {card.minimumPayment > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-400">Minimum Payment:</span>
              <span className="text-yellow-400 font-semibold">${card.minimumPayment?.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Change PIN Modal */}
      <ChangePINModal
        isOpen={showChangePINModal}
        onClose={() => setShowChangePINModal(false)}
        card={card}
        cardType={type}
      />
    </div>
  );
};

export default CardDisplay;
