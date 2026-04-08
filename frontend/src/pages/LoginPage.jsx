import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, Lock, Mail, ArrowRight, Shield, Eye, EyeOff, Loader2, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const { user: authUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1); // 1: email/password, 2: verification
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [userId, setUserId] = useState('');
  const [randomQuestion, setRandomQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('question');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [inactivityLogout, setInactivityLogout] = useState(false);
  const navigate = useNavigate();

  // Check if user was logged out due to inactivity
  useEffect(() => {
    if (searchParams.get('reason') === 'inactivity') {
      setInactivityLogout(true);
      // Clear the URL param after showing the message
      setTimeout(() => {
        window.history.replaceState({}, '', '/login');
      }, 100);
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await apiClient.post('/auth/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.requiresVerification) {
        // Step 1 successful, move to step 2
        setUserId(response.userId);
        
        // Set verification method based on user preference
        const preference = response.loginPreference || 'question';
        setVerificationMethod(preference);
        
        // If security question method, randomly select ONE question
        if (preference === 'question' && response.securityQuestions && response.securityQuestions.length > 0) {
          const randomIndex = Math.floor(Math.random() * response.securityQuestions.length);
          setRandomQuestion(response.securityQuestions[randomIndex]);
        }
        
        setStep(2);
      } else if (response.accessToken) {
        // Direct login (user has no security questions)
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Redirect based on user role
        if (response.user.isAdmin) {
          navigate('/mybanker');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      // Check if account is suspended
      if (err.response?.status === 403 && err.response?.data?.accountStatus === 'SUSPENDED') {
        setError(err.response.data.message || 'Your account has been suspended. Please visit your nearest Rosch Capital Bank branch for verification.');
      } else {
        setError(err.response?.data?.error || 'Login failed');
      }
    }

    setIsLoading(false);
  };

  const handleStep2Submit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const payload = {
        userId: userId,
        method: verificationMethod === 'question' ? 'security_question' : 'backup_code'
      };

      if (verificationMethod === 'question') {
        payload.questionId = randomQuestion.id;
        payload.answer = answer;
      } else {
        payload.backupCode = backupCode;
      }

      const response = await apiClient.post('/auth/login/verify', payload);

      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        // Force page reload to update AuthContext
        // Redirect based on user role
        if (response.user?.isAdmin) {
          window.location.href = '/mybanker';
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      {/* Left Side - Atmospheric Hero (Desktop) */}
      <div 
        className="hidden md:block bg-cover bg-center relative"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')"
        }}
      >
        {/* Dark overlay for contrast */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/70"></div>
        
        {/* Content overlay */}
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-white px-12">
          <Link to="/" className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
            <Building2 className="w-12 h-12 text-white" strokeWidth={2} />
          </Link>
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <h1 className="text-5xl font-bold mb-4">Rosch Capital Bank</h1>
          </Link>
          <p className="text-xl text-white/90 text-center max-w-md mb-12">
            Secure, Modern Banking at Your Fingertips
          </p>
          
          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-8 text-center">
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
              <Shield className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">256-bit</div>
              <div className="text-sm text-white/80">Encryption</div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
              <CheckCircle2 className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-white/80">Support</div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20">
              <Lock className="w-8 h-8 mx-auto mb-2" />
              <div className="text-2xl font-bold">100%</div>
              <div className="text-sm text-white/80">Secure</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Premium Purple Atmosphere (NO WHITE) */}
      <div className="relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(167, 139, 250, 0.02) 100%)'
      }}>
        {/* Subtle purple noise overlay */}
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"><rect width="4" height="4" fill="%23FAF5FF"/><rect x="0" y="0" width="1" height="1" fill="%238B5CF6" opacity="0.03"/></svg>')`
          }}
        ></div>
        
        {/* Decorative gradient orbs */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-purple-200/40 to-violet-200/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-32 left-20 w-80 h-80 bg-gradient-to-tr from-violet-200/30 to-purple-200/40 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-gradient-to-bl from-purple-200/30 to-violet-100/30 rounded-full blur-2xl"></div>
        </div>
        
        {/* Form container */}
        <div className="flex items-center justify-center min-h-screen p-6 md:p-12 relative z-10">
        {/* Mobile Hero Background */}
        <div 
          className="md:hidden absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')",
            height: '40vh',
            top: 0
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent"></div>
        </div>

        {/* Premium Glassmorphic Card (NO WHITE) */}
        <div className="w-full max-w-md relative z-10 md:mt-0 mt-[35vh]">
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
            {/* Logo - Top Center (Clickable to Homepage) */}
            <div className="flex flex-col items-center mb-8">
              <Link to="/" className="w-16 h-16 bg-gradient-to-br from-purple-700 to-purple-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg hover:from-purple-800 hover:to-purple-950 transition-all cursor-pointer">
                <Building2 className="w-10 h-10 text-white" strokeWidth={2} />
              </Link>
              <Link to="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-2xl font-bold text-neutral-900">Rosch Capital Bank</h1>
              </Link>
              <p className="text-sm text-neutral-600 mt-1">Secure, modern banking</p>
            </div>

            {step === 1 ? (
              // Step 1: Email & Password
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">Welcome Back</h2>
                  <p className="text-neutral-600">Sign in to your account</p>
                </div>

                <form onSubmit={handleStep1Submit} className="space-y-5">
                  {inactivityLogout && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-800 text-sm font-medium">Session Expired</p>
                        <p className="text-amber-700 text-xs mt-0.5">You were logged out due to inactivity. Please sign in again.</p>
                      </div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      </div>
                      <p className="text-red-700 text-sm font-medium">{error}</p>
                    </div>
                  )}

                  {/* Email Field */}
                  <div>
                    <label
                      htmlFor="login-email"
                      className="block text-sm font-semibold text-neutral-900 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="email"
                        id="login-email"
                        name="email"
                        autoComplete="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        placeholder="you@roschcapital.com"
                        style={{
                          background: 'rgba(255, 255, 255, 0.85)',
                          border: emailFocused ? '1.5px solid #7C3AED' : '1.5px solid rgba(124, 58, 237, 0.2)',
                          boxShadow: emailFocused ? '0 0 0 4px rgba(124, 58, 237, 0.15)' : 'none'
                        }}
                        className="w-full h-14 pl-12 pr-4 rounded-2xl text-neutral-900 placeholder-neutral-400 transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div>
                    <label
                      htmlFor="login-password"
                      className="block text-sm font-semibold text-neutral-900 mb-2"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="login-password"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        name="password"
                        autoComplete="current-password"
                        placeholder="Enter your password"
                        style={{
                          background: 'rgba(255, 255, 255, 0.85)',
                          border: passwordFocused ? '1.5px solid #7C3AED' : '1.5px solid rgba(124, 58, 237, 0.2)',
                          boxShadow: passwordFocused ? '0 0 0 4px rgba(124, 58, 237, 0.15)' : 'none'
                        }}
                        className="w-full h-14 pl-12 pr-12 rounded-2xl text-neutral-900 placeholder-neutral-400 transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <div className="mt-2 text-right">
                      <Link to="/forgot-password" className="text-sm font-semibold text-purple-700 hover:text-purple-800">
                        Forgot password?
                      </Link>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 disabled:from-neutral-300 disabled:to-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  {/* Security Notice */}
                  <div className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm text-emerald-700 font-medium">Protected by 256-bit encryption</span>
                  </div>

                  {/* Register Link */}
                  <div className="text-center pt-4">
                    <p className="text-neutral-600 text-sm">
                      Don't have an account?{' '}
                      <a href="/register" className="text-purple-700 font-semibold hover:text-purple-800">
                        Create one here
                      </a>
                    </p>
                  </div>
                </form>
              </>
          ) : (
            // Step 2: Verification
            <>
              <div className="mb-8">
                <button
                  onClick={() => setStep(1)}
                  className="text-purple-700 hover:text-purple-800 text-sm font-medium mb-4 hover:underline"
                >
                  ← Back to login
                </button>
                <h2 className="text-3xl font-bold text-neutral-900 mb-2">Verify Your Identity</h2>
                <p className="text-neutral-600">Choose a verification method</p>
              </div>

              <form onSubmit={handleStep2Submit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    </div>
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                {verificationMethod === 'question' ? (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-2">
                        <Shield className="w-4 h-4 inline mr-2" />
                        Security Question
                      </label>
                      <div className="w-full px-4 py-3 bg-purple-50 border border-purple-200 rounded-xl text-neutral-900 font-medium">
                        {randomQuestion?.question || 'Loading question...'}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-2">
                        Your Answer
                      </label>
                      <input
                        type="text"
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Enter your answer"
                        className="w-full h-14 px-4 bg-white border-2 border-purple-200 focus:border-purple-700 focus:ring-4 focus:ring-purple-100 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                      <p className="text-purple-800 text-sm font-medium">
                        📧 Check your email for your authentication code
                      </p>
                    </div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">
                      <Shield className="w-4 h-4 inline mr-2" />
                      Enter Auth Token
                    </label>
                    <input
                      type="text"
                      value={backupCode}
                      onChange={(e) => setBackupCode(e.target.value)}
                      placeholder="6-digit code"
                      maxLength={6}
                      className="w-full h-16 px-4 bg-white border-2 border-purple-200 focus:border-purple-700 focus:ring-4 focus:ring-purple-100 rounded-xl text-neutral-900 placeholder-neutral-400 text-center text-2xl tracking-widest font-mono transition-all"
                      required
                    />
                    <p className="text-xs text-neutral-500 mt-2">
                      Enter one of your Auth Tokens from the PDF sent by admin
                    </p>
                  </div>
                )}

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
                      <span>Verify & Sign In</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </>
            )}
          </div>

          {/* Mobile Trust Bar - Fixed Bottom */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-neutral-200 py-3 px-6 z-50">
            <div className="flex items-center justify-center gap-6 text-center">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium text-neutral-700">256-bit</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium text-neutral-700">24/7 Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-medium text-neutral-700">100% Safe</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
