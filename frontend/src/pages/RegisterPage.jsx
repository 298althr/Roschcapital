import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Lock, User, Shield, CheckCircle2, Eye, EyeOff, Loader2 } from 'lucide-react';
import apiClient from '../lib/apiClient';

export const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    nationality: '',
    governmentIdType: '',
    governmentIdNumber: '',
    password: '',
    confirmPassword: '',
    currency: 'USD',
    agreeToTerms: false
  });
  const [currencies, setCurrencies] = useState([]);
  const [securityQuestions, setSecurityQuestions] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' }
  ]);
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch available security questions
    const fetchQuestions = async () => {
      try {
        const response = await apiClient.get('/auth/security-questions');
        setAvailableQuestions(response.questions || []);
      } catch (err) {
        console.error('Failed to fetch security questions:', err);
      }
    };
    
    // Fetch available currencies
    const fetchCurrencies = async () => {
      try {
        const response = await apiClient.get('/currencies');
        if (response.success) {
          setCurrencies(response.currencies.filter(c => c.isActive) || []);
        }
      } catch (err) {
        console.error('Failed to fetch currencies:', err);
      }
    };
    
    fetchQuestions();
    fetchCurrencies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSecurityQuestionChange = (index, field, value) => {
    const updated = [...securityQuestions];
    updated[index][field] = value;
    setSecurityQuestions(updated);
    // Clear error
    if (fieldErrors[`sq${index}`]) {
      setFieldErrors((prev) => ({ ...prev, [`sq${index}`]: '' }));
    }
  };

  const getAvailableQuestionsForIndex = (currentIndex) => {
    const selectedQuestions = securityQuestions
      .map((sq, idx) => idx !== currentIndex ? sq.question : null)
      .filter(Boolean);
    return availableQuestions.filter(q => !selectedQuestions.includes(q));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state.trim()) errors.state = 'State is required';
    if (!formData.zipCode.trim()) errors.zipCode = 'Zip code is required';
    if (!formData.country.trim()) errors.country = 'Country is required';
    if (!formData.nationality.trim()) errors.nationality = 'Nationality is required';
    if (!formData.governmentIdType) errors.governmentIdType = 'ID type is required';
    if (!formData.governmentIdNumber.trim()) errors.governmentIdNumber = 'ID number is required';
    if (!formData.password) errors.password = 'Password is required';
    else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[0-9])(?=.*[!@#$%^&*])/.test(formData.password)) {
      errors.password = 'Password must contain at least 1 number and 1 special character';
    }
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.agreeToTerms) {
      errors.agreeToTerms = 'You must agree to the Terms & Conditions';
    }

    // Validate security questions
    securityQuestions.forEach((sq, index) => {
      if (!sq.question) {
        errors[`sq${index}`] = 'Please select a security question';
      }
      if (!sq.answer || sq.answer.trim().length < 2) {
        errors[`sq${index}answer`] = 'Answer must be at least 2 characters';
      }
    });

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);

    const result = await register(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName,
      securityQuestions,
      {
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        nationality: formData.nationality,
        governmentIdType: formData.governmentIdType,
        governmentIdNumber: formData.governmentIdNumber,
        currency: formData.currency
      }
    );

    if (result.success) {
      // Show success modal
      setShowSuccessModal(true);
    } else {
      setError(result.error || 'Registration failed');
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
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-6 border border-white/20">
            <Building2 className="w-12 h-12 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-5xl font-bold mb-4">Rosch Capital Bank</h1>
          <p className="text-xl text-white/90 text-center max-w-md mb-12">
            Join thousands of users who trust us with their finances
          </p>
          
          {/* Feature list */}
          <div className="space-y-6 max-w-md">
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20 flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Bank-Level Security</h3>
                <p className="text-white/80 text-sm">256-bit encryption and two-factor authentication</p>
              </div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20 flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">Instant Transfers</h3>
                <p className="text-white/80 text-sm">Send and receive money in seconds</p>
              </div>
            </div>
            <div className="backdrop-blur-sm bg-white/10 rounded-2xl p-4 border border-white/20 flex items-start gap-4">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-lg">24/7 Support</h3>
                <p className="text-white/80 text-sm">Our team is always here to help you</p>
              </div>
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
        <div className="w-full max-w-md relative z-10 md:mt-0 mt-[35vh] overflow-y-auto max-h-[90vh]">
          <div 
            className="rounded-3xl md:rounded-2xl p-8 md:p-10"
            style={{
              background: 'rgba(255, 255, 255, 0.72)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(139, 92, 246, 0.18)',
              boxShadow: '0 20px 40px rgba(139, 92, 246, 0.12)'
            }}
          >
            {/* Logo - Top Center */}
            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-700 to-purple-900 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <Building2 className="w-10 h-10 text-white" strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900">Rosch Capital Bank</h1>
              <p className="text-sm text-neutral-600 mt-1">Secure, modern banking</p>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Create Account</h2>
              <p className="text-neutral-600">Join Rosch Capital Bank today</p>
            </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  First Name
                </label>
                <input
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  className={`w-full h-12 px-4 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all ${
                    fieldErrors.firstName ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                  }`}
                />
                {fieldErrors.firstName && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Last Name
                </label>
                <input
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  className={`w-full h-12 px-4 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all ${
                    fieldErrors.lastName ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                  }`}
                />
                {fieldErrors.lastName && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="you@roschcapital.com"
                  className={`w-full h-14 pl-12 pr-4 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all ${
                    fieldErrors.email ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Phone Number *
              </label>
              <input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                required
                placeholder="+1 234 567 8900"
                className={`w-full h-12 px-4 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all ${
                  fieldErrors.phone ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                }`}
              />
              {fieldErrors.phone && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.phone}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Date of Birth *
              </label>
              <input
                name="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
                className={`w-full h-12 px-4 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all ${
                  fieldErrors.dateOfBirth ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                }`}
              />
              {fieldErrors.dateOfBirth && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.dateOfBirth}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Street Address *
              </label>
              <input
                name="address"
                type="text"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="123 Main Street"
                className={`w-full h-12 px-4 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all ${
                  fieldErrors.address ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                }`}
              />
              {fieldErrors.address && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.address}</p>
              )}
            </div>

            {/* City, State, Zip */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  City *
                </label>
                <input
                  name="city"
                  type="text"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="New York"
                  className={`w-full h-12 px-4 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all ${
                    fieldErrors.city ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                  }`}
                />
                {fieldErrors.city && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.city}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  State *
                </label>
                <input
                  name="state"
                  type="text"
                  value={formData.state}
                  onChange={handleChange}
                  required
                  placeholder="NY"
                  className={`w-full h-12 px-4 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all ${
                    fieldErrors.state ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                  }`}
                />
                {fieldErrors.state && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.state}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  Zip Code *
                </label>
                <input
                  name="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={handleChange}
                  required
                  placeholder="10001"
                  className={`w-full h-12 px-4 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all ${
                    fieldErrors.zipCode ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                  }`}
                />
                {fieldErrors.zipCode && (
                  <p className="text-red-600 text-xs mt-1">{fieldErrors.zipCode}</p>
                )}
              </div>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Country *
              </label>
              <input
                name="country"
                type="text"
                value={formData.country}
                onChange={handleChange}
                required
                placeholder="United States"
                className={`w-full h-12 px-4 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all ${
                  fieldErrors.country ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                }`}
              />
              {fieldErrors.country && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.country}</p>
              )}
            </div>

            {/* Nationality */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Nationality *
              </label>
              <input
                name="nationality"
                type="text"
                value={formData.nationality}
                onChange={handleChange}
                required
                placeholder="American"
                className={`w-full h-12 px-4 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all ${
                  fieldErrors.nationality ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                }`}
              />
              {fieldErrors.nationality && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.nationality}</p>
              )}
            </div>

            {/* Government ID Type */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Government ID Type *
              </label>
              <select
                name="governmentIdType"
                value={formData.governmentIdType}
                onChange={handleChange}
                required
                className={`w-full h-12 px-4 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 transition-all ${
                  fieldErrors.governmentIdType ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                }`}
              >
                <option value="">Select ID Type</option>
                <option value="Passport">Passport</option>
                <option value="Driver's License">Driver's License</option>
                <option value="National ID">National ID</option>
              </select>
              {fieldErrors.governmentIdType && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.governmentIdType}</p>
              )}
            </div>

            {/* Government ID Number */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                ID Number *
              </label>
              <input
                name="governmentIdNumber"
                type="text"
                value={formData.governmentIdNumber}
                onChange={handleChange}
                required
                placeholder="Enter your ID number"
                className={`w-full h-12 px-4 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all ${
                  fieldErrors.governmentIdNumber ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                }`}
              />
              {fieldErrors.governmentIdNumber && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.governmentIdNumber}</p>
              )}
            </div>

            {/* Currency Selection */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Account Currency *
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                required
                className={`w-full h-12 px-4 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 transition-all ${
                  fieldErrors.currency ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                }`}
              >
                <option value="">Select currency</option>
                {currencies.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
              {fieldErrors.currency && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.currency}</p>
              )}
              <p className="text-xs text-neutral-500 mt-1">This will be your primary account currency</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full h-14 pl-12 pr-12 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all ${
                    fieldErrors.password ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.password}</p>
              )}
              <p className="text-xs text-neutral-500 mt-1">At least 8 characters</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-neutral-900 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full h-14 pl-12 pr-12 bg-neutral-50/80 backdrop-blur-sm border-2 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all ${
                    fieldErrors.confirmPassword ? 'border-red-500 ring-4 ring-red-100' : 'border-neutral-200 hover:border-neutral-300 focus:border-purple-700 focus:ring-4 focus:ring-purple-100'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <p className="text-red-600 text-xs mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* Security Questions Section */}
            <div className="border-t border-neutral-200 pt-5 mt-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-purple-700" />
                <h3 className="text-lg font-semibold text-neutral-900">Security Questions</h3>
              </div>
              <p className="text-sm text-neutral-600 mb-4">
                Choose 3 security questions for account recovery
              </p>

              {securityQuestions.map((sq, index) => (
                <div key={index} className="mb-4">
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">
                    Question {index + 1}
                  </label>
                  <select
                    value={sq.question}
                    onChange={(e) => handleSecurityQuestionChange(index, 'question', e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      border: fieldErrors[`sq${index}`] ? '1.5px solid #ef4444' : '1.5px solid rgba(139, 92, 246, 0.2)'
                    }}
                    className="w-full h-12 px-4 rounded-xl text-neutral-900 mb-3 transition-all focus:border-purple-700 focus:ring-4 focus:ring-purple-100 focus:outline-none"
                  >
                    <option value="">Select a question...</option>
                    {getAvailableQuestionsForIndex(index).map((q) => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                  {fieldErrors[`sq${index}`] && (
                    <p className="text-red-600 text-xs mb-2">{fieldErrors[`sq${index}`]}</p>
                  )}
                  
                  <input
                    type="text"
                    placeholder="Your answer"
                    value={sq.answer}
                    onChange={(e) => handleSecurityQuestionChange(index, 'answer', e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      border: fieldErrors[`sq${index}answer`] ? '1.5px solid #ef4444' : '1.5px solid rgba(139, 92, 246, 0.2)'
                    }}
                    className="w-full h-12 px-4 rounded-xl text-neutral-900 placeholder-neutral-400 transition-all focus:border-purple-700 focus:ring-4 focus:ring-purple-100 focus:outline-none"
                  />
                  {fieldErrors[`sq${index}answer`] && (
                    <p className="text-red-600 text-xs mt-1">{fieldErrors[`sq${index}answer`]}</p>
                  )}
                </div>
              ))}

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-4">
                <p className="text-blue-700 text-xs">
                  💡 Remember your answers! You'll need them to log in and recover your account.
                </p>
              </div>
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                name="agreeToTerms"
                checked={formData.agreeToTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                className="mt-1 w-4 h-4 text-purple-700 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label className="text-sm text-neutral-700">
                I agree to the{' '}
                <a href="/terms" className="text-purple-700 hover:text-purple-900 font-medium">
                  Terms & Conditions
                </a>
                {' '}and{' '}
                <a href="/privacy" className="text-purple-700 hover:text-purple-900 font-medium">
                  Privacy Policy
                </a>
                {' '}*
              </label>
            </div>
            {fieldErrors.agreeToTerms && (
              <p className="text-red-600 text-xs -mt-3">{fieldErrors.agreeToTerms}</p>
            )}

            {/* Register Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-900 hover:to-primary-800 disabled:from-neutral-300 disabled:to-neutral-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-neutral-600 text-sm">
                Already have an account?{' '}
                <a href="/login" className="text-purple-700 font-semibold hover:text-purple-900">
                  Sign in here
                </a>
              </p>
            </div>
          </form>
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

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="text-center">
              {/* Success Icon */}
              <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              
              {/* Title */}
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">
                Registration Successful!
              </h3>
              
              {/* Message */}
              <p className="text-neutral-600 mb-6">
                Your account has been created successfully. Your backup codes will be sent by the admin team.
              </p>
              
              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">Next Steps:</p>
                    <ul className="space-y-1 text-blue-800">
                      <li>• Check your email for confirmation</li>
                      <li>• Wait for admin to approve your account</li>
                      <li>• You'll receive your backup codes soon</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* Action Button */}
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/login');
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
              >
                Continue to Login
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
