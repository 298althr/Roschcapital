import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, MessageCircle, CheckCircle } from 'lucide-react';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import apiClient from '../lib/apiClient';

const SupportPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: '',
    category: 'ACCOUNT',
    priority: 'MEDIUM',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await apiClient.post('/support-tickets', formData);
      setSuccess(true);
      
      // Redirect to support tickets page after 2 seconds
      setTimeout(() => {
        navigate('/support-tickets');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create support ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (success) {
    return (
      <UserDashboardLayout>
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Ticket Created!</h2>
            <p className="text-slate-600 mb-6">
              Your support ticket has been created successfully. Our team will respond shortly.
            </p>
            <p className="text-sm text-slate-500">
              Redirecting to your tickets...
            </p>
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Support & Help</h2>
          <p className="text-sm text-slate-500 mt-1">
            Get help with your Rosch Capital Bank account, cards, payments, and profile.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Create Support Ticket</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Subject *</label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tell us briefly what you need help with"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">Category *</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ACCOUNT">Account & Profile</option>
                  <option value="CARD">Cards</option>
                  <option value="TRANSACTION">Payments & Transfers</option>
                  <option value="TECHNICAL">Login & Security</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-slate-600">Priority *</label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-600">Details *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={5}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                placeholder="Share as much detail as you can so we can assist you quickly."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-3 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Creating Ticket...' : 'Create Ticket'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-3 text-sm text-slate-600">
          <h3 className="text-sm font-semibold text-slate-900">Other ways to reach us</h3>
          <p>Email: <span className="font-mono">support@roschcapital.com</span></p>
          <p>Phone: <span className="font-mono">+44 0000 000 000</span></p>
          <p>Support hours: Monday – Friday, 9:00 – 17:00 (GMT)</p>
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default SupportPage;
