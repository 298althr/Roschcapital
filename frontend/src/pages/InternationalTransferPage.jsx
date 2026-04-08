import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import { ActionButton } from '../components/ui/ActionButton';
import { Globe, CheckCircle2, AlertCircle, AlertTriangle, Shield, X, Loader2, Send } from 'lucide-react';

export const InternationalTransferPage = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [fromAccount, setFromAccount] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientIBAN, setRecipientIBAN] = useState('');
  const [recipientSWIFT, setRecipientSWIFT] = useState('');
  const [recipientBank, setRecipientBank] = useState('');
  const [recipientCountry, setRecipientCountry] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBackupCodeModal, setShowBackupCodeModal] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await apiClient.get('/accounts');
        if (response.success) {
          // Filter out crypto wallets for outgoing transfers
          const nonCryptoAccounts = response.accounts.filter(acc => acc.accountType !== 'CRYPTO_WALLET');
          setAccounts(nonCryptoAccounts);
          if (nonCryptoAccounts.length > 0) {
            setFromAccount(nonCryptoAccounts[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setError('Unable to load accounts');
      }
    };

    fetchAccounts();
  }, []);

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!fromAccount || !recipientName || !recipientIBAN || !recipientSWIFT || !recipientBank || !recipientCountry || !amount) {
      setError('Please fill in all required fields including SWIFT/BIC code');
      return;
    }

    // Validate SWIFT/BIC code format (8 or 11 characters)
    const swiftRegex = /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/i;
    if (!swiftRegex.test(recipientSWIFT)) {
      setError('Invalid SWIFT/BIC code format. Must be 8 or 11 characters (e.g., CHASUS33 or CHASUS33XXX)');
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    const account = accounts.find(acc => acc.id === fromAccount);
    if (account && parseFloat(amount) > parseFloat(account.balance)) {
      setError('Insufficient funds in source account');
      return;
    }

    // Show backup code modal
    setShowBackupCodeModal(true);
  };

  const handleVerifyAndSubmit = async () => {
    if (!backupCode) {
      setError('Please enter your Auth Token');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const response = await apiClient.post('/transfers/international', {
        fromAccountId: fromAccount,
        bankName: recipientBank,
        swiftCode: recipientSWIFT.toUpperCase(),
        iban: recipientIBAN,
        accountHolderName: recipientName,
        country: recipientCountry,
        amount: parseFloat(amount),
        description,
        backupCode
      });

      if (response.success) {
        setShowBackupCodeModal(false);
        setBackupCode('');
        setSuccess(`International transfer of $${amount} submitted for approval!`);
        setAmount('');
        setRecipientName('');
        setRecipientIBAN('');
        setRecipientSWIFT('');
        setRecipientBank('');
        setRecipientCountry('');
        setRecipientAddress('');
        setDescription('');
        
        setTimeout(() => {
          navigate('/transaction-history');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'International transfer failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1">International Wire</h1>
          <p className="text-sm text-neutral-600">Send money abroad via SWIFT/IBAN</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-700 text-sm font-medium">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Warning Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900 mb-1">Important Notice</h3>
              <p className="text-sm text-amber-700">
                International transfers may take 1-5 business days to process. Additional fees may apply based on the destination country and amount.
              </p>
            </div>
          </div>
        </div>

        {/* Transfer Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <Globe className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Transfer Details</h2>
              <p className="text-sm text-neutral-600">Enter recipient and transfer information</p>
            </div>
          </div>

          <form onSubmit={handleTransfer} className="space-y-5">
            {/* From Account */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                From Account
              </label>
              <select
                value={fromAccount}
                onChange={(e) => setFromAccount(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 text-sm"
                required
              >
                <option value="">Select source account...</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumber} - ${acc.balance} ({acc.accountType})
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-neutral-200 pt-5">
              <h3 className="text-sm font-semibold text-neutral-900 mb-4">Recipient Information</h3>

              {/* Recipient Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Recipient Name
                </label>
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Full name as it appears on their account"
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
                  required
                />
              </div>

              {/* Recipient IBAN */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  IBAN / Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={recipientIBAN}
                  onChange={(e) => setRecipientIBAN(e.target.value)}
                  placeholder="GB29 NWBK 6016 1331 9268 19"
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm font-mono"
                  required
                />
              </div>

              {/* SWIFT/BIC Code */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  SWIFT/BIC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={recipientSWIFT}
                  onChange={(e) => setRecipientSWIFT(e.target.value.toUpperCase())}
                  placeholder="CHASUS33 or CHASUS33XXX"
                  maxLength={11}
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm font-mono uppercase"
                  required
                />
                <p className="text-xs text-neutral-500 mt-1">8 or 11 character bank identifier code</p>
              </div>

              {/* Recipient Bank */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={recipientBank}
                  onChange={(e) => setRecipientBank(e.target.value)}
                  placeholder="e.g., Deutsche Bank, HSBC"
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
                  required
                />
              </div>

              {/* Recipient Country */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={recipientCountry}
                  onChange={(e) => setRecipientCountry(e.target.value)}
                  placeholder="e.g., United Kingdom, Germany"
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
                  required
                />
              </div>

              {/* Recipient Address */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Recipient Address (Optional)
                </label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Street address, city, postal code"
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
                />
              </div>
            </div>

            {/* Amount */}
            <div className="border-t border-neutral-200 pt-5">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
                  required
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1.5">Exchange rates and fees will be applied</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Purpose of Transfer (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Invoice payment, Family support"
                rows={3}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <ActionButton
                type="button"
                variant="outline"
                size="lg"
                onClick={() => navigate('/dashboard')}
                fullWidth
              >
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                disabled={!fromAccount || !recipientName || !recipientIBAN || !recipientSWIFT || !amount}
                fullWidth
              >
                {loading ? 'Processing...' : 'Initiate Transfer'}
              </ActionButton>
            </div>
          </form>
        </div>
      </div>

      {/* Backup Code Verification Modal */}
      {showBackupCodeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Verify Auth Token</h3>
                  <p className="text-sm text-neutral-500">Enter your Auth Token to proceed</p>
                </div>
              </div>
              <button
                onClick={() => { setShowBackupCodeModal(false); setBackupCode(''); setError(''); }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Auth Token *
                </label>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit Auth Token"
                  maxLength={6}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-xl tracking-widest font-mono"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowBackupCodeModal(false); setBackupCode(''); setError(''); }}
                  className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleVerifyAndSubmit}
                  disabled={verifying || backupCode.length !== 6}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-4 h-4" />}
                  {verifying ? 'Verifying...' : 'Verify & Submit'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </UserDashboardLayout>
  );
};

export default InternationalTransferPage;
