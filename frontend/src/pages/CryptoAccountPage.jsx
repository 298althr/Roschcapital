import React, { useState, useEffect } from 'react';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, RefreshCw } from 'lucide-react';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import apiClient from '../lib/apiClient';
import DepositModal from '../components/modals/DepositModal';
import WithdrawalModal from '../components/modals/WithdrawalModal';

// Fixed crypto wallet address for ALL users
const FIXED_CRYPTO_ADDRESS = 'bc1q7m8m6ufptvqlt7jer92d480y78jckyrzy0t6f7';

const CryptoAccountPage = ({ accountId, onBack }) => {
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showCrypto, setShowCrypto] = useState(false);
  const [cryptoValue, setCryptoValue] = useState(null);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [loadingRate, setLoadingRate] = useState(false);

  useEffect(() => {
    fetchAccountDetails();
  }, [accountId]);

  const fetchAccountDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/accounts/${accountId}`);
      if (response.success) {
        setAccount(response.account);
      }
    } catch (err) {
      console.error('Error fetching account:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCryptoType = () => {
    // Always return BTC for all crypto wallets
    return 'BTC';
  };

  const cryptoType = getCryptoType();

  const fetchCryptoValue = async () => {
    try {
      setLoadingRate(true);
      // Get rate: how many USD per 1 BTC
      const response = await apiClient.get(`/currencies/rate/${cryptoType}/USD`);
      if (response.success) {
        // rate = USD per 1 BTC (e.g., 83333)
        setExchangeRate(response.rate);
        // account.balance is in USD, convert to BTC by dividing
        const cryptoAmount = account.balance / response.rate;
        setCryptoValue(cryptoAmount);
      }
    } catch (err) {
      console.error('Failed to fetch crypto value:', err);
    } finally {
      setLoadingRate(false);
    }
  };

  const handleToggle = async () => {
    if (!showCrypto) {
      await fetchCryptoValue();
    }
    setShowCrypto(!showCrypto);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatCrypto = (value) => {
    if (!value) return '0.00000000';
    return value.toFixed(8);
  };

  if (loading) {
    return (
      <UserDashboardLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </UserDashboardLayout>
    );
  }

  if (!account) {
    return (
      <UserDashboardLayout>
        <div className="max-w-4xl mx-auto">
          <p className="text-neutral-500">Account not found</p>
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Crypto Wallet</h2>
            <p className="text-sm text-slate-500 mt-1">BTC Wallet</p>
          </div>
          <button
            onClick={onBack}
            className="text-purple-600 hover:text-purple-700 transition duration-200 flex items-center gap-2 font-medium"
          >
            ← Back
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-purple-100 text-sm mb-2 font-medium">Total Balance</p>
              {showCrypto && cryptoValue !== null ? (
                <>
                  <h3 className="text-5xl font-bold mb-2">{formatCrypto(cryptoValue)} {cryptoType}</h3>
                  <p className="text-purple-200 text-lg">≈ {formatCurrency(account.balance)}</p>
                </>
              ) : (
                <h3 className="text-5xl font-bold">{formatCurrency(account.balance)}</h3>
              )}
            </div>
            <button
              onClick={handleToggle}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRate ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">{showCrypto ? 'USD' : cryptoType}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-xs text-purple-100 mb-1">Available</p>
              <p className="text-xl font-semibold">
                {/* For crypto wallets: Available = Total Balance - Pending */}
                {showCrypto && cryptoValue !== null && exchangeRate
                  ? `${formatCrypto((account.balance - (account.pendingBalance || 0)) / exchangeRate)} ${cryptoType}`
                  : formatCurrency(account.balance - (account.pendingBalance || 0))}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-xs text-purple-100 mb-1">Pending</p>
              <p className="text-xl font-semibold">
                {showCrypto && cryptoValue !== null && exchangeRate
                  ? `${formatCrypto((account.pendingBalance || 0) / exchangeRate)} ${cryptoType}`
                  : formatCurrency(account.pendingBalance || 0)}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-xs text-purple-100 mb-1">Wallet Address</p>
            <p className="text-sm font-mono break-all">{FIXED_CRYPTO_ADDRESS}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setShowDepositModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition duration-200 shadow-lg flex items-center justify-center gap-3"
          >
            <ArrowDownLeft className="w-5 h-5" />
            <span>Buy {cryptoType}</span>
          </button>
          <button
            onClick={() => setShowWithdrawalModal(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-6 rounded-xl transition duration-200 shadow-lg flex items-center justify-center gap-3"
          >
            <ArrowUpRight className="w-5 h-5" />
            <span>Sell {cryptoType}</span>
          </button>
        </div>

        {/* Account Info */}
        <div className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4 shadow-sm">
          <h3 className="text-lg font-semibold text-neutral-900">Account Information</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-neutral-100">
              <span className="text-neutral-600 text-sm">Type</span>
              <span className="text-neutral-900 font-medium">{cryptoType} Wallet</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-neutral-100">
              <span className="text-neutral-600 text-sm">Currency</span>
              <span className="text-neutral-900 font-medium">USD</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-neutral-600 text-sm">Status</span>
              <span className={`font-medium px-3 py-1 rounded-full text-sm ${account.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {account.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex gap-3">
            <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-900 mb-1">About Crypto Trading</p>
              <p className="text-xs text-purple-700">
                Buy crypto by depositing funds through our payment gateways. Sell crypto by withdrawing to your preferred payment method. All transactions are processed securely.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Deposit Modal - Auto-select crypto gateway */}
      {showDepositModal && (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          preSelectedAccount={accountId}
          filterGatewayType="CRYPTO"
        />
      )}

      {/* Withdrawal Modal - Auto-select crypto gateway */}
      {showWithdrawalModal && (
        <WithdrawalModal
          isOpen={showWithdrawalModal}
          onClose={() => setShowWithdrawalModal(false)}
          preSelectedAccount={accountId}
          filterGatewayType="CRYPTO"
        />
      )}
    </UserDashboardLayout>
  );
};

export default CryptoAccountPage;
