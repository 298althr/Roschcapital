import React, { useState, useEffect } from 'react';
import { Lock, Shield, CheckCircle2, AlertCircle, Key, RefreshCw, User, Upload, Wallet, Info } from 'lucide-react';
import apiClient from '../lib/apiClient';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import { ActionButton } from '../components/ui/ActionButton';
import { ErrorState } from '../components/ui/ErrorState';
import { useAuth } from '../hooks/useAuth';

export const SettingsPage = () => {
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('password');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    backupCode: ''
  });
  const [securityQuestion, setSecurityQuestion] = useState(null);
  const [loginPreference, setLoginPreference] = useState('question');
  const [preferenceLoading, setPreferenceLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [autoDebitSettings, setAutoDebitSettings] = useState(null);
  const [autoDebitLoading, setAutoDebitLoading] = useState(false);
  
  // Verification modal state for changing login preference
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [pendingPreference, setPendingPreference] = useState(null);
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [verificationBackupCode, setVerificationBackupCode] = useState('');

  useEffect(() => {
    fetchRandomQuestion();
    fetchLoginPreference();
    fetchAutoDebitSettings();
  }, []);

  const fetchRandomQuestion = async () => {
    try {
      const response = await apiClient.get('/auth/random-security-question');
      setSecurityQuestion(response);
    } catch (err) {
      console.error('Failed to fetch security question:', err);
      setError('Failed to load security question');
    }
  };

  const fetchLoginPreference = async () => {
    try {
      const response = await apiClient.get('/auth/login-preference');
      setLoginPreference(response.preference);
    } catch (err) {
      console.error('Failed to fetch login preference:', err);
    }
  };

  const fetchAutoDebitSettings = async () => {
    try {
      const response = await apiClient.get('/auth/auto-debit-settings');
      setAutoDebitSettings(response);
    } catch (err) {
      console.error('Failed to fetch auto-debit settings:', err);
    }
  };

  const handleAutoDebitToggle = async () => {
    if (!autoDebitSettings) return;
    
    setAutoDebitLoading(true);
    setError('');
    setSuccess('');

    try {
      const newValue = !autoDebitSettings.enabled;
      await apiClient.put('/auth/auto-debit-settings', { enabled: newValue });
      setAutoDebitSettings({ ...autoDebitSettings, enabled: newValue });
      setSuccess(`Auto-debit protection ${newValue ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update auto-debit settings');
    }

    setAutoDebitLoading(false);
  };

  const handlePreferenceChange = async (newPreference) => {
    // Don't allow changing to the same preference
    if (newPreference === loginPreference) return;
    
    // Show verification modal instead of changing directly
    setPendingPreference(newPreference);
    setVerificationAnswer('');
    setVerificationBackupCode('');
    setShowVerificationModal(true);
  };

  const handleVerifiedPreferenceChange = async () => {
    setPreferenceLoading(true);
    setError('');
    setSuccess('');

    try {
      // Determine what verification is needed based on current preference
      const verificationData = {
        preference: pendingPreference
      };

      // If currently using security questions, require backup code to change away
      if (loginPreference === 'question') {
        if (!verificationBackupCode.trim()) {
          setError('Please enter a backup code to verify your identity');
          setPreferenceLoading(false);
          return;
        }
        verificationData.backupCode = verificationBackupCode.trim();
      } else {
        // If currently using backup code/auth token, require security question answer to change
        if (!verificationAnswer.trim()) {
          setError('Please answer the security question to verify your identity');
          setPreferenceLoading(false);
          return;
        }
        verificationData.questionId = securityQuestion?.id;
        verificationData.answer = verificationAnswer.trim();
      }

      await apiClient.put('/auth/login-preference', verificationData);
      setLoginPreference(pendingPreference);
      setSuccess(`Login verification method updated to ${pendingPreference === 'question' ? 'Security Question' : 'Auth Token'}`);
      setShowVerificationModal(false);
      setPendingPreference(null);
      setVerificationAnswer('');
      setVerificationBackupCode('');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please check your answer and try again.');
    }

    setPreferenceLoading(false);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB
        setError('Photo must be less than 1MB');
        return;
      }
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handlePhotoUpload = async () => {
    if (!profilePhoto) {
      setError('Please select a photo');
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(profilePhoto.type)) {
      setError('Invalid file type. Only JPEG, JPG, PNG, and GIF images are allowed');
      return;
    }

    // Validate file size (1MB)
    const maxSize = 1 * 1024 * 1024;
    if (profilePhoto.size > maxSize) {
      setError('File size too large. Maximum size is 1MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      setError('');
      setSuccess('');
      
      console.log('Uploading profile photo:', profilePhoto.name, profilePhoto.size, profilePhoto.type);
      
      // Convert file to base64
      const base64Image = await fileToBase64(profilePhoto);
      
      // Send base64 to backend
      const response = await apiClient.post('/auth/profile-photo-base64', { base64Image });

      console.log('Profile photo upload response:', response);

      setSuccess('Profile photo updated successfully!');
      setProfilePhoto(null);
      
      // Refresh user data to update avatar everywhere
      await refreshUser();
      
      // Update photo preview with the base64 image from response
      if (response.user?.profilePhoto) {
        setPhotoPreview(response.user.profilePhoto);
      }
    } catch (err) {
      console.error('Profile photo upload error:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      let errorMessage = 'Failed to upload photo';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.details) {
        errorMessage = `${err.response.data.error}: ${err.response.data.details}`;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (!passwordData.backupCode.trim() || passwordData.backupCode.length !== 6) {
      setError('Please enter a valid 6-digit Auth Token');
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        backupCode: passwordData.backupCode
      });

      setSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        backupCode: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
    }

    setIsLoading(false);
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Account Settings</h1>
          <p className="text-sm text-neutral-600">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
          <div className="border-b border-neutral-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('password')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'password'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Lock className="w-4 h-4 inline mr-2" />
                Change Password
              </button>
              <button
                onClick={() => setActiveTab('login')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'login'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Key className="w-4 h-4 inline mr-2" />
                Login Verification
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Profile Photo
              </button>
              <button
                onClick={() => setActiveTab('autodebit')}
                className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'autodebit'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <Wallet className="w-4 h-4 inline mr-2" />
                Balance Protection
              </button>
            </nav>
          </div>

          {/* Password Change Form */}
          {activeTab === 'password' && (
            <div className="p-6">
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-2">Change Password</h2>
                  <p className="text-sm text-neutral-600">
                    For security, you must enter an Auth Token to change your password
                  </p>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-emerald-700 text-sm font-medium">{success}</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-5">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter your current password"
                      className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
                      required
                    />
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                      className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
                      required
                    />
                    <p className="text-xs text-neutral-500 mt-1.5">At least 8 characters</p>
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                      className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
                      required
                    />
                  </div>

                  {/* Backup Code Verification */}
                  <div className="border-t border-neutral-200 pt-5 mt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-primary-600" />
                      <h3 className="text-sm font-semibold text-neutral-900">Security Verification</h3>
                    </div>

                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-sm font-medium text-amber-900">
                        Enter one of your Auth Tokens to verify this action. Auth Tokens can only be used once.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">
                        Auth Token
                      </label>
                      <input
                        type="text"
                        name="backupCode"
                        value={passwordData.backupCode}
                        onChange={handlePasswordChange}
                        placeholder="Enter 6-digit Auth Token"
                        maxLength="6"
                        className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm text-center text-xl tracking-widest font-mono"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <ActionButton
                      type="submit"
                      variant="primary"
                      size="lg"
                      loading={isLoading}
                      disabled={passwordData.backupCode.length !== 6}
                      fullWidth
                    >
                      {isLoading ? 'Changing Password...' : 'Change Password'}
                    </ActionButton>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Login Verification Preference */}
          {activeTab === 'login' && (
            <div className="p-6">
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-2">Login Verification Method</h2>
                  <p className="text-sm text-neutral-600">
                    Choose your preferred method for verifying your identity when logging in
                  </p>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-emerald-700 text-sm font-medium">{success}</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Security Question Option */}
                  <button
                    onClick={() => handlePreferenceChange('question')}
                    disabled={preferenceLoading || loginPreference === 'question'}
                    className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                      loginPreference === 'question'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-neutral-300 hover:border-primary-400 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        loginPreference === 'question'
                          ? 'border-primary-600 bg-primary-600'
                          : 'border-neutral-400'
                      }`}>
                        {loginPreference === 'question' && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Shield className="w-5 h-5 text-primary-600" />
                          <h3 className="font-semibold text-neutral-900">Security Question</h3>
                        </div>
                        <p className="text-sm text-neutral-600">
                          Answer one of your security questions to verify your identity
                        </p>
                      </div>
                    </div>
                  </button>

                  {/* Backup Code Option */}
                  <button
                    onClick={() => handlePreferenceChange('code')}
                    disabled={preferenceLoading || loginPreference === 'code'}
                    className={`w-full p-5 rounded-xl border-2 transition-all text-left ${
                      loginPreference === 'code'
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-neutral-300 hover:border-primary-400 bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                        loginPreference === 'code'
                          ? 'border-primary-600 bg-primary-600'
                          : 'border-neutral-400'
                      }`}>
                        {loginPreference === 'code' && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Key className="w-5 h-5 text-primary-600" />
                          <h3 className="font-semibold text-neutral-900">Auth Token</h3>
                        </div>
                        <p className="text-sm text-neutral-600">
                          Check your email for a 6-digit authentication code
                        </p>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-amber-900 mb-1">Important</h3>
                      <p className="text-sm text-amber-700">
                        {loginPreference === 'code' 
                          ? 'When using Auth Tokens, you will receive an email with your authentication code each time you log in.'
                          : 'Make sure you remember the answers to your security questions.'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Profile Photo Tab */}
          {activeTab === 'profile' && (
            <div className="p-6">
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-2">Profile Photo</h2>
                  <p className="text-sm text-neutral-600">
                    Upload a profile photo for your account (Max 1MB)
                  </p>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-emerald-700 text-sm font-medium">{success}</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Photo Preview */}
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-16 h-16 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="cursor-pointer">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors">
                          <Upload className="w-4 h-4" />
                          Choose Photo
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-neutral-500 mt-2">
                        JPG, PNG or GIF. Max size 1MB
                      </p>
                    </div>
                  </div>

                  {/* Upload Button */}
                  {profilePhoto && (
                    <div className="flex gap-3">
                      <ActionButton
                        type="button"
                        variant="primary"
                        size="lg"
                        onClick={handlePhotoUpload}
                        loading={uploadingPhoto}
                        disabled={uploadingPhoto}
                      >
                        {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                      </ActionButton>
                      <ActionButton
                        type="button"
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          setProfilePhoto(null);
                          setPhotoPreview(user?.profilePhoto || null);
                        }}
                        disabled={uploadingPhoto}
                      >
                        Cancel
                      </ActionButton>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Auto-Debit / Balance Protection Tab */}
          {activeTab === 'autodebit' && (
            <div className="p-6">
              <div className="max-w-2xl">
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-2">Automatic Balance Protection</h2>
                  <p className="text-sm text-neutral-600">
                    Protect your accounts from overdraft by automatically covering negative balances
                  </p>
                </div>

                {/* Success Message */}
                {success && (
                  <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-emerald-700 text-sm font-medium">{success}</p>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                )}

                {/* Toggle Card */}
                <div className="bg-white border border-neutral-200 rounded-xl p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        autoDebitSettings?.enabled ? 'bg-emerald-100' : 'bg-neutral-100'
                      }`}>
                        <Wallet className={`w-6 h-6 ${
                          autoDebitSettings?.enabled ? 'text-emerald-600' : 'text-neutral-400'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">Auto-Debit Protection</h3>
                        <p className="text-sm text-neutral-500">
                          {autoDebitSettings?.enabled ? 'Currently enabled' : 'Currently disabled'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleAutoDebitToggle}
                      disabled={autoDebitLoading}
                      className={`relative w-14 h-8 rounded-full transition-colors ${
                        autoDebitSettings?.enabled ? 'bg-emerald-500' : 'bg-neutral-300'
                      } ${autoDebitLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                        autoDebitSettings?.enabled ? 'translate-x-7' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>

                {/* Policy Information */}
                {autoDebitSettings?.policy && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-purple-900 mb-2">{autoDebitSettings.policy.title}</h3>
                        <p className="text-sm text-purple-700 mb-4">{autoDebitSettings.policy.description}</p>
                        
                        <h4 className="font-medium text-purple-900 mb-2">Policy Rules:</h4>
                        <ul className="space-y-2">
                          {autoDebitSettings.policy.rules.map((rule, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-purple-700">
                              <CheckCircle2 className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                              <span>{rule}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Priority */}
                <div className="mt-6 bg-neutral-50 border border-neutral-200 rounded-xl p-6">
                  <h3 className="font-semibold text-neutral-900 mb-4">Account Priority Order</h3>
                  <p className="text-sm text-neutral-600 mb-4">
                    When auto-debit is triggered, funds will be sourced in this order:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
                      <span className="w-6 h-6 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span className="text-sm font-medium text-neutral-700">Savings Account</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
                      <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span className="text-sm font-medium text-neutral-700">Checking Account</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-200">
                      <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span className="text-sm font-medium text-neutral-700">Business Account</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                      <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold">✕</span>
                      <span className="text-sm font-medium text-red-700">Crypto Wallet (Protected - Never used for auto-debit)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Security Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">Security Tip</h3>
              <p className="text-sm text-blue-700">
                Always use a strong, unique password. Never share your password or security question answers with anyone.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Modal for Changing Login Preference */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900">Verify Your Identity</h3>
                <p className="text-sm text-neutral-500">
                  {loginPreference === 'question' 
                    ? 'Enter a backup code to change your login method'
                    : 'Answer your security question to change your login method'
                  }
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {loginPreference === 'question' ? (
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Backup Code
                </label>
                <input
                  type="text"
                  value={verificationBackupCode}
                  onChange={(e) => setVerificationBackupCode(e.target.value)}
                  placeholder="Enter your 6-digit backup code"
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  maxLength={6}
                />
                <p className="mt-2 text-xs text-neutral-500">
                  Use one of your backup codes to verify this change
                </p>
              </div>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  {securityQuestion?.question || 'Security Question'}
                </label>
                <input
                  type="text"
                  value={verificationAnswer}
                  onChange={(e) => setVerificationAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                  setPendingPreference(null);
                  setError('');
                }}
                className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl hover:bg-neutral-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifiedPreferenceChange}
                disabled={preferenceLoading}
                className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-medium disabled:opacity-50"
              >
                {preferenceLoading ? 'Verifying...' : 'Confirm Change'}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserDashboardLayout>
  );
};

export default SettingsPage;
