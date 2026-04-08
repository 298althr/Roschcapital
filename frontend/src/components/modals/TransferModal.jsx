import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, Check, Search } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const TransferModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Form, 2: Review, 3: Success
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [banks, setBanks] = useState([]);
  
  // Form data
  const [fromAccountId, setFromAccountId] = useState('');
  const [useBeneficiary, setUseBeneficiary] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState('');
  const [destinationBank, setDestinationBank] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [beneficiaryNickname, setBeneficiaryNickname] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [transferResult, setTransferResult] = useState(null);
  const [bankSearchTerm, setBankSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      const [accountsRes, beneficiariesRes, banksRes] = await Promise.all([
        apiClient.get('/accounts'),
        apiClient.get('/transfers/beneficiaries/list'),
        apiClient.get('/transfers/banks')
      ]);

      if (accountsRes.success) setAccounts(accountsRes.accounts || []);
      if (beneficiariesRes.success) setBeneficiaries(beneficiariesRes.beneficiaries || []);
      if (banksRes.success) setBanks(banksRes.banks || []);
      
      if (accountsRes.accounts?.length > 0) {
        setFromAccountId(accountsRes.accounts[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const handleBeneficiarySelect = (beneficiary) => {
    setDestinationBank(beneficiary.bankName);
    setRoutingNumber(beneficiary.routingNumber);
    setAccountNumber(beneficiary.accountNumber);
    setAccountName(beneficiary.accountName);
    setSelectedBeneficiary(beneficiary.id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/transfers', {
        fromAccountId,
        destinationBank,
        routingNumber,
        accountNumber,
        accountName,
        amount: parseFloat(amount),
        description,
        saveBeneficiary,
        beneficiaryNickname
      });

      if (response.success) {
        setTransferResult(response.transfer);
        setStep(3);
        setTimeout(() => {
          onSuccess && onSuccess(response.transfer);
          handleClose();
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create transfer');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFromAccountId('');
    setUseBeneficiary(false);
    setSelectedBeneficiary('');
    setDestinationBank('');
    setRoutingNumber('');
    setAccountNumber('');
    setAccountName('');
    setAmount('');
    setDescription('');
    setSaveBeneficiary(false);
    setBeneficiaryNickname('');
    setError('');
    setTransferResult(null);
    onClose();
  };

  const selectedAccount = accounts.find(a => a.id === fromAccountId);
  const filteredBanks = banks.filter(b => 
    b.bankName.toLowerCase().includes(bankSearchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Send className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Domestic Transfer</h2>
              <p className="text-sm text-slate-400">Send money to another US bank</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Step 3: Success */}
          {step === 3 && transferResult && (
            <div className="space-y-6">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-semibold text-green-400 mb-2">Transfer Submitted!</h3>
                <p className="text-green-300/70 mb-4">
                  Your transfer is pending banker approval
                </p>
                <div className="bg-slate-900 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Reference</span>
                    <span className="text-white font-mono font-semibold">{transferResult.reference}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Amount</span>
                    <span className="text-white font-semibold">${transferResult.amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Status</span>
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 text-xs rounded-full">
                      {transferResult.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1 & 2: Form and Review */}
          {step < 3 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {step === 1 && (
                <>
                  {/* From Account */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      From Account <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={fromAccountId}
                      onChange={(e) => setFromAccountId(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      required
                    >
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.accountType} - ••••{account.accountNumber.slice(-4)} (Available: ${account.availableBalance?.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Use Beneficiary Toggle */}
                  {beneficiaries.length > 0 && (
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useBeneficiary}
                          onChange={(e) => setUseBeneficiary(e.target.checked)}
                          className="w-4 h-4 text-blue-500 rounded"
                        />
                        <span className="text-sm text-slate-300">Use saved beneficiary</span>
                      </label>
                    </div>
                  )}

                  {/* Beneficiary Selection */}
                  {useBeneficiary && beneficiaries.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Select Beneficiary
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {beneficiaries.map(ben => (
                          <button
                            key={ben.id}
                            type="button"
                            onClick={() => handleBeneficiarySelect(ben)}
                            className={`p-3 rounded-lg border text-left transition-all ${
                              selectedBeneficiary === ben.id
                                ? 'border-blue-500 bg-blue-500/10'
                                : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                            }`}
                          >
                            <p className="text-white font-medium">{ben.nickname || ben.accountName}</p>
                            <p className="text-sm text-slate-400">{ben.bankName} - ••••{ben.accountNumber.slice(-4)}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Manual Entry */}
                  {!useBeneficiary && (
                    <>
                      {/* Bank Selection */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Destination Bank <span className="text-red-400">*</span>
                        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={bankSearchTerm}
                            onChange={(e) => setBankSearchTerm(e.target.value)}
                            placeholder="Search banks..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                        {bankSearchTerm && (
                          <div className="mt-2 max-h-48 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg">
                            {filteredBanks.slice(0, 10).map(bank => (
                              <button
                                key={bank.id}
                                type="button"
                                onClick={() => {
                                  setDestinationBank(bank.bankName);
                                  setRoutingNumber(bank.routingNumber);
                                  setBankSearchTerm('');
                                }}
                                className="w-full p-3 text-left hover:bg-slate-800 transition-colors border-b border-slate-700 last:border-0"
                              >
                                <p className="text-white text-sm">{bank.bankName}</p>
                                <p className="text-xs text-slate-400">Routing: {bank.routingNumber}</p>
                              </button>
                            ))}
                          </div>
                        )}
                        {destinationBank && (
                          <p className="text-sm text-green-400 mt-2">✓ {destinationBank}</p>
                        )}
                      </div>

                      {/* Routing Number */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Routing Number <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={routingNumber}
                          onChange={(e) => setRoutingNumber(e.target.value)}
                          placeholder="9 digits"
                          maxLength={9}
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                          required
                        />
                      </div>

                      {/* Account Number */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Account Number <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={accountNumber}
                          onChange={(e) => setAccountNumber(e.target.value)}
                          placeholder="Recipient's account number"
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono"
                          required
                        />
                      </div>

                      {/* Account Name */}
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Account Holder Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          placeholder="Full name on account"
                          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Amount <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0.01"
                        max={selectedAccount?.availableBalance || 0}
                        step="0.01"
                        className="w-full pl-8 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Available: ${selectedAccount?.availableBalance?.toFixed(2) || '0.00'}
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                      placeholder="What's this transfer for?"
                    />
                  </div>

                  {/* Save Beneficiary */}
                  {!useBeneficiary && (
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveBeneficiary}
                          onChange={(e) => setSaveBeneficiary(e.target.checked)}
                          className="w-4 h-4 text-blue-500 rounded"
                        />
                        <span className="text-sm text-slate-300">Save as beneficiary for future transfers</span>
                      </label>
                      {saveBeneficiary && (
                        <input
                          type="text"
                          value={beneficiaryNickname}
                          onChange={(e) => setBeneficiaryNickname(e.target.value)}
                          placeholder="Nickname (optional)"
                          className="w-full mt-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm"
                        />
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      Review Transfer
                    </button>
                  </div>
                </>
              )}

              {/* Step 2: Review */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                    <p className="text-yellow-400 text-sm">
                      <span className="font-semibold">Review carefully:</span> This transfer requires banker approval and cannot be cancelled once submitted.
                    </p>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">From</span>
                      <span className="text-white font-medium">
                        {selectedAccount?.accountType} ••••{selectedAccount?.accountNumber.slice(-4)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">To</span>
                      <span className="text-white font-medium">{accountName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Bank</span>
                      <span className="text-white font-medium">{destinationBank}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account</span>
                      <span className="text-white font-mono">••••{accountNumber.slice(-4)}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-slate-700">
                      <span className="text-slate-400">Amount</span>
                      <span className="text-white font-bold text-lg">${parseFloat(amount).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors font-medium"
                      disabled={loading}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Confirm Transfer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferModal;
