import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { TrendingUp, TrendingDown, Search, X } from 'lucide-react';

/**
 * Market Rates Modal
 * Displays forex, stocks, commodities, crypto, and other market data
 */
export const MarketRatesModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('forex');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock market data - in production, this would come from a real API
  const marketData = {
    forex: [
      { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0856, change: 0.23, changePercent: 0.21 },
      { symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: 1.2734, change: -0.15, changePercent: -0.12 },
      { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: 149.82, change: 0.45, changePercent: 0.30 },
      { symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', price: 0.6523, change: 0.08, changePercent: 0.12 },
      { symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', price: 1.3845, change: -0.12, changePercent: -0.09 },
      { symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', price: 0.8756, change: 0.18, changePercent: 0.21 },
      { symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', price: 0.5987, change: -0.05, changePercent: -0.08 },
      { symbol: 'EUR/GBP', name: 'Euro / British Pound', price: 0.8523, change: 0.11, changePercent: 0.13 },
      { symbol: 'EUR/JPY', name: 'Euro / Japanese Yen', price: 162.67, change: 0.89, changePercent: 0.55 },
      { symbol: 'GBP/JPY', name: 'British Pound / Japanese Yen', price: 190.78, change: -0.34, changePercent: -0.18 },
    ],
    stocks: [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 189.95, change: 2.45, changePercent: 1.31 },
      { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.91, change: -1.23, changePercent: -0.32 },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 141.80, change: 3.12, changePercent: 2.25 },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', price: 151.94, change: 1.87, changePercent: 1.24 },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 242.84, change: -5.67, changePercent: -2.28 },
      { symbol: 'META', name: 'Meta Platforms Inc.', price: 484.03, change: 8.45, changePercent: 1.78 },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 495.22, change: 12.34, changePercent: 2.56 },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 157.89, change: 0.98, changePercent: 0.62 },
      { symbol: 'V', name: 'Visa Inc.', price: 258.76, change: 2.11, changePercent: 0.82 },
      { symbol: 'WMT', name: 'Walmart Inc.', price: 163.42, change: -0.56, changePercent: -0.34 },
      { symbol: 'DIS', name: 'The Walt Disney Company', price: 91.23, change: 1.45, changePercent: 1.61 },
      { symbol: 'NFLX', name: 'Netflix Inc.', price: 487.55, change: 6.78, changePercent: 1.41 },
    ],
    crypto: [
      { symbol: 'BTC', name: 'Bitcoin', price: 43567.89, change: 1234.56, changePercent: 2.92 },
      { symbol: 'ETH', name: 'Ethereum', price: 2289.45, change: -45.67, changePercent: -1.96 },
      { symbol: 'BNB', name: 'Binance Coin', price: 312.78, change: 8.90, changePercent: 2.93 },
      { symbol: 'XRP', name: 'Ripple', price: 0.6234, change: 0.0123, changePercent: 2.01 },
      { symbol: 'ADA', name: 'Cardano', price: 0.4567, change: -0.0089, changePercent: -1.91 },
      { symbol: 'SOL', name: 'Solana', price: 98.76, change: 3.45, changePercent: 3.62 },
      { symbol: 'DOT', name: 'Polkadot', price: 5.89, change: 0.12, changePercent: 2.08 },
      { symbol: 'MATIC', name: 'Polygon', price: 0.8934, change: -0.0234, changePercent: -2.55 },
      { symbol: 'AVAX', name: 'Avalanche', price: 36.78, change: 1.23, changePercent: 3.46 },
      { symbol: 'LINK', name: 'Chainlink', price: 14.56, change: 0.45, changePercent: 3.19 },
    ],
    commodities: [
      { symbol: 'GOLD', name: 'Gold', price: 2034.50, change: 12.30, changePercent: 0.61 },
      { symbol: 'SILVER', name: 'Silver', price: 24.87, change: -0.34, changePercent: -1.35 },
      { symbol: 'OIL', name: 'Crude Oil WTI', price: 78.45, change: 1.23, changePercent: 1.59 },
      { symbol: 'BRENT', name: 'Brent Crude Oil', price: 82.67, change: 0.89, changePercent: 1.09 },
      { symbol: 'NATGAS', name: 'Natural Gas', price: 2.456, change: -0.078, changePercent: -3.08 },
      { symbol: 'COPPER', name: 'Copper', price: 3.845, change: 0.056, changePercent: 1.48 },
      { symbol: 'PLATINUM', name: 'Platinum', price: 912.34, change: 5.67, changePercent: 0.63 },
      { symbol: 'PALLADIUM', name: 'Palladium', price: 1023.45, change: -12.34, changePercent: -1.19 },
      { symbol: 'WHEAT', name: 'Wheat', price: 612.50, change: 8.90, changePercent: 1.47 },
      { symbol: 'CORN', name: 'Corn', price: 478.25, change: -3.45, changePercent: -0.72 },
    ],
    indices: [
      { symbol: 'SPX', name: 'S&P 500', price: 4567.89, change: 23.45, changePercent: 0.52 },
      { symbol: 'DJI', name: 'Dow Jones Industrial Average', price: 36789.12, change: -45.67, changePercent: -0.12 },
      { symbol: 'IXIC', name: 'NASDAQ Composite', price: 14234.56, change: 89.34, changePercent: 0.63 },
      { symbol: 'FTSE', name: 'FTSE 100', price: 7523.45, change: 12.34, changePercent: 0.16 },
      { symbol: 'DAX', name: 'DAX', price: 16234.78, change: 56.78, changePercent: 0.35 },
      { symbol: 'N225', name: 'Nikkei 225', price: 33456.89, change: -123.45, changePercent: -0.37 },
      { symbol: 'HSI', name: 'Hang Seng Index', price: 17890.23, change: 234.56, changePercent: 1.33 },
      { symbol: 'SSEC', name: 'Shanghai Composite', price: 3123.45, change: 45.67, changePercent: 1.48 },
    ],
  };

  const tabs = [
    { id: 'forex', label: 'Forex', count: marketData.forex.length },
    { id: 'stocks', label: 'Stocks', count: marketData.stocks.length },
    { id: 'crypto', label: 'Crypto', count: marketData.crypto.length },
    { id: 'commodities', label: 'Commodities', count: marketData.commodities.length },
    { id: 'indices', label: 'Indices', count: marketData.indices.length },
  ];

  const activeData = marketData[activeTab] || [];
  
  const filteredData = activeData.filter(item =>
    item.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Mini sparkline generator
  const generateSparkline = (isPositive) => {
    const points = isPositive
      ? [20, 18, 15, 17, 12, 10, 8, 5]
      : [5, 8, 10, 12, 15, 17, 18, 20];
    
    return points.map((y, i) => `${i * 12},${y}`).join(' ');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Market Rates">
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search markets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-neutral-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-neutral-400">({tab.count})</span>
            </button>
          ))}
        </div>

        {/* Market Data Table */}
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase">Symbol</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-neutral-600 uppercase">Name</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600 uppercase">Price</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600 uppercase">Change</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-neutral-600 uppercase">Chart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredData.map((item, idx) => {
                const isPositive = item.change >= 0;
                return (
                  <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                    <td className="py-3 px-4">
                      <span className="text-sm font-semibold text-neutral-900">{item.symbol}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-neutral-600">{item.name}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm font-semibold text-neutral-900">
                        ${item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {isPositive ? (
                          <TrendingUp className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {isPositive ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <svg width="80" height="24" className="inline-block">
                        <polyline
                          points={generateSparkline(isPositive)}
                          fill="none"
                          stroke={isPositive ? '#10B981' : '#EF4444'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-sm">No results found for "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="pt-4 border-t border-neutral-200">
          <p className="text-xs text-neutral-500 text-center">
            Market data is for informational purposes only. Prices update every 60 seconds.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export default MarketRatesModal;
