import React, { useState } from 'react';
import { X, ArrowRight, Building, Users, FileText, Loader2 } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { BrandFeedbackModal } from './BrandFeedbackModal';

export const SendMoneyModal = ({ isOpen, onClose, userAccounts }) => {
  const [activeTab, setActiveTab] = useState('internal');
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    description: '',
    recipientAccountNumber: '',
    bankName: '',
    routingNumber: '',
    accountHolderName: '',
    billerName: '',
    billerAccountNumber: '',
    paymentDate: ''
  });
  const [backupCode, setBackupCode] = useState('');
  const [showBackupCodeStep, setShowBackupCodeStep] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({ isOpen: false, type: 'success', title: '', message: '' });

  if (!isOpen) return null;

  const tabs = [
    { id: 'internal', label: 'Internal Transfer', icon: ArrowRight },
    { id: 'p2p', label: 'P2P Transfer', icon: Users },
    { id: 'domestic', label: 'Domestic Transfer', icon: Building },
    { id: 'bill', label: 'Bill Payment', icon: FileText }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Internal transfers don't need backup code
    if (activeTab === 'internal') {
      await processInternalTransfer();
    } else {
      // Other transfers require backup code first
      setShowBackupCodeStep(true);
    }
  };

  const processInternalTransfer = async () => {
    setIsLoading(true);
    try {
      await apiClient.post('/payments/internal-transfer', {
        fromAccountId: formData.fromAccount,
        toAccountId: formData.toAccount,
        amount: parseFloat(formData.amount),
        description: formData.description
      });
      
      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: 'Transfer Successful',
        message: `$${formData.amount} has been transferred successfully!`
      });
      
      resetForm();
    } catch (error) {
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Transfer Failed',
        message: error.response?.data?.error || 'Failed to process transfer'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processWithBackupCode = async () => {
    if (!backupCode || backupCode.length !== 6) {
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Invalid Code',
        message: 'Please enter a valid 6-digit Auth Token'
      });
      return;
    }

    setIsLoading(true);
    try {
      let endpoint = '';
      let payload = {};

      switch (activeTab) {
        case 'p2p':
          endpoint = '/payments/p2p-transfer';
          payload = {
            fromAccountId: formData.fromAccount,
            recipientAccountNumber: formData.recipientAccountNumber,
            amount: parseFloat(formData.amount),
            description: formData.description,
            backupCode
          };
          break;
        case 'domestic':
          endpoint = '/payments/domestic-transfer';
          payload = {
            fromAccountId: formData.fromAccount,
            bankName: formData.bankName,
            routingNumber: formData.routingNumber,
            accountNumber: formData.recipientAccountNumber,
            accountHolderName: formData.accountHolderName,
            amount: parseFloat(formData.amount),
            description: formData.description,
            backupCode
          };
          break;
        case 'bill':
          endpoint = '/payments/bill-payment';
          payload = {
            fromAccountId: formData.fromAccount,
            billerName: formData.billerName,
            billerAccountNumber: formData.billerAccountNumber,
            amount: parseFloat(formData.amount),
            paymentDate: formData.paymentDate,
            description: formData.description,
            backupCode
          };
          break;
      }

      await apiClient.post(endpoint, payload);
      
      setFeedbackModal({
        isOpen: true,
        type: 'success',
        title: 'Pending Approval',
        message: 'Your transaction has been submitted and is pending admin approval.'
      });
      
      resetForm();
    } catch (error) {
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Transaction Failed',
        message: error.response?.data?.error || 'Failed to process transaction'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fromAccount: '',
      toAccount: '',
      amount: '',
      description: '',
      recipientAccountNumber: '',
      bankName: '',
      routingNumber: '',
      accountHolderName: '',
      billerName: '',
      billerAccountNumber: '',
      paymentDate: ''
    });
    setBackupCode('');
    setShowBackupCodeStep(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
        
        <div className="relative bg-white border border-neutral-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-neutral-900">Send Money</h2>
            <button
              onClick={handleClose}
              className="p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'text-primary-600 border-b-2 border-primary-600'
                        : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {!showBackupCodeStep ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* From Account */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">From Account *</label>
                  <select
                    name="fromAccount"
                    value={formData.fromAccount}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">Select account</option>
                    {userAccounts?.map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountType} - {acc.accountNumber} (${acc.balance?.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Internal Transfer Fields */}
                {activeTab === 'internal' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">To Account *</label>
                    <select
                      name="toAccount"
                      value={formData.toAccount}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="">Select account</option>
                      {userAccounts?.filter(acc => acc.id !== formData.fromAccount).map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountType} - {acc.accountNumber}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* P2P Transfer Fields */}
                {activeTab === 'p2p' && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Recipient Account Number *</label>
                    <input
                      type="text"
                      name="recipientAccountNumber"
                      value={formData.recipientAccountNumber}
                      onChange={handleChange}
                      required
                      placeholder="Enter recipient's account number"
                      className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                )}

                {/* Domestic Transfer Fields */}
                {activeTab === 'domestic' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Bank Name *</label>
                      <input
                        type="text"
                        name="bankName"
                        value={formData.bankName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Routing Number *</label>
                        <input
                          type="text"
                          name="routingNumber"
                          value={formData.routingNumber}
                          onChange={handleChange}
                          required
                          placeholder="9 digits"
                          className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Account Number *</label>
                        <input
                          type="text"
                          name="recipientAccountNumber"
                          value={formData.recipientAccountNumber}
                          onChange={handleChange}
                          required
                          className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Account Holder Name *</label>
                      <input
                        type="text"
                        name="accountHolderName"
                        value={formData.accountHolderName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </>
                )}

                {/* Bill Payment Fields */}
                {activeTab === 'bill' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Biller Name *</label>
                      <input
                        type="text"
                        name="billerName"
                        value={formData.billerName}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Biller Account Number *</label>
                      <input
                        type="text"
                        name="billerAccountNumber"
                        value={formData.billerAccountNumber}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-2">Payment Date *</label>
                      <input
                        type="date"
                        name="paymentDate"
                        value={formData.paymentDate}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </>
                )}

                {/* Common Fields */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Optional note"
                    className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-700 text-sm">
                    For security, please enter one of your 6-digit Auth Tokens to authorize this transaction.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">6-Digit Auth Token *</label>
                  <input
                    type="text"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg text-neutral-900 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBackupCodeStep(false)}
                    className="flex-1 px-6 py-3 bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-medium rounded-lg transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={processWithBackupCode}
                    disabled={isLoading || backupCode.length !== 6}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Submit'
                    )}
                  </button>
                </div>
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

export default SendMoneyModal;
