import prisma from '../config/prisma.js';

// Helper to build a standard invoice object from transactions
const buildInvoiceFromTransactions = (user, transactions, options = {}) => {
  const issuedAt = options.issuedAt || new Date();
  const currency = options.currency || 'USD';

  let total = 0;
  const items = transactions.map((tx) => {
    const amountNumber = Number(tx.amount);
    total += amountNumber;
    return {
      id: tx.id,
      description: tx.description || 'Payment',
      amount: amountNumber,
      category: tx.category || null,
      createdAt: tx.createdAt,
    };
  });

  return {
    id: options.id || `INV-${transactions[0].id.slice(0, 8).toUpperCase()}`,
    userId: user.id,
    customer: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    currency,
    issuedAt,
    items,
    total,
  };
};

// Generate invoice from a single payment (transaction)
export const generatePaymentInvoice = async (userId, paymentId) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: paymentId,
      account: { userId },
    },
    include: {
      account: true,
    },
  });

  if (!transaction) {
    throw new Error('Payment not found or unauthorized');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  const invoice = buildInvoiceFromTransactions(user, [transaction], {
    currency: transaction.account?.currency || 'USD',
    issuedAt: transaction.createdAt,
  });

  return invoice;
};

// Generate invoice from multiple payments (transactions)
export const generateBatchInvoice = async (userId, paymentIds) => {
  if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
    throw new Error('paymentIds array is required');
  }

  const transactions = await prisma.transaction.findMany({
    where: {
      id: { in: paymentIds },
      account: { userId },
    },
    include: {
      account: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (transactions.length === 0) {
    throw new Error('No payments found for invoice');
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new Error('User not found');
  }

  const firstTx = transactions[0];
  const invoice = buildInvoiceFromTransactions(user, transactions, {
    id: `INV-BATCH-${firstTx.id.slice(0, 6).toUpperCase()}`,
    currency: firstTx.account?.currency || 'USD',
    issuedAt: firstTx.createdAt,
  });

  return invoice;
};

// Generate professional HTML representation of an invoice
export const generateInvoiceHTML = (invoice) => {
  const { customer, items, total, currency, id, issuedAt } = invoice;

  const rows = items
    .map(
      (item, index) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${index + 1}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.category || 'General'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">${currency === 'USD' ? '$' : currency}${item.amount.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const invoiceDate = new Date(issuedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `<!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Invoice ${id}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f9fafb;
          padding: 40px 20px;
          color: #1f2937;
        }
        
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        
        .invoice-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
        }
        
        .bank-name {
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .bank-tagline {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .invoice-body {
          padding: 40px;
        }
        
        .invoice-meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .invoice-info h2 {
          font-size: 24px;
          color: #667eea;
          margin-bottom: 8px;
        }
        
        .invoice-number {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 4px;
        }
        
        .invoice-date {
          font-size: 14px;
          color: #6b7280;
        }
        
        .customer-info h3 {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .customer-name {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 4px;
        }
        
        .customer-email {
          font-size: 14px;
          color: #6b7280;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        
        .items-table thead {
          background: #f9fafb;
        }
        
        .items-table th {
          padding: 12px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #e5e7eb;
        }
        
        .items-table th:last-child {
          text-align: right;
        }
        
        .items-table tbody tr:last-child td {
          border-bottom: 2px solid #e5e7eb;
        }
        
        .total-section {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        
        .total-box {
          background: #f9fafb;
          padding: 20px 30px;
          border-radius: 8px;
          min-width: 300px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
          color: #6b7280;
        }
        
        .total-final {
          display: flex;
          justify-content: space-between;
          padding-top: 12px;
          border-top: 2px solid #e5e7eb;
          font-size: 20px;
          font-weight: bold;
          color: #1f2937;
        }
        
        .invoice-footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        
        .footer-note {
          margin-bottom: 8px;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          
          .invoice-container {
            box-shadow: none;
            border-radius: 0;
          }
        }
              <h2>INVOICE</h2>
              <div class="invoice-number">Invoice #: ${id}</div>
              <div class="invoice-date">Date: ${invoiceDate}</div>
            </div>
            
            <div class="customer-info">
              <h3>Billed To</h3>
              <div class="customer-name">${customer.firstName} ${customer.lastName}</div>
              <div class="customer-email">${customer.email}</div>
            </div>
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 60px;">#</th>
                <th>Description</th>
                <th style="width: 150px; text-align: center;">Category</th>
                <th style="width: 120px; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-box">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${currency === 'USD' ? '$' : currency}${total.toFixed(2)}</span>
              </div>
              <div class="total-row">
                <span>Tax (0%):</span>
                <span>${currency === 'USD' ? '$' : currency}0.00</span>
              </div>
              <div class="total-final">
                <span>Total:</span>
                <span>${currency === 'USD' ? '$' : currency}${total.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div class="invoice-footer">
            <div class="footer-note">Thank you for banking with Rosch Capital Bank</div>
            <div>123 Financial District, New York, NY 10004 | Tel: (555) 123-4567</div>
            <div>support@roschcapital.com | www.roschcapital.com</div>
          </div>
        </div>
      </div>
      
      <script>
        // Auto-print functionality (optional)
        // window.onload = function() { window.print(); };
      </script>
    </body>
  </html>`;
};
