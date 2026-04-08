import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Professional Metric Card Component
 * Enterprise-grade stats display with trends and sparklines
 */
export const MetricCard = ({ 
  label, 
  value, 
  icon: Icon,
  trend,
  trendLabel,
  loading = false,
  onClick,
  variant = 'default' // default, success, warning, error
}) => {
  const isClickable = !!onClick;
  
  const variantStyles = {
    default: 'bg-white hover:bg-neutral-50',
    success: 'bg-gradient-to-br from-emerald-50 to-white',
    warning: 'bg-gradient-to-br from-amber-50 to-white',
    error: 'bg-gradient-to-br from-red-50 to-white',
  };

  const iconColors = {
    default: 'text-indigo-600 bg-indigo-50',
    success: 'text-emerald-600 bg-emerald-100',
    warning: 'text-amber-600 bg-amber-100',
    error: 'text-red-600 bg-red-100',
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <TrendingUp className="w-3.5 h-3.5" />;
    if (trend < 0) return <TrendingDown className="w-3.5 h-3.5" />;
    return <Minus className="w-3.5 h-3.5" />;
  };

  const getTrendColor = () => {
    if (trend > 0) return 'text-emerald-600 bg-emerald-50';
    if (trend < 0) return 'text-red-600 bg-red-50';
    return 'text-neutral-500 bg-neutral-50';
  };

  if (loading) {
    return (
      <div className="bg-white border border-neutral-200 rounded-xl p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-neutral-200 rounded-lg" />
        </div>
        <div className="h-8 bg-neutral-200 rounded w-2/3 mb-2" />
        <div className="h-4 bg-neutral-200 rounded w-1/2" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        border border-neutral-200 rounded-xl p-6 
        transition-all duration-200
        ${variantStyles[variant]}
        ${isClickable ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5' : 'shadow-sm'}
      `}
    >
      {/* Icon */}
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColors[variant]}`}>
          {Icon && <Icon className="w-5 h-5" />}
        </div>
        
        {/* Trend Badge */}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="text-2xl font-bold text-neutral-900 mb-1 tracking-tight">
        {value}
      </div>

      {/* Label */}
      <div className="text-sm text-neutral-600 font-medium">
        {label}
      </div>

      {/* Trend Label */}
      {trendLabel && (
        <div className="text-xs text-neutral-500 mt-2">
          {trendLabel}
        </div>
      )}

      {/* Hover indicator for clickable cards */}
      {isClickable && (
        <div className="mt-3 text-xs text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          View details →
        </div>
      )}
    </div>
  );
};

export default MetricCard;
