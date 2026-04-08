import React, { useState, useEffect } from 'react';
import { X, ArrowDownToLine, Upload, CheckCircle, Wallet, CreditCard, Copy, QrCode, Shield, Clock, AlertCircle, ExternalLink } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { BrandFeedbackModal } from './BrandFeedbackModal';

const DepositModal = ({ isOpen, onClose, accounts }) => {
  const [step, setStep] = useState(1); // 1: Gateway, 2: Details, 3: Upload Proof, 4: Success
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [paymentProof, setPaymentProof] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    if (isOpen) {
      fetchGateways();
      if (accounts && accounts.length > 0) {
        setSelectedAccount(accounts[0].id);
      }
    }
  }, [isOpen, accounts]);

  const fetchGateways = async () => {
    try {
      const response = await apiClient.get('/gateways');
      if (response.success) {
        setGateways(response.gateways || []);
      }
    } catch (error) {
      console.error('Error fetching gateways:', error);
    }
  };

  const handleNext = () => {
    setError('');
    
    if (step === 1) {
      if (!selectedGateway) {
        setError('Please select a payment gateway');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedAccount || !amount) {
        setError('Please fill in all required fields');
        return;
      }
      if (parseFloat(amount) <= 0) {
        setError('Amount must be greater than zero');
        return;
      }
      setStep(3);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setPaymentProof(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!paymentProof) {
      setError('Please upload payment proof');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('accountId', selectedAccount);
      formData.append('amount', parseFloat(amount));
      formData.append('description', description);
      formData.append('gatewayId', selectedGateway.id);
      formData.append('paymentProof', paymentProof);

      // Don't set Content-Type manually - browser will set it with correct boundary for FormData
      await apiClient.post('/payments/deposit', formData);

      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: 'Deposit Request Submitted',
        message: 'Your deposit request has been submitted successfully and is pending admin approval.'
      });

      resetForm();
      setStep(4);
    } catch (err) {
      // Handle session expiration gracefully
      if (err.response?.status === 401) {
        setError('Session expired. Please log in again and retry your deposit.');
      } else {
        setError(err.response?.data?.error || 'Failed to submit deposit request');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedGateway(null);
    setSelectedAccount(accounts && accounts.length > 0 ? accounts[0].id : '');
    setAmount('');
    setDescription('');
    setPaymentProof(null);
    setProofPreview('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const renderProgressBar = () => {
    const steps = 3;
    return (
      <div className="flex gap-2 mb-6">
        {[...Array(steps)].map((_, index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index < step ? 'bg-primary-600' : 'bg-neutral-200'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <ArrowDownToLine className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-neutral-900">Deposit Funds</h2>
                <p className="text-xs text-neutral-500">Step {step} of 3</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {renderProgressBar()}

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Step 1: Select Gateway */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Select Payment Gateway</h3>
                  <p className="text-xs text-neutral-600 mb-4">Choose how you want to make your deposit</p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {gateways.map((gateway) => (
                    <button
                      key={gateway.id}
                      onClick={() => setSelectedGateway(gateway)}
                      className={`group relative p-5 rounded-xl border-2 transition-all text-left overflow-hidden ${
                        selectedGateway?.id === gateway.id
                          ? 'border-primary-600 bg-gradient-to-br from-primary-50 to-primary-100 shadow-lg shadow-primary-200'
                          : 'border-neutral-200 hover:border-primary-300 hover:shadow-md bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          selectedGateway?.id === gateway.id
                            ? 'bg-primary-600'
                            : 'bg-neutral-100 group-hover:bg-primary-100'
                        }`}>
                          {gateway.type === 'CRYPTO' ? (
                            <Wallet className={`w-6 h-6 ${
                              selectedGateway?.id === gateway.id ? 'text-white' : 'text-neutral-600 group-hover:text-primary-600'
                            }`} />
                          ) : (
                            <CreditCard className={`w-6 h-6 ${
                              selectedGateway?.id === gateway.id ? 'text-white' : 'text-neutral-600 group-hover:text-primary-600'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-neutral-900">{gateway.name}</p>
                          <p className="text-xs text-neutral-600 mt-0.5">{gateway.type} • {gateway.network || 'Standard'}</p>
                        </div>
                        {selectedGateway?.id === gateway.id && (
                          <CheckCircle className="w-6 h-6 text-primary-600" />
                        )}
                      </div>
                      {gateway.instructions && (
                        <p className="text-xs text-neutral-500 mt-3 line-clamp-2">{gateway.instructions}</p>
                      )}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleNext}
                  disabled={!selectedGateway}
                  className="w-full mt-6 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            )}

            {/* Step 2: Enter Details */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Selected Gateway Display */}
                {selectedGateway && (
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-xl p-4 mb-4">
                    <p className="text-xs font-medium text-primary-700 mb-2">Selected Payment Gateway</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                        {selectedGateway.type === 'CRYPTO' ? (
                          <Wallet className="w-5 h-5 text-white" />
                        ) : (
                          <CreditCard className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900">{selectedGateway.name}</p>
                        <p className="text-xs text-neutral-600">{selectedGateway.type}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Deposit Details</h3>
                  <p className="text-xs text-neutral-600 mb-4">Enter the amount and account information</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">To Account *</label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    {accounts?.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountType} - {acc.accountNumber} (${acc.balance?.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Amount *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Description (Optional)</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Add a note about this deposit..."
                    className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-3 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-medium rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!selectedAccount || !amount}
                    className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment Details & Upload Proof */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Amount Summary */}
                {selectedGateway && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                          {selectedGateway.type === 'CRYPTO' ? (
                            <Wallet className="w-5 h-5 text-white" />
                          ) : (
                            <CreditCard className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-neutral-900">{selectedGateway.name}</p>
                          <p className="text-xs text-neutral-600">{selectedGateway.type} • {selectedGateway.network || 'Standard'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-700">${parseFloat(amount).toLocaleString()}</p>
                        <p className="text-xs text-neutral-600">Deposit Amount</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Payment Instructions Section */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-amber-900">Send Payment First</p>
                      <p className="text-xs text-amber-700 mt-1">
                        Complete your payment using the details below, then upload proof of payment.
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR Code & Wallet Address */}
                {selectedGateway && (selectedGateway.walletAddress || selectedGateway.qrCodePath) && (
                  <div className="bg-white border-2 border-neutral-200 rounded-xl p-5">
                    <div className="text-center mb-4">
                      <h4 className="text-sm font-semibold text-neutral-900">Send Payment To</h4>
                      <p className="text-xs text-neutral-500 mt-1">Scan QR code or copy address below</p>
                    </div>

                    {/* QR Code */}
                    {selectedGateway.qrCodePath && (
                      <div className="flex justify-center mb-4">
                        <div className="p-3 bg-white border-2 border-neutral-100 rounded-xl shadow-sm">
                          <img 
                            src={selectedGateway.qrCodePath.startsWith('http') 
                              ? selectedGateway.qrCodePath 
                              : `${window.location.origin}/uploads/${selectedGateway.qrCodePath}`}
                            alt="Payment QR Code"
                            className="w-40 h-40 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling?.classList.remove('hidden');
                            }}
                          />
                          <div className="hidden w-40 h-40 bg-neutral-100 rounded-lg flex items-center justify-center">
                            <QrCode className="w-12 h-12 text-neutral-400" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Wallet Address */}
                    {selectedGateway.walletAddress && (
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-neutral-600 text-center">
                          {selectedGateway.type === 'CRYPTO' ? 'Wallet Address' : 'Account Details'}
                        </label>
                        <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                          <code className="flex-1 text-xs font-mono text-neutral-800 break-all select-all">
                            {selectedGateway.walletAddress}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(selectedGateway.walletAddress);
                              // Show brief feedback
                              const btn = document.getElementById('copy-btn');
                              if (btn) {
                                btn.classList.add('text-green-600');
                                setTimeout(() => btn.classList.remove('text-green-600'), 1500);
                              }
                            }}
                            id="copy-btn"
                            className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex-shrink-0"
                            title="Copy address"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        {selectedGateway.network && (
                          <p className="text-xs text-center text-neutral-500">
                            Network: <span className="font-medium text-neutral-700">{selectedGateway.network}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Processing Time */}
                    {selectedGateway.processingTime && (
                      <div className="flex items-center justify-center gap-2 mt-4 text-xs text-neutral-500">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Processing time: {selectedGateway.processingTime}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Gateway Instructions */}
                {selectedGateway?.instructions && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-blue-900">Payment Instructions</p>
                        <p className="text-xs text-blue-700 mt-1 whitespace-pre-line">{selectedGateway.instructions}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload Payment Proof */}
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Upload Payment Proof</h3>
                  <p className="text-xs text-neutral-600 mb-3">After sending payment, upload a screenshot or receipt</p>
                </div>

                <div className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
                  proofPreview ? 'border-green-300 bg-green-50' : 'border-neutral-300 hover:border-primary-300'
                }`}>
                  {proofPreview ? (
                    <div className="space-y-3">
                      <div className="relative inline-block">
                        <img src={proofPreview} alt="Payment proof" className="max-h-40 mx-auto rounded-lg shadow-sm" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      </div>
                      <p className="text-xs text-green-700 font-medium">Proof uploaded successfully</p>
                      <button
                        onClick={() => {
                          setPaymentProof(null);
                          setProofPreview('');
                        }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove and upload different file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                      <label className="cursor-pointer">
                        <span className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                          Click to upload
                        </span>
                        <span className="text-sm text-neutral-500"> or drag and drop</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs text-neutral-500 mt-2">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  )}
                </div>

                {/* Security Note */}
                <div className="flex items-center gap-2 text-xs text-neutral-500 justify-center">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Your payment is secured with bank-grade encryption</span>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setStep(2)}
                    className="flex-1 px-5 py-3 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-medium rounded-xl transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !paymentProof}
                    className="flex-1 px-5 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-green-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Submitting...
                      </span>
                    ) : 'Submit Deposit'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900 mb-2">Deposit Submitted!</h3>
                <p className="text-sm text-neutral-600 mb-6">
                  Your deposit request is pending admin approval. You'll be notified once it's processed.
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <BrandFeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => {
          setFeedbackModal({ ...feedbackModal, isOpen: false });
          if (feedbackModal.type === 'success') {
            handleClose();
          }
        }}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
      />
    </>
  );
};

export default DepositModal;
