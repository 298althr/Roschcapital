import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import apiClient from '../lib/apiClient';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';

const MarketsPage = () => {
  const [activeTab, setActiveTab] = useState('CRYPTO');
  const [prices, setPrices] = useState({});
  const [portfolio, setPortfolio] = useState({ holdings: [], totalValue: 0 });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [tradeType, setTradeType] = useState('buy');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [amount, setAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab) {
      fetchPrices(activeTab);
    }
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsRes, portfolioRes] = await Promise.all([
        apiClient.get('/accounts'),
        apiClient.get('/markets/portfolio')
      ]);

      if (accountsRes.success) {
        setAccounts(accountsRes.accounts || []);
        if (accountsRes.accounts?.length > 0) {
          setAccountId(accountsRes.accounts[0].id);
        }
      }
      if (portfolioRes.success) setPortfolio(portfolioRes);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrices = async (assetType) => {
    try {
      const response = await apiClient.get(`/markets/prices?assetType=${assetType}`);
      if (response.success) {
        setPrices(response.prices);
      }
    } catch (err) {
      console.error('Error fetching prices:', err);
    }
  };

  const handleTrade = (asset, symbol, type) => {
    setSelectedAsset({ ...asset, symbol, assetType: activeTab });
    setTradeType(type);
    setAmount('');
    setError('');
    setShowTradeModal(true);
  };

  const executeTrade = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      const endpoint = tradeType === 'buy' ? '/markets/buy' : '/markets/sell';
      const response = await apiClient.post(endpoint, {
        assetType: selectedAsset.assetType,
        symbol: selectedAsset.symbol,
        amount: parseFloat(amount),
        accountId
      });

      if (response.success) {
        setShowTradeModal(false);
        fetchData();
        fetchPrices(activeTab);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Trade failed');
    } finally {
      setProcessing(false);
    }
  };

  const tabs = [
    { id: 'CRYPTO', label: 'Crypto', icon: '₿' },
    { id: 'FOREX', label: 'Forex', icon: '€' },
    { id: 'COMMODITIES', label: 'Commodities', icon: '🥇' },
    { id: 'STOCKS', label: 'Stocks', icon: '📈' }
  ];

  const selectedAccount = accounts.find(a => a.id === accountId);
  const totalCost = selectedAsset ? parseFloat(amount || 0) * selectedAsset.price : 0;

  return (
    <UserDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Money Markets</h2>
          <p className="text-sm text-slate-500 mt-1">Trade crypto, forex, commodities, and stocks</p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
            <p className="text-sm opacity-90">Portfolio Value</p>
            <p className="text-3xl font-bold mt-2">${portfolio.totalValue?.toFixed(2) || '0.00'}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <p className="text-sm text-slate-500">Total Invested</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              ${portfolio.totalInvested?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <p className="text-sm text-slate-500">Holdings</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{portfolio.holdings?.length || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {/* Market Prices */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(prices).map(([symbol, data]) => (
              <div key={symbol} className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{symbol}</h3>
                    <p className="text-2xl font-bold text-slate-900 mt-1">
                      ${data.price.toLocaleString()}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                    data.change24h >= 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {data.change24h >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {Math.abs(data.change24h).toFixed(2)}%
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTrade(data, symbol, 'buy')}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => handleTrade(data, symbol, 'sell')}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Sell
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Holdings */}
        {portfolio.holdings?.length > 0 && (
          <div className="bg-white rounded-xl p-6 border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Holdings</h3>
            <div className="space-y-3">
              {portfolio.holdings.map((holding, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="font-semibold text-slate-900">{holding.symbol}</p>
                    <p className="text-sm text-slate-500">{holding.quantity} units</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">${holding.currentValue.toFixed(2)}</p>
                    <p className={`text-sm ${holding.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {holding.profitLoss >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trade Modal */}
      {showTradeModal && selectedAsset && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">
                {tradeType === 'buy' ? 'Buy' : 'Sell'} {selectedAsset.symbol}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Current Price: ${selectedAsset.price.toLocaleString()}
              </p>
            </div>

            <form onSubmit={executeTrade} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Account
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.accountType} ••••{account.accountNumber.slice(-4)} (${parseFloat(account.availableBalance || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Amount (units)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
              </div>

              {amount && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-600">Total Cost</span>
                    <span className="font-semibold text-slate-900">${totalCost.toFixed(2)}</span>
                  </div>
                  {tradeType === 'buy' && selectedAccount && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">Available</span>
                      <span className="text-slate-900">${parseFloat(selectedAccount?.availableBalance || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTradeModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing || !amount}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                    tradeType === 'buy'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${selectedAsset.symbol}`
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </UserDashboardLayout>
  );
};

export default MarketsPage;
