import React, { useState, useEffect } from 'react';
import apiClient from '../lib/apiClient';
import CardManagementComponent from './CardManagementComponent';
import TransactionListComponent from './TransactionListComponent';

/**
 * CardDetailsComponent - Shows detailed information about a specific card
 * Mobile-first, responsive design with dark theme
 */
export const CardDetailsComponent = ({ cardId, onBack }) => {
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('management'); // 'management' or 'transactions'

  useEffect(() => {
    const fetchCardDetails = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get(`/cards/${cardId}`);

        if (response.success) {
          setCard(response.card);
        } else {
          setError('Failed to load card details');
        }
      } catch (err) {
        console.error('Error fetching card details:', err);
        setError('Unable to load card information');
      } finally {
        setLoading(false);
      }
    };

    fetchCardDetails();
  }, [cardId]);

  const handleCardUpdate = (updatedCard) => {
    setCard(updatedCard);
  };

  const handleCardDelete = (cardId) => {
    onBack();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  if (!card) {
    return (
      <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
        <p className="text-neutral-500">Card not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="text-primary-600 hover:text-primary-700 transition duration-200 flex items-center gap-2"
        >
          ← Back to Cards
        </button>
        <h2 className="text-2xl font-bold text-neutral-900">
          {card.cardType.charAt(0).toUpperCase() + card.cardType.slice(1).toLowerCase()} Card
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 bg-neutral-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('management')}
          className={`flex-1 py-2 px-4 rounded transition duration-200 font-semibold ${
            activeTab === 'management'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'bg-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Management
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex-1 py-2 px-4 rounded transition duration-200 font-semibold ${
            activeTab === 'transactions'
              ? 'bg-white text-primary-700 shadow-sm'
              : 'bg-transparent text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Transactions
        </button>
      </div>

      {/* Management Tab */}
      {activeTab === 'management' && (
        <CardManagementComponent
          card={card}
          onUpdate={handleCardUpdate}
          onDelete={handleCardDelete}
        />
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-neutral-900">Card Transactions</h3>
          {card.transactions && card.transactions.length > 0 ? (
            <div className="space-y-3">
              {card.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="bg-white border border-neutral-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-neutral-900 font-medium">{transaction.description}</p>
                      <p className="text-xs text-neutral-500">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        {transaction.type === 'debit' ? '-' : '+'}${parseFloat(transaction.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-neutral-500 capitalize">{transaction.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-8 text-center">
              <p className="text-neutral-500">No transactions for this card</p>
            </div>
          )}
        </div>
      )}

      {/* Account Info */}
      {card.account && (
        <div className="bg-white border border-neutral-200 rounded-lg p-4 space-y-3">
          <h3 className="text-lg font-bold text-neutral-900">Linked Account</h3>

          <div className="space-y-2">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <span className="text-neutral-500">Account Type</span>
              <span className="text-neutral-900 font-medium capitalize">
                {card.account.accountType}
              </span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
              <span className="text-neutral-500">Account Number</span>
              <span className="text-neutral-900 font-mono">••{card.account.accountNumber?.slice(-4)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Account Balance</span>
              <span className="text-neutral-900 font-bold text-lg">
                ${parseFloat(card.account.balance || 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CardDetailsComponent;
