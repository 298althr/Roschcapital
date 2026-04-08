import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, Check, X, Clock, Ban } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { PremiumModal } from '../modals/PremiumModal';

export const ChequeManagement = () => {
  const [cheques, setCheques] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null });

  useEffect(() => {
    fetchCheques();
  }, [filterStatus]);

  const fetchCheques = async () => {
    setIsLoading(true);
    try {
      const params = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await apiClient.get(`/cheques/admin/all${params}`);
      setCheques(response.cheques || []);
    } catch (error) {
      console.error('Failed to fetch cheques:', error);
    }
    setIsLoading(false);
  };

  const handleClearCheque = async (chequeId) => {
    setModal({
      isOpen: true,
      type: 'confirmation',
      title: 'Clear Cheque',
      message: 'Are you sure you want to clear this cheque? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await apiClient.post(`/cheques/admin/${chequeId}/clear`);
          setModal({ isOpen: true, type: 'success', title: 'Success', message: 'Cheque cleared successfully!', onConfirm: null });
          fetchCheques();
        } catch (error) {
          console.error('Failed to clear cheque:', error);
          setModal({ isOpen: true, type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to clear cheque. Please try again.', onConfirm: null });
        }
      }
    });
  };

  const handleBounceCheque = async (chequeId) => {
    setModal({
      isOpen: true,
      type: 'confirmation',
      title: 'Bounce Cheque',
      message: 'Are you sure you want to bounce this cheque? This will notify the user.',
      onConfirm: async () => {
        try {
          await apiClient.post(`/cheques/admin/${chequeId}/bounce`, { reason: 'Insufficient funds' });
          setModal({ isOpen: true, type: 'success', title: 'Success', message: 'Cheque bounced successfully!', onConfirm: null });
          fetchCheques();
        } catch (error) {
          console.error('Failed to bounce cheque:', error);
          setModal({ isOpen: true, type: 'error', title: 'Error', message: error.response?.data?.message || 'Failed to bounce cheque. Please try again.', onConfirm: null });
        }
      }
    });
  };

  const filteredCheques = cheques.filter(cheque => 
    cheque.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cheque.chequeNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cheque.payee?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      PENDING: 'bg-amber-500/20 text-amber-400 border-amber-800',
      CLEARED: 'bg-green-500/20 text-green-400 border-green-800',
      BOUNCED: 'bg-red-500/20 text-red-400 border-red-800',
      CANCELLED: 'bg-slate-500/20 text-slate-400 border-slate-800'
    };
    return styles[status] || styles.PENDING;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Cheque Management</h2>
          <p className="text-slate-400 text-sm">Manage and process cheques</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email, cheque number, or payee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="CLEARED">Cleared</option>
              <option value="BOUNCED">Bounced</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Cheques Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-900 border-b border-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Cheque #</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Payee</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Issued Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {filteredCheques.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No cheques found</p>
                </td>
              </tr>
            ) : (
              filteredCheques.map((cheque) => (
                <tr key={cheque.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{cheque.user?.firstName} {cheque.user?.lastName}</div>
                      <div className="text-slate-400 text-sm">{cheque.user?.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-mono text-sm">{cheque.chequeNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-300">{cheque.payee}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-semibold">${parseFloat(cheque.amount).toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusBadge(cheque.status)}`}>
                      {cheque.status === 'PENDING' && <Clock className="w-3 h-3" />}
                      {cheque.status === 'CLEARED' && <Check className="w-3 h-3" />}
                      {cheque.status === 'BOUNCED' && <X className="w-3 h-3" />}
                      {cheque.status === 'CANCELLED' && <Ban className="w-3 h-3" />}
                      {cheque.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400 text-sm">{new Date(cheque.issuedDate).toLocaleDateString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    {cheque.status === 'PENDING' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleClearCheque(cheque.id)}
                          className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => handleBounceCheque(cheque.id)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
                        >
                          Bounce
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Premium Modal */}
      <PremiumModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
      />
    </div>
  );
};

export default ChequeManagement;
