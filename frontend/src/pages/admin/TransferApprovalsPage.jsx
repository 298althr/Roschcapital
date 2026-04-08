import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RotateCcw, Loader2, User, DollarSign, Calendar, Building } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const TransferApprovalsPage = () => {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState(''); // 'approve', 'decline', 'reverse'
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTransfers();
  }, []);

  const fetchTransfers = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/transfers/pending');
      if (response.success) {
        setTransfers(response.transfers || []);
      }
    } catch (err) {
      console.error('Error fetching transfers:', err);
      setError('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (transfer, actionType) => {
    setSelectedTransfer(transfer);
    setAction(actionType);
    setNotes('');
    setReason('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    try {
      let response;
      if (action === 'approve') {
        response = await apiClient.post(`/admin/transfers/${selectedTransfer.id}/approve`, { notes });
      } else if (action === 'decline') {
        response = await apiClient.post(`/admin/transfers/${selectedTransfer.id}/decline`, { reason });
      } else if (action === 'reverse') {
        response = await apiClient.post(`/admin/transfers/${selectedTransfer.id}/reverse`, { reason });
      }

      if (response.success) {
        setShowModal(false);
        setSelectedTransfer(null);
        fetchTransfers();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process transfer');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Transfer Approvals</h1>
        <p className="text-slate-400 mt-1">Review and approve pending transfer requests</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : transfers.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-12 text-center border border-slate-700">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">All Caught Up!</h3>
          <p className="text-slate-400">No pending transfer requests at this time</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {transfers.map(transfer => (
            <div key={transfer.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {transfer.user.firstName} {transfer.user.lastName}
                      </h3>
                      <p className="text-sm text-slate-400">{transfer.user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <DollarSign className="w-4 h-4" />
                        Amount
                      </div>
                      <p className="text-white font-semibold text-lg">
                        ${parseFloat(transfer.amount || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Building className="w-4 h-4" />
                        Destination Bank
                      </div>
                      <p className="text-white font-semibold text-sm">{transfer.destinationBank}</p>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <User className="w-4 h-4" />
                        Recipient
                      </div>
                      <p className="text-white font-semibold text-sm">{transfer.accountName}</p>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                        <Calendar className="w-4 h-4" />
                        Submitted
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {new Date(transfer.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-lg p-3 mb-4">
                    <p className="text-xs text-slate-400 mb-1">Reference</p>
                    <p className="text-white font-mono font-semibold">{transfer.reference}</p>
                  </div>

                  {transfer.description && (
                    <div className="bg-slate-900 rounded-lg p-3 mb-4">
                      <p className="text-xs text-slate-400 mb-1">Description</p>
                      <p className="text-white text-sm">{transfer.description}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      transfer.user.kycStatus === 'VERIFIED' 
                        ? 'bg-green-500/10 text-green-400' 
                        : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      KYC: {transfer.user.kycStatus}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400">
                      Available: ${parseFloat(transfer.account?.availableBalance || 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => handleAction(transfer, 'approve')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(transfer, 'decline')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    Decline
                  </button>
                  <button
                    onClick={() => handleAction(transfer, 'reverse')}
                    className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reverse
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedTransfer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-700">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">
                {action === 'approve' ? 'Approve Transfer' : action === 'decline' ? 'Decline Transfer' : 'Reverse Transfer'}
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {selectedTransfer.reference} - ${parseFloat(selectedTransfer.amount || 0).toFixed(2)}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {action === 'approve' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                    placeholder="Add any notes about this approval..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Reason <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white resize-none"
                    placeholder={`Explain why this transfer is being ${action}d...`}
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
                      : action === 'decline'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : (
                    action === 'approve' ? 'Approve' : action === 'decline' ? 'Decline' : 'Reverse'
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

export default TransferApprovalsPage;
