import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, TrendingUp, RefreshCw } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const CurrencyManagement = () => {
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCurrency, setEditingCurrency] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    type: 'FIAT',
    exchangeRate: 1.0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    try {
      const response = await apiClient.get('/currencies');
      if (response.success) {
        setCurrencies(response.currencies || []);
      }
    } catch (err) {
      console.error('Failed to fetch currencies:', err);
      setError('Failed to load currencies');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingCurrency) {
        await apiClient.put(`/currencies/${editingCurrency.code}`, formData);
        setSuccess('Currency updated successfully');
      } else {
        await apiClient.post('/currencies', formData);
        setSuccess('Currency created successfully');
      }
      
      fetchCurrencies();
      handleCloseModal();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Are you sure you want to delete ${code}?`)) return;

    try {
      await apiClient.delete(`/currencies/${code}`);
      setSuccess('Currency deleted successfully');
      fetchCurrencies();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete currency');
    }
  };

  const handleUpdateRates = async () => {
    try {
      setLoading(true);
      await apiClient.post('/currencies/update-rates');
      setSuccess('Exchange rates updated successfully');
      fetchCurrencies();
    } catch (err) {
      setError('Failed to update rates');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (currency) => {
    setEditingCurrency(currency);
    setFormData({
      code: currency.code,
      name: currency.name,
      symbol: currency.symbol,
      type: currency.type,
      exchangeRate: currency.exchangeRate
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCurrency(null);
    setFormData({
      code: '',
      name: '',
      symbol: '',
      type: 'FIAT',
      exchangeRate: 1.0
    });
  };

  const getCurrencyTypeColor = (type) => {
    switch (type) {
      case 'CRYPTO':
        return 'bg-purple-100 text-purple-700';
      case 'FIAT':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Currency Management</h2>
          <p className="text-slate-400 mt-1">Manage currencies and exchange rates</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleUpdateRates}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Update Rates
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Currency
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Currencies Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Exchange Rate (to USD)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {currencies.map((currency) => (
              <tr key={currency.id} className="hover:bg-slate-700/30">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">{currency.code}</span>
                    {currency.isBase && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                        BASE
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                  {currency.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                  {currency.symbol}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getCurrencyTypeColor(currency.type)}`}>
                    {currency.type}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-slate-300">
                  {parseFloat(currency.exchangeRate || 0).toFixed(6)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    currency.isActive 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {currency.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(currency)}
                      className="p-2 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {!currency.isBase && (
                      <button
                        onClick={() => handleDelete(currency.code)}
                        className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {currencies.length === 0 && !loading && (
          <div className="text-center py-12">
            <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No currencies found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-white mb-4">
              {editingCurrency ? 'Edit Currency' : 'Add New Currency'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Currency Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., BTC, EUR"
                  maxLength="10"
                  disabled={!!editingCurrency}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Currency Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Bitcoin, Euro"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Symbol *
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="e.g., ₿, €"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Type *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  required
                >
                  <option value="FIAT">Fiat</option>
                  <option value="CRYPTO">Crypto</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Exchange Rate (to USD) *
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.exchangeRate}
                  onChange={(e) => setFormData({ ...formData, exchangeRate: parseFloat(e.target.value) })}
                  placeholder="1.0"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                  required
                />
                <p className="text-xs text-slate-400 mt-1">
                  1 {formData.code || 'XXX'} = {formData.exchangeRate} USD
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  {editingCurrency ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyManagement;
