import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Loader2, Building2, Mail, Phone, MapPin } from 'lucide-react';
import UserDashboardLayout from '../components/layout/UserDashboardLayout';
import apiClient from '../lib/apiClient';
import { useAuth } from '../hooks/useAuth';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';

const StatementPage = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    fetchAccounts();
    fetchUserProfile();
    // Set default dates (last 30 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/accounts');
      if (response.success) {
        setAccounts(response.accounts || []);
        if (response.accounts?.length > 0) {
          setSelectedAccount(response.accounts[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError('Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      if (response.user) {
        setUserData(response.user);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const fetchTransactions = async () => {
    if (!selectedAccount || !startDate || !endDate) {
      setError('Please select an account and date range');
      return;
    }

    setGenerating(true);
    setError('');
    try {
      const response = await apiClient.get(`/accounts/${selectedAccount}/transactions`, {
        params: {
          startDate,
          endDate,
          limit: 500
        }
      });
      
      if (response.success) {
        setTransactions(response.transactions || []);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transactions');
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(parseFloat(amount) || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSelectedAccountDetails = () => {
    return accounts.find(acc => acc.id === selectedAccount);
  };

  const generatePDF = () => {
    const account = getSelectedAccountDetails();
    const profile = userData || user;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Account Statement - Rosch Capital Bank</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            padding: 40px; 
            color: #1a1a1a;
            line-height: 1.5;
          }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
            border-bottom: 3px solid #7c3aed; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .logo-section { display: flex; align-items: center; gap: 15px; }
          .logo { 
            width: 60px; 
            height: 60px; 
            background: linear-gradient(135deg, #7c3aed, #5b21b6); 
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 24px;
          }
          .bank-name { font-size: 28px; font-weight: 700; color: #7c3aed; }
          .bank-tagline { font-size: 12px; color: #666; margin-top: 4px; }
          .statement-title { text-align: right; }
          .statement-title h2 { font-size: 20px; color: #333; }
          .statement-title p { font-size: 12px; color: #666; margin-top: 4px; }
          
          .info-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px; 
            margin-bottom: 30px; 
          }
          .info-box { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px;
            border-left: 4px solid #7c3aed;
          }
          .info-box h3 { 
            font-size: 14px; 
            color: #7c3aed; 
            margin-bottom: 12px; 
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px;
            font-size: 13px;
          }
          .info-label { color: #666; }
          .info-value { font-weight: 600; color: #1a1a1a; }
          
          .summary-box {
            background: linear-gradient(135deg, #7c3aed, #5b21b6);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
          .summary-item { text-align: center; }
          .summary-item .label { font-size: 12px; opacity: 0.9; margin-bottom: 5px; }
          .summary-item .value { font-size: 22px; font-weight: 700; }
          
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px;
            font-size: 12px;
          }
          th { 
            background: #7c3aed; 
            color: white; 
            padding: 12px 15px; 
            text-align: left;
            font-weight: 600;
          }
          th:first-child { border-radius: 8px 0 0 0; }
          th:last-child { border-radius: 0 8px 0 0; text-align: right; }
          td { 
            padding: 12px 15px; 
            border-bottom: 1px solid #e5e7eb; 
          }
          td:last-child { text-align: right; font-weight: 600; }
          tr:nth-child(even) { background: #f9fafb; }
          tr:hover { background: #f3f4f6; }
          .credit { color: #059669; }
          .debit { color: #dc2626; }
          
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #666;
          }
          .footer p { margin-bottom: 5px; }
          
          @media print {
            body { padding: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-section">
            <div class="logo">RC</div>
            <div>
              <div class="bank-name">Rosch Capital Bank</div>
              <div class="bank-tagline">Banking Reimagined for the Digital Age</div>
            </div>
          </div>
          <div class="statement-title">
            <h2>Account Statement</h2>
            <p>Period: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
            <p>Generated: ${formatDate(new Date())}</p>
          </div>
        </div>
        
        <div class="info-grid">
          <div class="info-box">
            <h3>Account Holder</h3>
            <div class="info-row">
              <span class="info-label">Name:</span>
              <span class="info-value">${profile?.firstName || ''} ${profile?.lastName || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${profile?.email || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Phone:</span>
              <span class="info-value">${profile?.phone || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Address:</span>
              <span class="info-value">${profile?.address || 'N/A'}</span>
            </div>
          </div>
          
          <div class="info-box">
            <h3>Account Details</h3>
            <div class="info-row">
              <span class="info-label">Account Number:</span>
              <span class="info-value">${account?.accountNumber || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Account Type:</span>
              <span class="info-value">${account?.accountType || 'N/A'}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Currency:</span>
              <span class="info-value">USD</span>
            </div>
            <div class="info-row">
              <span class="info-label">Status:</span>
              <span class="info-value">${account?.isActive ? 'Active' : 'Inactive'}</span>
            </div>
          </div>
        </div>
        
        <div class="summary-box">
          <div class="summary-item">
            <div class="label">Opening Balance</div>
            <div class="value">${formatCurrency(account?.balance || 0)}</div>
          </div>
          <div class="summary-item">
            <div class="label">Total Transactions</div>
            <div class="value">${transactions.length}</div>
          </div>
          <div class="summary-item">
            <div class="label">Closing Balance</div>
            <div class="value">${formatCurrency(account?.balance || 0)}</div>
          </div>
        </div>
        
        <h3 style="margin-bottom: 10px; color: #333;">Transaction History</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Reference</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.length > 0 ? transactions.map(txn => `
              <tr>
                <td>${formatDate(txn.createdAt || txn.date)}</td>
                <td>${txn.description || 'N/A'}</td>
                <td>${txn.reference || '-'}</td>
                <td>${txn.type}</td>
                <td class="${['CREDIT', 'DEPOSIT'].includes(txn.type?.toUpperCase()) ? 'credit' : 'debit'}">
                  ${['CREDIT', 'DEPOSIT'].includes(txn.type?.toUpperCase()) ? '+' : '-'}${formatCurrency(Math.abs(txn.amount))}
                </td>
              </tr>
            `).join('') : `
              <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                  No transactions found for the selected period
                </td>
              </tr>
            `}
          </tbody>
        </table>
        
        <div class="footer">
          <p><strong>Rosch Capital Bank</strong> - Your Trusted Financial Partner</p>
          <p>This is a computer-generated statement and does not require a signature.</p>
          <p>For any queries, please contact support@roschcapital.com or call +1 (800) 555-0123</p>
          <p style="margin-top: 10px; font-size: 10px;">
            &copy; ${new Date().getFullYear()} Rosch Capital Bank. All rights reserved. Member FDIC.
          </p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading && accounts.length === 0) {
    return (
      <UserDashboardLayout>
        <LoadingSkeleton variant="premium" />
      </UserDashboardLayout>
    );
  }

  return (
    <UserDashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Account Statement</h1>
            <p className="text-sm text-neutral-500 mt-1">Generate and download your account statements</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
        </div>

        {/* Statement Generator */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-100">
            <h2 className="text-lg font-semibold text-neutral-900">Generate Statement</h2>
            <p className="text-sm text-neutral-500 mt-1">Select your account and date range</p>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Account Selection */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Select Account
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={loading}
                >
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.accountType} - {account.accountNumber}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  From Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* End Date */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  To Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Quick Date Ranges */}
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-neutral-500">Quick select:</span>
              {[
                { label: 'Last 7 days', days: 7 },
                { label: 'Last 30 days', days: 30 },
                { label: 'Last 90 days', days: 90 },
                { label: 'This Year', days: 365 },
              ].map(range => (
                <button
                  key={range.label}
                  onClick={() => {
                    const end = new Date();
                    const start = new Date();
                    start.setDate(start.getDate() - range.days);
                    setStartDate(start.toISOString().split('T')[0]);
                    setEndDate(end.toISOString().split('T')[0]);
                  }}
                  className="px-3 py-1 text-sm bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-full transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={fetchTransactions}
                disabled={generating || !selectedAccount}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
                Preview Statement
              </button>
              <button
                onClick={generatePDF}
                disabled={transactions.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                Download PDF
              </button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {transactions.length > 0 && (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Statement Preview</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  {transactions.length} transactions found
                </p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                Ready to download
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {transactions.slice(0, 10).map((txn, index) => (
                    <tr key={txn.id || index} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 text-sm text-neutral-900">
                        {formatDate(txn.createdAt || txn.date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-900">
                        {txn.description || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          ['CREDIT', 'DEPOSIT'].includes(txn.type?.toUpperCase())
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-neutral-100 text-neutral-700'
                        }`}>
                          {txn.type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-sm font-semibold text-right ${
                        ['CREDIT', 'DEPOSIT'].includes(txn.type?.toUpperCase())
                          ? 'text-emerald-600'
                          : 'text-neutral-900'
                      }`}>
                        {['CREDIT', 'DEPOSIT'].includes(txn.type?.toUpperCase()) ? '+' : '-'}
                        {formatCurrency(Math.abs(txn.amount))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {transactions.length > 10 && (
              <div className="px-6 py-4 bg-neutral-50 text-center">
                <p className="text-sm text-neutral-500">
                  Showing 10 of {transactions.length} transactions. Download PDF to see all.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">About Account Statements</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Statements include all transactions within the selected date range</li>
            <li>• PDF statements can be used for official documentation</li>
            <li>• For statements older than 1 year, please contact support</li>
          </ul>
        </div>
      </div>
    </UserDashboardLayout>
  );
};

export default StatementPage;
