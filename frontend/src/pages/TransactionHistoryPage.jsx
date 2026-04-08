import React, { useEffect, useState, useMemo } from 'react';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import apiClient from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { Search, Filter, Download, ArrowUpRight, ArrowDownLeft, Calendar, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp, FileText, Loader2 } from 'lucide-react';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

const PAGE_SIZE = 15;

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'SALARY', label: 'Salary & Income' },
  { value: 'CONTRACTOR', label: 'Contractor Payment' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'INTEREST', label: 'Interest' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'TAX_REFUND', label: 'Tax Refund' },
  { value: 'HOUSING', label: 'Housing' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'GROCERIES', label: 'Groceries' },
  { value: 'TRANSPORTATION', label: 'Transportation' },
  { value: 'DINING', label: 'Dining' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'INSURANCE', label: 'Insurance' },
  { value: 'SHOPPING', label: 'Shopping' },
  { value: 'LOAN_PAYMENT', label: 'Loan Payment' },
];

// Merchant logo mapping based on description keywords
const MERCHANT_LOGOS = {
  // Streaming & Entertainment
  'netflix': 'https://assets.nflxext.com/us/ffe/siteui/common/icons/nficon2016.ico',
  'spotify': 'https://www.scdn.co/i/_global/favicon.png',
  'hulu': 'https://www.hulu.com/favicon.ico',
  'disney': 'https://static-assets.bamgrid.com/product/disneyplus/favicons/favicon-32x32.png',
  'amazon prime': 'https://www.amazon.com/favicon.ico',
  'hbo': 'https://www.max.com/favicon.ico',
  'youtube': 'https://www.youtube.com/s/desktop/favicon.ico',
  // Insurance
  'state farm': 'https://www.statefarm.com/favicon.ico',
  'geico': 'https://www.geico.com/favicon.ico',
  'progressive': 'https://www.progressive.com/favicon.ico',
  'allstate': 'https://www.allstate.com/favicon.ico',
  // Utilities
  'spectrum': 'https://www.spectrum.com/favicon.ico',
  'at&t': 'https://www.att.com/favicon.ico',
  'verizon': 'https://www.verizon.com/favicon.ico',
  'comcast': 'https://www.xfinity.com/favicon.ico',
  'ameren': 'https://www.ameren.com/favicon.ico',
  // Groceries
  'walmart': 'https://www.walmart.com/favicon.ico',
  'costco': 'https://www.costco.com/favicon.ico',
  'kroger': 'https://www.kroger.com/favicon.ico',
  'aldi': 'https://www.aldi.us/favicon.ico',
  'target': 'https://www.target.com/favicon.ico',
  'whole foods': 'https://www.wholefoodsmarket.com/favicon.ico',
  // Gas Stations
  'shell': 'https://www.shell.com/favicon.ico',
  'bp': 'https://www.bp.com/favicon.ico',
  'exxon': 'https://www.exxon.com/favicon.ico',
  'chevron': 'https://www.chevron.com/favicon.ico',
  // Dining
  'mcdonalds': 'https://www.mcdonalds.com/favicon.ico',
  'starbucks': 'https://www.starbucks.com/favicon.ico',
  'chipotle': 'https://www.chipotle.com/favicon.ico',
  'olive garden': 'https://www.olivegarden.com/favicon.ico',
  'panera': 'https://www.panerabread.com/favicon.ico',
  'doordash': 'https://www.doordash.com/favicon.ico',
  // Shopping
  'amazon': 'https://www.amazon.com/favicon.ico',
  'ebay': 'https://www.ebay.com/favicon.ico',
  'best buy': 'https://www.bestbuy.com/favicon.ico',
  'home depot': 'https://www.homedepot.com/favicon.ico',
  'avasflowers': 'https://www.avasflowers.net/favicon.ico',
  // Contractor
  'conocophillips': 'https://www.conocophillips.com/favicon.ico',
  'exxonmobil': 'https://corporate.exxonmobil.com/favicon.ico',
  'halliburton': 'https://www.halliburton.com/favicon.ico',
};

const getMerchantLogo = (description) => {
  if (!description) return null;
  const descLower = description.toLowerCase();
  for (const [keyword, logo] of Object.entries(MERCHANT_LOGOS)) {
    if (descLower.includes(keyword)) {
      return logo;
    }
  }
  return null;
};

const getCategoryIcon = (category) => {
  const icons = {
    SALARY: '💼', CONTRACTOR: '🏗️', INVESTMENT: '📈', INTEREST: '🏦', FREELANCE: '💻',
    TAX_REFUND: '📋', HOUSING: '🏠', UTILITIES: '💡', GROCERIES: '🛒', TRANSPORTATION: '🚗',
    DINING: '🍽️', ENTERTAINMENT: '🎬', INSURANCE: '🛡️', SHOPPING: '🛍️', LOAN_PAYMENT: '💳',
  };
  return icons[category] || '💰';
};

