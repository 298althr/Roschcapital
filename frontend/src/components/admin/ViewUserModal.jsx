import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Calendar, CreditCard, Shield, DollarSign, Clock, FileText, Key, Download, Copy } from 'lucide-react';
import apiClient from '../../lib/apiClient';

export const ViewUserModal = ({ isOpen, onClose, userId }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [backupCodes, setBackupCodes] = useState([]);
  const [showCodes, setShowCodes] = useState(false);

  useEffect(() => {
    if (isOpen && userId) {
      fetchUserDetails();
    }
  }, [isOpen, userId]);

  const fetchUserDetails = async () => {
    setIsLoading(true);
    try {
      const [userResponse, transactionsResponse, codesResponse] = await Promise.all([
        apiClient.get(`/mybanker/users/${userId}`),
        apiClient.get(`/mybanker/users/${userId}/transactions?limit=10`).catch(() => ({ transactions: [] })),
        apiClient.get(`/mybanker/users/${userId}/backup-codes`).catch(() => ({ codes: [] }))
      ]);
      
      setUser(userResponse.user);
      setTransactions(transactionsResponse.transactions || []);
      setBackupCodes(codesResponse.codes || []);
    } catch (error) {
      console.error('Failed to fetch user details:', error);
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const downloadBackupCodes = async () => {
    try {
      const response = await apiClient.get(`/mybanker/users/${userId}/backup-codes/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-codes-${user.email}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download backup codes:', error);
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="text-slate-400 mt-4">Loading user details...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <p className="text-red-400">Failed to load user details</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-slate-700 text-white rounded-lg">
            Close
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'SUSPENDED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'LIMITED': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center">
              {user.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.firstName} className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-indigo-400 font-bold text-2xl">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{user.firstName} {user.lastName}</h3>
              <p className="text-slate-400 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.accountStatus)}`}>
                  {user.accountStatus}
                </span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.kycStatus)}`}>
                  KYC: {user.kycStatus}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Account Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <DollarSign className="w-4 h-4" />
                Available Balance
              </div>
              <div className="text-2xl font-bold text-white">
                ${user.balance?.toFixed(2) || '0.00'}
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <CreditCard className="w-4 h-4" />
                Account Number
              </div>
              <div className="text-xl font-mono font-bold text-white">
                {user.accountNumber || 'N/A'}
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                <Clock className="w-4 h-4" />
                Member Since
              </div>
              <div className="text-lg font-semibold text-white">
                {new Date(user.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="bg-slate-900 rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-400" />
              Personal Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Full Name:</span>
                <span className="text-white ml-2">{user.firstName} {user.lastName}</span>
              </div>
              <div>
                <span className="text-slate-400">Email:</span>
                <span className="text-white ml-2">{user.email}</span>
              </div>
              <div>
                <span className="text-slate-400">Phone:</span>
                <span className="text-white ml-2">{user.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400">Date of Birth:</span>
                <span className="text-white ml-2">
                  {user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-400">Address:</span>
                <span className="text-white ml-2">
                  {user.address ? `${user.address}, ${user.city}, ${user.state} ${user.zipCode}` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Account Details */}
          <div className="bg-slate-900 rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              Account Details
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">Account Type:</span>
                <span className="text-white ml-2">{user.accountType || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400">Account Status:</span>
                <span className="text-white ml-2">{user.accountStatus}</span>
              </div>
              <div>
                <span className="text-slate-400">KYC Status:</span>
                <span className="text-white ml-2">{user.kycStatus}</span>
              </div>
              <div>
                <span className="text-slate-400">Login Preference:</span>
                <span className="text-white ml-2">{user.loginPreference === 'question' ? 'Security Question' : 'Backup Code'}</span>
              </div>
              <div>
                <span className="text-slate-400">Total Sent:</span>
                <span className="text-white ml-2">${user.totalSentAmount?.toFixed(2) || '0.00'}</span>
              </div>
              <div>
                <span className="text-slate-400">Is Admin:</span>
                <span className="text-white ml-2">{user.isAdmin ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          {/* Security Questions */}
          {user.securityQuestions && user.securityQuestions.length > 0 && (
            <div className="bg-slate-900 rounded-lg p-6">
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                Security Questions
              </h4>
              <div className="space-y-2">
                {user.securityQuestions.map((sq, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="text-slate-400">{idx + 1}. {sq.question}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backup Codes */}
          {backupCodes.length > 0 && (
            <div className="bg-slate-900 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-400" />
                  Backup Codes
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCodes(!showCodes)}
                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition"
                  >
                    {showCodes ? 'Hide' : 'Show'} Codes
                  </button>
                  <button
                    onClick={downloadBackupCodes}
                    className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg transition"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              </div>
              
              {showCodes ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {backupCodes.map((code, idx) => (
                    <div key={idx} className="bg-slate-800 rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <div className="text-xs text-slate-400 mb-1">Code {idx + 1}</div>
                        <div className="text-lg font-mono font-bold text-white">{code.code}</div>
                        {code.used && (
                          <div className="text-xs text-red-400 mt-1">
                            Used on {new Date(code.usedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => copyToClipboard(code.code)}
                        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">
                  {backupCodes.filter(c => !c.used).length} unused codes available. Click "Show Codes" to view.
                </p>
              )}
            </div>
          )}

          {/* Recent Transactions */}
          <div className="bg-slate-900 rounded-lg p-6">
            <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              Recent Transactions
            </h4>
            {transactions.length === 0 ? (
              <p className="text-slate-400 text-sm">No transactions yet</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0">
                    <div>
                      <div className="text-white text-sm">{tx.description}</div>
                      <div className="text-slate-400 text-xs">{new Date(tx.createdAt).toLocaleString()}</div>
                    </div>
                    <div className={`font-semibold ${tx.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'}`}>
                      {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount?.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-700">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewUserModal;
