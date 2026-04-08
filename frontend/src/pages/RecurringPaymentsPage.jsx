import React, { useState, useEffect } from 'react';
import {
  Plus,
  Calendar,
  Clock,
  DollarSign,
  Repeat,
  Play,
  Pause,
  XCircle,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  X,
  Save,
  Loader2,
  Building2,
  User,
  ArrowRight,
  TrendingUp,
  CalendarDays,
  Zap
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';

const RecurringPaymentsPage = () => {
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [showEditModal, setShowEditModal] = useState(null);
  
  const [form, setForm] = useState({
    fromAccountId: '',
    paymentType: 'EXTERNAL',
    recipientName: '',
    recipientBank: '',
    recipientAccount: '',
    recipientRouting: '',
    toAccountNumber: '',
    amount: '',
    description: '',
    frequency: 'MONTHLY',
    startDate: '',
    endDate: '',
    dayOfMonth: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const accountsRes = await apiClient.get('/accounts');
      setAccounts(accountsRes.accounts || []);
      
      if (accountsRes.accounts?.length > 0) {
        const primary = accountsRes.accounts.find(a => a.isPrimary) || accountsRes.accounts[0];
        setForm(f => ({ ...f, fromAccountId: primary.id }));
      }
      
      // Try to fetch recurring payments, but don't fail if it errors
      try {
        const paymentsRes = await apiClient.get('/recurring-payments');
        setPayments(paymentsRes.payments || []);
        setError(''); // Clear any previous errors
      } catch (paymentErr) {
        console.log('Recurring payments not available:', paymentErr);
        setPayments([]);
        // Don't show error - just show empty state
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setAccounts([]);
      setPayments([]);
      // Don't show error - just show empty state
    }
    setIsLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        amount: parseFloat(form.amount),
        dayOfMonth: form.dayOfMonth ? parseInt(form.dayOfMonth) : null
      };
      
      await apiClient.post('/recurring-payments', payload);
      setSuccess('Recurring payment created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.message || 'Failed to create recurring payment');
    }
    setIsSubmitting(false);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiClient.put(`/recurring-payments/${showEditModal.id}`, {
        amount: parseFloat(form.amount),
        description: form.description,
        frequency: form.frequency,
        endDate: form.endDate || null,
        dayOfMonth: form.dayOfMonth ? parseInt(form.dayOfMonth) : null
      });
      setSuccess('Recurring payment updated!');
      setShowEditModal(null);
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update');
    }
    setIsSubmitting(false);
  };

  const handlePause = async (id) => {
    try {
      await apiClient.post(`/recurring-payments/${id}/pause`);
      setSuccess('Payment paused');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to pause');
    }
  };

  const handleResume = async (id) => {
    try {
      await apiClient.post(`/recurring-payments/${id}/resume`);
      setSuccess('Payment resumed');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to resume');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel this recurring payment?')) return;
    
    try {
      await apiClient.post(`/recurring-payments/${id}/cancel`);
      setSuccess('Payment cancelled');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to cancel');
    }
  };

  const resetForm = () => {
    const primary = accounts.find(a => a.isPrimary) || accounts[0];
    setForm({
      fromAccountId: primary?.id || '',
      paymentType: 'EXTERNAL',
      recipientName: '',
      recipientBank: '',
      recipientAccount: '',
      recipientRouting: '',
      toAccountNumber: '',
      amount: '',
      description: '',
      frequency: 'MONTHLY',
      startDate: '',
      endDate: '',
      dayOfMonth: ''
    });
  };

  const openEditModal = (payment) => {
    setForm({
      ...form,
      amount: payment.amount,
      description: payment.description || '',
      frequency: payment.frequency,
      endDate: payment.endDate ? payment.endDate.split('T')[0] : '',
      dayOfMonth: payment.dayOfMonth || ''
    });
    setShowEditModal(payment);
  };

  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', dot: 'bg-green-500' },
      PAUSED: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
      CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', dot: 'bg-red-500' },
      COMPLETED: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' }
    };
    return styles[status] || styles.ACTIVE;
  };

  const getFrequencyLabel = (freq) => {
    const labels = {
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      BIWEEKLY: 'Every 2 Weeks',
      MONTHLY: 'Monthly',
      QUARTERLY: 'Quarterly',
      YEARLY: 'Yearly'
    };
    return labels[freq] || freq;
  };

  const getFrequencyIcon = (freq) => {
    switch (freq) {
      case 'DAILY': return <Zap className="w-4 h-4" />;
      case 'WEEKLY': return <CalendarDays className="w-4 h-4" />;
      case 'MONTHLY': return <Calendar className="w-4 h-4" />;
      default: return <Repeat className="w-4 h-4" />;
    }
  };

  // Stats
  const activeCount = payments.filter(p => p.status === 'ACTIVE').length;
  const pausedCount = payments.filter(p => p.status === 'PAUSED').length;
  const totalMonthly = payments
    .filter(p => p.status === 'ACTIVE')
    .reduce((sum, p) => {
      const amount = parseFloat(p.amount);
      switch (p.frequency) {
        case 'DAILY': return sum + (amount * 30);
        case 'WEEKLY': return sum + (amount * 4);
        case 'BIWEEKLY': return sum + (amount * 2);
        case 'MONTHLY': return sum + amount;
        case 'QUARTERLY': return sum + (amount / 3);
        case 'YEARLY': return sum + (amount / 12);
        default: return sum + amount;
      }
    }, 0);

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
            <h1 className="text-2xl font-bold text-neutral-900">Recurring Payments</h1>
            <p className="text-neutral-500 mt-1">Automate your regular payments</p>
          </div>
          <button
            onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            New Recurring Payment
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-purple-800 font-medium">Recurring Payments Setup</p>
            <p className="text-purple-600 text-sm mt-1">
              To set up recurring payments, please contact our support team or visit your nearest branch. 
              Our team will help you configure automatic payments for bills, subscriptions, and regular transfers.
            </p>
          </div>
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

        {/* Payments List */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="border-b border-neutral-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-neutral-900">Your Recurring Payments</h2>
          </div>
          
          {payments.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center mb-4">
                <Repeat className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No recurring payments yet</h3>
              <p className="text-neutral-500 max-w-md mx-auto mb-6">
                Set up automatic payments for bills, subscriptions, or regular transfers to save time.
              </p>
              <button
                onClick={() => { resetForm(); setShowCreateModal(true); }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Your First Payment
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {payments.map(payment => {
                const statusStyle = getStatusBadge(payment.status);
                return (
                  <div
                    key={payment.id}
                    className="p-4 sm:p-5 hover:bg-neutral-50 transition-colors"
                  >
                    {/* Mobile Layout */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      {/* Left: Icon + Info */}
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          payment.status === 'ACTIVE' ? 'bg-green-100' :
                          payment.status === 'PAUSED' ? 'bg-amber-100' : 'bg-neutral-100'
                        }`}>
                          <Repeat className={`w-5 h-5 sm:w-6 sm:h-6 ${
                            payment.status === 'ACTIVE' ? 'text-green-600' :
                            payment.status === 'PAUSED' ? 'text-amber-600' : 'text-neutral-400'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-neutral-900 truncate">{payment.recipientName}</span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text} border ${statusStyle.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}></span>
                              {payment.status}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm text-neutral-500">
                            <span className="flex items-center gap-1">
                              <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                              {payment.recipientBank || 'So'}
                            </span>
                            <span className="text-neutral-300">•</span>
                            <span className="flex items-center gap-1">
                              {getFrequencyIcon(payment.frequency)}
                              {getFrequencyLabel(payment.frequency)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: Amount + Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-13 sm:pl-0">
                        <div className="text-left sm:text-right">
                          <div className="text-lg sm:text-xl font-bold text-neutral-900">
                            ${parseFloat(payment.amount).toLocaleString()}
                          </div>
                          <div className="text-xs sm:text-sm text-neutral-500">
                            Next: {payment.nextExecutionDate 
                              ? new Date(payment.nextExecutionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                              : 'N/A'}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-0.5 sm:gap-1">
                          <button
                            onClick={() => setShowDetailsModal(payment)}
                            className="p-1.5 sm:p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {payment.status === 'ACTIVE' && (
                            <button
                              onClick={() => openEditModal(payment)}
                              className="p-1.5 sm:p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Create Recurring Payment</h3>
                <p className="text-sm text-neutral-500">Set up automatic payments</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              {/* From Account */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">From Account</label>
                <select
                  value={form.fromAccountId}
                  onChange={(e) => setForm({...form, fromAccountId: e.target.value})}
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

              {/* Payment Type */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Payment Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setForm({...form, paymentType: 'EXTERNAL'})}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      form.paymentType === 'EXTERNAL'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <Building2 className={`w-5 h-5 mx-auto mb-1 ${form.paymentType === 'EXTERNAL' ? 'text-primary-600' : 'text-neutral-400'}`} />
                    <span className={`text-sm font-medium ${form.paymentType === 'EXTERNAL' ? 'text-primary-700' : 'text-neutral-600'}`}>
                      External Bank
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({...form, paymentType: 'INTERNAL'})}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      form.paymentType === 'INTERNAL'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <User className={`w-5 h-5 mx-auto mb-1 ${form.paymentType === 'INTERNAL' ? 'text-primary-600' : 'text-neutral-400'}`} />
                    <span className={`text-sm font-medium ${form.paymentType === 'INTERNAL' ? 'text-primary-700' : 'text-neutral-600'}`}>
                      Internal Transfer
                    </span>
                  </button>
                </div>
              </div>

              {/* Recipient Details */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Recipient Name</label>
                <input
                  type="text"
                  value={form.recipientName}
                  onChange={(e) => setForm({...form, recipientName: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., Electric Company"
                  required
                />
              </div>

              {form.paymentType === 'EXTERNAL' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1.5">Bank Name</label>
                    <input
                      type="text"
                      value={form.recipientBank}
                      onChange={(e) => setForm({...form, recipientBank: e.target.value})}
                      className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Routing Number</label>
                      <input
                        type="text"
                        value={form.recipientRouting}
                        onChange={(e) => setForm({...form, recipientRouting: e.target.value})}
                        maxLength={9}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1.5">Account Number</label>
                      <input
                        type="text"
                        value={form.recipientAccount}
                        onChange={(e) => setForm({...form, recipientAccount: e.target.value})}
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Recipient Account Number</label>
                  <input
                    type="text"
                    value={form.toAccountNumber}
                    onChange={(e) => setForm({...form, toAccountNumber: e.target.value})}
                    placeholder="Rosch Capital Bank account number"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              )}

              {/* Amount & Frequency */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      value={form.amount}
                      onChange={(e) => setForm({...form, amount: e.target.value})}
                      className="w-full pl-8 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => setForm({...form, frequency: e.target.value})}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                  >
                    <option value="DAILY">Daily</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="BIWEEKLY">Every 2 Weeks</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({...form, startDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">End Date (Optional)</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({...form, endDate: e.target.value})}
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              {form.frequency === 'MONTHLY' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">Day of Month (1-31)</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={form.dayOfMonth}
                    onChange={(e) => setForm({...form, dayOfMonth: e.target.value})}
                    placeholder="e.g., 15 for 15th"
                    className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description (Optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  placeholder="e.g., Monthly rent payment"
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 border border-neutral-300 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-medium hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">Payment Details</h3>
              <button onClick={() => setShowDetailsModal(null)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="text-center pb-4 border-b border-neutral-200">
                <div className="text-3xl font-bold text-neutral-900 mb-2">
                  ${parseFloat(showDetailsModal.amount).toLocaleString()}
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(showDetailsModal.status).bg} ${getStatusBadge(showDetailsModal.status).text}`}>
                  <span className={`w-2 h-2 rounded-full ${getStatusBadge(showDetailsModal.status).dot}`}></span>
                  {showDetailsModal.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-neutral-500">Reference</span>
                  <span className="font-mono text-sm text-primary-600">{showDetailsModal.reference}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-neutral-500">Recipient</span>
                  <span className="font-medium text-neutral-900">{showDetailsModal.recipientName}</span>
                </div>
                {showDetailsModal.recipientBank && (
                  <div className="flex justify-between py-2">
                    <span className="text-neutral-500">Bank</span>
                    <span className="text-neutral-900">{showDetailsModal.recipientBank}</span>
                  </div>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-neutral-500">Frequency</span>
                  <span className="text-neutral-900">{getFrequencyLabel(showDetailsModal.frequency)}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-neutral-500">Next Payment</span>
                  <span className="text-neutral-900">
                    {showDetailsModal.nextExecutionDate 
                      ? new Date(showDetailsModal.nextExecutionDate).toLocaleDateString()
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-neutral-500">Total Executions</span>
                  <span className="text-neutral-900">{showDetailsModal.executionCount || 0}</span>
                </div>
              </div>

              {showDetailsModal.executions?.length > 0 && (
                <div className="pt-4 border-t border-neutral-200">
                  <h4 className="text-sm font-medium text-neutral-700 mb-3">Recent Executions</h4>
                  <div className="space-y-2">
                    {showDetailsModal.executions.slice(0, 5).map(exec => (
                      <div key={exec.id} className="flex items-center justify-between text-sm bg-neutral-50 p-3 rounded-lg">
                        <span className="text-neutral-600">{new Date(exec.executionDate).toLocaleDateString()}</span>
                        <span className={exec.status === 'SUCCESS' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                          {exec.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => setShowDetailsModal(null)}
                className="w-full px-4 py-3 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-colors mt-4"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="border-b border-neutral-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900">Edit Payment</h3>
              <button onClick={() => setShowEditModal(null)} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={form.amount}
                    onChange={(e) => setForm({...form, amount: e.target.value})}
                    className="w-full pl-8 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Frequency</label>
                <select
                  value={form.frequency}
                  onChange={(e) => setForm({...form, frequency: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="BIWEEKLY">Every 2 Weeks</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="YEARLY">Yearly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">End Date (Optional)</label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({...form, endDate: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </UserDashboardLayout>
  );
};

export default RecurringPaymentsPage;
