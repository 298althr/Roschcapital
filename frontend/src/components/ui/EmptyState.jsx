import React from 'react';
import { ActionButton } from './ActionButton';

/**
 * Professional Empty State Component
 * Beautiful placeholders for empty data states
 */
export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  secondaryAction,
  secondaryActionLabel,
  illustration,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {/* Icon or Illustration */}
      {illustration ? (
        <div className="mb-6">
          {illustration}
        </div>
      ) : Icon ? (
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mb-6">
          <Icon className="w-8 h-8 text-neutral-400" />
        </div>
      ) : null}

      {/* Title */}
      <h3 className="text-xl font-semibold text-neutral-900 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-neutral-600 max-w-md mb-8">
        {description}
      </p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3">
          {action && (
            <ActionButton onClick={action} variant="primary">
              {actionLabel || 'Get Started'}
            </ActionButton>
          )}
          {secondaryAction && (
            <ActionButton onClick={secondaryAction} variant="outline">
              {secondaryActionLabel || 'Learn More'}
            </ActionButton>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
