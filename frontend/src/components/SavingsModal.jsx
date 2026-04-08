import React from 'react';
import { Modal } from './ui/Modal';
import { TrendingUp, Target, Award, Calendar } from 'lucide-react';

/**
 * Savings Details Modal
 * Shows savings growth, goals, and milestones
 */
export const SavingsModal = ({ isOpen, onClose }) => {
  // Mock savings data
  const savingsData = {
    total: 5200,
    thisMonth: 500,
    lastMonth: 400,
    change: 25,
    yearlyGoal: 10000,
    monthlyTarget: 833,
    goals: [
      { name: 'Emergency Fund', target: 10000, current: 5200, color: 'bg-emerald-500', icon: '🛡️' },
      { name: 'Vacation', target: 3000, current: 1200, color: 'bg-blue-500', icon: '✈️' },
      { name: 'New Car', target: 15000, current: 2500, color: 'bg-purple-500', icon: '🚗' },
    ],
    monthlyData: [
      { month: 'Jan', amount: 400, cumulative: 400 },
      { month: 'Feb', amount: 300, cumulative: 700 },
      { month: 'Mar', amount: 400, cumulative: 1100 },
      { month: 'Apr', amount: 400, cumulative: 1500 },
      { month: 'May', amount: 500, cumulative: 2000 },
      { month: 'Jun', amount: 500, cumulative: 2500 },
      { month: 'Jul', amount: 400, cumulative: 2900 },
      { month: 'Aug', amount: 500, cumulative: 3400 },
      { month: 'Sep', amount: 500, cumulative: 3900 },
      { month: 'Oct', amount: 400, cumulative: 4300 },
      { month: 'Nov', amount: 500, cumulative: 4800 },
      { month: 'Dec', amount: 500, cumulative: 5300 },
    ],
    milestones: [
      { amount: 1000, achieved: true, date: 'March 2024' },
      { amount: 2500, achieved: true, date: 'June 2024' },
      { amount: 5000, achieved: true, date: 'November 2024' },
      { amount: 10000, achieved: false, date: 'Target: June 2025' },
    ],
  };

  const maxCumulative = Math.max(...savingsData.monthlyData.map(d => d.cumulative));
  const goalProgress = (savingsData.total / savingsData.yearlyGoal) * 100;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl" title="Savings Analysis">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
            <p className="text-xs text-emerald-600 font-medium mb-1">Total Saved</p>
            <p className="text-2xl font-bold text-emerald-900">${savingsData.total.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <p className="text-xs text-blue-600 font-medium mb-1">This Month</p>
            <p className="text-2xl font-bold text-blue-900">${savingsData.thisMonth.toLocaleString()}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
            <p className="text-xs text-purple-600 font-medium mb-1">Growth</p>
            <div className="flex items-center gap-1">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <p className="text-2xl font-bold text-purple-900">+{savingsData.change}%</p>
            </div>
          </div>
        </div>

        {/* Yearly Goal Progress */}
        <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-xl p-6 border border-emerald-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">2024 Savings Goal</h3>
                <p className="text-xs text-neutral-600">Target: ${savingsData.yearlyGoal.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-600">{goalProgress.toFixed(0)}%</p>
              <p className="text-xs text-neutral-600">Complete</p>
            </div>
          </div>
          <div className="w-full h-4 bg-white rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-1000 relative"
              style={{ width: `${goalProgress}%` }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/50"></div>
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <p className="text-xs text-neutral-600">${savingsData.total.toLocaleString()} saved</p>
            <p className="text-xs text-neutral-600">${(savingsData.yearlyGoal - savingsData.total).toLocaleString()} remaining</p>
          </div>
        </div>

        {/* Savings Goals */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Savings Goals</h3>
          <div className="space-y-3">
            {savingsData.goals.map((goal, idx) => {
              const progress = (goal.current / goal.target) * 100;
              return (
                <div key={idx} className="bg-neutral-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{goal.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-neutral-900">{goal.name}</p>
                        <p className="text-xs text-neutral-600">
                          ${goal.current.toLocaleString()} / ${goal.target.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{progress.toFixed(0)}%</p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${goal.color} transition-all duration-500`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cumulative Growth Chart */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Cumulative Savings Growth</h3>
          <div className="bg-neutral-50 rounded-xl p-6">
            <div className="relative" style={{ height: '200px' }}>
              <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                {/* Grid lines */}
                <line x1="0" y1="50" x2="600" y2="50" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="100" x2="600" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                <line x1="0" y1="150" x2="600" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                
                {/* Area fill */}
                <path
                  d={`M 0 ${200 - (savingsData.monthlyData[0].cumulative / maxCumulative) * 180} ${savingsData.monthlyData.map((d, i) => 
                    `L ${(i / (savingsData.monthlyData.length - 1)) * 600} ${200 - (d.cumulative / maxCumulative) * 180}`
                  ).join(' ')} L 600 200 L 0 200 Z`}
                  fill="url(#savingsGradient)"
                />
                
                {/* Line */}
                <path
                  d={`M 0 ${200 - (savingsData.monthlyData[0].cumulative / maxCumulative) * 180} ${savingsData.monthlyData.map((d, i) => 
                    `L ${(i / (savingsData.monthlyData.length - 1)) * 600} ${200 - (d.cumulative / maxCumulative) * 180}`
                  ).join(' ')}`}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                
                {/* Dots */}
                {savingsData.monthlyData.map((d, i) => (
                  <circle
                    key={i}
                    cx={(i / (savingsData.monthlyData.length - 1)) * 600}
                    cy={200 - (d.cumulative / maxCumulative) * 180}
                    r="4"
                    fill="#10B981"
                  />
                ))}
                
                <defs>
                  <linearGradient id="savingsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            {/* Month labels */}
            <div className="flex justify-between mt-2">
              {savingsData.monthlyData.filter((_, i) => i % 3 === 0).map((d, i) => (
                <span key={i} className="text-xs text-neutral-600">{d.month}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Milestones */}
        <div>
          <h3 className="text-sm font-semibold text-neutral-900 mb-4">Milestones</h3>
          <div className="bg-neutral-50 rounded-xl p-4 space-y-3">
            {savingsData.milestones.map((milestone, idx) => (
              <div key={idx} className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${milestone.achieved ? 'bg-emerald-500' : 'bg-neutral-300'}`}>
                  {milestone.achieved ? (
                    <Award className="w-5 h-5 text-white" />
                  ) : (
                    <Target className="w-5 h-5 text-neutral-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-neutral-900">${milestone.amount.toLocaleString()}</p>
                  <p className="text-xs text-neutral-600">{milestone.date}</p>
                </div>
                {milestone.achieved && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    Achieved ✓
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex gap-3">
            <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-emerald-900 mb-1">Savings Insights</h4>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• You're saving {goalProgress.toFixed(0)}% of your yearly goal</li>
                <li>• Average monthly savings: ${(savingsData.total / 12).toFixed(0)}</li>
                <li>• At this rate, you'll reach $10K by June 2025</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default SavingsModal;
