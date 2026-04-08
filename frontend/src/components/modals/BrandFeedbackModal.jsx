import React from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

/**
 * BrandFeedbackModal - Unified modal for all success, error, warning, and info messages
 * Replaces all alert(), confirm(), and toast notifications
 * 
 * @param {boolean} isOpen - Controls modal visibility
 * @param {function} onClose - Callback when modal is closed
 * @param {string} type - 'success' | 'error' | 'warning' | 'info'
 * @param {string} title - Modal title
 * @param {string} message - Modal message body
 * @param {string} confirmText - Text for confirm button (default: 'OK')
 * @param {string} cancelText - Text for cancel button (optional, shows if provided)
 * @param {function} onConfirm - Callback for confirm action
 * @param {function} onCancel - Callback for cancel action
 */
export const BrandFeedbackModal = ({
  isOpen,
  onClose,
  type = 'success',
  title,
  message,
  confirmText = 'OK',
  cancelText = null,
  onConfirm = null,
  onCancel = null
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-16 h-16 text-white" strokeWidth={2} />;
      case 'error':
        return <XCircle className="w-16 h-16 text-white" strokeWidth={2} />;
      case 'warning':
        return <AlertCircle className="w-16 h-16 text-white" strokeWidth={2} />;
      case 'info':
        return <Info className="w-16 h-16 text-white" strokeWidth={2} />;
      default:
        return <CheckCircle className="w-16 h-16 text-white" strokeWidth={2} />;
    }
  };

  const getIconBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-br from-indigo-500 to-indigo-600';
      case 'error':
        return 'bg-gradient-to-br from-red-500 to-red-600';
      case 'warning':
        return 'bg-gradient-to-br from-yellow-500 to-yellow-600';
      case 'info':
        return 'bg-gradient-to-br from-blue-500 to-blue-600';
      default:
        return 'bg-gradient-to-br from-indigo-500 to-indigo-600';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl max-w-md w-full animate-scaleIn">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-300 hover:bg-slate-700 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className={`p-4 rounded-full ${getIconBgColor()} shadow-lg`}>
              {getIcon()}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white mb-3">
            {title}
          </h3>

          {/* Message */}
          <p className="text-slate-300 text-base leading-relaxed mb-6">
            {message}
          </p>

          {/* Buttons */}
          <div className="flex gap-3">
            {cancelText && (
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`${cancelText ? 'flex-1' : 'w-full'} px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium rounded-xl transition-all shadow-lg hover:shadow-xl`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandFeedbackModal;
