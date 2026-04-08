import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Wallet, CreditCard, DollarSign, Globe } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import { PremiumModal } from '../../components/modals/PremiumModal';

export const GatewayManagement = () => {
  const [gateways, setGateways] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGateway, setEditingGateway] = useState(null);
  const [modal, setModal] = useState({ isOpen: false, type: 'success', title: '', message: '', onConfirm: null });

  const [formData, setFormData] = useState({
    name: '',
    type: 'CRYPTO',
    walletAddress: '',
    network: '',
    accountEmail: '',
    accountId: '',
    instructions: '',
    minAmount: '',
    maxAmount: '',
    processingTime: '',
    displayOrder: 0,
    isActive: true,
    qrCode: null
  });

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/gateways/admin');
      if (response.success) {
        setGateways(response.gateways || []);
      }
    } catch (error) {
      console.error('Failed to fetch gateways:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: 'Failed to load payment gateways',
        onConfirm: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        if (key === 'qrCode' && formData[key] instanceof File) {
          data.append('qrCode', formData[key]);
        } else {
          data.append(key, formData[key]);
        }
      }
    });

    try {
      if (editingGateway) {
        // Don't set Content-Type - browser will set it automatically with boundary for FormData
        await apiClient.put(`/gateways/${editingGateway.id}`, data);
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Gateway updated successfully!',
          onConfirm: null
        });
      } else {
        // Don't set Content-Type - browser will set it automatically with boundary for FormData
        await apiClient.post('/gateways', data);
        setModal({
          isOpen: true,
          type: 'success',
          title: 'Success',
          message: 'Gateway created successfully!',
          onConfirm: null
        });
      }
      
      setShowForm(false);
      setEditingGateway(null);
      resetForm();
      fetchGateways();
    } catch (error) {
      console.error('Failed to save gateway:', error);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: error.response?.data?.error || 'Failed to save gateway',
        onConfirm: null
      });
    }
  };

  const handleEdit = (gateway) => {
    setEditingGateway(gateway);
    setFormData({
      name: gateway.name || '',
      type: gateway.type || 'CRYPTO',
      walletAddress: gateway.walletAddress || '',
      network: gateway.network || '',
      accountEmail: gateway.accountEmail || '',
      accountId: gateway.accountId || '',
      instructions: gateway.instructions || '',
      minAmount: gateway.minAmount || '',
      maxAmount: gateway.maxAmount || '',
      processingTime: gateway.processingTime || '',
      displayOrder: gateway.displayOrder || 0,
      isActive: gateway.isActive,
      qrCode: null
    });
    setShowForm(true);
  };

  const handleDelete = (gateway) => {
    setModal({
      isOpen: true,
      type: 'confirmation',
      title: 'Delete Gateway',
      message: `Are you sure you want to delete "${gateway.name}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await apiClient.delete(`/gateways/${gateway.id}`);
          setModal({
            isOpen: true,
            type: 'success',
            title: 'Success',
            message: 'Gateway deleted successfully!',
            onConfirm: null
          });
          fetchGateways();
        } catch (error) {
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: 'Failed to delete gateway',
            onConfirm: null
          });
        }
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'CRYPTO',
      walletAddress: '',
      network: '',
      accountEmail: '',
      accountId: '',
      instructions: '',
      minAmount: '',
      maxAmount: '',
      processingTime: '',
      displayOrder: 0,
      isActive: true,
      qrCode: null
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'CRYPTO': return <Wallet className="w-5 h-5" />;
      case 'PAYPAL': return <DollarSign className="w-5 h-5" />;
      case 'BANK': return <CreditCard className="w-5 h-5" />;
      default: return <Globe className="w-5 h-5" />;
    }
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
          <h1 className="text-2xl font-bold text-white">Payment Gateways</h1>
          <p className="text-slate-400 mt-1">Configure payment methods for deposits</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setEditingGateway(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
        >
          <Plus className="w-5 h-5" />
          Add Gateway
        </button>
      </div>

      {/* Gateway Form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            {editingGateway ? 'Edit Gateway' : 'Add New Gateway'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Gateway Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Bitcoin, PayPal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="CRYPTO">Cryptocurrency</option>
                  <option value="PAYPAL">PayPal</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="CHECK">Check</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {formData.type === 'CRYPTO' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Wallet Address
                  </label>
                  <input
                    type="text"
                    name="walletAddress"
                    value={formData.walletAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter blockchain wallet address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Network
                  </label>
                  <input
                    type="text"
                    name="network"
                    value={formData.network}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., BTC, ETH, USDT-TRC20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    QR Code Image
                  </label>
                  <input
                    type="file"
                    name="qrCode"
                    onChange={handleInputChange}
                    accept="image/*"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            {(formData.type === 'PAYPAL' || formData.type === 'OTHER') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Account Email
                  </label>
                  <input
                    type="email"
                    name="accountEmail"
                    value={formData.accountEmail}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Account ID
                  </label>
                  <input
                    type="text"
                    name="accountId"
                    value={formData.accountId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="Account or Merchant ID"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Instructions for Users
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                placeholder="Provide payment instructions..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Min Amount
                </label>
                <input
                  type="number"
                  name="minAmount"
                  value={formData.minAmount}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Max Amount
                </label>
                <input
                  type="number"
                  name="maxAmount"
                  value={formData.maxAmount}
                  onChange={handleInputChange}
                  step="0.01"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  name="displayOrder"
                  value={formData.displayOrder}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Processing Time
              </label>
              <input
                type="text"
                name="processingTime"
                value={formData.processingTime}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Instant, 1-3 business days"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 rounded focus:ring-indigo-500"
              />
              <label className="text-sm font-medium text-slate-300">
                Active (visible to users)
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                type="submit"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
              >
                {editingGateway ? 'Update Gateway' : 'Create Gateway'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingGateway(null);
                  resetForm();
                }}
                className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Gateways List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gateways.map((gateway) => (
          <div
            key={gateway.id}
            className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:border-indigo-500 transition"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-400">
                  {getTypeIcon(gateway.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{gateway.name}</h3>
                  <p className="text-sm text-slate-400">{gateway.type}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                gateway.isActive
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-slate-500/20 text-slate-400'
              }`}>
                {gateway.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {gateway.walletAddress && (
              <div className="mb-2">
                <p className="text-xs text-slate-400">Wallet Address</p>
                <p className="text-sm text-white font-mono truncate">{gateway.walletAddress}</p>
              </div>
            )}

            {gateway.network && (
              <div className="mb-2">
                <p className="text-xs text-slate-400">Network</p>
                <p className="text-sm text-white">{gateway.network}</p>
              </div>
            )}

            {gateway.qrCodePath && (
              <div className="mb-2">
                <p className="text-xs text-slate-400">QR Code</p>
                <img 
                  src={gateway.qrCodePath} 
                  alt="QR Code" 
                  className="w-20 h-20 mt-1 rounded border border-slate-600"
                />
              </div>
            )}

            {gateway.accountEmail && (
              <div className="mb-2">
                <p className="text-xs text-slate-400">Account Email</p>
                <p className="text-sm text-white">{gateway.accountEmail}</p>
              </div>
            )}

            {(gateway.minAmount || gateway.maxAmount) && (
              <div className="mb-2">
                <p className="text-xs text-slate-400">Limits</p>
                <p className="text-sm text-white">
                  ${gateway.minAmount || '0'} - ${gateway.maxAmount || '∞'}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
              <button
                onClick={() => handleEdit(gateway)}
                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm transition"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(gateway)}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {gateways.length === 0 && !showForm && (
        <div className="text-center py-12">
          <Wallet className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No Payment Gateways</h3>
          <p className="text-slate-500 mb-4">Add your first payment gateway to start accepting deposits</p>
          <button
            onClick={() => {
              resetForm();
              setEditingGateway(null);
              setShowForm(true);
            }}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
          >
            Add Gateway
          </button>
        </div>
      )}

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

export default GatewayManagement;
