import React, { useState, useEffect } from 'react';
import { 
  Landmark, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  DollarSign,
  Calendar,
  Percent,
  ChevronRight,
  X,
  FileText,
  CreditCard,
  Home,
  Car,
  Briefcase,
  Calculator,
  Info,
  Shield
} from 'lucide-react';
import apiClient from '../lib/apiClient';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

const LoansPage = () => {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [applyForm, setApplyForm] = useState({
    loanType: 'PERSONAL',
    amount: '',
    termMonths: 12,
    purpose: ''
  });

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await apiClient.get('/loans');
      setLoans(response.loans || []);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Failed to fetch loans:', error);
      setLoans([]); // Set empty array on error
      // Don't show error to user - just show empty state
    }
    setIsLoading(false);
  };

  const handleApplyLoan = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await apiClient.post('/loans', applyForm);
      setSuccess('Loan application submitted successfully! Our team will review your application.');
      setShowApplyModal(false);
      setApplyForm({ loanType: 'PERSONAL', amount: '', termMonths: 12, purpose: '' });
      fetchLoans();
      setTimeout(() => setSuccess(''), 5000);
    } catch (error) {
      setError(error.message || 'Failed to submit loan application');
    }
    setIsSubmitting(false);
  };

  const fetchSchedule = async (loanId) => {
    try {
      const response = await apiClient.get(`/loans/${loanId}/schedule`);
      setSchedule(response.schedule || []);
      setShowScheduleModal(loanId);
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
      setError('Failed to load payment schedule');
    }
  };

  const handleRepayment = async (loanId) => {
    try {
      await apiClient.post(`/loans/${loanId}/repay`);
      setSuccess('Payment processed successfully!');
      fetchLoans();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError(error.message || 'Failed to process payment');
      setTimeout(() => setError(''), 3000);
    }
  };

  const getLoanTypeIcon = (type) => {
    switch (type) {
      case 'PERSONAL': return <CreditCard className="w-5 h-5" />;
      case 'MORTGAGE': return <Home className="w-5 h-5" />;
      case 'AUTO': return <Car className="w-5 h-5" />;
      case 'BUSINESS': return <Briefcase className="w-5 h-5" />;
      default: return <Landmark className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
      APPROVED: 'bg-green-50 text-green-700 border-green-200',
      ACTIVE: 'bg-blue-50 text-blue-700 border-blue-200',
      PAID: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      DECLINED: 'bg-red-50 text-red-700 border-red-200',
      DEFAULTED: 'bg-red-50 text-red-700 border-red-200'
    };
    return styles[status] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const calculateMonthlyPayment = (amount, rate, months) => {
    if (!amount || !rate || !months) return 0;
    const monthlyRate = rate / 100 / 12;
    const numerator = monthlyRate * Math.pow(1 + monthlyRate, months);
    const denominator = Math.pow(1 + monthlyRate, months) - 1;
    return (amount * numerator) / denominator;
  };

  // Realistic interest rates for different loan types
  const defaultRates = {
    PERSONAL: 12.5,
    BUSINESS: 9.5,
    MORTGAGE: 6.5,
    AUTO: 8.0
  };

  const estimatedPayment = calculateMonthlyPayment(
    parseFloat(applyForm.amount) || 0,
    defaultRates[applyForm.loanType],
    applyForm.termMonths
  );

  if (isLoading && loans.length === 0) {
    return (
      <UserDashboardLayout>
        <LoadingSkeleton variant="premium" />
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Landmark className="w-5 h-5 text-purple-600" />
              </div>
              Loans
            </h1>
            <p className="text-gray-500 mt-1">Apply for loans and manage your existing loans</p>
          </div>
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl transition font-medium shadow-lg shadow-purple-500/25"
          >
            <Plus className="w-5 h-5" />
            Apply for Loan
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Info Banner */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-purple-800 font-medium">How Loans Work</p>
            <p className="text-purple-600 text-sm mt-1">
              Submit your loan application and our team will review it within 24-48 hours. 
              Once approved, funds will be credited directly to your account.
            </p>
          </div>
        </div>

        {/* Loan Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Landmark className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-gray-500 text-sm">Total Loans</div>
                <div className="text-2xl font-bold text-gray-900">{loans.length}</div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-gray-500 text-sm">Active Loans</div>
                <div className="text-2xl font-bold text-blue-600">
                  {loans.filter(l => l.status === 'ACTIVE' || l.status === 'APPROVED').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <div className="text-gray-500 text-sm">Pending</div>
                <div className="text-2xl font-bold text-amber-600">
                  {loans.filter(l => l.status === 'PENDING').length}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-gray-500 text-sm">Total Borrowed</div>
                <div className="text-2xl font-bold text-green-600">
                  ${loans.filter(l => l.status === 'ACTIVE' || l.status === 'APPROVED').reduce((sum, l) => sum + parseFloat(l.amount || 0), 0).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Loans List */}
        {loans.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
            <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Landmark className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Loans Yet</h3>
            <p className="text-gray-500 mb-6">Apply for your first loan to get started</p>
            <button
              onClick={() => setShowApplyModal(true)}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition font-medium"
            >
              Apply Now
            </button>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Loans</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {loans.map((loan) => (
                <div key={loan.id} className="p-5 hover:bg-gray-50 transition">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        loan.loanType === 'PERSONAL' ? 'bg-purple-100 text-purple-600' :
                        loan.loanType === 'MORTGAGE' ? 'bg-blue-100 text-blue-600' :
                        loan.loanType === 'AUTO' ? 'bg-green-100 text-green-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {getLoanTypeIcon(loan.loanType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-lg font-semibold text-gray-900">{loan.loanType} Loan</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(loan.status)}`}>
                            {loan.status}
                          </span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">{loan.purpose || 'No purpose specified'}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-sm">
                          <span className="flex items-center gap-1 text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            ${parseFloat(loan.amount).toLocaleString()}
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Percent className="w-4 h-4" />
                            {parseFloat(loan.interestRate)}% APR
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {loan.termMonths} months
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col md:items-end gap-2">
                      <div className="text-right">
                        <div className="text-gray-500 text-sm">Monthly Payment</div>
                        <div className="text-xl font-bold text-gray-900">${parseFloat(loan.monthlyPayment).toFixed(2)}</div>
                      </div>
                      {(loan.status === 'ACTIVE' || loan.status === 'APPROVED') && (
                        <div className="text-right">
                          <div className="text-gray-500 text-sm">Remaining</div>
                          <div className="text-lg font-semibold text-amber-600">${parseFloat(loan.remainingBalance).toLocaleString()}</div>
                        </div>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setShowDetailsModal(loan)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition font-medium"
                        >
                          Details
                        </button>
                        {(loan.status === 'ACTIVE' || loan.status === 'APPROVED') && (
                          <>
                            <button
                              onClick={() => fetchSchedule(loan.id)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition font-medium"
                            >
                              Schedule
                            </button>
                            <button
                              onClick={() => handleRepayment(loan.id)}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition font-medium"
                            >
                              Make Payment
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Apply Loan Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Apply for a Loan</h2>
                  <button onClick={() => setShowApplyModal(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <form onSubmit={handleApplyLoan} className="p-6 space-y-5">
                {/* Loan Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loan Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['PERSONAL', 'BUSINESS', 'MORTGAGE', 'AUTO'].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setApplyForm({...applyForm, loanType: type})}
                        className={`p-4 rounded-xl border-2 transition flex items-center gap-2 ${
                          applyForm.loanType === type 
                            ? 'bg-purple-50 border-purple-500 text-purple-700' 
                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {getLoanTypeIcon(type)}
                        <span className="text-sm font-medium">{type}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-purple-600 mt-2 font-medium">Interest Rate: {defaultRates[applyForm.loanType]}% APR</p>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Loan Amount ($)</label>
                  <input
                    type="number"
                    value={applyForm.amount}
                    onChange={(e) => setApplyForm({...applyForm, amount: e.target.value})}
                    placeholder="Enter amount (min $1,000)"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                    min="1000"
                    max="1000000"
                  />
                </div>

                {/* Term */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Loan Term</label>
                  <select
                    value={applyForm.termMonths}
                    onChange={(e) => setApplyForm({...applyForm, termMonths: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                  >
                    <option value={6}>6 months</option>
                    <option value={12}>12 months</option>
                    <option value={24}>24 months</option>
                    <option value={36}>36 months</option>
                    <option value={48}>48 months</option>
                    <option value={60}>60 months (5 years)</option>
                    <option value={120}>120 months (10 years)</option>
                    <option value={180}>180 months (15 years)</option>
                    <option value={240}>240 months (20 years)</option>
                    <option value={360}>360 months (30 years)</option>
                  </select>
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Purpose (Optional)</label>
                  <textarea
                    value={applyForm.purpose}
                    onChange={(e) => setApplyForm({...applyForm, purpose: e.target.value})}
                    placeholder="Describe the purpose of this loan"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  />
                </div>

                {/* Estimated Payment */}
                {applyForm.amount && parseFloat(applyForm.amount) >= 1000 && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-5 h-5 text-purple-600" />
                      <span className="text-purple-700 font-medium">Estimated Monthly Payment</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">${estimatedPayment.toFixed(2)}/month</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Total repayment: ${(estimatedPayment * applyForm.termMonths).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowApplyModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !applyForm.amount || parseFloat(applyForm.amount) < 1000}
                    className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loan Details Modal */}
        {showDetailsModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Loan Details</h2>
                  <button onClick={() => setShowDetailsModal(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-gray-500 text-sm">Loan Type</div>
                    <div className="text-gray-900 font-medium">{showDetailsModal.loanType}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Status</div>
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(showDetailsModal.status)}`}>
                      {showDetailsModal.status}
                    </span>
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Principal Amount</div>
                    <div className="text-gray-900 font-medium">${parseFloat(showDetailsModal.amount).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Interest Rate</div>
                    <div className="text-gray-900 font-medium">{parseFloat(showDetailsModal.interestRate)}% APR</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Term</div>
                    <div className="text-gray-900 font-medium">{showDetailsModal.termMonths} months</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Monthly Payment</div>
                    <div className="text-gray-900 font-medium">${parseFloat(showDetailsModal.monthlyPayment).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Remaining Balance</div>
                    <div className="text-amber-600 font-medium">${parseFloat(showDetailsModal.remainingBalance).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-sm">Total Paid</div>
                    <div className="text-green-600 font-medium">${parseFloat(showDetailsModal.totalPaid).toLocaleString()}</div>
                  </div>
                </div>
                {showDetailsModal.purpose && (
                  <div>
                    <div className="text-gray-500 text-sm">Purpose</div>
                    <div className="text-gray-900">{showDetailsModal.purpose}</div>
                  </div>
                )}
                {showDetailsModal.declineReason && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                    <div className="text-red-700 text-sm font-medium">Decline Reason</div>
                    <div className="text-red-600">{showDetailsModal.declineReason}</div>
                  </div>
                )}
                {showDetailsModal.nextPaymentDate && (
                  <div>
                    <div className="text-gray-500 text-sm">Next Payment Due</div>
                    <div className="text-gray-900">{new Date(showDetailsModal.nextPaymentDate).toLocaleDateString()}</div>
                  </div>
                )}
                <div className="text-gray-400 text-xs pt-2 border-t border-gray-100">
                  Applied: {new Date(showDetailsModal.createdAt).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Payment Schedule</h2>
                  <button onClick={() => setShowScheduleModal(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="overflow-y-auto max-h-[60vh]">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Payment</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Principal</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Interest</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {schedule.map((row) => (
                      <tr key={row.month} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-500">{row.month}</td>
                        <td className="px-4 py-3 text-gray-900">{new Date(row.paymentDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right text-gray-900 font-medium">${row.payment.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-green-600">${row.principal.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-amber-600">${row.interest.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-900">${row.remainingBalance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default LoansPage;
