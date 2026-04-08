import React, { useState, useEffect } from 'react';
import { Upload, FileText, X, Check, AlertCircle, Send } from 'lucide-react';
import apiClient from '../lib/apiClient';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import PremiumModal from '../components/modals/PremiumModal';

const DOCUMENT_CATEGORIES = {
  personal: [
    { value: 'GOVERNMENT_ID', label: 'Government ID', description: 'Passport, Driver\'s License, or National ID' },
    { value: 'PROOF_OF_ADDRESS', label: 'Proof of Address', description: 'Utility Bill, Bank Statement, or Lease Agreement (within 3 months)' },
    { value: 'TAX_ID', label: 'Tax ID', description: 'SSN, TIN, SIN, or NIN document' },
    { value: 'SELFIE', label: 'Selfie with ID', description: 'Clear photo holding your ID' }
  ],
  business: [
    { value: 'BUSINESS_REGISTRATION', label: 'Business Registration', description: 'Certificate of Incorporation or Business License', required: true },
    { value: 'BUSINESS_TAX', label: 'Business Tax Documents', description: 'EIN Letter, Tax ID, or VAT Registration' },
    { value: 'BUSINESS_ADDRESS', label: 'Business Address Proof', description: 'Utility Bill, Lease Agreement, or Property Deed' },
    { value: 'REPRESENTATIVE_ID', label: 'Representative ID', description: 'Government ID of authorized representative', required: true },
    { value: 'OTHER', label: 'Other Documents', description: 'Additional supporting documents' }
  ]
};

