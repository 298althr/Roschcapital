import React, { useState, useEffect } from 'react';
import { FileText, Check, X, Eye, Download, AlertCircle, Building2, User, Calendar, MapPin, Phone, Mail, Briefcase, FileCheck, MessageSquare } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import PremiumModal from '../modals/PremiumModal';

export const KYCReview = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [actionType, setActionType] = useState(null); // 'approve', 'reject', 'request'
  const [isProcessing, setIsProcessing] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/mybanker/kyc/users/pending');
      setPendingUsers(response.users || []);
    } catch (error) {
      console.error('Failed to fetch pending KYC users:', error);
    }
    setIsLoading(false);
  };

  const fetchUserDetails = async (userId) => {
    try {
      const response = await apiClient.get(`/mybanker/kyc/users/${userId}`);
      setUserDetails(response);
      setSelectedUserId(userId);
      setShowModal(true);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Load Failed',
        message: 'Failed to load user details. Please try again.',
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await apiClient.post(`/mybanker/kyc/users/${selectedUserId}/approve`);
      setShowModal(false);
      setShowActionModal(false);
      setModal({
        isOpen: true,
        type: 'success',
        title: 'KYC Approved',
        message: 'KYC has been approved successfully! The user now has full access to banking features.',
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
      fetchPendingUsers();
    } catch (error) {
      console.error('Failed to approve KYC:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Approval Failed',
        message: 'Failed to approve KYC. Please try again.',
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
    }
    setIsProcessing(false);
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Reason Required',
        message: 'Please provide a reason for rejection before proceeding.',
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      await apiClient.post(`/mybanker/kyc/users/${selectedUserId}/reject`, { 
        reason: rejectionReason 
      });
      setShowModal(false);
      setShowActionModal(false);
      setRejectionReason('');
      setModal({
        isOpen: true,
        type: 'success',
        title: 'KYC Rejected',
        message: 'KYC has been rejected. The user has been notified.',
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
      fetchPendingUsers();
    } catch (error) {
      console.error('Failed to reject KYC:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Rejection Failed',
        message: 'Failed to reject KYC. Please try again.',
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
    }
    setIsProcessing(false);
  };

  const handleRequestMore = async () => {
    if (!requestMessage.trim()) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Message Required',
        message: 'Please provide a message specifying which documents are needed.',
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    
    setIsProcessing(true);
    try {
      await apiClient.post(`/mybanker/kyc/users/${selectedUserId}/request-more`, { 
        message: requestMessage 
      });
      setShowActionModal(false);
      setRequestMessage('');
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Request Sent',
        message: 'Document request has been sent successfully. The user will be notified.',
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
    } catch (error) {
      console.error('Failed to request documents:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Request Failed',
        message: 'Failed to send document request. Please try again.',
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
    }
    setIsProcessing(false);
  };

  const openActionModal = (type) => {
    setActionType(type);
    setShowActionModal(true);
  };

  const getCategoryLabel = (category) => {
    const labels = {
      'GOVERNMENT_ID': 'Government ID',
      'PROOF_OF_ADDRESS': 'Proof of Address',
      'TAX_ID': 'Tax ID',
      'SELFIE': 'Selfie with ID',
      'BUSINESS_REGISTRATION': 'Business Registration',
      'BUSINESS_TAX': 'Business Tax Documents',
      'BUSINESS_ADDRESS': 'Business Address Proof',
      'REPRESENTATIVE_ID': 'Representative ID',
      'OTHER': 'Other Documents'
    };
    return labels[category] || category;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">KYC Review</h2>
          <p className="text-slate-400 text-sm">Review and approve pending KYC submissions</p>
        </div>
        <div className="bg-indigo-500/20 px-4 py-2 rounded-lg">
          <span className="text-indigo-400 font-semibold">{pendingUsers.length} Pending</span>
        </div>
      </div>

      {/* Pending Users List */}
      {pendingUsers.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-12 text-center">
          <FileCheck className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Pending KYC Submissions</h3>
          <p className="text-slate-400">All KYC submissions have been reviewed</p>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Documents
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {pendingUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                        {user.isBusinessAccount ? (
                          <Building2 className="w-5 h-5 text-indigo-400" />
                        ) : (
                          <User className="w-5 h-5 text-indigo-400" />
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-slate-400 text-sm">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.isBusinessAccount ? (
                      <div>
                        <div className="text-white text-sm">Business</div>
                        <div className="text-slate-400 text-xs">{user.businessName}</div>
                      </div>
                    ) : (
                      <div className="text-white text-sm">Personal</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="text-white">{user.phoneCountryCode} {user.phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-400">
                      {new Date(user.kycSubmittedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      {Math.floor((new Date() - new Date(user.kycSubmittedAt)) / (1000 * 60 * 60 * 24))} days ago
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-white text-sm">{user.documentCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => fetchUserDetails(user.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {showModal && userDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between z-10">
              <div>
                <h3 className="text-xl font-bold text-white">KYC Review</h3>
                <p className="text-slate-400 text-sm">
                  {userDetails.user.firstName} {userDetails.user.lastName} - {userDetails.user.email}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* User Information */}
              <div className="bg-slate-900 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  {userDetails.user.isBusinessAccount ? (
                    <><Building2 className="w-5 h-5 text-indigo-400" /> Business Information</>
                  ) : (
                    <><User className="w-5 h-5 text-indigo-400" /> Personal Information</>
                  )}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {userDetails.user.isBusinessAccount ? (
                    <>
                      <div>
                        <span className="text-slate-400">Business Name:</span>
                        <span className="text-white ml-2">{userDetails.user.businessName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Business Type:</span>
                        <span className="text-white ml-2">{userDetails.user.businessType}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Tax ID:</span>
                        <span className="text-white ml-2">{userDetails.user.taxId}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Representative:</span>
                        <span className="text-white ml-2">{userDetails.user.representativeName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Representative Title:</span>
                        <span className="text-white ml-2">{userDetails.user.representativeTitle}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Business Address:</span>
                        <span className="text-white ml-2">
                          {userDetails.user.businessAddress}, {userDetails.user.businessCity}, {userDetails.user.businessState} {userDetails.user.businessZip}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-slate-400">Date of Birth:</span>
                        <span className="text-white ml-2">
                          {userDetails.user.dateOfBirth ? new Date(userDetails.user.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Phone:</span>
                        <span className="text-white ml-2">
                          {userDetails.user.phoneCountryCode} {userDetails.user.phone}
                        </span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="text-slate-400">Address:</span>
                        <span className="text-white ml-2">
                          {userDetails.user.address}, {userDetails.user.city}, {userDetails.user.state} {userDetails.user.zipCode}, {userDetails.user.country}
                        </span>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-slate-400">Email:</span>
                    <span className="text-white ml-2">{userDetails.user.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Submitted:</span>
                    <span className="text-white ml-2">
                      {new Date(userDetails.user.kycSubmittedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Documents by Category */}
              <div className="bg-slate-900 rounded-lg p-6">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-400" />
                  Submitted Documents ({userDetails.totalDocuments})
                </h4>

                {Object.keys(userDetails.documents).length === 0 ? (
                  <p className="text-slate-400 text-sm">No documents uploaded</p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(userDetails.documents).map(([category, docs]) => (
                      <div key={category} className="border border-slate-700 rounded-lg p-4">
                        <h5 className="text-white font-medium mb-3">{getCategoryLabel(category)}</h5>
                        <div className="space-y-2">
                          {docs.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between bg-slate-800 p-3 rounded-lg">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-slate-400" />
                                <div>
                                  <div className="text-white text-sm">{doc.fileName}</div>
                                  <div className="text-slate-400 text-xs">
                                    {formatFileSize(doc.fileSize)} • Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              </div>
                              <a
                                href={`${(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1').replace('/api/v1', '')}/${doc.filePath.replace(/^\/app\//, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition text-sm"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
                <button
                  onClick={() => openActionModal('approve')}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-semibold"
                >
                  <Check className="w-5 h-5" />
                  Approve KYC
                </button>
                <button
                  onClick={() => openActionModal('reject')}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-semibold"
                >
                  <X className="w-5 h-5" />
                  Reject KYC
                </button>
                <button
                  onClick={() => openActionModal('request')}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition font-semibold"
                >
                  <MessageSquare className="w-5 h-5" />
                  Request More
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              {actionType === 'approve' && 'Approve KYC'}
              {actionType === 'reject' && 'Reject KYC'}
              {actionType === 'request' && 'Request Additional Documents'}
            </h3>

            {actionType === 'approve' && (
              <div className="space-y-4">
                <p className="text-slate-300">
                  Are you sure you want to approve this KYC submission? The user will gain full access to all banking features.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowActionModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApprove}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Approve'}
                  </button>
                </div>
              </div>
            )}

            {actionType === 'reject' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explain why the KYC is being rejected..."
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 resize-none"
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowActionModal(false);
                      setRejectionReason('');
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            )}

            {actionType === 'request' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Message to User *
                  </label>
                  <textarea
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Specify which additional documents are needed..."
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-amber-500 resize-none"
                    rows={4}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setShowActionModal(false);
                      setRequestMessage('');
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestMore}
                    disabled={isProcessing}
                    className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {isProcessing ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Premium Modal */}
      <PremiumModal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
      />
    </div>
  );
};

export default KYCReview;
