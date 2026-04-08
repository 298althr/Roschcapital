import React from 'react';
import { X, User, Mail, Phone, MapPin, Wallet, CreditCard } from 'lucide-react';

const ProfileAvatarModal = ({ isOpen, onClose, user, accounts }) => {
  if (!isOpen) return null;

  const totalBalance = accounts?.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0) || 0;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header with Avatar */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 ring-4 ring-white/30 overflow-hidden">
              {user?.profilePhoto ? (
                <img
                  src={user.profilePhoto.startsWith('data:') || user.profilePhoto.startsWith('http') ? user.profilePhoto : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || ''}${user.profilePhoto}`}
                  alt={user?.firstName}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-1">
              {user?.firstName} {user?.lastName}
            </h2>
            <p className="text-white/80 text-sm">Account Holder</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-indigo-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500">Email</p>
                  <p className="text-sm font-medium text-slate-900 truncate">{user?.email}</p>
                </div>
              </div>
              {user?.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-sm font-medium text-slate-900">{user.phone}</p>
                  </div>
                </div>
              )}
              {(user?.address || user?.city || user?.state) && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-indigo-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-xs text-slate-500">Address</p>
                    <p className="text-sm font-medium text-slate-900">
                      {[user?.address, user?.city, user?.state, user?.zipCode].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Account Balances */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Wallet className="w-4 h-4" />
              Account Balances
            </h3>
            
            {/* Total Balance */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 mb-3">
              <p className="text-white/80 text-xs mb-1">Total Balance</p>
              <p className="text-white text-2xl font-bold">
                ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Individual Accounts */}
            <div className="space-y-2">
              {accounts?.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      account.accountType === 'SAVINGS' ? 'bg-green-100' :
                      account.accountType === 'CHECKING' ? 'bg-blue-100' :
                      'bg-purple-100'
                    }`}>
                      <CreditCard className={`w-4 h-4 ${
                        account.accountType === 'SAVINGS' ? 'text-green-600' :
                        account.accountType === 'CHECKING' ? 'text-blue-600' :
                        'text-purple-600'
                      }`} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 capitalize">{account.accountType?.toLowerCase()}</p>
                      <p className="text-xs font-mono text-slate-600">{account.accountNumber}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      ${parseFloat(account.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-slate-500">{account.currency || 'USD'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all font-medium shadow-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileAvatarModal;
