import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { TrendingUp, TrendingDown, AlertCircle, ShoppingBag, Utensils, Car, Home } from 'lucide-react';

/**
 * Expenses Details Modal
 * Shows detailed expense breakdown by category with insights
 */
export const ExpensesModal = ({ isOpen, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Mock expenses data
  const expensesData = {
    total: 42000,
    thisMonth: 4200,
    lastMonth: 3900,
    change: 7.7,
    categories: [
      { 
        name: 'Food & Dining', 
        amount: 1470, 
        percentage: 35, 
        trend: 5.2, 
        color: '#F59E0B',
        icon: Utensils,
        transactions: 45,
        avgTransaction: 32.67
      },
      { 
        name: 'Shopping', 
        amount: 1050, 
        percentage: 25, 
        trend: -3.1, 
        color: '#8B5CF6',
        icon: ShoppingBag,
        transactions: 12,
        avgTransaction: 87.50
      },
      { 
        name: 'Transport', 
        amount: 840, 
        percentage: 20, 
        trend: 8.5, 
        color: '#3B82F6',
        icon: Car,
        transactions: 28,
        avgTransaction: 30.00
      },
      { 
        name: 'Bills & Utilities', 
        amount: 840, 
        percentage: 20, 
        trend: 0, 
        color: '#10B981',
        icon: Home,
        transactions: 8,
        avgTransaction: 105.00
      },
    ],
    topExpenses: [
      { name: 'Whole Foods Market', amount: 245.80, category: 'Food & Dining', date: '2 days ago' },
      { name: 'Amazon', amount: 189.99, category: 'Shopping', date: '3 days ago' },
      { name: 'Electric Bill', amount: 156.50, category: 'Bills', date: '5 days ago' },
      { name: 'Uber', amount: 89.40, category: 'Transport', date: '1 week ago' },
      { name: 'Netflix', amount: 15.99, category: 'Entertainment', date: '1 week ago' },
    ],
  };

  // Calculate donut chart segments
  const total = expensesData.categories.reduce((sum, cat) => sum + cat.percentage, 0);
  let currentAngle = -90;
  const segments = expensesData.categories.map(cat => {
    const angle = (cat.percentage / 100) * 360;
    const segment = {
      ...cat,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Expenses Breakdown">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
            <p className="text-xs text-red-600 font-medium mb-1">Total Expenses (12M)</p>
            <p className="text-2xl font-bold text-red-900">${expensesData.total.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-4 border border-amber-200">
            <p className="text-xs text-amber-600 font-medium mb-1">This Month</p>
            <p className="text-2xl font-bold text-amber-900">${expensesData.thisMonth.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <p className="text-xs text-purple-600 font-medium mb-1">Change</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <p className="text-2xl font-bold text-purple-900">+{expensesData.change}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Donut Chart */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">Category Distribution</h3>
            <div className="bg-neutral-50 rounded-xl p-6 flex items-center justify-center">
              <svg width="220" height="220" viewBox="0 0 220 220">
                {/* Background circle */}
                <circle cx="110" cy="110" r="90" fill="none" stroke="#f1f5f9" strokeWidth="28" />
                
                {/* Category segments */}
                {segments.map((segment, idx) => {
                  const startAngle = (segment.startAngle * Math.PI) / 180;
                  const endAngle = (segment.endAngle * Math.PI) / 180;
                  const largeArc = segment.percentage > 50 ? 1 : 0;
                  
                  const x1 = 110 + 90 * Math.cos(startAngle);
                  const y1 = 110 + 90 * Math.sin(startAngle);
                  const x2 = 110 + 90 * Math.cos(endAngle);
                  const y2 = 110 + 90 * Math.sin(endAngle);
                  
                  return (
                    <path
                      key={idx}
                      d={`M 110 110 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={segment.color}
                      opacity="0.9"
                      className="cursor-pointer hover:opacity-100 transition-opacity"
                      onClick={() => setSelectedCategory(segment)}
                    />
                  );
                })}
                
                {/* Center circle */}
                <circle cx="110" cy="110" r="62" fill="white" />
                
                {/* Center text */}
                <text x="110" y="100" textAnchor="middle" className="text-xs fill-neutral-500" fontSize="14">Total</text>
                <text x="110" y="125" textAnchor="middle" className="text-xl font-bold fill-neutral-900" fontSize="24">
                  ${expensesData.thisMonth.toLocaleString()}
                </text>
              </svg>
            </div>
          </div>

          {/* Category Details */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">Categories</h3>
            <div className="space-y-3">
              {expensesData.categories.map((category, idx) => {
                const Icon = category.icon;
                return (
                  <div
                    key={idx}
                    className="bg-neutral-50 rounded-lg p-4 cursor-pointer hover:bg-neutral-100 transition-colors"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: category.color + '20' }}
                        >
                          <Icon className="w-5 h-5" style={{ color: category.color }} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{category.name}</p>
                          <p className="text-xs text-neutral-500">{category.transactions} transactions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-neutral-900">${category.amount.toLocaleString()}</p>
                        {category.trend !== 0 && (
                          <div className={`flex items-center gap-0.5 justify-end ${category.trend > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {category.trend > 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            <span className="text-xs font-semibold">
                              {category.trend > 0 ? '+' : ''}{category.trend}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500"
                        style={{ 
                          width: `${category.percentage}%`,
                          backgroundColor: category.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Expenses */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Top Expenses This Month</h3>
          <div className="bg-neutral-50 rounded-xl p-4 space-y-2">
            {expensesData.topExpenses.map((expense, idx) => (
              <div key={idx} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-neutral-900">{expense.name}</p>
                  <p className="text-xs text-neutral-500">{expense.category} • {expense.date}</p>
                </div>
                <p className="text-sm font-bold text-red-600">-${expense.amount.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-900 mb-1">Spending Insights</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Food & Dining is your largest expense category (35%)</li>
                <li>• Transport costs increased by 8.5% this month</li>
                <li>• You're spending ${(expensesData.thisMonth / 30).toFixed(0)} per day on average</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ExpensesModal;
