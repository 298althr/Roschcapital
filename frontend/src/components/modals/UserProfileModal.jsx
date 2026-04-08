import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Shield, CreditCard, Loader2 } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const UserProfileModal = ({ isOpen, onClose, user }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch fresh user profile data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/auth/me');
      if (response.user) {
        setProfileData(response.user);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      // Fall back to passed user data
      setProfileData(user);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Use fetched profile data or fall back to passed user
  const userData = profileData || user;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-700',
      LIMITED: 'bg-yellow-100 text-yellow-700',
      SUSPENDED: 'bg-red-100 text-red-700',
      CLOSED: 'bg-slate-100 text-slate-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.ACTIVE}`}>{status}</span>;
  };

  const getKYCBadge = (status) => {
    const styles = {
      NOT_SUBMITTED: 'bg-slate-100 text-slate-700',
      PENDING: 'bg-yellow-100 text-yellow-700',
      VERIFIED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.NOT_SUBMITTED}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-500 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {userData?.profilePhoto ? (
              <img 
                src={userData.profilePhoto.startsWith('data:') || userData.profilePhoto.startsWith('http') ? userData.profilePhoto : `${import.meta.env.VITE_API_URL?.replace('/api/v1', '') || ''}${userData.profilePhoto}`}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover ring-2 ring-white/30"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className={`w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold ${userData?.profilePhoto ? 'hidden' : ''}`}
            >
              {userData?.firstName?.[0]?.toUpperCase() || userData?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {userData?.firstName && userData?.lastName ? `${userData.firstName} ${userData.lastName}` : 'User Profile'}
              </h2>
              <p className="text-primary-100 text-sm">{userData?.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <>
          {/* Account Status */}
          <div className="bg-neutral-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Account Status
              </h3>
              {getStatusBadge(userData?.accountStatus || 'ACTIVE')}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">KYC Status</span>
              {getKYCBadge(userData?.kycStatus || 'NOT_SUBMITTED')}
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-start justify-between py-2 border-b border-neutral-100">
                <span className="text-sm text-neutral-600">Full Name</span>
                <span className="text-sm font-medium text-neutral-900 text-right">
                  {userData?.firstName && userData?.lastName ? `${userData.firstName} ${userData.lastName}` : 'Not provided'}
                </span>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-neutral-100">
                <span className="text-sm text-neutral-600 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </span>
                <span className="text-sm font-medium text-neutral-900 text-right">{userData?.email || 'N/A'}</span>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-neutral-100">
                <span className="text-sm text-neutral-600 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </span>
                <span className="text-sm font-medium text-neutral-900 text-right">{userData?.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-neutral-100">
                <span className="text-sm text-neutral-600 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </span>
                <span className="text-sm font-medium text-neutral-900 text-right max-w-xs">
                  {userData?.address || 'Not provided'}
                </span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Account Details
            </h3>
            <div className="space-y-3">
              <div className="flex items-start justify-between py-2 border-b border-neutral-100">
                <span className="text-sm text-neutral-600">Account Type</span>
                <span className="text-sm font-medium text-neutral-900">
                  {userData?.accountType === 'BUSINESS' || userData?.isBusinessAccount ? 'Corporate Account' : 'Personal Account'}
                </span>
              </div>
              <div className="flex items-start justify-between py-2">
                <span className="text-sm text-neutral-600">Member Since</span>
                <span className="text-sm font-medium text-neutral-900">
                  {(() => {
                    // Set member since to approximately 2000 days ago (about 5.5 years)
                    const memberSince = new Date();
                    memberSince.setDate(memberSince.getDate() - 2000);
                    return memberSince.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    });
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> This information is read-only. To update your profile, please visit the Account Settings page.
            </p>
          </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 p-6">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
