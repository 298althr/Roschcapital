import React, { createContext, useState, useCallback, useEffect, useRef } from 'react';
import { apiClient } from '../lib/apiClient';

export const AuthContext = createContext();

// Inactivity timeout: 5 minutes (in milliseconds)
const INACTIVITY_TIMEOUT = 5 * 60 * 1000;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const inactivityTimerRef = useRef(null);
  const warningTimerRef = useRef(null);

  // Initialize auth state from localStorage and fetch fresh user data
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Set initial user from localStorage
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Fetch fresh user data from server to get latest profilePhoto etc.
          try {
            const response = await apiClient.get('/auth/me');
            if (response?.user) {
              const freshUser = { ...parsedUser, ...response.user };
              setUser(freshUser);
              localStorage.setItem('user', JSON.stringify(freshUser));
            }
          } catch (fetchErr) {
            console.error('Failed to refresh user data:', fetchErr);
          }
        } catch (err) {
          console.error('Failed to parse stored user:', err);
          localStorage.removeItem('user');
          localStorage.removeItem('accessToken');
        }
      }
      setLoading(false);
    };
    
    initAuth();
  }, []);

  // Auto-logout after inactivity (for non-admin users only)
  const resetInactivityTimer = useCallback(() => {
    // Clear existing timers
    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    setShowInactivityWarning(false);

    // Only set timer for authenticated non-admin users
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return;
    
    try {
      const userData = JSON.parse(storedUser);
      if (userData.isAdmin) return; // Skip for admins
    } catch (e) {
      return;
    }

    // Show warning 1 minute before logout
    warningTimerRef.current = setTimeout(() => {
      setShowInactivityWarning(true);
    }, INACTIVITY_TIMEOUT - 60000);

    // Auto-logout after full timeout
    inactivityTimerRef.current = setTimeout(() => {
      console.log('Auto-logout due to inactivity');
      setShowInactivityWarning(false);
      performLogout();
    }, INACTIVITY_TIMEOUT);
  }, []);

  // Perform logout without API call (for inactivity)
  const performLogout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
    // Redirect to login
    window.location.href = '/login?reason=inactivity';
  }, []);

  // Set up activity listeners when user is logged in
  useEffect(() => {
    if (!user || user.isAdmin) return;

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Add event listeners
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start the timer
    resetInactivityTimer();

    // Cleanup
    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [user, resetInactivityTimer]);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const response = await apiClient.post('/auth/login', { email, password });

      // apiClient returns the parsed JSON body directly
      const { user, accessToken, refreshToken } = response || {};

      if (!user || !accessToken) {
        throw new Error('Login response missing authentication data');
      }

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken || '');
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Login failed';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const register = useCallback(async (email, password, firstName, lastName, securityQuestions, additionalData = {}) => {
    try {
      setError(null);

      // First create the user account with security questions and additional data
      await apiClient.post('/auth/register', {
        email,
        password,
        confirmPassword: password,
        firstName,
        lastName,
        securityQuestions,
        ...additionalData
      });

      // Registration successful - user will need to login with 2FA
      return { success: true, message: 'Registration successful! Please log in.' };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Registration failed';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setError(null);
    }
  }, []);

  const getProfile = useCallback(async () => {
    try {
      const response = await apiClient.get('/auth/me');
      const { user: userData } = response || {};

      if (!userData) {
        throw new Error('Failed to load user profile');
      }

      // Merge with existing user data to preserve any additional fields
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      return null;
    }
  }, [user]);

  // Refresh user profile to get latest data including profilePhoto
  const refreshUser = useCallback(async () => {
    return getProfile();
  }, [getProfile]);

  const updateProfile = useCallback(async (firstName, lastName) => {
    try {
      setError(null);
      const response = await apiClient.put('/auth/profile', { firstName, lastName });
      const { user } = response || {};

      if (!user) {
        throw new Error('Failed to update profile');
      }

      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.error || err.message || 'Update failed';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      setError(null);
      await apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword,
        confirmPassword: newPassword,
      });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || 'Password change failed';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  // Dev-only helper to bypass real auth for local UI testing
  const devLogin = useCallback((mockUser) => {
    try {
      const userData = {
        id: mockUser.id || 'dev-user-id',
        email: mockUser.email || 'dev.user@roschcapital.test',
        firstName: mockUser.firstName || 'Dev',
        lastName: mockUser.lastName || 'User',
        isAdmin: !!mockUser.isAdmin,
        createdAt: mockUser.createdAt || new Date().toISOString(),
      };

      localStorage.setItem('accessToken', 'dev-access-token');
      localStorage.setItem('refreshToken', '');
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      setError(null);
      return { success: true, user: userData };
    } catch (err) {
      console.error('Dev login failed:', err);
      return { success: false, error: 'Dev login failed' };
    }
  }, []);

  // Dismiss inactivity warning and reset timer
  const dismissInactivityWarning = useCallback(() => {
    setShowInactivityWarning(false);
    resetInactivityTimer();
  }, [resetInactivityTimer]);

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    getProfile,
    refreshUser,
    updateProfile,
    changePassword,
    devLogin,
    isAuthenticated: !!user,
    showInactivityWarning,
    dismissInactivityWarning,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {/* Inactivity Warning Modal */}
      {showInactivityWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl p-6 max-w-sm mx-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-neutral-900 mb-2">Session Expiring Soon</h3>
              <p className="text-neutral-600 text-sm mb-6">
                You will be logged out in 1 minute due to inactivity. Click below to stay logged in.
              </p>
              <button
                onClick={dismissInactivityWarning}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all"
              >
                Stay Logged In
              </button>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export default AuthContext;
