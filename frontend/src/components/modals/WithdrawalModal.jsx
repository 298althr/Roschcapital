import React, { useState, useEffect } from 'react';
import { X, ArrowUpFromLine, CreditCard, Key, CheckCircle, Wallet, Shield, Clock, AlertTriangle, Copy, Loader2 } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { BrandFeedbackModal } from './BrandFeedbackModal';

const WithdrawalModal = ({ isOpen, onClose, accounts }) => {
  const [step, setStep] = useState(1); // 1: Gateway, 2: Details, 3: Auth Token, 4: Success
  const [gateways, setGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
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
      const account = accounts.find(acc => acc.id === selectedAccount);
      if (account && parseFloat(amount) > parseFloat(account.balance)) {
        setError('Insufficient funds in selected account');
        return;
      }
      // Require wallet address for crypto withdrawals
      if (selectedGateway?.type === 'CRYPTO' && !walletAddress.trim()) {
        setError('Please enter your wallet address');
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setError('');
    
    if (!backupCode || backupCode.length !== 6) {
      setError('Please enter your 6-digit Auth Token');
      return;
    }

    try {
      setLoading(true);
      await apiClient.post('/payments/withdrawal', {
        accountId: selectedAccount,
        amount: parseFloat(amount),
        description,
        gatewayId: selectedGateway.id,
        backupCode,
        walletAddress: selectedGateway?.type === 'CRYPTO' ? walletAddress : undefined
      });

      setStep(4);
    } catch (err) {
      setFeedbackModal({
        isOpen: true,
        type: 'error',
        title: 'Withdrawal Failed',
        message: err.response?.data?.error || 'Failed to process withdrawal'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedGateway(null);
    setAmount('');
    setDescription('');
    setWalletAddress('');
    setBackupCode('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const selectedAccountData = accounts?.find(acc => acc.id === selectedAccount);

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <ArrowUpFromLine className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Withdraw Funds</h3>
                <p className="text-sm text-slate-500">Step {step} of 4</p>
              </div>
            </div>
            <button onClick={handleClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pt-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full ${
                    s <= step ? 'bg-orange-600' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Step 1: Gateway Selection */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Select Payment Gateway</h4>
                  <p className="text-sm text-slate-600 mb-4">
                    Choose how you want to receive your withdrawal
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {gateways.map((gateway) => (
                    <button
                      key={gateway.id}
                      onClick={() => setSelectedGateway(gateway)}
                      className={`group relative p-5 rounded-xl border-2 transition-all text-left overflow-hidden ${
                        selectedGateway?.id === gateway.id
                          ? 'border-orange-600 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg shadow-orange-200'
                          : 'border-neutral-200 hover:border-orange-300 hover:shadow-md bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                          selectedGateway?.id === gateway.id
                            ? 'bg-orange-600'
                            : 'bg-neutral-100 group-hover:bg-orange-100'
                        }`}>
                          {gateway.type === 'CRYPTO' ? (
                            <Wallet className={`w-6 h-6 ${
                              selectedGateway?.id === gateway.id ? 'text-white' : 'text-neutral-600 group-hover:text-orange-600'
                            }`} />
                          ) : (
                            <CreditCard className={`w-6 h-6 ${
                              selectedGateway?.id === gateway.id ? 'text-white' : 'text-neutral-600 group-hover:text-orange-600'
                            }`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-neutral-900">{gateway.name}</p>
                          <p className="text-xs text-neutral-600 mt-0.5">{gateway.type} • {gateway.network || 'Standard'}</p>
                        </div>
                        {selectedGateway?.id === gateway.id && (
                          <CheckCircle className="w-6 h-6 text-orange-600" />
                        )}
                      </div>
                      {gateway.instructions && (
                        <p className="text-xs text-neutral-500 mt-3 line-clamp-2">{gateway.instructions}</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Withdrawal Details */}
            {step === 2 && (
              <div className="space-y-4">
                {/* Selected Gateway Display */}
                {selectedGateway && (
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 mb-4">
                    <p className="text-xs font-medium text-orange-700 mb-2">Selected Payment Gateway</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
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
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Withdrawal Details</h4>
                  <p className="text-sm text-slate-600 mb-4">
                    Enter the withdrawal information
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Withdraw From Account
                  </label>
                  <select
                    value={selectedAccount}
                    onChange={(e) => setSelectedAccount(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  >
                    {accounts?.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.accountNumber} - ${account.balance?.toFixed(2)} ({account.accountType})
                      </option>
                    ))}
                  </select>
                  {selectedAccountData && (
                    <p className="text-xs text-slate-500 mt-1">
                      Available balance: ${selectedAccountData.balance?.toFixed(2)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>

                {/* Wallet Address for Crypto */}
                {selectedGateway?.type === 'CRYPTO' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Your {selectedGateway.name} Wallet Address *
                    </label>
                    <div className="relative">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="text"
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        placeholder={`Enter your ${selectedGateway.network || selectedGateway.name} wallet address`}
                        className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      Make sure the address is correct. Transactions cannot be reversed.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a note about this withdrawal..."
                    rows={2}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                  />
                </div>

                {/* Info Cards */}
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-900">Important Notice</p>
                        <p className="text-xs text-amber-700 mt-1">
                          Withdrawals require admin approval and may take 1-3 business days to process.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {selectedGateway?.processingTime && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Estimated processing time: {selectedGateway.processingTime}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Backup Code */}
            {step === 3 && (
              <div className="space-y-4">
                {/* Selected Gateway Display */}
                {selectedGateway && (
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 mb-4">
                    <p className="text-xs font-medium text-orange-700 mb-2">Withdrawal Details</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                        {selectedGateway.type === 'CRYPTO' ? (
                          <Wallet className="w-5 h-5 text-white" />
                        ) : (
                          <CreditCard className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-neutral-900">{selectedGateway.name}</p>
                        <p className="text-xs text-neutral-600">{selectedGateway.type}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-neutral-900">${amount}</p>
                        <p className="text-xs text-neutral-600">Amount</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
                    <Key className="w-8 h-8 text-orange-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-slate-900 mb-2">Verify with Auth Token</h4>
                  <p className="text-sm text-slate-600">
                    Enter your 6-digit Auth Token to authorize this withdrawal
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 text-center">
                    Auth Token
                  </label>
                  <input
                    type="text"
                    value={backupCode}
                    onChange={(e) => setBackupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    className="w-full px-4 py-4 border border-slate-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    <strong>Security:</strong> Auth Tokens are required for all withdrawal requests to ensure account security.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h4 className="text-2xl font-bold text-slate-900 mb-2">Withdrawal Submitted!</h4>
                <p className="text-slate-600 mb-6">
                  Your withdrawal request has been submitted for admin approval.
                </p>
                <div className="bg-slate-50 rounded-xl p-4 text-left space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Amount:</span>
                    <span className="font-bold text-slate-900">${parseFloat(amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Gateway:</span>
                    <span className="font-semibold text-slate-900">{selectedGateway?.name}</span>
                  </div>
                  {selectedGateway?.type === 'CRYPTO' && walletAddress && (
                    <div className="text-sm">
                      <span className="text-slate-600 block mb-1">Receiving Wallet:</span>
                      <code className="text-xs font-mono text-slate-800 bg-slate-200 px-2 py-1 rounded break-all block">
                        {walletAddress}
                      </code>
                    </div>
                  )}
                  <div className="flex justify-between text-sm items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-600">Status:</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                      Pending Approval
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-200 bg-slate-50">
            <div className="flex gap-3">
              {step < 4 && (
                <>
                  {step > 1 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                      disabled={loading}
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={step === 3 ? handleSubmit : handleNext}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl hover:from-orange-700 hover:to-orange-800 transition-all font-medium disabled:opacity-50 shadow-lg shadow-orange-500/25 disabled:shadow-none flex items-center justify-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : step === 3 ? 'Submit Withdrawal' : 'Continue'}
                  </button>
                </>
              )}
              {step === 4 && (
                <button
                  onClick={handleClose}
                  className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <BrandFeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal({ ...feedbackModal, isOpen: false })}
        type={feedbackModal.type}
        title={feedbackModal.title}
        message={feedbackModal.message}
      />
    </>
  );
};

export default WithdrawalModal;
