import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';

/**
 * AccountDetailsComponent - Shows detailed information about a specific account
 * Mobile-first, responsive design with dark theme
 */
export const AccountDetailsComponent = ({ accountId, onBack }) => {
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        setLoading(true);
        const accountRes = await apiClient.get(`/accounts/${accountId}`);

        if (accountRes.success) {
          setAccount(accountRes.account);
        } else {
          setError('Failed to load account details');
        }
      } catch (err) {
        console.error('Error fetching account details:', err);
        setError('Unable to load account information');
      } finally {
        setLoading(false);
      }
    };

    fetchAccountDetails();
  }, [accountId]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const maskAccountNumber = (accountNumber) => {
    const last4 = accountNumber.slice(-4);
    return `••${last4}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
        {error}
      </div>
    );
  }

  if (!account) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-8 text-center shadow-sm">
        <p className="text-neutral-500">Account not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-primary-600 hover:text-primary-700 transition duration-200 flex items-center gap-2 font-medium"
        >
          ← Back
        </button>
      </div>

      {/* Main Balance Card */}
      <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl p-8 text-white shadow-xl">
        <p className="text-primary-100 text-sm mb-2 font-medium">Account Balance</p>
        <h3 className="text-5xl font-bold mb-6">{formatCurrency(account.balance)}</h3>
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-primary-100 mb-1">Account Number</p>
            <p className="text-base font-mono text-white">{maskAccountNumber(account.accountNumber)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-primary-100 mb-1">{account.currency}</p>
            <p className={`text-sm font-semibold px-3 py-1 rounded-full ${account.isActive ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {account.isActive ? 'Active' : 'Inactive'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Only Overview */}
      <div className="bg-neutral-100 p-1 rounded-xl">
        <div className="bg-white text-neutral-900 shadow-sm py-2.5 px-4 rounded-lg font-medium text-sm text-center">
          Overview
        </div>
      </div>

      {/* Overview Content */}
      <div className="space-y-4">
          {/* Account Info */}
          <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4 shadow-sm">
            <h3 className="text-lg font-semibold text-neutral-900">Account Information</h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <span className="text-neutral-600 text-sm">Type</span>
                <span className="text-neutral-900 font-medium capitalize">{account.accountType.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-neutral-100">
                <span className="text-neutral-600 text-sm">Currency</span>
                <span className="text-neutral-900 font-medium">{account.currency}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-neutral-600 text-sm">Status</span>
                <span className={`font-medium px-3 py-1 rounded-full text-sm ${account.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {account.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Cards Associated */}
          {account.cards && account.cards.length > 0 && (
            <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4 shadow-sm">
              <h3 className="text-lg font-semibold text-neutral-900">Associated Cards ({account.cards.length})</h3>

              <div className="space-y-3">
                {account.cards.map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between bg-neutral-50 rounded-lg p-4 hover:bg-neutral-100 transition duration-200 cursor-pointer group"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-neutral-900 capitalize">{card.cardType} Card</p>
                      <p className="text-xs text-neutral-600">
                        •••• •••• •••• {card.cardNumber.slice(-4)} | Limit: ${card.dailyLimit.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          card.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {card.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {card.isFrozen && (
                        <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                          Frozen
                        </span>
                      )}
                      <span className="text-neutral-400 group-hover:text-primary-600 transition duration-200">→</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/payments')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-sm"
            >
              Transfer Money
            </button>
            <button 
              onClick={() => navigate('/cards')}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-sm"
            >
              Add Card
            </button>
          </div>
        </div>
      )
    </div>
  );
};

export default AccountDetailsComponent;
