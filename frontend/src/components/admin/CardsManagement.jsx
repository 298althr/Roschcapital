import React, { useState, useEffect } from 'react';
import { CreditCard, Search, Edit, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '../../lib/apiClient';

export const CardsManagement = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userCards, setUserCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCard, setEditingCard] = useState(null);
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    creditLimit: '',
    availableCredit: '',
    currentBalance: '',
    status: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/mybanker/users');
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserCards = async (userId) => {
    try {
      setCardsLoading(true);
      console.log('Fetching cards for user:', userId);
      const response = await apiClient.get(`/mybanker/users/${userId}/cards`);
      console.log('User cards response:', response);
      console.log('Cards array:', response.cards);
      setUserCards(response.cards || []);
    } catch (error) {
      console.error('Failed to fetch user cards:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      setUserCards([]);
    } finally {
      setCardsLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    fetchUserCards(user.id);
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    // Decode card number for editing
    let decodedCardNumber = '';
    try {
      decodedCardNumber = atob(card.cardNumber);
    } catch (e) {
      decodedCardNumber = card.cardNumber;
    }
    
    setFormData({
      cardNumber: decodedCardNumber,
      expiryDate: card.expiryDate ? new Date(card.expiryDate).toISOString().split('T')[0] : '',
      creditLimit: card.creditLimit || '',
      availableCredit: card.availableCredit || '',
      currentBalance: card.currentBalance || '',
      status: card.status || 'ACTIVE'
    });
  };

  const handleUpdateCard = async () => {
    try {
      await apiClient.put(`/mybanker/cards/${editingCard.id}`, formData);
      alert('Card updated successfully');
      setEditingCard(null);
      fetchUserCards(selectedUser.id);
    } catch (error) {
      console.error('Failed to update card:', error);
      alert('Failed to update card');
    }
  };

  const handleToggleCardStatus = async (cardId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'ACTIVE' ? 'FROZEN' : 'ACTIVE';
      await apiClient.put(`/mybanker/cards/${cardId}`, { status: newStatus });
      fetchUserCards(selectedUser.id);
    } catch (error) {
      console.error('Failed to toggle card status:', error);
      alert('Failed to update card status');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.accountNumber?.includes(searchTerm)
  );

  const getCardTypeColor = (type) => {
    return type === 'CREDIT' ? 'text-purple-400' : 'text-blue-400';
  };

  const formatCardNumber = (encryptedNumber, cardType) => {
    try {
      if (!encryptedNumber) return '•••• •••• •••• ••••';
      const decoded = atob(encryptedNumber);
      const digitsOnly = decoded.replace(/\D/g, '');
      let lastFour = digitsOnly.slice(-4);
      if (lastFour.length < 4) {
        lastFour = Math.floor(1000 + Math.random() * 9000).toString();
      }
      const prefix = cardType === 'CREDIT' ? '5175' : '4062';
      return `${prefix} •••• •••• ${lastFour}`;
    } catch (error) {
      return '•••• •••• •••• ••••';
    }
  };

  const handleDeleteCard = async (cardId, cardType) => {
    if (!window.confirm('Are you sure you want to delete this card? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiClient.delete(`/mybanker/cards/${cardId}`);
      alert('Card deleted successfully');
      fetchUserCards(selectedUser.id);
    } catch (error) {
      console.error('Failed to delete card:', error);
      alert('Failed to delete card');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      ACTIVE: 'bg-green-500/20 text-green-400 border-green-800',
      FROZEN: 'bg-blue-500/20 text-blue-400 border-blue-800',
      PENDING: 'bg-yellow-500/20 text-yellow-400 border-yellow-800',
      DECLINED: 'bg-red-500/20 text-red-400 border-red-800'
    };
    return styles[status] || styles.ACTIVE;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Cards Management</h2>
        <p className="text-slate-400 text-sm">View and manage all user cards</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users List */}
        <div className="lg:col-span-1 bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedUser?.id === user.id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                    <span className="text-indigo-400 font-semibold">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Cards Display */}
        <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-lg p-6">
          {!selectedUser ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <CreditCard className="w-16 h-16 mb-4" />
              <p>Select a user to view their cards</p>
            </div>
          ) : cardsLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
            </div>
          ) : userCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <AlertCircle className="w-16 h-16 mb-4" />
              <p>No cards found for this user</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-4">
                {selectedUser.firstName} {selectedUser.lastName}'s Cards
              </h3>
              
              {userCards.map((card) => (
                <div
                  key={card.id}
                  className="bg-slate-700 border border-slate-600 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <CreditCard className={`w-6 h-6 ${getCardTypeColor(card.cardType)}`} />
                      <div>
                        <p className="font-semibold text-white">
                          {card.cardType} Card
                        </p>
                        <p className="text-sm text-slate-300 font-mono">
                          {formatCardNumber(card.cardNumber, card.cardType)}
                        </p>
                        <p className="text-xs text-slate-400">
                          {card.accountType} Account
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusBadge(card.status)}`}>
                      {card.status}
                    </span>
                  </div>

                  {card.cardType === 'CREDIT' ? (
                    <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-slate-400">Credit Limit</p>
                        <p className="text-white font-semibold">
                          ${parseFloat(card.creditLimit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Available Credit</p>
                        <p className="text-green-400 font-semibold">
                          ${parseFloat(card.availableCredit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Current Balance</p>
                        <p className="text-orange-400 font-semibold">
                          ${parseFloat(card.currentBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                      <div>
                        <p className="text-slate-400">Daily Limit</p>
                        <p className="text-white font-semibold">
                          ${parseFloat(card.dailyLimit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Monthly Limit</p>
                        <p className="text-white font-semibold">
                          ${parseFloat(card.monthlyLimit || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleEditCard(card)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit Details
                    </button>
                    <button
                      onClick={() => handleToggleCardStatus(card.id, card.status)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                        card.status === 'ACTIVE'
                          ? 'bg-orange-600 hover:bg-orange-700 text-white'
                          : 'bg-green-600 hover:bg-green-700 text-white'
                      }`}
                    >
                      {card.status === 'ACTIVE' ? (
                        <>
                          <X className="w-4 h-4" />
                          Freeze
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id, card.cardType)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                    >
                      <X className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-white mb-4">Edit Card Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Card Number (16 digits)
                </label>
                <input
                  type="text"
                  maxLength="16"
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value.replace(/\D/g, '') })}
                  placeholder="1234567890123456"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Current: {editingCard.cardType === 'CREDIT' ? '5175' : '4062'} •••• •••• {formData.cardNumber.slice(-4)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Credit Limit ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Available Credit ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.availableCredit}
                  onChange={(e) => setFormData({ ...formData, availableCredit: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Available Credit = Credit Limit - Current Balance
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="FROZEN">Frozen</option>
                  <option value="PENDING">Pending</option>
                  <option value="DECLINED">Declined</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdateCard}
                className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={() => setEditingCard(null)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardsManagement;
