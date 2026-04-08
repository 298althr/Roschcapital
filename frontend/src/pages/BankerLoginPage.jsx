import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Lock, Mail, ArrowRight, Shield, Eye, EyeOff, Loader2, Fingerprint, CheckCircle2 } from 'lucide-react';
import apiClient from '../lib/apiClient';

export const BankerLoginPage = () => {
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
  const navigate = useNavigate();

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
        // Check if user is admin
        if (!response.user?.isAdmin) {
          setError('Access denied. Admin credentials required.');
          setIsLoading(false);
          return;
        }

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
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
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
        
        // Verify user is admin before redirecting
        if (response.user?.isAdmin) {
          window.location.href = '/mybanker';
        } else {
          setError('Access denied. Admin credentials required.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Hero Image */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop')"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 to-indigo-900/90"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <Building2 className="w-16 h-16 mb-6" />
          <h1 className="text-4xl font-bold mb-4">Banker Portal</h1>
          <p className="text-lg text-purple-100 mb-8">
            Secure access to administrative banking operations. Manage users, transactions, and system settings.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-purple-300" />
              <span className="text-purple-100">Enhanced Security Verification</span>
            </div>
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-purple-300" />
              <span className="text-purple-100">Admin-Level Access Control</span>
            </div>
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-purple-300" />
              <span className="text-purple-100">Multi-Factor Authentication</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8"
        style={{
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.04), rgba(167, 139, 250, 0.02))'
        }}
      >
        <div className="w-full max-w-md">
          {/* Logo for mobile */}
          <div className="lg:hidden mb-8 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-4 text-purple-700" />
            <h1 className="text-2xl font-bold text-neutral-900">Banker Portal</h1>
          </div>

          {/* Login Card */}
          <div 
            className="rounded-3xl p-8 md:p-10"
            style={{
              background: 'rgba(255, 255, 255, 0.72)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(139, 92, 246, 0.18)',
              boxShadow: '0 20px 40px rgba(139, 92, 246, 0.12)'
            }}
          >
            {step === 1 ? (
              <>
                <div className="mb-8">
                  <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">
                    Banker Sign In
                  </h2>
                  <p className="text-neutral-600">
                    Access your administrative dashboard
                  </p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleStep1Submit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        required
                        style={{
                          background: 'rgba(255, 255, 255, 0.85)',
                          border: emailFocused ? '1.5px solid #8B5CF6' : '1.5px solid rgba(139, 92, 246, 0.2)',
                          boxShadow: emailFocused ? '0 0 0 4px rgba(139, 92, 246, 0.15)' : 'none'
                        }}
                        className="w-full h-14 pl-12 pr-4 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all focus:outline-none"
                        placeholder="banker@roschcapital.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        required
                        style={{
                          background: 'rgba(255, 255, 255, 0.85)',
                          border: passwordFocused ? '1.5px solid #8B5CF6' : '1.5px solid rgba(139, 92, 246, 0.2)',
                          boxShadow: passwordFocused ? '0 0 0 4px rgba(139, 92, 246, 0.15)' : 'none'
                        }}
                        className="w-full h-14 pl-12 pr-12 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all focus:outline-none"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-900 hover:to-primary-800 disabled:from-neutral-300 disabled:to-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Continue
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <Link to="/login" className="text-sm text-purple-700 hover:text-purple-900 font-medium">
                    ← Back to Customer Login
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-neutral-900">Verify Your Identity</h2>
                      <p className="text-sm text-neutral-600">Step 2 of 2</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="mb-6 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVerificationMethod('question')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                      verificationMethod === 'question'
                        ? 'bg-purple-700 text-white shadow-md'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    <Shield className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs">Security Question</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerificationMethod('backup')}
                    className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all ${
                      verificationMethod === 'backup'
                        ? 'bg-purple-700 text-white shadow-md'
                        : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                    }`}
                  >
                    <Fingerprint className="w-5 h-5 mx-auto mb-1" />
                    <div className="text-xs">Auth Token</div>
                  </button>
                </div>

                <form onSubmit={handleStep2Submit} className="space-y-5">
                  {verificationMethod === 'question' ? (
                    <>
                      {randomQuestion && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4">
                          <p className="text-sm font-semibold text-purple-900 mb-1">Security Question:</p>
                          <p className="text-neutral-700">{randomQuestion.question}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-semibold text-neutral-900 mb-2">
                          Your Answer
                        </label>
                        <input
                          type="text"
                          value={answer}
                          onChange={(e) => setAnswer(e.target.value)}
                          required
                          style={{
                            background: 'rgba(255, 255, 255, 0.85)',
                            border: '1.5px solid rgba(139, 92, 246, 0.2)'
                          }}
                          className="w-full h-12 px-4 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all focus:border-purple-700 focus:ring-4 focus:ring-purple-100 focus:outline-none"
                          placeholder="Enter your answer"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-neutral-900 mb-2">
                        Auth Token
                      </label>
                      <input
                        type="text"
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value)}
                        required
                        style={{
                          background: 'rgba(255, 255, 255, 0.85)',
                          border: '1.5px solid rgba(139, 92, 246, 0.2)'
                        }}
                        className="w-full h-12 px-4 rounded-xl text-neutral-900 placeholder-neutral-400 font-mono transition-all focus:border-purple-700 focus:ring-4 focus:ring-purple-100 focus:outline-none"
                        placeholder="XXXX-XXXX-XXXX"
                      />
                      <p className="text-xs text-neutral-500 mt-2">
                        Enter one of your Auth Tokens from your secure storage
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-14 bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-900 hover:to-primary-800 disabled:from-neutral-300 disabled:to-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        Access Dashboard
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    ← Back to login
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center text-xs text-neutral-500">
            <p>🔒 Secure banker authentication • Admin access only</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankerLoginPage;
