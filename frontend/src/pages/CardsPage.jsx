import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../lib/apiClient';
import CardDetailsComponent from '../components/CardDetailsComponent';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import { Modal } from '../components/ui/Modal';
import { ActionButton } from '../components/ui/ActionButton';
import { CreditCard, Plus, TrendingUp, TrendingDown, ArrowUpRight, Wallet, DollarSign, Clock, Eye, EyeOff, X } from 'lucide-react';

/**
 * CardsPage - Grid view of all user cards with creation and management options
 * Mobile-first, responsive design with light theme
 * Supports both Debit and Credit cards with distinct workflows
 */
export const CardsPage = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [cardStats, setCardStats] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [creating, setCreating] = useState(false);
  const [cardType, setCardType] = useState('DEBIT');
  const [createBackupCode, setCreateBackupCode] = useState(''); // DEBIT or CREDIT
  const [cardTransactions, setCardTransactions] = useState({});
  const [showRevealModal, setShowRevealModal] = useState(false);
  const [selectedCardForReveal, setSelectedCardForReveal] = useState(null);
  const [backupCode, setBackupCode] = useState('');
  const [revealedCardDetails, setRevealedCardDetails] = useState(null);
  const [revealError, setRevealError] = useState('');
  const [revealing, setRevealing] = useState(false);

  // Helper function to format card number with proper prefix
  const formatCardNumber = (encryptedNumber, cardType) => {
    try {
      if (!encryptedNumber) return '•••• •••• •••• ••••';
      // Decode base64 card number
      const decoded = atob(encryptedNumber);
      // Extract only digits from the decoded string
      const digitsOnly = decoded.replace(/\D/g, '');
      // Get last 4 digits, or generate random if not enough digits
      let lastFour = digitsOnly.slice(-4);
      if (lastFour.length < 4) {
        // Generate random 4 digits if we don't have enough
        lastFour = Math.floor(1000 + Math.random() * 9000).toString();
      }
      // Use 4062 prefix for debit, 5175 for credit
      const prefix = cardType === 'CREDIT' ? '5175' : '4062';
      return `${prefix} •••• •••• ${lastFour}`;
    } catch (error) {
      console.error('Error formatting card number:', error);
      return '•••• •••• •••• ••••';
    }
  };

  // Fetch all cards and stats
  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch combined debit and credit cards
      try {
        const cardsRes = await apiClient.get('/cards/all/combined');
        console.log('Cards response:', cardsRes);
        if (cardsRes.success && cardsRes.cards) {
          setCards(cardsRes.cards);
          
          // Fetch transactions for each card
          const transactionsPromises = cardsRes.cards.map(async (card) => {
            try {
              const txRes = await apiClient.get(`/cards/${card.id}/transactions?limit=3`);
              return { cardId: card.id, transactions: txRes.transactions || [] };
            } catch (err) {
              console.error(`Error fetching transactions for card ${card.id}:`, err);
              return { cardId: card.id, transactions: [] };
            }
          });
          
          const transactionsData = await Promise.all(transactionsPromises);
          const transactionsMap = {};
          transactionsData.forEach(({ cardId, transactions }) => {
            transactionsMap[cardId] = transactions;
          });
          setCardTransactions(transactionsMap);
        } else {
          setCards([]);
        }
      } catch (err) {
        console.error('Error fetching cards:', err);
        setCards([]);
      }

      // Fetch stats (optional)
      try {
        const statsRes = await apiClient.get('/cards/stats/overview');
        if (statsRes.success && statsRes.stats) {
          setCardStats(statsRes.stats);
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }

      // Fetch accounts
      try {
        const accountsRes = await apiClient.get('/accounts');
        if (accountsRes.success && accountsRes.accounts) {
          setAccounts(accountsRes.accounts);
          if (accountsRes.accounts.length > 0) {
            setSelectedAccount(accountsRes.accounts[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching accounts:', err);
      }
    } catch (err) {
      console.error('Error in fetchCards:', err);
      setCards([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = async (e) => {
    e.preventDefault();

    if (cardType === 'DEBIT' && !selectedAccount) {
      setError('Please select an account for debit card');
      return;
    }

    try {
      setCreating(true);
      
      let response;
      if (cardType === 'DEBIT') {
        response = await apiClient.post('/cards/debit', {
          accountId: selectedAccount,
          cardHolderName: 'ROSCH CAPITAL BANK',
          backupCode: createBackupCode
        });
      } else {
        // Credit card application
        response = await apiClient.post('/cards/credit/apply', {
          requestedLimit: 5000,
          cardHolderName: 'ROSCH CAPITAL BANK',
          backupCode: createBackupCode
        });
      }

      if (response.success) {
        // Refresh cards list
        await fetchCards();
        setShowCreateModal(false);
        setError(null);
        setCardType('DEBIT');
        setSelectedAccount('');
        setCreateBackupCode('');
      } else {
        setError('Failed to create card');
      }
    } catch (err) {
      console.error('Error creating card:', err);
      setError(err.response?.data?.error || 'Unable to create card');
    } finally {
      setCreating(false);
    }
  };

  // Reveal full card details with backup code verification
  const handleRevealCard = (card) => {
    setSelectedCardForReveal(card);
    setShowRevealModal(true);
    setBackupCode('');
    setRevealError('');
    setRevealedCardDetails(null);
  };

  const handleBackupCodeSubmit = async (e) => {
    e.preventDefault();
    setRevealing(true);
    setRevealError('');

    try {
      const response = await apiClient.post(`/cards/debit/${selectedCardForReveal.id}/reveal`, {
        backupCode: backupCode.trim()
      });

      if (response.success) {
        setRevealedCardDetails(response.card);
        setBackupCode('');
      }
    } catch (err) {
      console.error('Error revealing card:', err);
      setRevealError(err.response?.data?.error || 'Invalid backup code or card not found');
    } finally {
      setRevealing(false);
    }
  };

  const closeRevealModal = () => {
    setShowRevealModal(false);
    setSelectedCardForReveal(null);
    setBackupCode('');
    setRevealedCardDetails(null);
    setRevealError('');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + 
           ' • ' + date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  if (selectedCardId) {
    return (
      <UserDashboardLayout>
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Card details</h2>
            <p className="text-sm text-slate-500 mt-1">View limits, status and recent activity for this card.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <CardDetailsComponent
              cardId={selectedCardId}
              onBack={() => {
                setSelectedCardId(null);
                fetchCards();
              }}
            />
          </div>
        </div>
      </UserDashboardLayout>
    );
  }

import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

// ... inside the component
  if (loading && cards.length === 0) {
    return (
      <UserDashboardLayout>
        <LoadingSkeleton variant="premium" />
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">My cards</h2>
          <p className="text-sm text-slate-500 mt-1">Manage your debit and credit cards.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {/* Removed redundant inner loading check */}
        {/* Only show create button if user doesn't have both card types */}
        {(() => {
          const hasDebit = cards.some(c => c.cardType === 'DEBIT');
          const hasCredit = cards.some(c => c.cardType === 'CREDIT');
          const canCreateCard = !hasDebit || !hasCredit;
          
          return canCreateCard ? (
            <div>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white transition-colors"
              >
                + Create new card
              </button>
            </div>
          ) : null;
        })()}

        <Modal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setCardType('DEBIT');
            setSelectedAccount('');
          }}
          title="Create New Card"
          size="md"
        >
          <form onSubmit={handleCreateCard} className="space-y-5">
            {/* Card Type Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Card Type *
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCardType('DEBIT')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    cardType === 'DEBIT'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold text-neutral-900">Debit Card</div>
                    <div className="text-xs text-neutral-500 mt-1">Linked to account</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setCardType('CREDIT')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    cardType === 'CREDIT'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-lg font-semibold text-neutral-900">Credit Card</div>
                    <div className="text-xs text-neutral-500 mt-1">Requires approval</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Account Selection (only for Debit) */}
            {cardType === 'DEBIT' && (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Select Account *
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 text-sm"
                  required
                >
                  <option value="">Choose an account...</option>
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.accountNumber} - ${account.balance}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-neutral-500 mt-1.5">
                  The debit card will be linked to this account
                </p>
              </div>
            )}

            {/* Credit Card Info */}
            {cardType === 'CREDIT' && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900 font-medium mb-1">Credit Card Application</p>
                <p className="text-xs text-amber-700">
                  Your application will be reviewed by our banking team. You'll be notified once approved.
                </p>
              </div>
            )}

            {/* Auth Token */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Auth Token *
              </label>
              <input
                type="text"
                value={createBackupCode}
                onChange={(e) => setCreateBackupCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter 6-digit Auth Token"
                maxLength={6}
                className="w-full px-4 py-3 bg-white border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-neutral-900 text-sm text-center text-xl tracking-widest font-mono"
                required
              />
              <p className="text-xs text-neutral-500 mt-1.5">
                Enter one of your Auth Tokens to verify this action
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <ActionButton
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  setShowCreateModal(false);
                  setCardType('DEBIT');
                  setSelectedAccount('');
                  setCreateBackupCode('');
                }}
                fullWidth
              >
                Cancel
              </ActionButton>
              <ActionButton
                type="submit"
                variant="primary"
                size="lg"
                loading={creating}
                disabled={cardType === 'DEBIT' && !selectedAccount}
                fullWidth
              >
                {creating ? 'Creating...' : cardType === 'DEBIT' ? 'Create Debit Card' : 'Apply for Credit Card'}
              </ActionButton>
            </div>
          </form>
        </Modal>

        <div>
          {cards.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {cards.map((card) => {
                const transactions = cardTransactions[card.id] || [];
                const isCredit = card.cardType === 'CREDIT';
                const isPending = isCredit && card.approvalStatus === 'PENDING';
                
                return (
                  <div
                    key={card.id}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-neutral-100 hover:shadow-md transition-all"
                  >
                    {/* Card Type Badge */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isCredit 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}>
                        {isCredit ? 'CREDIT CARD' : 'DEBIT CARD'}
                      </span>
                      {isPending && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          PENDING APPROVAL
                        </span>
                      )}
                    </div>

                    {/* Realistic Card Visual - Using Template Image */}
                    <div className="flex items-start gap-4 mb-6">
                      <div 
                        className={`relative rounded-2xl overflow-hidden shadow-2xl ${isPending ? 'opacity-60' : ''}`}
                        style={{ 
                          width: '324px', 
                          height: '204px',
                          fontFamily: "'OCR A Std', 'OCR-A', 'Courier New', monospace"
                        }}
                      >
                        {/* Template background image with color filter for debit cards */}
                        <img 
                          src="/card-template.png" 
                          alt="Card Template" 
                          className="absolute inset-0 w-full h-full object-cover"
                          style={!isCredit ? { filter: 'hue-rotate(200deg) saturate(1.2)' } : {}}
                        />
                        
                        {/* Card type label - cover template's "Credit card" text for debit cards */}
                        {!isCredit && (
                          <>
                            {/* Background to cover the original "Credit card" text */}
                            <div 
                              className="absolute"
                              style={{ 
                                top: '8%', 
                                right: '4%',
                                width: '80px',
                                height: '20px',
                                background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a87 100%)',
                                borderRadius: '4px'
                              }}
                            />
                            {/* Debit card text */}
                            <div 
                              className="absolute text-white"
                              style={{ 
                                top: '8%', 
                                right: '5%',
                                fontSize: '12px',
                                letterSpacing: '0.05em',
                                fontWeight: '400',
                                fontFamily: "'OCR B Std', 'OCR-B', 'Courier New', monospace",
                                fontStyle: 'italic'
                              }}
                            >
                              Debit card
                            </div>
                          </>
                        )}
                        
                        {/* Card number - single line, positioned at 50% from top */}
                        <div 
                          className="absolute text-white whitespace-nowrap"
                          style={{ 
                            top: '50%', 
                            left: '6%',
                            fontSize: '16px',
                            letterSpacing: '0.14em',
                            fontWeight: '400',
                            fontFamily: "'OCR A Std', 'OCR-A', 'Courier New', monospace"
                          }}
                        >
                          {formatCardNumber(card.cardNumber, card.cardType)}
                        </div>
                        
                        {/* Expiry date - positioned next to template's VALID THRU */}
                        <div 
                          className="absolute text-white"
                          style={{ 
                            top: '66%', 
                            left: '68%',
                            fontSize: '15px',
                            letterSpacing: '0.08em',
                            fontWeight: '400',
                            fontFamily: "'OCR A Std', 'OCR-A', 'Courier New', monospace"
                          }}
                        >
                          {card.expiryDate ? new Date(card.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' }).replace('/', '/') : '12/30'}
                        </div>
                        
                        {/* Cardholder name - positioned at 84% from top */}
                        <div 
                          className="absolute text-white uppercase whitespace-nowrap"
                          style={{ 
                            top: '84%', 
                            left: '6%',
                            fontSize: '13px',
                            letterSpacing: '0.18em',
                            fontWeight: '400',
                            fontFamily: "'OCR A Std', 'OCR-A', 'Courier New', monospace"
                          }}
                        >
                          {card.cardHolderName || 'CARDHOLDER NAME'}
                        </div>
                        
                        {/* Frozen overlay */}
                        {card.isFrozen && (
                          <div className="absolute inset-0 bg-blue-900/70 flex items-center justify-center">
                            <span className="text-white text-lg font-bold tracking-wider">FROZEN</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Info Section */}
                    {isCredit ? (
                      // Credit Card Info
                      <div className="mb-6 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Credit Limit</p>
                            <p className="text-xl font-bold text-neutral-900">${parseFloat(card.creditLimit || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Available Credit</p>
                            <p className="text-xl font-bold text-emerald-600">${parseFloat(card.availableCredit || 0).toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">Current Balance</p>
                            <p className="text-lg font-semibold text-neutral-900">${parseFloat(card.currentBalance || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-neutral-500 mb-1">APR</p>
                            <p className="text-lg font-semibold text-neutral-900">{parseFloat(card.apr || 0).toFixed(2)}%</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Debit Card Info
                      <div className="mb-6">
                        <p className="text-sm text-neutral-500 mb-1">Daily Limit</p>
                        <p className="text-3xl font-bold text-neutral-900">${parseFloat(card.dailyLimit || 0).toFixed(2)}</p>
                        {card.account && (
                          <p className="text-xs text-neutral-500 mt-2">
                            Linked to: {card.account.accountNumber}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {/* Recent Transactions */}
                    {!isPending && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-sm font-semibold text-neutral-900">Recent Transactions</h3>
                        </div>
                        
                        {/* Transaction List */}
                        <div className="space-y-3">
                          {transactions.length > 0 ? (
                            transactions.map((tx) => (
                              <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors cursor-pointer">
                                <div className={`w-10 h-10 rounded-xl ${
                                  parseFloat(tx.amount) < 0 ? 'bg-red-50' : 'bg-green-50'
                                } flex items-center justify-center flex-shrink-0`}>
                                  <div className={`w-6 h-6 ${
                                    parseFloat(tx.amount) < 0 ? 'bg-red-500' : 'bg-green-500'
                                  } rounded-md flex items-center justify-center text-white text-xs font-bold`}>
                                    {tx.merchantName.charAt(0).toUpperCase()}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-neutral-900 truncate">{tx.merchantName}</p>
                                  <p className="text-xs text-neutral-500">{formatDate(tx.createdAt)}</p>
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-semibold ${
                                    parseFloat(tx.amount) < 0 ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {parseFloat(tx.amount) < 0 ? '-' : '+'}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-6 text-neutral-500 text-sm">
                              No transactions yet
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Card Status Badge */}
                    <div className="mt-4 pt-4 border-t border-neutral-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${card.isActive ? 'bg-emerald-500' : 'bg-neutral-400'}`}></span>
                          <span className="text-sm font-medium text-neutral-700">
                            {card.isActive ? 'Active' : 'Inactive'}
                          </span>
                          {card.isFrozen && (
                            <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              Frozen
                            </span>
                          )}
                        </div>
                        {!isPending && (
                          <button 
                            onClick={() => setSelectedCardId(card.id)}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700"
                          >
                            View Details →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 shadow-sm border border-neutral-100 text-center">
              <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-10 h-10 text-neutral-400" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No cards yet</h3>
              <p className="text-neutral-500 mb-6 max-w-sm mx-auto">
                Create your first card to start managing your finances with Rosch Capital Bank
              </p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-sm font-semibold text-white transition-all shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                Create your first card
              </button>
            </div>
          )}
        </div>

        {/* Reveal Card Details Modal */}
        {showRevealModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Reveal Card Details</h3>
                  <p className="text-sm text-slate-500 mt-1">Enter a backup code to view full card details</p>
                </div>
                <button
                  onClick={closeRevealModal}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {!revealedCardDetails ? (
                  // Backup Code Entry Form
                  <form onSubmit={handleBackupCodeSubmit} className="space-y-4">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">
                        <strong>Security Notice:</strong> This action will use one of your backup codes. Please have a backup code ready.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Backup Code *
                      </label>
                      <input
                        type="text"
                        value={backupCode}
                        onChange={(e) => setBackupCode(e.target.value)}
                        placeholder="Enter your backup code"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        required
                      />
                    </div>

                    {revealError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">{revealError}</p>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={closeRevealModal}
                        className="flex-1 px-4 py-3 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={revealing || !backupCode.trim()}
                        className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {revealing ? 'Verifying...' : 'Reveal Card'}
                      </button>
                    </div>
                  </form>
                ) : (
                  // Revealed Card Details
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800">
                        <strong>Success!</strong> Your card details are now visible. Please keep them secure.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Card Number</label>
                        <p className="text-lg font-mono font-bold text-slate-900">{revealedCardDetails.cardNumber}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">CVV</label>
                          <p className="text-lg font-mono font-bold text-slate-900">{revealedCardDetails.cvv}</p>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Expiry</label>
                          <p className="text-lg font-mono font-bold text-slate-900">
                            {new Date(revealedCardDetails.expiryDate).toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Card Holder</label>
                        <p className="text-lg font-bold text-slate-900">{revealedCardDetails.cardHolderName}</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Daily Limit</label>
                        <p className="text-lg font-bold text-slate-900">${parseFloat(revealedCardDetails.dailyLimit || 0).toFixed(2)}</p>
                      </div>
                    </div>

                    <button
                      onClick={closeRevealModal}
                      className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </UserDashboardLayout>
  );
};

export default CardsPage;
