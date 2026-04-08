import React from 'react';

/**
 * Professional Loading Skeleton Component
 * Smooth loading states instead of spinners
 */
export const LoadingSkeleton = ({ variant = 'card', count = 1 }) => {
  const skeletons = {
    card: (
      <div className="bg-white/60 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-sm overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] animate-[shimmer_2s_infinite]" />
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-neutral-200/50 rounded-xl" />
          <div className="w-16 h-6 bg-neutral-200/50 rounded-full" />
        </div>
        <div className="h-8 bg-neutral-200/50 rounded-lg w-2/3 mb-2" />
        <div className="h-4 bg-neutral-200/50 rounded-lg w-1/2" />
      </div>
    ),
    
    list: (
      <div className="bg-white/40 backdrop-blur-sm border border-neutral-100 rounded-xl p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-neutral-200/50 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <div className="h-4 bg-neutral-200/50 rounded w-3/4 mb-2" />
            <div className="h-3 bg-neutral-200/50 rounded w-1/2" />
          </div>
          <div className="h-6 bg-neutral-200/50 rounded w-20" />
        </div>
      </div>
    ),
    
    hero: (
      <div className="bg-gradient-to-br from-purple-100/30 to-primary-100/30 backdrop-blur-md border border-white/40 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_3s_infinite]" />
        <div className="h-6 bg-neutral-200/50 rounded w-1/4 mb-4" />
        <div className="h-16 bg-neutral-200/50 rounded w-1/2 mb-8" />
        <div className="flex gap-4">
          <div className="h-12 bg-neutral-200/50 rounded-xl w-40" />
          <div className="h-12 bg-neutral-200/50 rounded-xl w-40" />
        </div>
      </div>
    ),
    
    text: (
      <div className="space-y-3 relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-100/50 to-transparent -translate-x-full animate-[shimmer_1s_infinite]" />
        <div className="h-4 bg-neutral-100 rounded w-full" />
        <div className="h-4 bg-neutral-100 rounded w-11/12" />
        <div className="h-4 bg-neutral-100 rounded w-4/6" />
      </div>
    ),

    premium: (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-3xl border-4 border-purple-100 animate-pulse" />
          <div className="absolute inset-2 rounded-2xl border-4 border-purple-200 animate-[ping_2s_infinite]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-primary-600 rounded-xl animate-bounce" />
          </div>
        </div>
        <div className="h-8 bg-neutral-200 rounded-lg w-48 mb-4 animate-pulse" />
        <div className="h-4 bg-neutral-100 rounded-lg w-64 animate-pulse" />
      </div>
    )
  };

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{skeletons[variant]}</div>
      ))}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSkeleton;
