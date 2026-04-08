/**
 * Export utilities for payments and receipts
 * Supports CSV and PDF formats
 */

/**
 * Export payments to CSV format
 * @param {array} payments - Array of payment objects
 * @param {string} filename - Output filename
 */
export const exportPaymentsToCSV = (payments, filename = 'payments.csv') => {
  if (!payments || payments.length === 0) {
    console.warn('No payments to export');
    return;
  }

  // Define CSV headers
  const headers = [
    'Date',
    'Type',
    'Status',
    'From Account',
    'To Account',
    'Amount',
    'Description',
    'Reference',
  ];

  // Format payment data for CSV
  const rows = payments.map((payment) => [
    new Date(payment.createdAt).toLocaleDateString('en-US'),
    payment.type.charAt(0).toUpperCase() + payment.type.slice(1),
    payment.status.charAt(0).toUpperCase() + payment.status.slice(1),
    payment.fromAccount?.accountType || 'N/A',
    payment.toAccount?.accountType || 'N/A',
    payment.amount,
    `"${payment.description || ''}"`,
    payment.reference || 'N/A',
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate receipt as printable format
 * @param {object} payment - Payment object
 * @returns {string} HTML content
 */
export const generateReceiptHTML = (payment) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'transfer':
        return 'Account Transfer';
      case 'p2p':
        return 'Peer-to-Peer Payment';
      case 'bill':
        return 'Bill Payment';
      case 'refund':
        return 'Refund';
      default:
        return 'Payment';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'transfer':
        return '↔️';
      case 'p2p':
        return '👤';
      case 'bill':
        return '📄';
      case 'refund':
        return '↩️';
      default:
        return '💳';
    }
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background-color: #f5f5f5;
          margin: 0;
          padding: 20px;
        }
        .receipt-container {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .receipt-header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #0ea5e9;
          padding-bottom: 20px;
        }
        .receipt-title {
          font-size: 24px;
          font-weight: bold;
          color: #1e293b;
          margin: 0;
        }
        .receipt-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 5px 0 0 0;
        }
        .amount-section {
          text-align: center;
          margin: 30px 0;
          padding: 20px;
          background: linear-gradient(135deg, #0ea5e9, #06b6d4);
          border-radius: 8px;
          color: white;
        }
        .amount-icon {
          font-size: 40px;
          margin-bottom: 10px;
        }
        .amount-label {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 5px;
        }
        .amount-value {
          font-size: 32px;
          font-weight: bold;
        }
        .details-section {
          margin: 30px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
        }
        .detail-label {
          color: #64748b;
          font-weight: 600;
        }
        .detail-value {
          color: #1e293b;
          text-align: right;
          word-break: break-word;
        }
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .status-completed {
          background-color: #dcfce7;
          color: #166534;
        }
        .status-pending {
          background-color: #fef3c7;
          color: #92400e;
        }
        .status-cancelled {
          background-color: #fee2e2;
          color: #991b1b;
        }
        .status-refunded {
          background-color: #e0e7ff;
          color: #3730a3;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 12px;
        }
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .receipt-container {
            box-shadow: none;
            padding: 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="receipt-header">
          <h1 class="receipt-title">${getTypeLabel(payment.type)}</h1>
          <p class="receipt-subtitle">Receipt #${payment.reference}</p>
        </div>

        <div class="amount-section">
          <div class="amount-icon">${getTypeIcon(payment.type)}</div>
          <div class="amount-label">Amount</div>
          <div class="amount-value">${formatCurrency(payment.amount)}</div>
        </div>

        <div class="details-section">
          <div class="detail-row">
            <span class="detail-label">Date & Time</span>
            <span class="detail-value">${formatDate(payment.createdAt)}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value">
              <span class="status-badge status-${payment.status}">
                ${payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
              </span>
            </span>
          </div>

          <div class="detail-row">
            <span class="detail-label">From Account</span>
            <span class="detail-value">${payment.fromAccount?.accountType || 'N/A'}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">To Account</span>
            <span class="detail-value">${payment.toAccount?.accountType || 'N/A'}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Description</span>
            <span class="detail-value">${payment.description || '-'}</span>
          </div>

          <div class="detail-row">
            <span class="detail-label">Reference Number</span>
            <span class="detail-value">${payment.reference}</span>
          </div>
        </div>

        <div class="footer">
          <p>This is an electronically generated receipt and is valid without a signature.</p>
          <p>Thank you for banking with Rosch Capital Bank</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Print payment receipt
 * @param {object} payment - Payment object
 */
export const printReceipt = (payment) => {
  const html = generateReceiptHTML(payment);
  const printWindow = window.open('', '', 'height=600,width=800');
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load then print
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

/**
 * Download receipt as HTML file
 * @param {object} payment - Payment object
 * @param {string} filename - Output filename
 */
export const downloadReceiptHTML = (payment, filename = 'receipt.html') => {
  const html = generateReceiptHTML(payment);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};