const getCategoryColor = (category) => {
  const colors = {
    SALARY: 'bg-emerald-100 text-emerald-700', CONTRACTOR: 'bg-blue-100 text-blue-700',
    INVESTMENT: 'bg-purple-100 text-purple-700', INTEREST: 'bg-cyan-100 text-cyan-700',
    FREELANCE: 'bg-indigo-100 text-indigo-700', TAX_REFUND: 'bg-green-100 text-green-700',
    HOUSING: 'bg-orange-100 text-orange-700', UTILITIES: 'bg-yellow-100 text-yellow-700',
    GROCERIES: 'bg-lime-100 text-lime-700', TRANSPORTATION: 'bg-sky-100 text-sky-700',
    DINING: 'bg-rose-100 text-rose-700', ENTERTAINMENT: 'bg-pink-100 text-pink-700',
    INSURANCE: 'bg-slate-100 text-slate-700', SHOPPING: 'bg-fuchsia-100 text-fuchsia-700',
    LOAN_PAYMENT: 'bg-red-100 text-red-700',
  };
  return colors[category] || 'bg-gray-100 text-gray-700';
};

const TransactionHistoryPage = () => {
  const { user } = useAuth();
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState(''); // '', 'credit', 'debit'
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  
  // Receipt download state
  const [expandedId, setExpandedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchAllTransactions = async () => {
      try {
        setLoading(true);
        setError('');
        
        const data = await apiClient.get(`/transactions?limit=1000&offset=0`);
        const transactions = Array.isArray(data?.transactions) ? data.transactions : [];

        const mapped = transactions.map((tx) => {
          const amountNumber = Math.abs(Number(tx.amount || 0));
          const txType = tx.type?.toUpperCase() || '';
          const isDebit = ['DEBIT', 'WITHDRAWAL', 'PAYMENT', 'TRANSFER'].includes(txType) || Number(tx.amount) < 0;

          return {
            id: tx.id,
            date: tx.createdAt,
            description: tx.description || tx.category || 'Transaction',
            accountNumber: tx.account?.accountNumber || '',
            category: tx.category || 'GENERAL',
            type: isDebit ? 'debit' : 'credit',
            amount: amountNumber,
            currency: tx.account?.currency || 'USD',
            merchantName: tx.merchantName || '',
            reference: tx.reference || '',
            status: tx.status || 'COMPLETED',
          };
        });

        setAllRows(mapped);
      } catch (err) {
        console.error('Error loading transactions:', err);
        setError('Unable to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    fetchAllTransactions();
  }, []);

  if (loading && allRows.length === 0) {
    return (
      <UserDashboardLayout>
        <LoadingSkeleton variant="premium" />
      </UserDashboardLayout>
    );
  }

  // Filter and search logic
  const filteredRows = useMemo(() => {
    return allRows.filter((row) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          row.description.toLowerCase().includes(search) ||
          row.merchantName?.toLowerCase().includes(search) ||
          row.category.toLowerCase().includes(search) ||
          row.reference?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (typeFilter && row.type !== typeFilter) return false;

      // Category filter
      if (categoryFilter && row.category !== categoryFilter) return false;

      // Date range filter
      if (dateRange.start) {
        const rowDate = new Date(row.date);
        const startDate = new Date(dateRange.start);
        if (rowDate < startDate) return false;
      }
      if (dateRange.end) {
        const rowDate = new Date(row.date);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (rowDate > endDate) return false;
      }

      return true;
    });
  }, [allRows, searchTerm, typeFilter, categoryFilter, dateRange]);

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / PAGE_SIZE);
  const paginatedRows = filteredRows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Stats
  const stats = useMemo(() => {
    const credits = filteredRows.filter(r => r.type === 'credit');
    const debits = filteredRows.filter(r => r.type === 'debit');
    return {
      totalTransactions: filteredRows.length,
      totalCredits: credits.reduce((sum, r) => sum + r.amount, 0),
      totalDebits: debits.reduce((sum, r) => sum + r.amount, 0),
      creditCount: credits.length,
      debitCount: debits.length,
    };
  }, [filteredRows]);

  const formatDate = (value) => {
    if (!value) return '--';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '--';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatAmount = (value) => {
    return Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter('');
    setCategoryFilter('');
    setDateRange({ start: '', end: '' });
    setPage(0);
  };

  const hasActiveFilters = searchTerm || typeFilter || categoryFilter || dateRange.start || dateRange.end;

  // Handle receipt download
  const handleDownloadReceipt = async (transactionId) => {
    try {
      setDownloadingId(transactionId);
      const token = localStorage.getItem('accessToken');
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://gatwickbank-production.up.railway.app/api/v1';
      
      const response = await fetch(`${apiBaseUrl}/transactions/${transactionId}/receipt`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to download receipt');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `RoschCapital_Receipt_${transactionId}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading receipt:', err);
      alert('Failed to download receipt. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <UserDashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
            <p className="text-slate-500 mt-1">View and manage all your account transactions</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors">
            <Download className="w-4 h-4" />
            Export Statement
          </button>
        </div>


        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="p-4 border-b border-slate-100">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex gap-2">
                <button
                  onClick={() => { setTypeFilter(typeFilter === 'credit' ? '' : 'credit'); setPage(0); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    typeFilter === 'credit' 
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4 inline mr-1" />
                  Income
                </button>
                <button
                  onClick={() => { setTypeFilter(typeFilter === 'debit' ? '' : 'debit'); setPage(0); }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    typeFilter === 'debit' 
                      ? 'bg-red-100 text-red-700 border-2 border-red-300' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4 inline mr-1" />
                  Expenses
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                    showFilters ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">From Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => { setDateRange(prev => ({ ...prev, start: e.target.value })); setPage(0); }}
                      className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">To Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => { setDateRange(prev => ({ ...prev, end: e.target.value })); setPage(0); }}
                      className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">Active filters:</span>
                {searchTerm && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs">
                    Search: "{searchTerm}"
                    <button onClick={() => setSearchTerm('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {typeFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs">
                    Type: {typeFilter}
                    <button onClick={() => setTypeFilter('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                {categoryFilter && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs">
                    Category: {categoryFilter}
                    <button onClick={() => setCategoryFilter('')}><X className="w-3 h-3" /></button>
                  </span>
                )}
                <button onClick={clearFilters} className="text-xs text-primary-600 hover:underline">
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Transactions List */}
          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : error ? (
              <div className="text-center py-20 text-red-600">{error}</div>
            ) : paginatedRows.length === 0 ? (
              <div className="text-center py-20 text-slate-500">
                <p className="text-lg font-medium">No transactions found</p>
                <p className="text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              paginatedRows.map((row) => {
                const merchantLogo = getMerchantLogo(row.description);
                const isExpanded = expandedId === row.id;
                return (
                <div key={row.id} className="border-b border-slate-100 last:border-b-0">
                  {/* Main Row - Clickable */}
                  <div 
                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => toggleExpand(row.id)}
                  >
                    <div className="flex items-center gap-4">
                      {/* Icon - Use merchant logo if available, otherwise category icon */}
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden ${
                        row.type === 'credit' ? 'bg-emerald-100' : 'bg-red-50'
                      }`}>
                        {merchantLogo ? (
                          <img 
                            src={merchantLogo} 
                            alt="" 
                            className="w-7 h-7 object-contain"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : null}
                        <span className={`text-xl ${merchantLogo ? 'hidden' : ''}`}>
                          {getCategoryIcon(row.category)}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900 truncate">{row.description}</p>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getCategoryColor(row.category)}`}>
                            {row.category.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>{formatDate(row.date)}</span>
                          <span>•</span>
                          <span>{formatTime(row.date)}</span>
                          {row.accountNumber && (
                            <>
                              <span>•</span>
                              <span>****{row.accountNumber.slice(-4)}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Amount & Status */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className={`text-lg font-semibold ${
                            row.type === 'credit' ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {row.type === 'credit' ? '+' : '-'}${formatAmount(row.amount)}
                          </p>
                          <div className="flex items-center justify-end gap-2">
                            <p className="text-xs text-slate-400">{row.currency}</p>
                            {row.status && row.status !== 'COMPLETED' && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                row.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                row.status === 'DECLINED' ? 'bg-red-100 text-red-700' :
                                row.status === 'REVERSED' ? 'bg-gray-100 text-gray-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {row.status}
                              </span>
                            )}
                          </div>
                        </div>
                        {/* Expand Icon */}
                        <div className="text-slate-400">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 bg-slate-50 border-t border-slate-100">
                      <div className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Reference</p>
                          <p className="text-sm font-mono text-slate-900">{row.reference || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Type</p>
                          <p className="text-sm text-slate-900 capitalize">{row.type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Category</p>
                          <p className="text-sm text-slate-900">{row.category.replace('_', ' ')}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Status</p>
                          <p className="text-sm text-slate-900">{row.status}</p>
                        </div>
                        {row.merchantName && (
                          <div className="col-span-2">
                            <p className="text-xs text-slate-500 mb-1">Merchant</p>
                            <p className="text-sm text-slate-900">{row.merchantName}</p>
                          </div>
                        )}
                        <div className="col-span-2">
                          <p className="text-xs text-slate-500 mb-1">Date & Time</p>
                          <p className="text-sm text-slate-900">
                            {new Date(row.date).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}
                          </p>
                        </div>
                      </div>

                      {/* Download Receipt Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadReceipt(row.id);
                        }}
                        disabled={downloadingId === row.id}
                        className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-colors"
                      >
                        {downloadingId === row.id ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Generating Receipt...</span>
                          </>
                        ) : (
                          <>
                            <Download className="w-5 h-5" />
                            <span>Download Receipt (PDF)</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );})
            )}
          </div>

          {/* Pagination */}
          {!loading && filteredRows.length > 0 && (
            <div className="p-4 border-t border-slate-100 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Showing {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, filteredRows.length)} of {filteredRows.length} transactions
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-3 py-1 text-sm font-medium">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default TransactionHistoryPage;
