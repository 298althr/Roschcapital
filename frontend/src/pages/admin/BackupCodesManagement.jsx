import React, { useState, useEffect } from 'react';
import { Shield, Eye, Download, RefreshCw, Search, User, Calendar, CheckCircle, XCircle, FileText } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import jsPDF from 'jspdf';

export const BackupCodesManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCodesModal, setShowCodesModal] = useState(false);
  const [backupCodes, setBackupCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [showRegenerateModal, setShowRegenerateModal] = useState(false);
  const [codeCount, setCodeCount] = useState(50);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/mybanker/users');
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackupCodes = async (userId) => {
    try {
      setLoadingCodes(true);
      const response = await apiClient.get(`/mybanker/users/${userId}/backup-codes`);
      setBackupCodes(response.codes || []);
    } catch (error) {
      console.error('Failed to fetch backup codes:', error);
      alert('Failed to load backup codes');
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleViewCodes = async (user) => {
    setSelectedUser(user);
    setShowCodesModal(true);
    await fetchBackupCodes(user.id);
  };

  const handleOpenRegenerateModal = () => {
    setCodeCount(50);
    setShowRegenerateModal(true);
  };

  const handleRegenerateCodes = async () => {
    if (!selectedUser) return;

    try {
      setRegenerating(true);
      setShowRegenerateModal(false);
      const response = await apiClient.post(`/mybanker/users/${selectedUser.id}/regenerate-backup-codes`, {
        count: codeCount
      });
      setBackupCodes(response.codes || []);
      // Auto-download PDF after regeneration
      handleDownloadPDF(response.codes || []);
    } catch (error) {
      console.error('Failed to regenerate codes:', error);
      alert('Failed to regenerate backup codes');
    } finally {
      setRegenerating(false);
    }
  };

  const handleDownloadPDF = (codes = backupCodes) => {
    if (!selectedUser || !codes.length) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFillColor(79, 70, 229); // Indigo
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('ROSCH CAPITAL BANK', pageWidth / 2, 18, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Backup Authentication Codes', pageWidth / 2, 30, { align: 'center' });
    
    // User Info Box
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(15, 50, pageWidth - 30, 30, 3, 3, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Account Holder:', 20, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`${selectedUser.firstName} ${selectedUser.lastName}`, 55, 60);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Email:', 20, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(selectedUser.email, 35, 70);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Generated:', 120, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date().toLocaleDateString(), 145, 60);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Total Codes:', 120, 70);
    doc.setFont('helvetica', 'normal');
    doc.text(codes.length.toString(), 150, 70);
    
    // Security Notice
    doc.setFillColor(254, 243, 199); // Amber
    doc.roundedRect(15, 90, pageWidth - 30, 20, 3, 3, 'F');
    doc.setFontSize(9);
    doc.setTextColor(146, 64, 14);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠ IMPORTANT:', 20, 100);
    doc.setFont('helvetica', 'normal');
    doc.text('Keep these codes secure. Each code can only be used ONCE. Store in a safe place.', 50, 100);
    doc.text('Contact admin to request new codes when exhausted.', 20, 107);
    
    // Codes Grid
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Your Backup Codes', 15, 125);
    
    const activeCodes = codes.filter(c => !c.used);
    const codesPerRow = 4;
    const codeWidth = (pageWidth - 40) / codesPerRow;
    const codeHeight = 12;
    let startY = 135;
    let currentPage = 1;
    
    activeCodes.forEach((codeObj, index) => {
      const row = Math.floor(index / codesPerRow);
      const col = index % codesPerRow;
      const x = 20 + (col * codeWidth);
      const y = startY + (row * codeHeight);
      
      // Check if we need a new page
      if (y > 270) {
        doc.addPage();
        currentPage++;
        startY = 20 - (row * codeHeight);
      }
      
      const actualY = startY + (row * codeHeight);
      
      // Code box
      doc.setFillColor(240, 253, 244); // Green tint
      doc.roundedRect(x, actualY - 8, codeWidth - 5, 10, 2, 2, 'F');
      doc.setDrawColor(34, 197, 94);
      doc.roundedRect(x, actualY - 8, codeWidth - 5, 10, 2, 2, 'S');
      
      // Code number
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`${index + 1}.`, x + 2, actualY - 1);
      
      // Code value
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setFont('courier', 'bold');
      doc.text(codeObj.code, x + 10, actualY - 1);
      doc.setFont('helvetica', 'normal');
    });
    
    // Footer
    const lastPage = doc.internal.getNumberOfPages();
    for (let i = 1; i <= lastPage; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${lastPage} | Generated: ${new Date().toLocaleString()} | Rosch Capital Bank - Secure Banking`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Save PDF
    doc.save(`backup-codes-${selectedUser.email}-${Date.now()}.pdf`);
  };

  const handleDownloadCodes = () => {
    if (!selectedUser || !backupCodes.length) return;

    const codesText = backupCodes
      .map((code, index) => `${index + 1}. ${code.code || '[USED]'} ${code.used ? '(USED)' : ''}`)
      .join('\n');

    const content = `Rosch Capital Bank - Backup Codes
User: ${selectedUser.firstName} ${selectedUser.lastName}
Email: ${selectedUser.email}
Generated: ${new Date().toLocaleString()}

${codesText}

IMPORTANT: Keep these codes secure. Each code can only be used once.`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-codes-${selectedUser.email}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredUsers = users.filter(user => {
    const search = searchTerm.toLowerCase();
    return (
      user.firstName?.toLowerCase().includes(search) ||
      user.lastName?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Backup Codes Management</h1>
            <p className="text-slate-600">View and manage user backup authentication codes</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Account Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">
                          {user.firstName} {user.lastName}
                        </div>
                        {user.isAdmin && (
                          <span className="text-xs text-indigo-600 font-medium">Admin</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.accountStatus === 'ACTIVE' 
                        ? 'bg-green-100 text-green-700'
                        : user.accountStatus === 'SUSPENDED'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.accountStatus === 'ACTIVE' ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {user.accountStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleViewCodes(user)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      <Eye className="w-4 h-4" />
                      View Codes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <User className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600">No users found</p>
            </div>
          )}
        </div>
      )}

      {/* Backup Codes Modal */}
      {showCodesModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Backup Codes</h2>
                  <p className="text-sm text-slate-600 mt-1">
                    {selectedUser.firstName} {selectedUser.lastName} ({selectedUser.email})
                  </p>
                </div>
                <button
                  onClick={() => setShowCodesModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
              {loadingCodes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : backupCodes.length > 0 ? (
                <>
                  {/* Security Notice */}
                  <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-amber-900 mb-1">Security Notice</h3>
                        <p className="text-sm text-amber-800">
                          Backup codes are hashed for security and cannot be retrieved. To view actual codes, click "Regenerate All" below. The new codes will be displayed and can be downloaded.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {backupCodes.map((code, index) => (
                      <div
                        key={code.id || index}
                        className={`p-3 rounded-lg border ${
                          code.used
                            ? 'bg-red-50 border-red-200'
                            : 'bg-green-50 border-green-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-mono text-sm font-medium ${
                            code.used ? 'text-red-400 line-through' : 'text-slate-900'
                          }`}>
                            {code.code === '******' ? '••••••' : code.code}
                          </span>
                          {code.used ? (
                            <span className="text-xs text-red-500 font-medium">Used</span>
                          ) : (
                            <span className="text-xs text-green-600 font-medium">Active</span>
                          )}
                        </div>
                        {code.usedAt && (
                          <div className="text-xs text-red-400 mt-1">
                            Used: {new Date(code.usedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600">No backup codes found</p>
                </div>
              )}

              {/* Stats */}
              {backupCodes.length > 0 && (
                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-slate-900">{backupCodes.length}</div>
                      <div className="text-xs text-slate-600">Total Codes</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {backupCodes.filter(c => !c.used).length}
                      </div>
                      <div className="text-xs text-slate-600">Active</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-red-500">
                        {backupCodes.filter(c => c.used).length}
                      </div>
                      <div className="text-xs text-slate-600">Used</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => handleDownloadPDF()}
                disabled={backupCodes.length === 0 || backupCodes.filter(c => !c.used).length === 0}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <FileText className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={handleOpenRegenerateModal}
                disabled={regenerating}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {regenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Regenerate Codes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Codes Modal */}
      {showRegenerateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Generate Backup Codes</h3>
              <p className="text-sm text-slate-600 mt-1">
                Enter the number of codes to generate for {selectedUser?.firstName} {selectedUser?.lastName}
              </p>
            </div>
            
            <div className="px-6 py-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Number of Codes
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={codeCount}
                  onChange={(e) => setCodeCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg font-mono text-center"
                  placeholder="Enter number (1-100)"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Enter a number between 1 and 100. This will replace all existing codes.
                </p>
              </div>
              
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> This will invalidate all existing backup codes for this user.
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-slate-200 flex gap-3">
              <button
                onClick={() => setShowRegenerateModal(false)}
                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateCodes}
                disabled={!codeCount || codeCount < 1}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Generate {codeCount} Codes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupCodesManagement;
