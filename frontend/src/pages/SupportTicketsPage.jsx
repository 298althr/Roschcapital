import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Loader2, Send } from 'lucide-react';
import apiClient from '../lib/apiClient';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';

const SupportTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create ticket form
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      console.log('Fetching user support tickets...');
      const response = await apiClient.get('/support/tickets');
      console.log('User tickets response:', response);
      if (response.success) {
        setTickets(response.tickets || []);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
      console.error('Error response:', err.response);
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      console.log('Creating support ticket...');
      const response = await apiClient.post('/support/tickets', {
        subject,
        category,
        priority,
        message: description  // Backend expects 'message' field
      });

      console.log('Create ticket response:', response);

      if (response.success) {
        setSuccess('Support ticket created successfully!');
        setShowCreateModal(false);
        setSubject('');
        setCategory('GENERAL');
        setPriority('MEDIUM');
        setDescription('');
        fetchTickets();
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.error || 'Failed to create ticket. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedTicket?.id) return;

    setSending(true);
    setError('');
    try {
      console.log('Sending message to ticket:', selectedTicket.id);
      const response = await apiClient.post(`/support/tickets/${selectedTicket.id}/messages`, {
        message: newMessage.trim()
      });

      console.log('Send message response:', response);

      if (response.success) {
        setNewMessage('');
        // Refresh ticket to get updated messages
        const ticketResponse = await apiClient.get(`/support/tickets/${selectedTicket.id}`);
        console.log('Refreshed ticket:', ticketResponse);
        if (ticketResponse.success) {
          setSelectedTicket(ticketResponse.ticket);
          // Update in list
          setTickets(prev => prev.map(t => t.id === selectedTicket.id ? ticketResponse.ticket : t));
        }
      } else {
        setError('Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || 'Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      OPEN: 'bg-blue-100 text-blue-700',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-700',
      RESOLVED: 'bg-green-100 text-green-700',
      CLOSED: 'bg-slate-100 text-slate-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{status}</span>;
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      LOW: 'bg-slate-100 text-slate-700',
      MEDIUM: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-orange-100 text-orange-700',
      URGENT: 'bg-red-100 text-red-700'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority]}`}>{priority}</span>;
  };

  return (
    <UserDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Support Tickets</h2>
            <p className="text-sm text-slate-500 mt-1">Get help from our support team</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Ticket
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ticket List */}
            <div className="lg:col-span-1 space-y-3">
              {tickets.length === 0 ? (
                <div className="bg-white rounded-xl p-8 text-center border border-slate-200">
                  <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500">No tickets yet</p>
                </div>
              ) : (
                tickets.map(ticket => (
                  <button
                    key={ticket.id}
                    onClick={async () => {
                      try {
                        const response = await apiClient.get(`/support/tickets/${ticket.id}`);
                        if (response.success) {
                          setSelectedTicket(response.ticket);
                        }
                      } catch (err) {
                        console.error('Error fetching ticket details:', err);
                        setSelectedTicket(ticket); // Fallback to basic ticket
                      }
                    }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedTicket?.id === ticket.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-slate-900 text-sm">{ticket.subject}</p>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{ticket.reference}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Ticket Detail */}
            <div className="lg:col-span-2">
              {selectedTicket ? (
                <div className="bg-white rounded-xl border border-slate-200">
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-slate-900">{selectedTicket.subject}</h3>
                        <p className="text-sm text-slate-500 mt-1">{selectedTicket.reference}</p>
                      </div>
                      <div className="flex gap-2">
                        {getStatusBadge(selectedTicket.status)}
                        {getPriorityBadge(selectedTicket.priority)}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-4">
                      <p className="text-sm text-slate-700">{selectedTicket.description}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="p-6 max-h-96 overflow-y-auto space-y-4">
                    {selectedTicket.messages?.map(msg => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderType === 'ADMIN' ? 'justify-start' : 'justify-end'}`}
                      >
                        <div className={`max-w-md ${msg.senderType === 'ADMIN' ? 'bg-slate-100' : 'bg-blue-100'} rounded-lg p-4`}>
                          <p className="text-xs font-medium text-slate-600 mb-1">
                            {msg.senderType === 'ADMIN' ? 'Support Team' : 'You'}
                          </p>
                          <p className="text-sm text-slate-900">{msg.message}</p>
                          <p className="text-xs text-slate-500 mt-2">
                            {new Date(msg.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply */}
                  {selectedTicket.status !== 'CLOSED' && (
                    <form onSubmit={sendMessage} className="p-6 border-t border-slate-200">
                      <div className="flex gap-3">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={sending || !newMessage.trim()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
                  <MessageSquare className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-500">Select a ticket to view details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900">Create Support Ticket</h2>
            </div>

            <form onSubmit={createTicket} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="GENERAL">General</option>
                    <option value="ACCOUNT">Account</option>
                    <option value="TRANSACTION">Transaction</option>
                    <option value="CARD">Card</option>
                    <option value="TECHNICAL">Technical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </UserDashboardLayout>
  );
};

export default SupportTicketsPage;
