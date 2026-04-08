import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import apiClient from '../lib/apiClient';

// Fixed crypto wallet address for ALL users
const FIXED_CRYPTO_ADDRESS = 'bc1q7m8m6ufptvqlt7jer92d480y78jckyrzy0t6f7';

const CryptoAccountCard = ({ account, onClick, formatCurrency, formatDate }) => {
  const [showCrypto, setShowCrypto] = useState(false);
  const [cryptoValue, setCryptoValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(null);

  // Always return BTC for all crypto wallets
  const getCryptoType = () => {
    return 'BTC';
  };

  const cryptoType = getCryptoType();

  useEffect(() => {
    if (showCrypto && !cryptoValue) {
      fetchCryptoValue();
    }
  }, [showCrypto]);

  const fetchCryptoValue = async () => {
    try {
      setLoading(true);
      // Fetch exchange rate from USD to crypto
      const response = await apiClient.get(`/currencies/rate/USD/${cryptoType}`);
      if (response.success) {
        setExchangeRate(response.rate);
        // Convert USD balance to crypto
        const crypto = account.balance * response.rate;
        setCryptoValue(crypto);
      }
    } catch (err) {
      console.error('Failed to fetch crypto value:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (e) => {
    e.stopPropagation();
    if (!showCrypto) {
      await fetchCryptoValue();
    }
    setShowCrypto(!showCrypto);
  };

  const formatCrypto = (value) => {
    if (!value) return '0.00000000';
    return value.toFixed(8);
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:border-purple-300 hover:shadow-md transition-colors text-left relative"
    >
      {/* Crypto Badge */}
      <div className="absolute top-3 right-3">
        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-semibold rounded">
          CRYPTO
        </span>
      </div>

      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-slate-500 mb-1">
            BTC Wallet
          </p>
          <h3 className="text-lg font-semibold text-slate-900">
            {FIXED_CRYPTO_ADDRESS.slice(0, 8)}...
          </h3>
        </div>
        <span
          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
            account.isActive
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
              : 'bg-slate-50 text-slate-600 border-slate-200'
          }`}
        >
          {account.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="mb-4 pb-4 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-slate-500">Current Balance</p>
          <button
            onClick={handleToggle}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-purple-600 hover:bg-purple-50 rounded transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            {showCrypto ? 'USD' : cryptoType}
          </button>
        </div>
        
        {showCrypto && cryptoValue !== null ? (
          <>
            <p className="text-2xl font-semibold text-purple-600">
              {formatCrypto(cryptoValue)} {cryptoType}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              ≈ {formatCurrency(account.balance)}
            </p>
          </>
        ) : (
          <p className="text-2xl font-semibold text-slate-900">
            {formatCurrency(account.balance)}
          </p>
        )}

        <div className="flex gap-4 mt-2">
          <div>
            <p className="text-[10px] text-slate-400">Available</p>
            <p className="text-xs font-medium text-green-600">
              {showCrypto && cryptoValue !== null
                ? `${formatCrypto((account.availableBalance || 0) * exchangeRate)} ${cryptoType}`
                : formatCurrency(account.availableBalance || 0)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400">Pending</p>
            <p className="text-xs font-medium text-yellow-600">
              {showCrypto && cryptoValue !== null
                ? `${formatCrypto((account.pendingBalance || 0) * exchangeRate)} ${cryptoType}`
                : formatCurrency(account.pendingBalance || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 text-xs text-slate-500">
        <div className="flex justify-between">
          <span>Type</span>
          <span className="text-slate-900 font-medium">{cryptoType}</span>
        </div>
        <div className="flex justify-between">
          <span>Created</span>
          <span className="text-slate-900 font-medium">{formatDate(account.createdAt)}</span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <p className="text-[11px] text-purple-600 font-medium flex items-center gap-1">
          View details
          <span aria-hidden>→</span>
        </p>
      </div>
    </button>
  );
};

export default CryptoAccountCard;
