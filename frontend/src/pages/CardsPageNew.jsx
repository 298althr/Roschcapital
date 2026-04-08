import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import CardDisplay from '../components/cards/CardDisplay';
import CardCreationModal from '../components/modals/CardCreationModal';
import BackupCodeModal from '../components/modals/BackupCodeModal';
import CreditCardFundingModal from '../components/modals/CreditCardFundingModal';
import CardDetailsModal from '../components/modals/CardDetailsModal';
import { CreditCard, Plus, Loader2 } from 'lucide-react';

export const CardsPage = () => {
  const navigate = useNavigate();
  const [debitCards, setDebitCards] = useState([]);
  const [creditCards, setCreditCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBackupCodeModal, setShowBackupCodeModal] = useState(false);
  const [showFundingModal, setShowFundingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [selectedCardType, setSelectedCardType] = useState('debit');

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);

      const [debitRes, creditRes] = await Promise.all([
        apiClient.get('/cards/debit').catch(() => ({ success: true, cards: [] })),
        apiClient.get('/cards/credit').catch(() => ({ success: true, cards: [] }))
      ]);

      if (debitRes.success) setDebitCards(debitRes.cards || []);
      if (creditRes.success) setCreditCards(creditRes.cards || []);
    } catch (err) {
      console.error('Error fetching cards:', err);
      setError('Failed to load cards');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (card, type) => {
    setSelectedCard(card);
    setSelectedCardType(type);
    setShowDetailsModal(true);
  };

  const handleFreeze = async (card, type) => {
    try {
      await apiClient.post(`/cards/${type}/${card.id}/freeze`);
      fetchCards();
    } catch (err) {
      console.error('Error freezing card:', err);
      alert('Failed to freeze card');
    }
  };

  const handleUnfreeze = async (card, type) => {
    try {
      await apiClient.post(`/cards/${type}/${card.id}/unfreeze`);
      fetchCards();
    } catch (err) {
      console.error('Error unfreezing card:', err);
      alert('Failed to unfreeze card');
    }
  };

  const handleFund = (card) => {
    setSelectedCard(card);
    setShowFundingModal(true);
  };

  const totalCards = debitCards.length + creditCards.length;
  const activeCards = [...debitCards, ...creditCards].filter(c => c.isActive).length;
  const frozenCards = [...debitCards, ...creditCards].filter(c => c.isFrozen).length;

  return (
    <UserDashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">My Cards</h2>
            <p className="text-sm text-slate-500 mt-1">
              Manage your debit and credit cards
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Card
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500">Total Cards</p>
            <p className="text-2xl font-bold text-slate-900">{totalCards}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500">Active</p>
            <p className="text-2xl font-bold text-green-600">{activeCards}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500">Frozen</p>
            <p className="text-2xl font-bold text-blue-600">{frozenCards}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-sm text-slate-500">Inactive</p>
            <p className="text-2xl font-bold text-slate-400">{totalCards - activeCards}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        ) : totalCards === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No cards yet</h3>
            <p className="text-slate-500 mb-6">
              Create your first card to start managing your finances with Rosch Capital Bank
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Your First Card
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Debit Cards */}
            {debitCards.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Debit Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {debitCards.map(card => (
                    <CardDisplay
                      key={card.id}
                      card={card}
                      type="debit"
                      onViewDetails={(c) => handleViewDetails(c, 'debit')}
                      onFreeze={(c) => handleFreeze(c, 'debit')}
                      onUnfreeze={(c) => handleUnfreeze(c, 'debit')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Credit Cards */}
            {creditCards.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Credit Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {creditCards.map(card => (
                    <CardDisplay
                      key={card.id}
                      card={card}
                      type="credit"
                      onViewDetails={(c) => handleViewDetails(c, 'credit')}
                      onFreeze={(c) => handleFreeze(c, 'credit')}
                      onUnfreeze={(c) => handleUnfreeze(c, 'credit')}
                      onFund={handleFund}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <CardCreationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchCards();
        }}
      />

      <BackupCodeModal
        isOpen={showBackupCodeModal}
        onClose={() => {
          setShowBackupCodeModal(false);
          setSelectedCard(null);
        }}
        cardId={selectedCard?.id}
        cardType={selectedCardType}
      />

      <CreditCardFundingModal
        isOpen={showFundingModal}
        onClose={() => {
          setShowFundingModal(false);
          setSelectedCard(null);
        }}
        creditCard={selectedCard}
        onSuccess={() => {
          setShowFundingModal(false);
          fetchCards();
        }}
      />

      <CardDetailsModal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedCard(null);
        }}
        card={selectedCard}
        cardType={selectedCardType}
      />
    </UserDashboardLayout>
  );
};

export default CardsPage;
