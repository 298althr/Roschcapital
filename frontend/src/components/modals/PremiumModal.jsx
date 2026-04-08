import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Premium Modal Component - 9/10 Standard
 * Beautiful, modern modal with icons, animations, and soft imagery
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {function} props.onClose - Callback when modal closes
 * @param {string} props.type - 'success' | 'error' | 'warning' | 'info' | 'confirm'
 * @param {string} props.title - Modal title
 * @param {string} props.message - Modal message
 * @param {string} props.confirmText - Text for confirm button (default: 'OK')
 * @param {string} props.cancelText - Text for cancel button (only for confirm type)
 * @param {function} props.onConfirm - Callback for confirm action
 * @param {function} props.onCancel - Callback for cancel action
 * @param {boolean} props.showCancel - Show cancel button (default: false for non-confirm types)
 */
export const PremiumModal = ({
  isOpen,
  onClose,
  type = 'info',
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  showCancel = false
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  // Type-specific configurations
  const typeConfig = {
    success: {
      icon: CheckCircle,
      iconColor: 'text-green-400',
      bgGradient: 'from-green-500/20 via-green-500/10 to-transparent',
      borderColor: 'border-green-500/30',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      glowColor: 'shadow-green-500/20'
    },
    error: {
      icon: XCircle,
      iconColor: 'text-red-400',
      bgGradient: 'from-red-500/20 via-red-500/10 to-transparent',
      borderColor: 'border-red-500/30',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      glowColor: 'shadow-red-500/20'
    },
    warning: {
      icon: AlertCircle,
      iconColor: 'text-amber-400',
      bgGradient: 'from-amber-500/20 via-amber-500/10 to-transparent',
      borderColor: 'border-amber-500/30',
      buttonColor: 'bg-amber-600 hover:bg-amber-700',
      glowColor: 'shadow-amber-500/20'
    },
    info: {
      icon: Info,
      iconColor: 'text-blue-400',
      bgGradient: 'from-blue-500/20 via-blue-500/10 to-transparent',
      borderColor: 'border-blue-500/30',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      glowColor: 'shadow-blue-500/20'
    },
    confirm: {
      icon: AlertCircle,
      iconColor: 'text-indigo-400',
      bgGradient: 'from-indigo-500/20 via-indigo-500/10 to-transparent',
      borderColor: 'border-indigo-500/30',
      buttonColor: 'bg-indigo-600 hover:bg-indigo-700',
      glowColor: 'shadow-indigo-500/20'
    }
  };

  const config = typeConfig[type] || typeConfig.info;
  const Icon = config.icon;
  const isConfirmType = type === 'confirm' || showCancel;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div 
        className={`
          relative bg-slate-800 border ${config.borderColor} rounded-2xl 
          shadow-2xl ${config.glowColor} max-w-md w-full
          animate-slideUp transform transition-all duration-300
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Background Effect */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient} rounded-2xl opacity-50`} />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-slate-700/50 hover:bg-slate-700 
                     text-slate-400 hover:text-white transition-all duration-200 z-10"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <div className="relative p-8">
          {/* Icon with animation */}
          <div className="flex justify-center mb-6">
            <div className={`
              relative p-4 rounded-full bg-slate-900/50 border ${config.borderColor}
              animate-scaleIn
            `}>
              <Icon className={`w-12 h-12 ${config.iconColor} animate-pulse`} />
              
              {/* Glow effect */}
              <div className={`absolute inset-0 rounded-full ${config.iconColor} opacity-20 blur-xl`} />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white text-center mb-3 animate-slideUp">
            {title}
          </h3>

          {/* Message */}
          <p className="text-slate-300 text-center leading-relaxed mb-8 animate-slideUp">
            {message}
          </p>

          {/* Action Buttons */}
          <div className={`flex gap-3 ${isConfirmType ? 'flex-row' : 'flex-col'}`}>
            {isConfirmType && (
              <button
                onClick={handleCancel}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white 
                         rounded-xl font-semibold transition-all duration-200 
                         transform hover:scale-105 active:scale-95"
              >
                {cancelText}
              </button>
            )}
            
            <button
              onClick={handleConfirm}
              className={`
                flex-1 px-6 py-3 ${config.buttonColor} text-white rounded-xl 
                font-semibold transition-all duration-200 shadow-lg
                transform hover:scale-105 active:scale-95
              `}
            >
              {confirmText}
            </button>
          </div>
        </div>

        {/* Decorative elements - pointer-events-none to prevent blocking clicks */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-white/5 to-transparent rounded-full blur-2xl pointer-events-none" />
      </div>
    </div>
  );
};

// Tailwind animations (add to tailwind.config.js if not present)
/*
module.exports = {
  theme: {
    extend: {
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        scaleIn: 'scaleIn 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
}
*/

export default PremiumModal;
