import React, { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';

/**
 * ChartComponent - Displays spending analytics and trends
 * Mobile-first, responsive design with dark theme
 */
export const ChartComponent = ({ days = 30 }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState('category'); // 'category' or 'daily'

  useEffect(() => {
    const fetchSpendingSummary = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/transactions/summary/spending?days=${days}`);

        if (response.success) {
          setSummary(response.summary);
        } else {
          setError('Failed to load spending data');
        }
      } catch (err) {
        console.error('Error fetching spending summary:', err);
        setError('Unable to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchSpendingSummary();
  }, [days]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatCategoryChart = (categoryTotals) => {
    if (!categoryTotals || Object.keys(categoryTotals).length === 0) {
      return [];
    }

    return Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount]) => ({
        category,
        amount: parseFloat(amount),
      }));
  };

  const formatDailyChart = (dailyTrend) => {
    if (!dailyTrend || Object.keys(dailyTrend).length === 0) {
      return [];
    }

    return Object.entries(dailyTrend)
      .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
      .slice(-14) // Last 14 days
      .map(([date, amount]) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        amount: parseFloat(amount),
      }));
  };

  const getMaxAmount = (data) => {
    if (!data || data.length === 0) return 1;
    return Math.max(...data.map((d) => d.amount));
  };

  const getBarColor = (index) => {
    const colors = [
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-cyan-500',
      'bg-indigo-500',
    ];
    return colors[index % colors.length];
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
      <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const categoryData = formatCategoryChart(summary?.categoryTotals || {});
  const dailyData = formatDailyChart(summary?.dailyTrend || {});

  const chartData = viewType === 'category' ? categoryData : dailyData;
  const maxAmount = getMaxAmount(chartData);

  return (
    <div className="space-y-4">
      {/* View Type Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewType('category')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition duration-200 ${
            viewType === 'category'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          By Category
        </button>
        <button
          onClick={() => setViewType('daily')}
          className={`flex-1 py-2 px-4 rounded-lg font-semibold transition duration-200 ${
            viewType === 'daily'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
          }`}
        >
          Daily Trend
        </button>
      </div>

      {/* Total Spending Summary */}
      <div className="bg-slate-700 border border-slate-600 rounded-lg p-4">
        <p className="text-slate-400 text-sm mb-1">Total Spending</p>
        <p className="text-3xl font-bold text-white">{formatCurrency(summary?.totalSpent || 0)}</p>
        <p className="text-xs text-slate-400 mt-1">Last {summary?.days || 30} days</p>
      </div>

      {/* Chart */}
      {chartData && chartData.length > 0 ? (
        <div className="bg-slate-700 border border-slate-600 rounded-lg p-4 space-y-4">
          {chartData.map((item, index) => {
            const percentage = maxAmount > 0 ? (item.amount / maxAmount) * 100 : 0;
            const label = viewType === 'category' ? item.category : item.date;

            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-white truncate">{label}</span>
                  <span className="text-sm text-slate-300 flex-shrink-0">
                    {formatCurrency(item.amount)}
                  </span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${getBarColor(index)} transition-all duration-300`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-8 text-center">
          <p className="text-slate-400">No spending data available</p>
        </div>
      )}

      {/* Insights */}
      {categoryData.length > 0 && viewType === 'category' && (
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4">
          <p className="text-sm text-slate-300 mb-2">
            Top category: <span className="font-bold text-white">{categoryData[0].category}</span>
          </p>
          <p className="text-xs text-slate-400">
            {formatCurrency(categoryData[0].amount)} spent
          </p>
        </div>
      )}
    </div>
  );
};

export default ChartComponent;
