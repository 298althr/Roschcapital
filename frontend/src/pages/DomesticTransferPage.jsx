import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import { ActionButton } from '../components/ui/ActionButton';
import { Users, CheckCircle2, AlertCircle, Info, Shield, Star, Plus } from 'lucide-react';

export const DomesticTransferPage = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [fromAccount, setFromAccount] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientAccountNumber, setRecipientAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBackupCodeModal, setShowBackupCodeModal] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [accountsRes, beneficiariesRes] = await Promise.all([
          apiClient.get('/accounts'),
          apiClient.get('/beneficiaries').catch(() => ({ success: true, beneficiaries: [] }))
        ]);
        
        if (accountsRes.success) {
          // Filter out crypto wallets for outgoing transfers
          const nonCryptoAccounts = accountsRes.accounts.filter(acc => acc.accountType !== 'CRYPTO_WALLET');
          setAccounts(nonCryptoAccounts);
          if (nonCryptoAccounts.length > 0) {
            setFromAccount(nonCryptoAccounts[0].id);
          }
        }
        
        if (beneficiariesRes.success) {
          // Filter for internal beneficiaries only
          setBeneficiaries((beneficiariesRes.beneficiaries || []).filter(b => b.type === 'INTERNAL'));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Unable to load accounts');
      }
    };

    fetchData();
  }, []);

  const selectBeneficiary = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setRecipientName(beneficiary.accountName || beneficiary.name);
    setRecipientEmail(beneficiary.email || '');
    setRecipientAccountNumber(beneficiary.accountNumber || '');
  };

  const handleContinue = (e) => {
    e.preventDefault();
    setError('');

    if (!fromAccount || !recipientAccountNumber || !recipientName || !amount) {
      setError('Please fill in all required fields');
      return;
    }

    if (parseFloat(amount) <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    const account = accounts.find(acc => acc.id === fromAccount);
    if (account && parseFloat(amount) > parseFloat(account.availableBalance)) {
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

    try {
      setVerifying(true);
      setError('');

      const response = await apiClient.post('/transfers/internal', {
        fromAccountId: fromAccount,
        toAccountNumber: recipientAccountNumber,
        recipientName,
        recipientEmail,
        amount: parseFloat(amount),
        description,
        backupCode,
        saveBeneficiary
      });

      if (response.success) {
        setSuccess('Internal transfer completed successfully!');
        setShowBackupCodeModal(false);
        
        // Reset form
        setRecipientName('');
        setRecipientEmail('');
        setRecipientAccountNumber('');
        setAmount('');
        setDescription('');
        setBackupCode('');
        setSaveBeneficiary(false);
        setSelectedBeneficiary(null);
        
        setTimeout(() => {
          navigate('/transaction-history');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Transfer request failed');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-1">Internal Transfer</h1>
          <p className="text-sm text-neutral-600">Transfer money to other Rosch Capital Bank users instantly</p>
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

        {/* Saved Beneficiaries */}
        {beneficiaries.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              Saved Beneficiaries
            </h3>
            <div className="flex flex-wrap gap-2">
              {beneficiaries.map((ben) => (
                <button
                  key={ben.id}
                  type="button"
                  onClick={() => selectBeneficiary(ben)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedBeneficiary?.id === ben.id
                      ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border-2 border-transparent'
                  }`}
                >
                  {ben.nickname || ben.accountName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Transfer Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Transfer Details</h2>
              <p className="text-sm text-neutral-600">Send money to another Rosch Capital Bank user</p>
            </div>
          </div>

          <form onSubmit={handleContinue} className="space-y-5">
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
                    {acc.accountNumber} - ${parseFloat(acc.availableBalance || acc.balance).toFixed(2)} ({acc.accountType})
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Recipient Name *
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Full name of the recipient"
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
                required
              />
            </div>

            {/* Recipient Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Recipient Email (Optional)
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="recipient@email.com"
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Recipient Account Number *
              </label>
              <input
                type="text"
                value={recipientAccountNumber}
                onChange={(e) => setRecipientAccountNumber(e.target.value)}
                placeholder="10-digit Rosch Capital Bank account number"
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm"
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Amount
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
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a note about this transfer..."
                rows={3}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm resize-none"
              />
            </div>

            {/* Save Beneficiary */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="saveBeneficiary"
                checked={saveBeneficiary}
                onChange={(e) => setSaveBeneficiary(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="saveBeneficiary" className="text-sm text-neutral-700">
                Save this recipient for future transfers
              </label>
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
                disabled={!fromAccount || !recipientAccountNumber || !recipientName || !amount}
                fullWidth
              >
                Continue
              </ActionButton>
            </div>
          </form>
        </div>

        {/* Info Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-emerald-900 mb-1">Internal Transfers</h3>
              <p className="text-sm text-emerald-700">
                Transfers between Rosch Capital Bank accounts are instant and free. Auth Token verification is required for security.
              </p>
            </div>
          </div>
        </div>

        {/* Backup Code Modal */}
        {showBackupCodeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-neutral-900">Verify Auth Token</h3>
                  <p className="text-sm text-neutral-600">Enter your Auth Token to proceed</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Auth Token *
                </label>
                <input
                  type="text"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  placeholder="Enter your 6-digit Auth Token"
                  maxLength="6"
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 placeholder-neutral-400 text-sm text-center text-2xl tracking-widest font-mono"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <ActionButton
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setShowBackupCodeModal(false);
                    setBackupCode('');
                    setError('');
                  }}
                  fullWidth
                  disabled={verifying}
                >
                  Cancel
                </ActionButton>
                <ActionButton
                  type="button"
                  variant="primary"
                  size="lg"
                  onClick={handleVerifyAndSubmit}
                  loading={verifying}
                  disabled={!backupCode || backupCode.length !== 6}
                  fullWidth
                >
                  {verifying ? 'Verifying...' : 'Verify & Submit'}
                </ActionButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default DomesticTransferPage;
