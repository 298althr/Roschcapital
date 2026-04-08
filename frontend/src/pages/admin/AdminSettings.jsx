import React, { useState } from 'react';
import { Settings, Shield, Bell, Mail, Globe, Lock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const AdminSettings = () => {
  const [settings, setSettings] = useState({
    // Security Settings
    twoFactorRequired: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    transactionAlerts: true,
    securityAlerts: true,
    
    // Platform Settings
    maintenanceMode: false,
    allowNewRegistrations: true,
    kycRequired: true,
    autoApproveAccounts: false,
    
    // Transaction Limits
    dailyTransferLimit: 50000,
    singleTransactionLimit: 10000,
    withdrawalLimit: 5000
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await apiClient.post('/mybanker/settings', settings);
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-lg">
              <Settings className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Admin Settings</h2>
              <p className="text-slate-400 text-sm">Configure platform settings and preferences</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {success && (
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-400 text-sm">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Security Settings */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          Security Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-300">Two-Factor Authentication Required</label>
              <p className="text-xs text-slate-400 mt-1">Require 2FA for all admin accounts</p>
            </div>
            <input
              type="checkbox"
              name="twoFactorRequired"
              checked={settings.twoFactorRequired}
              onChange={handleChange}
              className="w-5 h-5 bg-slate-700 border-slate-600 rounded text-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Session Timeout (minutes)
              </label>
              <input
                type="number"
                name="sessionTimeout"
                value={settings.sessionTimeout}
                onChange={handleChange}
                min="5"
                max="120"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                name="maxLoginAttempts"
                value={settings.maxLoginAttempts}
                onChange={handleChange}
                min="3"
                max="10"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Password Min Length
              </label>
              <input
                type="number"
                name="passwordMinLength"
                value={settings.passwordMinLength}
                onChange={handleChange}
                min="6"
                max="20"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-amber-400" />
          Notification Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-300">Email Notifications</label>
              <p className="text-xs text-slate-400 mt-1">Send email alerts for important events</p>
            </div>
            <input
              type="checkbox"
              name="emailNotifications"
              checked={settings.emailNotifications}
              onChange={handleChange}
              className="w-5 h-5 bg-slate-700 border-slate-600 rounded text-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-300">SMS Notifications</label>
              <p className="text-xs text-slate-400 mt-1">Send SMS alerts for critical events</p>
            </div>
            <input
              type="checkbox"
              name="smsNotifications"
              checked={settings.smsNotifications}
              onChange={handleChange}
              className="w-5 h-5 bg-slate-700 border-slate-600 rounded text-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-300">Transaction Alerts</label>
              <p className="text-xs text-slate-400 mt-1">Alert on large or suspicious transactions</p>
            </div>
            <input
              type="checkbox"
              name="transactionAlerts"
              checked={settings.transactionAlerts}
              onChange={handleChange}
              className="w-5 h-5 bg-slate-700 border-slate-600 rounded text-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-300">Security Alerts</label>
              <p className="text-xs text-slate-400 mt-1">Alert on security events and breaches</p>
            </div>
            <input
              type="checkbox"
              name="securityAlerts"
              checked={settings.securityAlerts}
              onChange={handleChange}
              className="w-5 h-5 bg-slate-700 border-slate-600 rounded text-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Platform Settings */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5 text-green-400" />
          Platform Settings
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-300">Maintenance Mode</label>
              <p className="text-xs text-slate-400 mt-1">Temporarily disable user access</p>
            </div>
            <input
              type="checkbox"
              name="maintenanceMode"
              checked={settings.maintenanceMode}
              onChange={handleChange}
              className="w-5 h-5 bg-slate-700 border-slate-600 rounded text-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-300">Allow New Registrations</label>
              <p className="text-xs text-slate-400 mt-1">Enable new user sign-ups</p>
            </div>
            <input
              type="checkbox"
              name="allowNewRegistrations"
              checked={settings.allowNewRegistrations}
              onChange={handleChange}
              className="w-5 h-5 bg-slate-700 border-slate-600 rounded text-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-300">KYC Required</label>
              <p className="text-xs text-slate-400 mt-1">Require KYC verification for full access</p>
            </div>
            <input
              type="checkbox"
              name="kycRequired"
              checked={settings.kycRequired}
              onChange={handleChange}
              className="w-5 h-5 bg-slate-700 border-slate-600 rounded text-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-300">Auto-Approve Accounts</label>
              <p className="text-xs text-slate-400 mt-1">Automatically approve new accounts (not recommended)</p>
            </div>
            <input
              type="checkbox"
              name="autoApproveAccounts"
              checked={settings.autoApproveAccounts}
              onChange={handleChange}
              className="w-5 h-5 bg-slate-700 border-slate-600 rounded text-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Transaction Limits */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-purple-400" />
          Transaction Limits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Daily Transfer Limit ($)
            </label>
            <input
              type="number"
              name="dailyTransferLimit"
              value={settings.dailyTransferLimit}
              onChange={handleChange}
              min="1000"
              step="1000"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Single Transaction Limit ($)
            </label>
            <input
              type="number"
              name="singleTransactionLimit"
              value={settings.singleTransactionLimit}
              onChange={handleChange}
              min="500"
              step="500"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Withdrawal Limit ($)
            </label>
            <input
              type="number"
              name="withdrawalLimit"
              value={settings.withdrawalLimit}
              onChange={handleChange}
              min="500"
              step="500"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