export const KYCUploadPage = () => {
  const [kycStatus, setKycStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, type: 'info', title: '', message: '', onConfirm: null, showCancel: false });

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const response = await apiClient.get('/kyc/status');
      setKycStatus(response);
      setUploadedDocs(response.documents || {});
    } catch (error) {
      console.error('Failed to fetch KYC status:', error);
    }
    setIsLoading(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate files
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      
      if (!validTypes.includes(file.type)) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'Invalid File Type',
          message: `${file.name} is not a valid file type. Only JPG, PNG, GIF, and PDF are allowed.`,
          onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
        });
        return false;
      }
      
      if (file.size > maxSize) {
        setModal({
          isOpen: true,
          type: 'error',
          title: 'File Too Large',
          message: `${file.name} is too large. Maximum file size is 10MB.`,
          onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
        });
        return false;
      }
      
      return true;
    });
    
    setSelectedFiles(validFiles);
  };

  const handleUpload = async () => {
    if (!selectedCategory) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'Category Required',
        message: 'Please select a document category before uploading.',
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    
    if (selectedFiles.length === 0) {
      setModal({
        isOpen: true,
        type: 'warning',
        title: 'No Files Selected',
        message: 'Please select at least one file to upload.',
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    
    setIsUploading(true);
    try {
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('documents', file);
      });
      formData.append('category', selectedCategory);
      
      await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'}/kyc/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        credentials: 'include',
        body: formData
      });
      
      setModal({
        isOpen: true,
        type: 'success',
        title: 'Upload Successful',
        message: 'Your documents have been uploaded successfully!',
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
      setSelectedFiles([]);
      setSelectedCategory('');
      fetchKYCStatus();
    } catch (error) {
      console.error('Upload failed:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Upload Failed',
        message: 'Failed to upload documents. Please try again.',
        onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
      });
    }
    setIsUploading(false);
  };

  const handleDeleteDocument = async (docId) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document? This action cannot be undone.',
      showCancel: true,
      onConfirm: async () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        try {
          await apiClient.delete(`/kyc/documents/${docId}`);
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Document Deleted',
            message: 'Document deleted successfully.',
            onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
          });
          fetchKYCStatus();
        } catch (error) {
          console.error('Delete failed:', error);
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Delete Failed',
            message: error.response?.data?.error || 'Failed to delete document. Please try again.',
            onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
          });
        }
      },
      onCancel: () => setModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleSubmitKYC = async () => {
    setModal({
      isOpen: true,
      type: 'confirm',
      title: 'Submit KYC for Review',
      message: 'Are you sure you want to submit your KYC for review? You will not be able to modify documents after submission.',
      showCancel: true,
      confirmText: 'Submit',
      onConfirm: async () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        setIsSubmitting(true);
        try {
          console.log('Submitting KYC...');
          const response = await apiClient.post('/kyc/submit');
          console.log('KYC submit response:', response);
          
          setModal({
            isOpen: true,
            type: 'success',
            title: 'KYC Submitted',
            message: 'Your KYC has been submitted successfully! You will be notified once the review is complete.',
            onConfirm: () => {
              setModal(prev => ({ ...prev, isOpen: false }));
              fetchKYCStatus();
            }
          });
        } catch (error) {
          console.error('Submit KYC error:', error);
          console.error('Error response:', error.response);
          console.error('Error data:', error.response?.data);
          
          let errorMessage = 'Failed to submit KYC. Please try again.';
          
          if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Submission Failed',
            message: errorMessage,
            onConfirm: () => setModal(prev => ({ ...prev, isOpen: false }))
          });
        } finally {
          setIsSubmitting(false);
        }
      },
      onCancel: () => setModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  const categories = kycStatus?.isBusinessAccount ? DOCUMENT_CATEGORIES.business : DOCUMENT_CATEGORIES.personal;
  const canUpload = kycStatus?.kycStatus === 'NOT_SUBMITTED' || kycStatus?.kycStatus === 'REJECTED';
  const canSubmit = canUpload && kycStatus?.totalDocuments > 0;

  if (isLoading) {
    return (
      <UserDashboardLayout>
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500" />
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">KYC verification</h1>
          <p className="text-sm text-slate-500">
            Upload your documents to verify your identity and unlock full banking features.
          </p>
          
          {/* Status Badge */}
          <div className="mt-4">
            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${
              kycStatus?.kycStatus === 'NOT_SUBMITTED'
                ? 'bg-amber-50 text-amber-700 border-amber-100'
                : kycStatus?.kycStatus === 'PENDING'
                  ? 'bg-blue-50 text-blue-700 border-blue-100'
                  : kycStatus?.kycStatus === 'VERIFIED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-red-50 text-red-700 border-red-100'
            }`}>
              {kycStatus?.kycStatus === 'NOT_SUBMITTED' && <AlertCircle className="w-4 h-4" />}
              {kycStatus?.kycStatus === 'PENDING' && <FileText className="w-4 h-4" />}
              {kycStatus?.kycStatus === 'VERIFIED' && <Check className="w-4 h-4" />}
              {kycStatus?.kycStatus === 'REJECTED' && <X className="w-4 h-4" />}
              {kycStatus?.kycStatus}
            </span>
          </div>

          {/* Rejection Reason */}
          {kycStatus?.kycStatus === 'REJECTED' && kycStatus?.rejectionReason && (
            <div className="mt-4 bg-red-50 border border-red-100 rounded-xl p-4">
              <p className="text-red-700 text-sm">
                <strong>Rejection Reason:</strong> {kycStatus.rejectionReason}
              </p>
            </div>
          )}

          {/* Pending Message */}
          {kycStatus?.kycStatus === 'PENDING' && (
            <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-blue-700 text-sm">
                Your KYC is under review. You will be notified once the review is complete.
              </p>
            </div>
          )}

          {/* Verified Message */}
          {kycStatus?.kycStatus === 'VERIFIED' && (
            <div className="mt-4 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <p className="text-emerald-700 text-sm">
                Your KYC has been verified! You have full access to all banking features.
              </p>
            </div>
          )}
        </div>

        {/* Upload Section */}
        {canUpload && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Upload documents</h2>
            
            {/* Category Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Document category *
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              >
                <option value="">Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label} {cat.required ? '(Required)' : ''}
                  </option>
                ))}
              </select>
              {selectedCategory && (
                <p className="text-slate-400 text-sm mt-2">
                  {categories.find(c => c.value === selectedCategory)?.description}
                </p>
              )}
            </div>

            {/* File Upload */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Select files (max 10MB each, JPG/PNG/GIF/PDF)
              </label>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/gif,application/pdf"
                onChange={handleFileSelect}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
              />
            </div>

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Selected files:</p>
                <div className="space-y-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-xl">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                        <div>
                          <div className="text-slate-900 text-sm">{file.name}</div>
                          <div className="text-slate-500 text-xs">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Button */}
            <button
              onClick={handleUpload}
              disabled={isUploading || !selectedCategory || selectedFiles.length === 0}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <Upload className="w-5 h-5" />
              {isUploading ? 'Uploading...' : 'Upload Documents'}
            </button>
          </div>
        )}

        {/* Uploaded Documents - Only show for non-verified accounts */}
        {Object.keys(uploadedDocs).length > 0 && kycStatus?.status !== 'VERIFIED' && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Uploaded documents ({kycStatus?.totalDocuments})
            </h2>
            
            <div className="space-y-4">
              {Object.entries(uploadedDocs).map(([category, docs]) => (
                <div key={category} className="border border-slate-100 rounded-xl p-4 bg-slate-50">
                  <h3 className="text-slate-900 font-medium mb-3">
                    {categories.find(c => c.value === category)?.label || category}
                  </h3>
                  <div className="space-y-2">
                    {docs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-slate-400" />
                          <div>
                            <div className="text-slate-900 text-sm">{doc.fileName}</div>
                            <div className="text-slate-500 text-xs">
                              {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(doc.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {canUpload && (
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        {canSubmit && (
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-slate-900 font-semibold mb-2">Ready to submit?</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Once you submit your KYC for review, you will not be able to modify or delete documents. 
                  Please ensure all documents are correct before submitting.
                </p>
                <button
                  onClick={handleSubmitKYC}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition font-semibold disabled:opacity-50 text-sm"
                >
                  <Send className="w-5 h-5" />
                  {isSubmitting ? 'Submitting...' : 'Submit for Review'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={modal.isOpen}
        onClose={() => setModal(prev => ({ ...prev, isOpen: false }))}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
        showCancel={modal.showCancel}
      />
    </UserDashboardLayout>
  );
};

export default KYCUploadPage;
