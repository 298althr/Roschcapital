import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Lock, Mail, ArrowRight, Shield, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft, KeyRound } from 'lucide-react';
import apiClient from '../lib/apiClient';

export const ForgotPasswordPage = () => {
  const [step, setStep] = useState(1); // 1: email, 2: backup code, 3: new password, 4: success
  const [email, setEmail] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [codeFocused, setCodeFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const navigate = useNavigate();

  // Step 1: Verify email exists
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password/verify-email', { email });
      
      if (response.success) {
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Email not found. Please check and try again.');
    }

    setIsLoading(false);
  };

  // Step 2: Verify backup code
  const handleBackupCodeSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password/verify-code', { 
        email, 
        backupCode 
      });
      
      if (response.success) {
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or already used backup code.');
    }

    setIsLoading(false);
  };

  // Step 3: Reset password
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password/reset', { 
        email, 
        backupCode,
        newPassword 
      });
      
      if (response.success) {
        setStep(4);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    }

    setIsLoading(false);
  };

  const inputStyle = (focused) => ({
    background: 'rgba(255, 255, 255, 0.85)',
    border: focused ? '1.5px solid #7C3AED' : '1.5px solid rgba(124, 58, 237, 0.2)',
    boxShadow: focused ? '0 0 0 4px rgba(124, 58, 237, 0.15)' : 'none'
  });

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left Side - Atmospheric Hero (Desktop) */}
      <div 
        className="hidden md:block bg-cover bg-center relative"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/70"></div>
        
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white px-12">
          <Link to="/" className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
            <Building2 className="w-12 h-12 text-white" strokeWidth={2} />
          </Link>
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-5xl font-bold mb-4">Rosch Capital Bank</h1>
          </Link>
          <p className="text-xl text-white/90 text-center max-w-md mb-12">
            Secure Password Recovery
          </p>
          
          <div className="grid grid-cols-3 gap-8 text-center">
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
              <Shield className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">256-bit</div>
              <div className="text-sm text-white/80">Encryption</div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
              <KeyRound className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">Auth</div>
              <div className="text-sm text-white/80">Token</div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
              <Lock className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-white/80">Secure</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(167, 139, 250, 0.02) 100%)'
      }}>
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="%23FAF5FF"/><rect x="0" y="0" width="1" height="1" fill="%238B5CF6" opacity="0.03"/></svg>')`
          }}
        ></div>
        
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-purple-200/40 to-violet-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 left-20 w-80 h-80 bg-gradient-to-tr from-violet-200/30 to-purple-200/40 rounded-full blur-3xl"></div>
        </div>
        
        <div className="flex items-center justify-center min-h-screen p-6 md:p-12 relative z-10">
          <div className="w-full max-w-md">
            <div 
              className="rounded-3xl md:rounded-2xl p-8 md:p-10"
              style={{
                background: 'rgba(255, 255, 255, 0.72)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(124, 58, 237, 0.18)',
                boxShadow: '0 20px 40px rgba(124, 58, 237, 0.12)'
              }}
            >
              {/* Logo */}
              <div className="flex flex-col items-center mb-8">
                <Link to="/" className="w-16 h-16 bg-gradient-to-br from-purple-700 to-purple-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg hover:from-purple-800 hover:to-purple-950 transition-all cursor-pointer">
                  <Building2 className="w-10 h-10 text-white" strokeWidth={2} />
                </Link>
                <Link to="/" className="hover:opacity-80 transition-opacity">
                  <h1 className="text-2xl font-bold text-neutral-900">Rosch Capital Bank</h1>
                </Link>
                <p className="text-sm text-neutral-600 mt-1">Password Recovery</p>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3].map((s) => (
                  <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step >= s 
                        ? 'bg-purple-700 text-white' 
                        : 'bg-neutral-200 text-neutral-500'
                    }`}>
                      {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                    </div>
                    {s < 3 && (
                      <div className={`w-8 h-1 mx-1 rounded transition-all ${
                        step > s ? 'bg-purple-700' : 'bg-neutral-200'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>

              {/* Step 1: Email */}
              {step === 1 && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">Forgot Password?</h2>
                    <p className="text-neutral-600">Enter your email address to begin recovery</p>
                  </div>

                  <form onSubmit={handleEmailSubmit} className="space-y-5">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-700 text-sm font-medium">{error}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-2">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setEmailFocused(true)}
                          onBlur={() => setEmailFocused(false)}
                          placeholder="you@roschcapital.com"
                          style={inputStyle(emailFocused)}
                          className="w-full h-14 pl-12 pr-4 rounded-2xl text-neutral-900 placeholder-neutral-400 transition-all"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 disabled:from-neutral-300 disabled:to-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Continue</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>

                    <div className="text-center pt-4">
                      <Link to="/login" className="text-purple-700 font-semibold hover:text-purple-800 flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                      </Link>
                    </div>
                  </form>
                </>
              )}

              {/* Step 2: Backup Code */}
              {step === 2 && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">Enter Auth Token</h2>
                    <p className="text-neutral-600">Enter one of your Auth Tokens from the PDF sent by admin</p>
                  </div>

                  <form onSubmit={handleBackupCodeSubmit} className="space-y-5">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-700 text-sm font-medium">{error}</p>
                      </div>
                    )}

                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                      <p className="text-purple-800 text-sm">
                        <strong>Email verified:</strong> {email}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-2">
                        <KeyRound className="w-4 h-4 inline mr-2" />
                        Auth Token (6 digits)
                      </label>
                      <input
                        type="text"
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        onFocus={() => setCodeFocused(true)}
                        onBlur={() => setCodeFocused(false)}
                        placeholder="000000"
                        maxLength={6}
                        style={inputStyle(codeFocused)}
                        className="w-full h-16 px-4 rounded-2xl text-neutral-900 placeholder-neutral-400 text-center text-2xl tracking-widest font-mono transition-all"
                        required
                      />
                      <p className="text-xs text-neutral-500 mt-2 text-center">
                        This token will be marked as used after password reset
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || backupCode.length !== 6}
                      className="w-full h-14 bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 disabled:from-neutral-300 disabled:to-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Verifying...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify Token</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setStep(1); setError(''); }}
                      className="w-full text-purple-700 font-semibold hover:text-purple-800 flex items-center justify-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                  </form>
                </>
              )}

              {/* Step 3: New Password */}
              {step === 3 && (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-neutral-900 mb-2">Create New Password</h2>
                    <p className="text-neutral-600">Enter your new password below</p>
                  </div>

                  <form onSubmit={handlePasswordReset} className="space-y-5">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-red-700 text-sm font-medium">{error}</p>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          placeholder="Enter new password"
                          style={inputStyle(passwordFocused)}
                          className="w-full h-14 pl-12 pr-12 rounded-2xl text-neutral-900 placeholder-neutral-400 transition-all"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">At least 8 characters</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          onFocus={() => setConfirmFocused(true)}
                          onBlur={() => setConfirmFocused(false)}
                          placeholder="Confirm new password"
                          style={inputStyle(confirmFocused)}
                          className="w-full h-14 pl-12 pr-12 rounded-2xl text-neutral-900 placeholder-neutral-400 transition-all"
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-14 bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 disabled:from-neutral-300 disabled:to-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Resetting...</span>
                        </>
                      ) : (
                        <>
                          <span>Reset Password</span>
                          <ArrowRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* Step 4: Success */}
              {step === 4 && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">Password Reset Successful!</h2>
                  <p className="text-neutral-600 mb-8">
                    Your password has been changed. You can now log in with your new password.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 w-full h-14 bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    <span>Go to Login</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
