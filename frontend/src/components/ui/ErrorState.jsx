import React from 'react';
import { AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';
import { ActionButton } from './ActionButton';

/**
 * Professional Error State Component
 * Beautiful error handling with retry and support options
 */
export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We encountered an error while loading this data.',
  onRetry,
  onContactSupport,
  variant = 'error', // error, warning, info
}) => {
  const variants = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-100',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      titleColor: 'text-red-900',
      textColor: 'text-red-700',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      titleColor: 'text-amber-900',
      textColor: 'text-amber-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      titleColor: 'text-blue-900',
      textColor: 'text-blue-700',
    },
  };

  const style = variants[variant];

  return (
    <div className={`${style.bg} border ${style.border} rounded-xl p-8`}>
      <div className="flex flex-col items-center text-center max-w-md mx-auto">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-full ${style.iconBg} flex items-center justify-center mb-4`}>
          <AlertCircle className={`w-7 h-7 ${style.iconColor}`} />
        </div>

        {/* Title */}
        <h3 className={`text-lg font-semibold ${style.titleColor} mb-2`}>
          {title}
        </h3>

        {/* Message */}
        <p className={`text-sm ${style.textColor} mb-6`}>
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {onRetry && (
            <ActionButton
              onClick={onRetry}
              variant="primary"
              size="md"
              icon={RefreshCw}
            >
              Try Again
            </ActionButton>
          )}
          {onContactSupport && (
            <ActionButton
              onClick={onContactSupport}
              variant="outline"
              size="md"
              icon={HelpCircle}
            >
              Contact Support
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorState;
