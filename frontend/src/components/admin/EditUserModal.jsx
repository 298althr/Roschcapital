import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, CreditCard, Shield, Lock, Upload, Save } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your favorite color?",
  "What was the name of your elementary school?"
];

export const EditUserModal = ({ isOpen, onClose, userId, onSuccess }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [errors, setErrors] = useState({});
  
  const [formData, setFormData] = useState({
    // Personal
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    
    // Address
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    
    // Account
    accountStatus: '',
    kycStatus: '',
    accountType: '',
    loginPreference: '',
    isAdmin: false,
    
    // Password (optional)
    newPassword: '',
    confirmPassword: '',
    
    // Security Questions
    question1: SECURITY_QUESTIONS[0],
    answer1: '',
    question2: SECURITY_QUESTIONS[1],
    answer2: '',
    question3: SECURITY_QUESTIONS[2],
    answer3: '',
    
    // Profile Picture
    profilePhoto: null
  });

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    setErrors({});
    try {
      const response = await apiClient.get(`/mybanker/users/${userId}`);
      const userData = response.user;
      
      if (!userData) {
        throw new Error('User data not found in response');
      }
      
      setUser(userData);
      setFormData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        zipCode: userData.zipCode || '',
        country: userData.country || 'United States',
        accountStatus: userData.accountStatus || 'LIMITED',
        kycStatus: userData.kycStatus || 'PENDING',
        accountType: userData.accountType || 'CHECKING',
        loginPreference: userData.loginPreference || 'question',
        isAdmin: userData.isAdmin || false,
        newPassword: '',
        confirmPassword: '',
        question1: userData.securityQuestions?.[0]?.question || SECURITY_QUESTIONS[0],
        answer1: '',
        question2: userData.securityQuestions?.[1]?.question || SECURITY_QUESTIONS[1],
        answer2: '',
        question3: userData.securityQuestions?.[2]?.question || SECURITY_QUESTIONS[2],
        answer3: '',
        profilePhoto: null
      });
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setErrors({ fetch: error.message || 'Failed to load user details' });
    }
    setIsLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profilePhoto: 'File size must be less than 5MB' }));
        return;
      }
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profilePhoto: 'File must be an image' }));
        return;
      }
      setFormData(prev => ({ ...prev, profilePhoto: file }));
      setErrors(prev => ({ ...prev, profilePhoto: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    // Password validation (only if changing)
    if (formData.newPassword) {
      if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      if (formData.newPassword !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSaving(true);
    try {
      const updateData = new FormData();
      
      // Personal info
      updateData.append('firstName', formData.firstName);
      updateData.append('lastName', formData.lastName);
      updateData.append('email', formData.email);
      updateData.append('phone', formData.phone);
      updateData.append('dateOfBirth', formData.dateOfBirth);
      
      // Address
      updateData.append('address', formData.address);
      updateData.append('city', formData.city);
      updateData.append('state', formData.state);
      updateData.append('zipCode', formData.zipCode);
      updateData.append('country', formData.country);
      
      // Account settings
      updateData.append('accountStatus', formData.accountStatus);
      updateData.append('kycStatus', formData.kycStatus);
      updateData.append('accountType', formData.accountType);
      updateData.append('loginPreference', formData.loginPreference);
      updateData.append('isAdmin', formData.isAdmin);
      
      // Password (if provided)
      if (formData.newPassword) {
        updateData.append('newPassword', formData.newPassword);
      }
      
      // Security questions (if any answers provided)
      const securityQuestions = [];
      if (formData.answer1) securityQuestions.push({ question: formData.question1, answer: formData.answer1 });
      if (formData.answer2) securityQuestions.push({ question: formData.question2, answer: formData.answer2 });
      if (formData.answer3) securityQuestions.push({ question: formData.question3, answer: formData.answer3 });
      
      if (securityQuestions.length > 0) {
        updateData.append('securityQuestions', JSON.stringify(securityQuestions));
      }
      
      // Profile photo
      if (formData.profilePhoto) {
        updateData.append('profilePhoto', formData.profilePhoto);
      }

      // Use fetch directly for FormData
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/mybanker/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type - browser will set it with boundary for FormData
        },
        credentials: 'include',
        body: updateData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Update user error:', error);
      setErrors({ submit: error.message || error.response?.data?.error || 'Failed to update user' });
    }
    setIsSaving(false);
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          {errors.fetch ? (
            <>
              <p className="text-red-400 text-center mb-4">{errors.fetch}</p>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Close
              </button>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="text-slate-400 mt-4">Loading user details...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between z-10">
          <div>
            <h3 className="text-xl font-bold text-white">Edit User</h3>
            <p className="text-slate-400 text-sm">{user?.email}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-700 px-6">
          <div className="flex gap-4">
            {[
              { id: 'personal', label: 'Personal Info', icon: User },
              { id: 'account', label: 'Account Settings', icon: CreditCard },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'password', label: 'Password', icon: Lock }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Personal Info Tab */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center overflow-hidden">
                    {user?.profilePhoto ? (
                      <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-indigo-400 font-bold text-2xl">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <input
                      type="file"
                      id="profilePhoto"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="profilePhoto"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg cursor-pointer transition"
                    >
                      <Upload className="w-4 h-4" />
                      Upload New Photo
                    </label>
                    <p className="text-xs text-slate-400 mt-2">Max 5MB, JPG, PNG, or GIF</p>
                    {errors.profilePhoto && <p className="text-red-400 text-xs mt-1">{errors.profilePhoto}</p>}
                  </div>
                </div>
              </div>

              {/* Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 bg-slate-900 border ${errors.firstName ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.firstName && <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 bg-slate-900 border ${errors.lastName ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.lastName && <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 bg-slate-900 border ${errors.email ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* DOB */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-400" />
                  Address
                </h4>
                
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street Address"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="ZIP Code"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Account Settings Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Account Status
                  </label>
                  <select
                    name="accountStatus"
                    value={formData.accountStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="LIMITED">Limited</option>
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    KYC Status
                  </label>
                  <select
                    name="kycStatus"
                    value={formData.kycStatus}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="NOT_SUBMITTED">Not Submitted</option>
                    <option value="PENDING">Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Account Type
                  </label>
                  <select
                    name="accountType"
                    value={formData.accountType}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="CHECKING">Checking</option>
                    <option value="SAVINGS">Savings</option>
                    <option value="BUSINESS">Business</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Login Preference
                  </label>
                  <select
                    name="loginPreference"
                    value={formData.loginPreference}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="question">Security Question</option>
                    <option value="code">Backup Code</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isAdmin"
                    checked={formData.isAdmin}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-slate-300 text-sm">
                    Grant Admin Privileges
                  </span>
                </label>
              </div>

              <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
                <p className="text-amber-400 text-sm">
                  <strong>Note:</strong> Changing account status or KYC status will affect user's access and capabilities.
                </p>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className="bg-indigo-900/20 border border-indigo-800 rounded-lg p-4 mb-4">
                <p className="text-indigo-400 text-sm">
                  Update security questions. Leave answers blank to keep existing questions unchanged.
                </p>
              </div>

              {[1, 2, 3].map((num) => (
                <div key={num} className="bg-slate-900 rounded-lg p-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Question {num}
                  </label>
                  <select
                    name={`question${num}`}
                    value={formData[`question${num}`]}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 mb-2"
                  >
                    {SECURITY_QUESTIONS.map((q, idx) => (
                      <option key={idx} value={q}>{q}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    name={`answer${num}`}
                    value={formData[`answer${num}`]}
                    onChange={handleChange}
                    placeholder="New answer (leave blank to keep existing)"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
                <p className="text-amber-400 text-sm">
                  Leave password fields blank to keep the current password unchanged.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  className={`w-full px-4 py-2 bg-slate-900 border ${errors.newPassword ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  className={`w-full px-4 py-2 bg-slate-900 border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;
