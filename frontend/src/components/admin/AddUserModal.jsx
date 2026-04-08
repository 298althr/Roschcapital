import React, { useState } from 'react';
import { X, User, Mail, Lock, Phone, MapPin, Calendar, CreditCard, Shield } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const SECURITY_QUESTIONS = [
  "What is your mother's maiden name?",
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your favorite color?",
  "What was the name of your elementary school?"
];

export const AddUserModal = ({ isOpen, onClose, onSuccess }) => {
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [backupCodes, setBackupCodes] = useState([]);
  const [formData, setFormData] = useState({
    // Personal Information
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
    country: 'United States',
    
    // Account Settings
    password: '',
    confirmPassword: '',
    accountType: 'CHECKING',
    initialBalance: '0',
    setAsActive: false,
    
    // Security Questions
    question1: SECURITY_QUESTIONS[0],
    answer1: '',
    question2: SECURITY_QUESTIONS[1],
    answer2: '',
    question3: SECURITY_QUESTIONS[2],
    answer3: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    // Required fields
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    
    // Password validation
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Security questions
    if (!formData.answer1.trim()) newErrors.answer1 = 'Answer is required';
    if (!formData.answer2.trim()) newErrors.answer2 = 'Answer is required';
    if (!formData.answer3.trim()) newErrors.answer3 = 'Answer is required';

    // Initial balance
    if (parseFloat(formData.initialBalance) < 0) {
      newErrors.initialBalance = 'Balance cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        password: formData.password,
        accountType: formData.accountType,
        initialBalance: parseFloat(formData.initialBalance),
        setAsActive: formData.setAsActive,
        securityQuestions: [
          { question: formData.question1, answer: formData.answer1 },
          { question: formData.question2, answer: formData.answer2 },
          { question: formData.question3, answer: formData.answer3 }
        ]
      };

      const response = await apiClient.post('/mybanker/users', payload);

      // Show backup codes to admin
      setCreatedUser(response.user);
      setBackupCodes(response.backupCodes || []);
      setShowBackupCodes(true);
      
      // Reset form
      setFormData({
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
        password: '',
        confirmPassword: '',
        accountType: 'CHECKING',
        initialBalance: '0',
        setAsActive: false,
        question1: SECURITY_QUESTIONS[0],
        answer1: '',
        question2: SECURITY_QUESTIONS[1],
        answer2: '',
        question3: SECURITY_QUESTIONS[2],
        answer3: ''
      });
    } catch (error) {
      console.error('Add user error:', error);
      setErrors({ submit: error.response?.data?.error || 'Failed to create user' });
    }
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between z-10">
          <div>
            <h3 className="text-xl font-bold text-white">Add New User</h3>
            <p className="text-slate-400 text-sm">Create a new user account with full details</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Personal Information */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              Personal Information
            </h4>
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
                  Phone *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  className={`w-full px-4 py-2 bg-slate-900 border ${errors.phone ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-slate-900 border ${errors.dateOfBirth ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.dateOfBirth && <p className="text-red-400 text-xs mt-1">{errors.dateOfBirth}</p>}
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-indigo-400" />
              Address
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-slate-900 border ${errors.address ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.address && <p className="text-red-400 text-xs mt-1">{errors.address}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-slate-900 border ${errors.city ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.city && <p className="text-red-400 text-xs mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-slate-900 border ${errors.state ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.state && <p className="text-red-400 text-xs mt-1">{errors.state}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-slate-900 border ${errors.zipCode ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.zipCode && <p className="text-red-400 text-xs mt-1">{errors.zipCode}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Account Settings */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              Account Settings
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Account Type *
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
                  Initial Balance
                </label>
                <input
                  type="number"
                  name="initialBalance"
                  value={formData.initialBalance}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-2 bg-slate-900 border ${errors.initialBalance ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.initialBalance && <p className="text-red-400 text-xs mt-1">{errors.initialBalance}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="setAsActive"
                    checked={formData.setAsActive}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-slate-300 text-sm">
                    Set as Active (KYC Verified) - Account will be fully activated
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-400" />
              Password
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-slate-900 border ${errors.password ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 bg-slate-900 border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                />
                {errors.confirmPassword && <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          {/* Security Questions */}
          <div>
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              Security Questions
            </h4>
            <div className="space-y-4">
              {[1, 2, 3].map((num) => (
                <div key={num} className="bg-slate-900 rounded-lg p-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Question {num} *
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
                    placeholder="Answer"
                    className={`w-full px-4 py-2 bg-slate-800 border ${errors[`answer${num}`] ? 'border-red-500' : 'border-slate-700'} rounded-lg text-white focus:ring-2 focus:ring-indigo-500`}
                  />
                  {errors[`answer${num}`] && <p className="text-red-400 text-xs mt-1">{errors[`answer${num}`]}</p>}
                </div>
              ))}
            </div>
          </div>

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
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating User...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>

      {/* Backup Codes Modal */}
      {showBackupCodes && createdUser && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">User Created Successfully!</h3>
              <p className="text-slate-400 text-sm mt-1">
                {createdUser.firstName} {createdUser.lastName} - {createdUser.email}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
                <p className="text-amber-400 text-sm">
                  <strong>Important:</strong> Save these backup codes securely. They cannot be retrieved later.
                </p>
              </div>

              <div>
                <h4 className="text-white font-semibold mb-3">Backup Codes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="bg-slate-900 rounded-lg p-3">
                      <div className="text-xs text-slate-400 mb-1">Code {idx + 1}</div>
                      <div className="text-lg font-mono font-bold text-white">{code}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-700">
              <button
                onClick={() => {
                  setShowBackupCodes(false);
                  setCreatedUser(null);
                  setBackupCodes([]);
                  onSuccess();
                  onClose();
                }}
                className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddUserModal;
