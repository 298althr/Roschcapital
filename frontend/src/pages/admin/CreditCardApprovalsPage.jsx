import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, User, DollarSign, Calendar } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const CreditCardApprovalsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState(''); // 'approve' or 'decline'
  const [approvedLimit, setApprovedLimit] = useState('');
  const [apr, setApr] = useState('18.99');
  const [declineReason, setDeclineReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/cards/credit/pending');
      if (response.success) {
        setApplications(response.applications || []);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (app) => {
    setSelectedApp(app);
    setApprovedLimit(app.requestedLimit.toString());
    setApr('18.99');
    setAction('approve');
    setShowModal(true);
  };

  const handleDecline = (app) => {
    setSelectedApp(app);
    setDeclineReason('');
    setAction('decline');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      if (action === 'approve') {
        await apiClient.post(`/admin/cards/credit/${selectedApp.id}/approve`, {
          approvedLimit: parseFloat(approvedLimit),
          apr: parseFloat(apr)
        });
      } else {
        await apiClient.post(`/admin/cards/credit/${selectedApp.id}/decline`, {
          reason: declineReason
        });
      }

      setShowModal(false);
      setSelectedApp(null);
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process application');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Credit Card Applications</h1>
        <p className="text-slate-400 mt-1">Review and approve pending credit card applications</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
          <p className="text-slate-400">
            No pending credit card applications at this time
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {applications.map(app => (
            <div key={app.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {app.user.firstName} {app.user.lastName}
                      </h3>
                      <p className="text-sm text-slate-400">{app.user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <DollarSign className="w-4 h-4" />
                        Requested Limit
                      </div>
                      <p className="text-white font-semibold text-lg">
                        ${app.requestedLimit.toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <User className="w-4 h-4" />
                        Card Holder
                      </div>
                      <p className="text-white font-semibold">{app.cardHolderName}</p>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Calendar className="w-4 h-4" />
                        Applied
                      </div>
                      <p className="text-white font-semibold">
                        {new Date(app.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      app.user.kycStatus === 'VERIFIED' 
                        ? 'bg-green-500/10 text-green-400' 
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      KYC: {app.user.kycStatus}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleApprove(app)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleDecline(app)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval/Decline Modal */}
      {showModal && selectedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">
                {action === 'approve' ? 'Approve Application' : 'Decline Application'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {selectedApp.user.firstName} {selectedApp.user.lastName}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {action === 'approve' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Approved Credit Limit <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                      <input
                        type="number"
                        value={approvedLimit}
                        onChange={(e) => setApprovedLimit(e.target.value)}
                        min="1000"
                        max="50000"
                        step="100"
                        className="w-full pl-8 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                        required
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Requested: ${selectedApp.requestedLimit.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      APR (%) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      value={apr}
                      onChange={(e) => setApr(e.target.value)}
                      min="0"
                      max="99.99"
                      step="0.01"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white"
                      required
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Decline Reason <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                    placeholder="Explain why this application is being declined..."
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                  disabled={processing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                    action === 'approve' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    action === 'approve' ? 'Approve' : 'Decline'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCardApprovalsPage;
