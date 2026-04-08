/**
 * Generate cheque HTML for printing
 * This creates a printable HTML cheque that can be converted to PDF
 */
export const generateChequeHTML = (cheque) => {
  const { chequeNumber, amount, payee, memo, issuedDate, user } = cheque;
  
  const formattedDate = new Date(issuedDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedAmount = parseFloat(amount).toFixed(2);
  const amountInWords = numberToWords(parseFloat(amount));

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cheque #${chequeNumber}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Courier New', monospace;
      background: #f5f5f5;
      padding: 20px;
    }
    
    .cheque-container {
      width: 8.5in;
      height: 3.5in;
      margin: 0 auto;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: 2px solid #333;
      border-radius: 8px;
      padding: 30px;
      position: relative;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .cheque-inner {
      background: white;
      height: 100%;
      border: 1px solid #ddd;
      padding: 20px;
      position: relative;
    }
    
    .bank-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    
    .bank-logo {
      font-size: 24px;
      font-weight: bold;
      color: #667eea;
      font-family: 'Arial', sans-serif;
    }
    
    .bank-info {
      text-align: right;
      font-size: 10px;
      color: #666;
    }
    
    .cheque-number {
      position: absolute;
      top: 20px;
      right: 20px;
      font-size: 14px;
      font-weight: bold;
      color: #667eea;
    }
    
    .date-line {
      text-align: right;
      margin-bottom: 20px;
      font-size: 12px;
    }
    
    .date-value {
      display: inline-block;
      border-bottom: 1px solid #333;
      min-width: 150px;
      padding: 2px 10px;
    }
    
    .pay-to-line {
      margin-bottom: 15px;
      font-size: 12px;
    }
    
    .pay-to-value {
      display: inline-block;
      border-bottom: 1px solid #333;
      min-width: 400px;
      padding: 2px 10px;
      font-weight: bold;
    }
    
    .amount-box {
      position: absolute;
      top: 80px;
      right: 20px;
      border: 2px solid #667eea;
      padding: 5px 15px;
      font-size: 16px;
      font-weight: bold;
      background: #f9f9f9;
    }
    
    .amount-words-line {
      margin-bottom: 15px;
      font-size: 12px;
    }
    
    .amount-words-value {
      display: inline-block;
      border-bottom: 1px solid #333;
      width: calc(100% - 20px);
      padding: 2px 10px;
      text-transform: uppercase;
      font-weight: bold;
    }
    
    .memo-line {
      margin-bottom: 20px;
      font-size: 11px;
    }
    
    .memo-value {
      display: inline-block;
      border-bottom: 1px solid #333;
      min-width: 300px;
      padding: 2px 10px;
    }
    
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 30px;
    }
    
    .signature-line {
      width: 200px;
      border-top: 1px solid #333;
      padding-top: 5px;
      text-align: center;
      font-size: 10px;
    }
    
    .account-info {
      position: absolute;
      bottom: 10px;
      left: 20px;
      font-size: 10px;
      color: #666;
      font-family: 'Courier New', monospace;
    }
    
    .security-features {
      position: absolute;
      bottom: 10px;
      right: 20px;
      font-size: 8px;
      color: #999;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .cheque-container {
        box-shadow: none;
        page-break-after: always;
      }
    }
  </style>
</head>
<body>
  <div class="cheque-container">
    <div class="cheque-inner">
      <div class="bank-header">
        <div class="bank-logo">🏦 ROSCH CAPITAL BANK</div>
        <div class="bank-info">
          123 Financial District<br>
          New York, NY 10004<br>
          Tel: (555) 123-4567
        </div>
      </div>
      
      <div class="cheque-number">
        #${chequeNumber}
      </div>
      
      <div class="date-line">
        Date: <span class="date-value">${formattedDate}</span>
      </div>
      
      <div class="amount-box">
        $${formattedAmount}
      </div>
      
      <div class="pay-to-line">
        Pay to the order of: <span class="pay-to-value">${payee}</span>
      </div>
      
      <div class="amount-words-line">
        <span class="amount-words-value">${amountInWords} DOLLARS</span>
      </div>
      
      <div class="memo-line">
        Memo: <span class="memo-value">${memo || '_______________'}</span>
      </div>
      
      <div class="signature-section">
        <div class="signature-line">
          ${user.firstName} ${user.lastName}
        </div>
        <div class="signature-line">
          Authorized Signature
        </div>
      </div>
      
      <div class="account-info">
        ⑆${user.accountNumber || '000000000000'}⑆ ⑈604003000⑈ ${chequeNumber}
      </div>
      
      <div class="security-features">
        VOID IF ALTERED • SECURITY FEATURES APPLIED
      </div>
    </div>
  </div>
  
  <script>
    // Auto-print when opened
    window.onload = function() {
      // Uncomment to enable auto-print
      // window.print();
    };
  </script>
</body>
</html>
  `;
};

/**
 * Convert number to words for cheque amount
 */
function numberToWords(num) {
  if (num === 0) return 'ZERO';
  
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  
  function convertLessThanThousand(n) {
    if (n === 0) return '';
    
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) {
      const ten = Math.floor(n / 10);
      const one = n % 10;
      return tens[ten] + (one > 0 ? ' ' + ones[one] : '');
    }
    
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    return ones[hundred] + ' HUNDRED' + (remainder > 0 ? ' ' + convertLessThanThousand(remainder) : '');
  }
  
  // Split into dollars and cents
  const dollars = Math.floor(num);
  const cents = Math.round((num - dollars) * 100);
  
  let result = '';
  
  if (dollars === 0) {
    result = 'ZERO';
  } else {
    const billion = Math.floor(dollars / 1000000000);
    const million = Math.floor((dollars % 1000000000) / 1000000);
    const thousand = Math.floor((dollars % 1000000) / 1000);
    const remainder = dollars % 1000;
    
    if (billion > 0) {
      result += convertLessThanThousand(billion) + ' BILLION ';
    }
    if (million > 0) {
      result += convertLessThanThousand(million) + ' MILLION ';
    }
    if (thousand > 0) {
      result += convertLessThanThousand(thousand) + ' THOUSAND ';
    }
    if (remainder > 0) {
      result += convertLessThanThousand(remainder);
    }
  }
  
  // Add cents if present
  if (cents > 0) {
    result += ' AND ' + cents + '/100';
  } else {
    result += ' AND 00/100';
  }
  
  return result.trim();
}
