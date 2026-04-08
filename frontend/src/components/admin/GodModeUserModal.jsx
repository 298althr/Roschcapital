import React, { useState, useEffect } from 'react';
import { 
  X, User, Mail, Phone, MapPin, Calendar, CreditCard, Shield, DollarSign, Clock, 
  FileText, Key, Download, Copy, Edit, Save, Plus, Trash2, Wallet, RefreshCw,
  CheckCircle, XCircle, AlertTriangle, Lock, Unlock, Eye, EyeOff, ChevronDown, ChevronUp
} from 'lucide-react';
import apiClient from '../../lib/apiClient';

export const GodModeUserModal = ({ isOpen, onClose, userId, onSuccess }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [backupCodes, setBackupCodes] = useState([]);
  const [cards, setCards] = useState({ debitCards: [], creditCards: [] });
  const [showCodes, setShowCodes] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [accountEditState, setAccountEditState] = useState(null);
  const [accountSaving, setAccountSaving] = useState(false);
  const [moneyAction, setMoneyAction] = useState({ type: 'CREDIT', amount: '', description: '' });
  const [adminTransfer, setAdminTransfer] = useState({ toAccountId: '', amount: '', description: '' });
  const [allAccounts, setAllAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    accounts: true,
    cards: true,
    security: false,
    transactions: false
  });

  useEffect(() => {
    if (isOpen && userId) {
      fetchAllUserData();
    }
  }, [isOpen, userId]);

  const fetchAllUserData = async () => {
    setIsLoading(true);
    try {
      const [userResponse, transactionsResponse, codesResponse, cardsResponse] = await Promise.all([
        apiClient.get(`/mybanker/users/${userId}`),
        apiClient.get(`/mybanker/users/${userId}/transactions?limit=20`).catch(() => ({ transactions: [] })),
        apiClient.get(`/mybanker/users/${userId}/backup-codes`).catch(() => ({ codes: [] })),
        apiClient.get(`/mybanker/users/${userId}/cards`).catch(() => ({ debitCards: [], creditCards: [] }))
      ]);
      
      setUser(userResponse.user);
      setEditData(userResponse.user);
      setTransactions(transactionsResponse.transactions || []);
      setBackupCodes(codesResponse.codes || []);
      setCards(cardsResponse);
      
      // Set first account as selected
      if (userResponse.user?.accounts?.length > 0) {
        setSelectedAccount(userResponse.user.accounts[0]);
      }
    } catch (error) {
      console.error('Failed to fetch user details:', error);
      setMessage({ type: 'error', text: 'Failed to load user data' });
    }
    setIsLoading(false);
  };

  const handleSaveUser = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/mybanker/users/${userId}`, {
        firstName: editData.firstName,
        lastName: editData.lastName,
        email: editData.email,
        phone: editData.phone,
        dateOfBirth: editData.dateOfBirth,
        address: editData.address,
        city: editData.city,
        state: editData.state,
        zipCode: editData.zipCode,
        country: editData.country,
        accountStatus: editData.accountStatus,
        kycStatus: editData.kycStatus,
        loginPreference: editData.loginPreference,
        isAdmin: editData.isAdmin,
        newPassword: editData.newPassword || undefined
      });
      
      setMessage({ type: 'success', text: 'User updated successfully!' });
      setEditMode(false);
      fetchAllUserData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Failed to update user:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update user' });
    }
    setSaving(false);
  };

  useEffect(() => {
    if (selectedAccount) {
      setAccountEditState({
        id: selectedAccount.id,
        accountNumber: selectedAccount.accountNumber || '',
        balance: selectedAccount.balance ?? '',
        availableBalance: selectedAccount.availableBalance ?? '',
        pendingBalance: selectedAccount.pendingBalance ?? 0,
        accountType: selectedAccount.accountType || 'CHECKING',
        isPrimary: Boolean(selectedAccount.isPrimary),
        isActive: Boolean(selectedAccount.isActive)
      });
    } else {
      setAccountEditState(null);
    }
  }, [selectedAccount]);

  const handleAccountFieldChange = (field, value) => {
    setAccountEditState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleUpdateAccount = async () => {
    if (!userId || !accountEditState?.id) {
      setMessage({ type: 'error', text: 'No account selected' });
      return;
    }

    setAccountSaving(true);
    try {
      const payload = {
        accountNumber: accountEditState.accountNumber?.trim(),
        accountType: accountEditState.accountType,
        balance: accountEditState.balance,
        availableBalance: accountEditState.availableBalance,
        pendingBalance: accountEditState.pendingBalance,
        isPrimary: accountEditState.isPrimary,
        isActive: accountEditState.isActive
      };

      await apiClient.put(`/mybanker/users/${userId}/accounts/${accountEditState.id}`, payload);
      setMessage({ type: 'success', text: 'Account updated successfully!' });
      await fetchAllUserData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Account update failed:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update account' });
    } finally {
      setAccountSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!userId || !accountEditState?.id) {
      setMessage({ type: 'error', text: 'No account selected' });
      return;
    }

    if (!confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      return;
    }

    setAccountSaving(true);
    try {
      await apiClient.delete(`/mybanker/users/${userId}/accounts/${accountEditState.id}`);
      setMessage({ type: 'success', text: 'Account deleted successfully' });
      setSelectedAccount(null);
      await fetchAllUserData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Delete account failed:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to delete account' });
    } finally {
      setAccountSaving(false);
    }
  };

  const handleCreditDebit = async () => {
    if (!selectedAccount || !moneyAction.amount) {
      setMessage({ type: 'error', text: 'Please select an account and enter an amount' });
      return;
    }
    
    setSaving(true);
    try {
      await apiClient.post(`/mybanker/users/${userId}/credit-debit`, {
        type: moneyAction.type,
        amount: parseFloat(moneyAction.amount),
        description: moneyAction.description || `Admin ${moneyAction.type.toLowerCase()}`,
        accountId: selectedAccount.id
      });
      
      setMessage({ type: 'success', text: `Successfully ${moneyAction.type.toLowerCase()}ed $${moneyAction.amount}` });
      setMoneyAction({ type: 'CREDIT', amount: '', description: '' });
      fetchAllUserData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Credit/Debit failed:', error);
      setMessage({ type: 'error', text: error.message || 'Transaction failed' });
    }
    setSaving(false);
  };

  const fetchAllAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await apiClient.get('/mybanker/all-accounts');
      setAllAccounts(response.accounts || []);
    } catch (error) {
      console.error('Failed to fetch all accounts:', error);
      setMessage({ type: 'error', text: 'Failed to load accounts for transfer' });
    }
    setLoadingAccounts(false);
  };

  const handleAdminTransfer = async () => {
    if (!selectedAccount || !adminTransfer.toAccountId || !adminTransfer.amount) {
      setMessage({ type: 'error', text: 'Please select source account, destination account, and enter an amount' });
      return;
    }
    
    if (selectedAccount.id === adminTransfer.toAccountId) {
      setMessage({ type: 'error', text: 'Source and destination accounts must be different' });
      return;
    }
    
    setSaving(true);
    try {
      const response = await apiClient.post('/mybanker/admin-transfer', {
        fromAccountId: selectedAccount.id,
        toAccountId: adminTransfer.toAccountId,
        amount: parseFloat(adminTransfer.amount),
        description: adminTransfer.description || 'Admin transfer'
      });
      
      setMessage({ type: 'success', text: response.message || `Successfully transferred $${adminTransfer.amount}` });
      setAdminTransfer({ toAccountId: '', amount: '', description: '' });
      fetchAllUserData();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Admin transfer failed:', error);
      setMessage({ type: 'error', text: error.response?.data?.error || error.message || 'Transfer failed' });
    }
    setSaving(false);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await apiClient.put(`/mybanker/users/${userId}/status`, { accountStatus: newStatus });
      setMessage({ type: 'success', text: `Status changed to ${newStatus}` });
      fetchAllUserData();
      if (onSuccess) onSuccess();
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update status' });
    }
  };

  const regenerateBackupCodes = async () => {
    if (!confirm('This will invalidate all existing backup codes. Continue?')) return;
    
    try {
      const response = await apiClient.post(`/mybanker/users/${userId}/regenerate-backup-codes`);
      setMessage({ type: 'success', text: 'Backup codes regenerated!' });
      setBackupCodes(response.codes || []);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to regenerate codes' });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setMessage({ type: 'success', text: 'Copied to clipboard!' });
    setTimeout(() => setMessage(null), 2000);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': case 'VERIFIED': case 'COMPLETED': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'SUSPENDED': case 'REJECTED': case 'FAILED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'PENDING': case 'LIMITED': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
          <p className="text-slate-400 mt-4 text-center">Loading God Mode...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
          <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">Failed to load user details</p>
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 text-white rounded-lg">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-purple-500/30 rounded-xl max-w-6xl w-full max-h-[95vh] overflow-hidden shadow-2xl shadow-purple-500/10">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 to-slate-900 border-b border-purple-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-500/20 rounded-full flex items-center justify-center border-2 border-purple-500/50">
                {user.profilePhoto ? (
                  <img src={user.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-purple-400 font-bold text-xl">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">{user.firstName} {user.lastName}</h3>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full border border-purple-500/30">
                    GOD MODE
                  </span>
                </div>
                <p className="text-slate-400 text-sm">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.accountStatus)}`}>
                    {user.accountStatus}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.kycStatus)}`}>
                    KYC: {user.kycStatus}
                  </span>
                  {user.isAdmin && (
                    <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full border border-red-500/30">
                      ADMIN
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-3 py-2 rounded-lg transition flex items-center gap-2 ${
                  editMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                <Edit className="w-4 h-4" />
                {editMode ? 'Editing' : 'Edit Mode'}
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Message Toast */}
        {message && (
          <div className={`mx-4 mt-4 p-3 rounded-lg flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
            'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            {message.text}
            <button onClick={() => setMessage(null)} className="ml-auto"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-180px)] p-4 space-y-4">
          
          {/* Quick Actions Bar */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-400" />
              Quick Actions
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleStatusChange(user.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  user.accountStatus === 'ACTIVE' 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30'
                }`}
              >
                {user.accountStatus === 'ACTIVE' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                {user.accountStatus === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}
              </button>
              <button
                onClick={() => {
                  setEditData(prev => ({ ...prev, kycStatus: 'VERIFIED' }));
                  handleSaveUser();
                }}
                className="px-3 py-2 bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded-lg text-sm font-medium flex items-center gap-2 border border-green-500/30"
              >
                <CheckCircle className="w-4 h-4" />
                Verify KYC
              </button>
              <button
                onClick={regenerateBackupCodes}
                className="px-3 py-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg text-sm font-medium flex items-center gap-2 border border-purple-500/30"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate Backup Codes
              </button>
              <button
                onClick={() => {
                  setEditData(prev => ({ ...prev, isAdmin: !prev.isAdmin }));
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  editData.isAdmin 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}
              >
                <Shield className="w-4 h-4" />
                {editData.isAdmin ? 'Remove Admin' : 'Make Admin'}
              </button>
            </div>
          </div>

          {/* Accounts Section */}
          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <button 
              onClick={() => toggleSection('accounts')}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <h4 className="text-white font-semibold flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-400" />
                Accounts ({user.accounts?.length || 0})
              </h4>
              {expandedSections.accounts ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            
            {expandedSections.accounts && (
              <div className="p-4 pt-0 space-y-3">
                {user.accounts?.map((account) => (
                  <div 
                    key={account.id}
                    onClick={() => setSelectedAccount(account)}
                    className={`p-4 rounded-lg cursor-pointer transition ${
                      selectedAccount?.id === account.id 
                        ? 'bg-purple-500/20 border-2 border-purple-500/50' 
                        : 'bg-slate-900 border border-slate-700 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{account.accountType}</span>
                        {account.isPrimary && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">Primary</span>
                        )}
                        {account.cryptoSymbol && (
                          <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">{account.cryptoSymbol}</span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${account.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {account.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400 block">Account #</span>
                        <span className="text-white font-mono">{account.accountNumber}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Balance</span>
                        <span className="text-green-400 font-semibold">${parseFloat(account.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Available</span>
                        <span className="text-white">${parseFloat(account.availableBalance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Currency</span>
                        <span className="text-white">{account.currency}</span>
                      </div>
                    </div>
                    {account.cryptoAddress && (
                      <div className="mt-2 pt-2 border-t border-slate-700">
                        <span className="text-slate-400 text-xs">Crypto Address:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono text-xs truncate">{account.cryptoAddress}</span>
                          <button onClick={(e) => { e.stopPropagation(); copyToClipboard(account.cryptoAddress); }} className="text-purple-400 hover:text-purple-300">
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Credit/Debit Section */}
                {selectedAccount && accountEditState && (
                  <div className="space-y-3">
                    <div className="bg-slate-900 rounded-lg p-4 border border-purple-500/30">
                      <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        Credit/Debit: {selectedAccount.accountType} ({selectedAccount.accountNumber})
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <select
                          value={moneyAction.type}
                          onChange={(e) => setMoneyAction(prev => ({ ...prev, type: e.target.value }))}
                          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        >
                          <option value="CREDIT">Credit (+)</option>
                          <option value="DEBIT">Debit (-)</option>
                        </select>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={moneyAction.amount}
                          onChange={(e) => setMoneyAction(prev => ({ ...prev, amount: e.target.value }))}
                          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={moneyAction.description}
                          onChange={(e) => setMoneyAction(prev => ({ ...prev, description: e.target.value }))}
                          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        />
                        <button
                          onClick={handleCreditDebit}
                          disabled={saving || !moneyAction.amount}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg font-semibold transition"
                        >
                          {saving ? 'Processing...' : 'Apply'}
                        </button>
                      </div>
                    </div>

                    {/* Admin Transfer - Move money to any account */}
                    <div className="bg-slate-900 rounded-lg p-4 border border-blue-500/30">
                      <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Wallet className="w-4 h-4 text-blue-400" />
                        Transfer to Another Account (Any User)
                      </h5>
                      <p className="text-slate-400 text-xs mb-3">
                        Transfer from: {selectedAccount.accountType} ({selectedAccount.accountNumber}) - Balance: ${parseFloat(selectedAccount.balance || 0).toLocaleString()}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div className="md:col-span-2">
                          <select
                            value={adminTransfer.toAccountId}
                            onChange={(e) => setAdminTransfer(prev => ({ ...prev, toAccountId: e.target.value }))}
                            onFocus={() => allAccounts.length === 0 && fetchAllAccounts()}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                          >
                            <option value="">Select destination account...</option>
                            {loadingAccounts ? (
                              <option disabled>Loading accounts...</option>
                            ) : (
                              allAccounts
                                .filter(acc => acc.id !== selectedAccount.id)
                                .map(acc => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.userName} - {acc.accountType} ({acc.accountNumber}) - ${acc.balance.toLocaleString()}
                                  </option>
                                ))
                            )}
                          </select>
                        </div>
                        <input
                          type="number"
                          placeholder="Amount"
                          value={adminTransfer.amount}
                          onChange={(e) => setAdminTransfer(prev => ({ ...prev, amount: e.target.value }))}
                          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                        />
                        <button
                          onClick={handleAdminTransfer}
                          disabled={saving || !adminTransfer.amount || !adminTransfer.toAccountId}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg font-semibold transition"
                        >
                          {saving ? 'Transferring...' : 'Transfer'}
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Description (optional)"
                        value={adminTransfer.description}
                        onChange={(e) => setAdminTransfer(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full mt-3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      />
                    </div>

                    <div className="bg-slate-900 rounded-lg p-4 border border-amber-500/30">
                      <h5 className="text-white font-semibold mb-3 flex items-center gap-2">
                        <Edit className="w-4 h-4 text-amber-300" />
                        Account Admin Controls
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Account Number</label>
                          <input
                            type="text"
                            value={accountEditState.accountNumber}
                            onChange={(e) => handleAccountFieldChange('accountNumber', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Account Type</label>
                          <select
                            value={accountEditState.accountType}
                            onChange={(e) => handleAccountFieldChange('accountType', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                          >
                            {['CHECKING', 'SAVINGS', 'BUSINESS', 'CRYPTO_WALLET'].map(type => (
                              <option key={type} value={type}>{type.replace('_', ' ')}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Balance</label>
                          <input
                            type="number"
                            value={accountEditState.balance}
                            onChange={(e) => handleAccountFieldChange('balance', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Available Balance</label>
                          <input
                            type="number"
                            value={accountEditState.availableBalance}
                            onChange={(e) => handleAccountFieldChange('availableBalance', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 block mb-1">Pending Balance</label>
                          <input
                            type="number"
                            value={accountEditState.pendingBalance}
                            onChange={(e) => handleAccountFieldChange('pendingBalance', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                        <div className="flex items-center gap-4 mt-4">
                          <label className="flex items-center gap-2 text-slate-200 text-sm">
                            <input
                              type="checkbox"
                              checked={accountEditState.isPrimary}
                              onChange={(e) => handleAccountFieldChange('isPrimary', e.target.checked)}
                              className="text-purple-500"
                            />
                            Primary Account
                          </label>
                          <label className="flex items-center gap-2 text-slate-200 text-sm">
                            <input
                              type="checkbox"
                              checked={accountEditState.isActive}
                              onChange={(e) => handleAccountFieldChange('isActive', e.target.checked)}
                              className="text-purple-500"
                            />
                            Active
                          </label>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          onClick={handleUpdateAccount}
                          disabled={accountSaving}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-600 text-white rounded-lg font-semibold transition flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          {accountSaving ? 'Saving...' : 'Update Account'}
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={accountSaving}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded-lg font-semibold transition flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Personal Information Section */}
          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <button 
              onClick={() => toggleSection('personal')}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <h4 className="text-white font-semibold flex items-center gap-2">
                <User className="w-5 h-5 text-purple-400" />
                Personal Information
              </h4>
              {expandedSections.personal ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            
            {expandedSections.personal && (
              <div className="p-4 pt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* First Name */}
                  <div>
                    <label className="text-slate-400 text-sm block mb-1">First Name</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.firstName || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    ) : (
                      <span className="text-white">{user.firstName}</span>
                    )}
                  </div>
                  
                  {/* Last Name */}
                  <div>
                    <label className="text-slate-400 text-sm block mb-1">Last Name</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.lastName || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    ) : (
                      <span className="text-white">{user.lastName}</span>
                    )}
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label className="text-slate-400 text-sm block mb-1">Email</label>
                    {editMode ? (
                      <input
                        type="email"
                        value={editData.email || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    ) : (
                      <span className="text-white">{user.email}</span>
                    )}
                  </div>
                  
                  {/* Phone */}
                  <div>
                    <label className="text-slate-400 text-sm block mb-1">Phone</label>
                    {editMode ? (
                      <input
                        type="text"
                        value={editData.phone || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    ) : (
                      <span className="text-white">{user.phone || 'N/A'}</span>
                    )}
                  </div>
                  
                  {/* Date of Birth */}
                  <div>
                    <label className="text-slate-400 text-sm block mb-1">Date of Birth</label>
                    {editMode ? (
                      <input
                        type="date"
                        value={editData.dateOfBirth ? editData.dateOfBirth.split('T')[0] : ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    ) : (
                      <span className="text-white">{user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                    )}
                  </div>
                  
                  {/* Account Status */}
                  <div>
                    <label className="text-slate-400 text-sm block mb-1">Account Status</label>
                    {editMode ? (
                      <select
                        value={editData.accountStatus || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, accountStatus: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      >
                        <option value="LIMITED">Limited</option>
                        <option value="ACTIVE">Active</option>
                        <option value="SUSPENDED">Suspended</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.accountStatus)}`}>
                        {user.accountStatus}
                      </span>
                    )}
                  </div>
                  
                  {/* KYC Status */}
                  <div>
                    <label className="text-slate-400 text-sm block mb-1">KYC Status</label>
                    {editMode ? (
                      <select
                        value={editData.kycStatus || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, kycStatus: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      >
                        <option value="NOT_SUBMITTED">Not Submitted</option>
                        <option value="PENDING">Pending</option>
                        <option value="VERIFIED">Verified</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.kycStatus)}`}>
                        {user.kycStatus}
                      </span>
                    )}
                  </div>
                  
                  {/* Login Preference */}
                  <div>
                    <label className="text-slate-400 text-sm block mb-1">Login Preference</label>
                    {editMode ? (
                      <select
                        value={editData.loginPreference || 'question'}
                        onChange={(e) => setEditData(prev => ({ ...prev, loginPreference: e.target.value }))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      >
                        <option value="question">Security Question</option>
                        <option value="code">Backup Code</option>
                      </select>
                    ) : (
                      <span className="text-white">{user.loginPreference === 'question' ? 'Security Question' : 'Backup Code'}</span>
                    )}
                  </div>
                  
                  {/* New Password (Edit Mode Only) */}
                  {editMode && (
                    <div>
                      <label className="text-slate-400 text-sm block mb-1">New Password (leave blank to keep)</label>
                      <input
                        type="password"
                        value={editData.newPassword || ''}
                        onChange={(e) => setEditData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  )}
                  
                  {/* Address */}
                  <div className="md:col-span-2 lg:col-span-3">
                    <label className="text-slate-400 text-sm block mb-1">Address</label>
                    {editMode ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <input
                          type="text"
                          placeholder="Street Address"
                          value={editData.address || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                          className="col-span-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={editData.city || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, city: e.target.value }))}
                          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={editData.state || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, state: e.target.value }))}
                          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                        <input
                          type="text"
                          placeholder="ZIP Code"
                          value={editData.zipCode || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, zipCode: e.target.value }))}
                          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                        <input
                          type="text"
                          placeholder="Country"
                          value={editData.country || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, country: e.target.value }))}
                          className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        />
                      </div>
                    ) : (
                      <span className="text-white">
                        {user.address ? `${user.address}, ${user.city}, ${user.state} ${user.zipCode}, ${user.country}` : 'N/A'}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Save Button */}
                {editMode && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleSaveUser}
                      disabled={saving}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 text-white rounded-lg font-semibold flex items-center gap-2 transition"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cards Section */}
          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <button 
              onClick={() => toggleSection('cards')}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <h4 className="text-white font-semibold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                Cards ({(cards.debitCards?.length || 0) + (cards.creditCards?.length || 0)})
              </h4>
              {expandedSections.cards ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            
            {expandedSections.cards && (
              <div className="p-4 pt-0 space-y-3">
                {/* Debit Cards */}
                {cards.debitCards?.map((card) => (
                  <div key={card.id} className="bg-gradient-to-r from-blue-900/30 to-slate-900 rounded-lg p-4 border border-blue-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-blue-400 font-semibold">Debit Card</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${card.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {card.isFrozen ? 'Frozen' : card.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-slate-400 block">Card Number</span>
                        <span className="text-white font-mono">•••• {card.cardNumber?.slice(-4) || '****'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Expiry</span>
                        <span className="text-white">{card.expiry ? new Date(card.expiry).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }) : 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Daily Limit</span>
                        <span className="text-white">${parseFloat(card.dailyLimit || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Monthly Limit</span>
                        <span className="text-white">${parseFloat(card.monthlyLimit || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Credit Cards */}
                {cards.creditCards?.map((card) => (
                  <div key={card.id} className="bg-gradient-to-r from-purple-900/30 to-slate-900 rounded-lg p-4 border border-purple-500/30">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-purple-400 font-semibold">Credit Card</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${getStatusColor(card.status)}`}>
                        {card.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-slate-400 block">Card Number</span>
                        <span className="text-white font-mono">•••• {card.cardNumber?.slice(-4) || '****'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Credit Limit</span>
                        <span className="text-white">${parseFloat(card.creditLimit || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Current Balance</span>
                        <span className="text-red-400">${parseFloat(card.currentBalance || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Available Credit</span>
                        <span className="text-green-400">${parseFloat(card.availableCredit || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {(cards.debitCards?.length || 0) + (cards.creditCards?.length || 0) === 0 && (
                  <p className="text-slate-400 text-center py-4">No cards found</p>
                )}
              </div>
            )}
          </div>

          {/* Security Section */}
          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <button 
              onClick={() => toggleSection('security')}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <h4 className="text-white font-semibold flex items-center gap-2">
                <Key className="w-5 h-5 text-purple-400" />
                Security & Backup Codes
              </h4>
              {expandedSections.security ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            
            {expandedSections.security && (
              <div className="p-4 pt-0 space-y-4">
                {/* Security Questions */}
                {user.securityQuestions?.length > 0 && (
                  <div>
                    <h5 className="text-slate-400 text-sm mb-2">Security Questions</h5>
                    <div className="space-y-1">
                      {user.securityQuestions.map((sq, idx) => (
                        <div key={idx} className="text-white text-sm">{idx + 1}. {sq.question}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Backup Codes */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-slate-400 text-sm">Backup Codes ({backupCodes.filter(c => !c.used).length} unused)</h5>
                    <button
                      onClick={() => setShowCodes(!showCodes)}
                      className="text-purple-400 text-sm hover:text-purple-300 flex items-center gap-1"
                    >
                      {showCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      {showCodes ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  
                  {showCodes && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {backupCodes.map((code, idx) => (
                        <div key={idx} className={`p-2 rounded-lg text-center ${code.used ? 'bg-red-500/10 border border-red-500/30' : 'bg-slate-900 border border-slate-700'}`}>
                          <span className={`font-mono ${code.used ? 'text-red-400 line-through' : 'text-white'}`}>{code.code}</span>
                          {code.used && <span className="text-red-400 text-xs block">Used</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Transactions Section */}
          <div className="bg-slate-800 rounded-lg border border-slate-700">
            <button 
              onClick={() => toggleSection('transactions')}
              className="w-full p-4 flex items-center justify-between text-left"
            >
              <h4 className="text-white font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Recent Transactions ({transactions.length})
              </h4>
              {expandedSections.transactions ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            
            {expandedSections.transactions && (
              <div className="p-4 pt-0">
                {transactions.length === 0 ? (
                  <p className="text-slate-400 text-center py-4">No transactions</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
                        <div>
                          <div className="text-white text-sm">{tx.description || tx.type}</div>
                          <div className="text-slate-400 text-xs">{new Date(tx.createdAt).toLocaleString()}</div>
                        </div>
                        <div className={`font-semibold ${['CREDIT', 'DEPOSIT'].includes(tx.type) ? 'text-green-400' : 'text-red-400'}`}>
                          {['CREDIT', 'DEPOSIT'].includes(tx.type) ? '+' : '-'}${parseFloat(tx.amount || 0).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4 bg-slate-900 flex justify-between items-center">
          <div className="text-slate-400 text-sm">
            User ID: <span className="font-mono text-white">{userId}</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GodModeUserModal;
