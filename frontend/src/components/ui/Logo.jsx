import React from 'react';
import { Building2 } from 'lucide-react';

/**
 * Rosch Capital Bank Professional Logo
 * Unified design for both Landing Page and Dashboard
 */
export const Logo = ({ size = 'md', variant = 'full', className = '' }) => {
  const sizes = {
    sm: { container: 'gap-2', iconBox: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4', text: 'text-lg' },
    md: { container: 'gap-2.5', iconBox: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5', text: 'text-xl' },
    lg: { container: 'gap-3', iconBox: 'w-12 h-12 rounded-xl', icon: 'w-6 h-6', text: 'text-2xl' },
  };

  const s = sizes[size] || sizes.md;

  const Icon = () => (
    <div className={`${s.iconBox} bg-gradient-to-br from-purple-700 to-purple-900 flex items-center justify-center shadow-md text-white ${className}`}>
      <Building2 className={s.icon} strokeWidth={2.5} />
    </div>
  );

  // Icon only variant
  if (variant === 'icon') {
    return <Icon />;
  }

  // Full logo with text
  return (
    <div className={`flex items-center ${s.container} select-none`}>
      <Icon />
      <div className="flex flex-col justify-center">
        <span className={`${s.text} font-bold text-slate-900 leading-tight tracking-tight`}>
          Rosch Capital Bank
        </span>
      </div>
    </div>
  );
};

export default Logo;
