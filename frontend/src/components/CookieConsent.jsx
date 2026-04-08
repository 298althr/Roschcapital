import React, { useState, useEffect } from 'react';
import { Cookie, X } from 'lucide-react';

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const hasAccepted = localStorage.getItem('cookieConsent');
    
    if (!hasAccepted) {
      // Show banner after a short delay
      const showTimer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);

      // Auto-accept after 5 seconds if user doesn't interact
      const autoAcceptTimer = setTimeout(() => {
        acceptCookies();
      }, 6000);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(autoAcceptTimer);
      };
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    localStorage.setItem('cookieConsentDate', new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Cookie className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white mb-1">We use cookies</h3>
              <p className="text-sm text-slate-300">
                We use essential cookies to provide our banking services and analytics cookies to improve your experience. 
                By continuing to use our site, you agree to our{' '}
                <a href="#privacy" className="text-purple-400 hover:text-purple-300 underline">
                  Cookie Policy
                </a>.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={acceptCookies}
              className="flex-1 sm:flex-none px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
            >
              Accept All
            </button>
            <button
              onClick={acceptCookies}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-slate-700">
          <p className="text-xs text-slate-400">
            This banner will auto-accept in a few seconds. We only use cookies necessary for secure banking operations.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
