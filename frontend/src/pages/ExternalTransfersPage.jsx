import React, { useState, useEffect } from 'react';
import {
  Send,
  Users,
  Plus,
  Building2,
  Globe,
  Search,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Save,
  Loader2,
  ArrowUpRight,
  History,
  Star,
  Wallet,
  ChevronRight,
  Shield,
  CreditCard
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';

const ExternalTransfersPage = () => {
  const [activeTab, setActiveTab] = useState('transfer');
  const [accounts, setAccounts] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [banks, setBanks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBeneficiaryModal, setShowBeneficiaryModal] = useState(false);
  const [showTransferDetailsModal, setShowTransferDetailsModal] = useState(null);
  const [editingBeneficiary, setEditingBeneficiary] = useState(null);
  const [showBackupCodeModal, setShowBackupCodeModal] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  
  // Transfer form
  const [transferType, setTransferType] = useState('domestic');
  const [selectedAccount, setSelectedAccount] = useState('');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [saveBeneficiary, setSaveBeneficiary] = useState(false);
  
  const [transferForm, setTransferForm] = useState({
    amount: '',
    description: '',
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountHolderName: '',
    swiftCode: '',
    iban: '',
    country: ''
  });

  const [beneficiaryForm, setBeneficiaryForm] = useState({
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountName: '',
    nickname: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [accountsRes, beneficiariesRes, transfersRes, banksRes] = await Promise.all([
        apiClient.get('/accounts'),
        apiClient.get('/beneficiaries'),
        apiClient.get('/transfers'),
        apiClient.get('/transfers/banks').catch(() => ({ banks: [] }))
      ]);
      
      // Filter out crypto wallets for outgoing transfers
      const nonCryptoAccounts = (accountsRes.accounts || []).filter(acc => acc.accountType !== 'CRYPTO_WALLET');
      setAccounts(nonCryptoAccounts);
      setBeneficiaries(beneficiariesRes.beneficiaries || []);
      setTransfers(transfersRes.transfers || []);
      setBanks(banksRes.banks || []);
      
      if (nonCryptoAccounts.length > 0) {
        const primary = nonCryptoAccounts.find(a => a.isPrimary) || nonCryptoAccounts[0];
        setSelectedAccount(primary.id);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load data');
    }
    setIsLoading(false);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate form
    if (!selectedAccount || !transferForm.amount) {
      setError('Please fill in all required fields');
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
      const endpoint = transferType === 'domestic' ? '/transfers/domestic' : '/transfers/international';
      
      const payload = {
        fromAccountId: selectedAccount,
        amount: parseFloat(transferForm.amount),
        description: transferForm.description,
        bankName: selectedBeneficiary?.bankName || transferForm.bankName,
        routingNumber: selectedBeneficiary?.routingNumber || transferForm.routingNumber,
        accountNumber: selectedBeneficiary?.accountNumber || transferForm.accountNumber,
        accountHolderName: selectedBeneficiary?.accountName || transferForm.accountHolderName,
        backupCode: backupCode
      };

      if (transferType === 'international') {
        payload.swiftCode = transferForm.swiftCode;
        payload.iban = transferForm.iban;
        payload.country = transferForm.country;
      }

      const response = await apiClient.post(endpoint, payload);
      
      setShowBackupCodeModal(false);
      setBackupCode('');
      setSuccess(`Transfer of $${transferForm.amount} submitted for approval!`);
      
      if (saveBeneficiary && !selectedBeneficiary) {
        await apiClient.post('/beneficiaries', {
          bankName: transferForm.bankName,
          routingNumber: transferForm.routingNumber,
          accountNumber: transferForm.accountNumber,
          accountName: transferForm.accountHolderName,
          nickname: transferForm.accountHolderName
        });
      }
      
      resetTransferForm();
      setShowTransferModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Transfer failed');
    }
    setVerifying(false);
  };

  const handleSaveBeneficiary = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingBeneficiary) {
        await apiClient.put(`/beneficiaries/${editingBeneficiary.id}`, beneficiaryForm);
        setSuccess('Beneficiary updated successfully!');
      } else {
        await apiClient.post('/beneficiaries', beneficiaryForm);
        setSuccess('Beneficiary added successfully!');
      }
      
      setShowBeneficiaryModal(false);
      setEditingBeneficiary(null);
      resetBeneficiaryForm();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save beneficiary');
    }
    setIsSubmitting(false);
  };

  const handleDeleteBeneficiary = async (id) => {
    if (!confirm('Are you sure you want to delete this beneficiary?')) return;
    
    try {
      await apiClient.delete(`/beneficiaries/${id}`);
      setSuccess('Beneficiary deleted');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete beneficiary');
    }
  };

  const resetTransferForm = () => {
    setTransferForm({
      amount: '',
      description: '',
      bankName: '',
      routingNumber: '',
      accountNumber: '',
      accountHolderName: '',
      swiftCode: '',
      iban: '',
      country: ''
    });
    setSelectedBeneficiary(null);
    setSaveBeneficiary(false);
  };

  const resetBeneficiaryForm = () => {
    setBeneficiaryForm({
      bankName: '',
      routingNumber: '',
      accountNumber: '',
      accountName: '',
      nickname: ''
    });
  };

  const openEditBeneficiary = (ben) => {
    setEditingBeneficiary(ben);
    setBeneficiaryForm({
      bankName: ben.bankName,
      routingNumber: ben.routingNumber,
      accountNumber: ben.accountNumber,
      accountName: ben.accountName,
      nickname: ben.nickname || ''
    });
    setShowBeneficiaryModal(true);
  };

  const selectBeneficiaryForTransfer = (ben) => {
    setSelectedBeneficiary(ben);
    setTransferForm(prev => ({
      ...prev,
      bankName: ben.bankName,
      routingNumber: ben.routingNumber,
      accountNumber: ben.accountNumber,
      accountHolderName: ben.accountName
    }));
    setShowTransferModal(true);
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock },
      APPROVED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: CheckCircle },
      COMPLETED: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
      DECLINED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: XCircle },
      REVERSED: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', icon: XCircle }
    };
    return styles[status] || styles.PENDING;
  };

  const filteredBeneficiaries = beneficiaries.filter(b => 
    b.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.bankName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const pendingCount = transfers.filter(t => t.status === 'PENDING').length;
  const completedCount = transfers.filter(t => t.status === 'COMPLETED').length;
  const totalTransferred = transfers
    .filter(t => t.status === 'COMPLETED')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  if (isLoading) {
    return (
      <UserDashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Local Transfer</h1>
            <p className="text-neutral-500 mt-1">Transfer to other banks within the same country</p>
          </div>
          <button
            onClick={() => { resetTransferForm(); setShowTransferModal(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-200"
          >
            <Send className="w-4 h-4" />
            New Transfer
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700 text-sm">{success}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Beneficiaries</p>
                <p className="text-2xl font-bold text-neutral-900">{beneficiaries.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Pending</p>
                <p className="text-2xl font-bold text-neutral-900">{pendingCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Completed</p>
                <p className="text-2xl font-bold text-neutral-900">{completedCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <ArrowUpRight className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-neutral-500">Total Sent</p>
                <p className="text-2xl font-bold text-neutral-900">${totalTransferred.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="border-b border-neutral-200">
            <nav className="flex">
              {[
                { id: 'transfer', label: 'Quick Transfer', icon: Send },
                { id: 'beneficiaries', label: 'Beneficiaries', icon: Users }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-600 text-primary-600 bg-primary-50/50'
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Quick Transfer Tab */}
            {activeTab === 'transfer' && (
              <div className="space-y-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">Send Money Externally</h3>
                  <p className="text-neutral-500 max-w-md mx-auto mb-6">
                    Transfer funds to any bank account. Choose from your saved beneficiaries or add a new recipient.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => { resetTransferForm(); setShowTransferModal(true); }}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      New Transfer
                    </button>
                    {beneficiaries.length > 0 && (
                      <button
                        onClick={() => setActiveTab('beneficiaries')}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors"
                      >
                        <Users className="w-4 h-4" />
                        Select Beneficiary
                      </button>
                    )}
                  </div>
                </div>

                {/* Recent Beneficiaries */}
                {beneficiaries.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-neutral-700 mb-3">Quick Send to Recent</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {beneficiaries.slice(0, 4).map(ben => (
                        <button
                          key={ben.id}
                          onClick={() => selectBeneficiaryForTransfer(ben)}
                          className="flex flex-col items-center p-4 bg-neutral-50 rounded-xl hover:bg-primary-50 hover:border-primary-200 border border-neutral-200 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold mb-2">
                            {ben.accountName?.charAt(0)?.toUpperCase() || 'B'}
                          </div>
                          <span className="text-sm font-medium text-neutral-900 truncate w-full text-center">
                            {ben.nickname || ben.accountName}
                          </span>
                          <span className="text-xs text-neutral-500 truncate w-full text-center">
                            {ben.bankName}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Beneficiaries Tab */}
            {activeTab === 'beneficiaries' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Search beneficiaries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <button
                    onClick={() => { resetBeneficiaryForm(); setEditingBeneficiary(null); setShowBeneficiaryModal(true); }}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Beneficiary
                  </button>
                </div>

                {filteredBeneficiaries.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
                    <p className="text-neutral-500">No beneficiaries found</p>
                    <p className="text-sm text-neutral-400 mt-1">Add a beneficiary to get started</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredBeneficiaries.map(ben => (
                      <div
                        key={ben.id}
                        className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl hover:bg-white hover:shadow-md border border-neutral-200 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-bold">
                            {ben.accountName?.charAt(0)?.toUpperCase() || 'B'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-neutral-900">{ben.accountName}</span>
                              {ben.nickname && (
                                <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                                  {ben.nickname}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-neutral-500">
                              <Building2 className="w-3.5 h-3.5" />
                              {ben.bankName}
                              <span className="text-neutral-300">|</span>
                              <span className="font-mono">****{ben.accountNumber?.slice(-4)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => selectBeneficiaryForTransfer(ben)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Send Money"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditBeneficiary(ben)}
                            className="p-2 text-neutral-500 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBeneficiary(ben.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">New External Transfer</h3>
                <p className="text-sm text-neutral-500">Send money to another bank</p>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <form onSubmit={handleTransfer} className="p-6 space-y-5">
              {/* Transfer Type */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTransferType('domestic')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    transferType === 'domestic'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <Building2 className={`w-6 h-6 mx-auto mb-2 ${transferType === 'domestic' ? 'text-primary-600' : 'text-neutral-400'}`} />
                  <span className={`text-sm font-medium ${transferType === 'domestic' ? 'text-primary-700' : 'text-neutral-600'}`}>
                    Domestic
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTransferType('international')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    transferType === 'international'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <Globe className={`w-6 h-6 mx-auto mb-2 ${transferType === 'international' ? 'text-primary-600' : 'text-neutral-400'}`} />
                  <span className={`text-sm font-medium ${transferType === 'international' ? 'text-primary-700' : 'text-neutral-600'}`}>
                    International
                  </span>
                </button>
              </div>

              {/* From Account */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">From Account</label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  required
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountType} - {acc.accountNumber} (${parseFloat(acc.balance).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Selected Beneficiary */}
              {selectedBeneficiary && (
                <div className="p-4 bg-primary-50 border border-primary-200 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                        {selectedBeneficiary.accountName?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">{selectedBeneficiary.accountName}</div>
                        <div className="text-sm text-neutral-500">{selectedBeneficiary.bankName}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedBeneficiary(null)}
                      className="text-primary-600 text-sm font-medium hover:underline"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* Recipient Details */}
              {!selectedBeneficiary && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Recipient Name</label>
                    <input
                      type="text"
                      value={transferForm.accountHolderName}
                      onChange={(e) => setTransferForm({...transferForm, accountHolderName: e.target.value})}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      value={transferForm.bankName}
                      onChange={(e) => setTransferForm({...transferForm, bankName: e.target.value})}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Chase Bank"
                      required
                    />
                  </div>
                  
                  {transferType === 'domestic' ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Routing Number</label>
                        <input
                          type="text"
                          value={transferForm.routingNumber}
                          onChange={(e) => setTransferForm({...transferForm, routingNumber: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="021000021"
                          maxLength={9}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">Account Number</label>
                        <input
                          type="text"
                          value={transferForm.accountNumber}
                          onChange={(e) => setTransferForm({...transferForm, accountNumber: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="123456789"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">SWIFT Code</label>
                          <input
                            type="text"
                            value={transferForm.swiftCode}
                            onChange={(e) => setTransferForm({...transferForm, swiftCode: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="CHASUS33"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1.5">Country</label>
                          <input
                            type="text"
                            value={transferForm.country}
                            onChange={(e) => setTransferForm({...transferForm, country: e.target.value})}
                            className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="United Kingdom"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1.5">IBAN</label>
                        <input
                          type="text"
                          value={transferForm.iban}
                          onChange={(e) => setTransferForm({...transferForm, iban: e.target.value})}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                          placeholder="GB82 WEST 1234 5698 7654 32"
                          required
                        />
                      </div>
                    </>
                  )}

                  {/* Save Beneficiary */}
                  <label className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl cursor-pointer hover:bg-neutral-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={saveBeneficiary}
                      onChange={(e) => setSaveBeneficiary(e.target.checked)}
                      className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-neutral-700">Save as beneficiary</span>
                      <p className="text-xs text-neutral-500">Quick access for future transfers</p>
                    </div>
                  </label>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({...transferForm, amount: e.target.value})}
                    className="w-full pl-8 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg font-semibold"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({...transferForm, description: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Payment for services"
                />
              </div>

              {/* Security Notice */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-xl">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Secure Transfer</p>
                  <p className="text-blue-700">Your transfer is protected with bank-grade encryption</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Transfer
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Beneficiary Modal */}
      {showBeneficiaryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">
                {editingBeneficiary ? 'Edit Beneficiary' : 'Add Beneficiary'}
              </h3>
              <button
                onClick={() => { setShowBeneficiaryModal(false); setEditingBeneficiary(null); }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <form onSubmit={handleSaveBeneficiary} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Account Holder Name</label>
                <input
                  type="text"
                  value={beneficiaryForm.accountName}
                  onChange={(e) => setBeneficiaryForm({...beneficiaryForm, accountName: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Bank Name</label>
                <input
                  type="text"
                  value={beneficiaryForm.bankName}
                  onChange={(e) => setBeneficiaryForm({...beneficiaryForm, bankName: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Routing Number</label>
                  <input
                    type="text"
                    value={beneficiaryForm.routingNumber}
                    onChange={(e) => setBeneficiaryForm({...beneficiaryForm, routingNumber: e.target.value})}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    maxLength={9}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Account Number</label>
                  <input
                    type="text"
                    value={beneficiaryForm.accountNumber}
                    onChange={(e) => setBeneficiaryForm({...beneficiaryForm, accountNumber: e.target.value})}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Nickname (Optional)</label>
                <input
                  type="text"
                  value={beneficiaryForm.nickname}
                  onChange={(e) => setBeneficiaryForm({...beneficiaryForm, nickname: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Landlord, Mom"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowBeneficiaryModal(false); setEditingBeneficiary(null); }}
                  className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingBeneficiary ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Details Modal */}
      {showTransferDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">Transfer Details</h3>
              <button
                onClick={() => setShowTransferDetailsModal(null)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center pb-4 border-b border-neutral-200">
                <div className="text-3xl font-bold text-neutral-900 mb-1">
                  ${parseFloat(showTransferDetailsModal.amount).toLocaleString()}
                </div>
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(showTransferDetailsModal.status).bg} ${getStatusBadge(showTransferDetailsModal.status).text}`}>
                  {showTransferDetailsModal.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Reference</span>
                  <span className="font-mono text-neutral-900">{showTransferDetailsModal.reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Recipient</span>
                  <span className="text-neutral-900">{showTransferDetailsModal.accountName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Bank</span>
                  <span className="text-neutral-900">{showTransferDetailsModal.destinationBank}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Date</span>
                  <span className="text-neutral-900">{new Date(showTransferDetailsModal.createdAt).toLocaleString()}</span>
                </div>
                {showTransferDetailsModal.description && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Description</span>
                    <span className="text-neutral-900">{showTransferDetailsModal.description}</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setShowTransferDetailsModal(null)}
                className="w-full px-4 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors mt-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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

export default ExternalTransfersPage;
