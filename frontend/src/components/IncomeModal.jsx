import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { TrendingUp, TrendingDown, Calendar, DollarSign } from 'lucide-react';

/**
 * Income Details Modal
 * Shows detailed income breakdown, trends, and sources
 */
export const IncomeModal = ({ isOpen, onClose }) => {
  const [timeRange, setTimeRange] = useState('12m'); // 1m, 3m, 6m, 12m

  // Mock income data - would come from API
  const incomeData = {
    total: 48200,
    thisMonth: 4700,
    lastMonth: 4200,
    change: 11.9,
    sources: [
      { name: 'Salary', amount: 3500, percentage: 74.5, trend: 0, color: 'bg-blue-500' },
      { name: 'Freelance', amount: 850, percentage: 18.1, trend: 15.2, color: 'bg-purple-500' },
      { name: 'Investments', amount: 250, percentage: 5.3, trend: -5.8, color: 'bg-emerald-500' },
      { name: 'Other', amount: 100, percentage: 2.1, trend: 8.3, color: 'bg-amber-500' },
    ],
    monthlyData: [
      { month: 'Jan', amount: 2800, salary: 2400, freelance: 300, investments: 100 },
      { month: 'Feb', amount: 3500, salary: 3000, freelance: 400, investments: 100 },
      { month: 'Mar', amount: 3200, salary: 2800, freelance: 300, investments: 100 },
      { month: 'Apr', amount: 4000, salary: 3500, freelance: 400, investments: 100 },
      { month: 'May', amount: 3600, salary: 3200, freelance: 300, investments: 100 },
      { month: 'Jun', amount: 4500, salary: 3500, freelance: 800, investments: 200 },
      { month: 'Jul', amount: 4200, salary: 3500, freelance: 600, investments: 100 },
      { month: 'Aug', amount: 3900, salary: 3500, freelance: 300, investments: 100 },
      { month: 'Sep', amount: 4400, salary: 3500, freelance: 700, investments: 200 },
      { month: 'Oct', amount: 4100, salary: 3500, freelance: 500, investments: 100 },
      { month: 'Nov', amount: 4700, salary: 3500, freelance: 900, investments: 300 },
      { month: 'Dec', amount: 4000, salary: 3500, freelance: 400, investments: 100 },
    ],
  };

  const maxIncome = Math.max(...incomeData.monthlyData.map(d => d.amount));

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Income Analysis">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <p className="text-xs text-blue-600 font-medium mb-1">Total Income (12M)</p>
            <p className="text-2xl font-bold text-blue-900">${incomeData.total.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
            <p className="text-xs text-emerald-600 font-medium mb-1">This Month</p>
            <p className="text-2xl font-bold text-emerald-900">${incomeData.thisMonth.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <p className="text-xs text-purple-600 font-medium mb-1">Growth</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <p className="text-2xl font-bold text-purple-900">+{incomeData.change}%</p>
            </div>
          </div>
        </div>

        {/* Income Sources */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Income Sources</h3>
          <div className="space-y-3">
            {incomeData.sources.map((source, idx) => (
              <div key={idx} className="bg-neutral-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${source.color}`}></div>
                    <span className="text-sm font-medium text-neutral-900">{source.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-neutral-900">
                      ${source.amount.toLocaleString()}
                    </span>
                    {source.trend !== 0 && (
                      <div className={`flex items-center gap-0.5 ${source.trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {source.trend > 0 ? (
                          <TrendingUp className="w-3 h-3" />
                        ) : (
                          <TrendingDown className="w-3 h-3" />
                        )}
                        <span className="text-xs font-semibold">
                          {source.trend > 0 ? '+' : ''}{source.trend}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${source.color} transition-all duration-500`}
                    style={{ width: `${source.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">{source.percentage}% of total income</p>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">12-Month Trend</h3>
          <div className="bg-neutral-50 rounded-xl p-6">
            <div className="flex items-end justify-between gap-2" style={{ height: '200px' }}>
              {incomeData.monthlyData.map((data, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group" style={{ height: '100%' }}>
                  <div className="w-full relative flex items-end justify-center" style={{ height: 'calc(100% - 20px)' }}>
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300 cursor-pointer hover:from-blue-700 hover:to-blue-500 relative"
                      style={{
                        height: `${(data.amount / maxIncome) * 100}%`,
                        minHeight: '8px',
                      }}
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                        <div className="bg-neutral-900 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xl">
                          <div className="text-center mb-1">{data.month}</div>
                          <div className="text-emerald-400">${data.amount.toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-600 font-medium">{data.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <DollarSign className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900 mb-1">Income Insights</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your income has grown by {incomeData.change}% compared to last month</li>
                <li>• Freelance income is your fastest growing source (+15.2%)</li>
                <li>• Average monthly income: ${(incomeData.total / 12).toFixed(0)}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default IncomeModal;
