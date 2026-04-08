import sgMail from '@sendgrid/mail';
import config from '../config/app.js';

// Initialize SendGrid with API key (disabled for now)
// Email service is optional - will be enabled when SENDGRID_API_KEY is configured
if (config.sendgridApiKey) {
  sgMail.setApiKey(config.sendgridApiKey);
}

const FROM_EMAIL = config.fromEmail || 'noreply@roschcapital.com';
const FROM_NAME = 'Rosch Capital Bank';

/**
 * Send email using SendGrid
 */
export const sendEmail = async (to, subject, html, text = null) => {
  if (!config.sendgridApiKey) {
    console.log('--------------------------------------------------');
    console.log('📧 TEST EMAIL LOG (No SendGrid Key)');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('--------------------------------------------------');
    return { success: true, message: 'Email logged to console (Prototype Mode)' };
  }

  try {
    const msg = {
      to,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME
      },
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
    };

    await sgMail.send(msg);
    console.log(`✅ Email sent to ${to}: ${subject}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Email send error:', error);
    if (error.response) {
      console.error('SendGrid error:', error.response.body);
    }
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (user) => {
  const subject = 'Welcome to Rosch Capital Bank!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Rosch Capital Bank!</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName} ${user.lastName},</p>
          <p>Thank you for choosing Rosch Capital Bank. Your account has been successfully created!</p>
          <p><strong>Account Details:</strong></p>
          <ul>
            <li>Email: ${user.email}</li>
            <li>Account Type: ${user.accountType || 'Personal'}</li>
            <li>Registration Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>To get started, please complete your profile and verify your identity by uploading your KYC documents.</p>
          <a href="${config.frontendUrl}/dashboard" class="button">Go to Dashboard</a>
          <p>If you have any questions, our support team is here to help 24/7.</p>
        </div>
        <div class="footer">
          <p>&#169; ${new Date().getFullYear()} Rosch Capital Bank. All rights reserved.</p>
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(user.email, subject, html);
};

/**
 * Send deposit approval notification
 */
export const sendDepositApprovedEmail = async (user, deposit) => {
  const subject = 'Deposit Approved - Funds Added to Your Account';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .amount { font-size: 32px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Deposit Approved!</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName},</p>
          <p>Great news! Your deposit has been approved and the funds have been added to your account.</p>
          <div class="amount">$${parseFloat(deposit.amount).toFixed(2)}</div>
          <p><strong>Transaction Details:</strong></p>
          <ul>
            <li>Reference: ${deposit.reference}</li>
            <li>Amount: $${parseFloat(deposit.amount).toFixed(2)}</li>
            <li>Status: Completed</li>
            <li>Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>Your new balance is now available for use.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rosch Capital Bank. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(user.email, subject, html);
};

/**
 * Send deposit rejection notification
 */
export const sendDepositRejectedEmail = async (user, deposit, reason) => {
  const subject = 'Deposit Request Declined';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .reason { background: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Deposit Request Declined</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName},</p>
          <p>We regret to inform you that your deposit request has been declined.</p>
          <p><strong>Transaction Details:</strong></p>
          <ul>
            <li>Reference: ${deposit.reference}</li>
            <li>Amount: $${parseFloat(deposit.amount).toFixed(2)}</li>
            <li>Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          <div class="reason">
            <strong>Reason:</strong> ${reason || 'Please contact support for more information.'}
          </div>
          <p>If you believe this is an error or need assistance, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rosch Capital Bank. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(user.email, subject, html);
};

/**
 * Send withdrawal approval notification
 */
export const sendWithdrawalApprovedEmail = async (user, withdrawal) => {
  const subject = 'Withdrawal Approved - Funds Processed';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .amount { font-size: 32px; font-weight: bold; color: #3b82f6; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Withdrawal Approved!</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName},</p>
          <p>Your withdrawal request has been approved and is being processed.</p>
          <div class="amount">$${parseFloat(withdrawal.amount).toFixed(2)}</div>
          <p><strong>Transaction Details:</strong></p>
          <ul>
            <li>Reference: ${withdrawal.reference}</li>
            <li>Amount: $${parseFloat(withdrawal.amount).toFixed(2)}</li>
            <li>Status: Processing</li>
            <li>Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          <p>Funds will be transferred to your designated account within 1-3 business days.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rosch Capital Bank. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(user.email, subject, html);
};

/**
 * Send loan approval notification
 */
export const sendLoanApprovedEmail = async (user, loan) => {
  const subject = 'Loan Application Approved!';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .amount { font-size: 32px; font-weight: bold; color: #8b5cf6; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Loan Approved!</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName},</p>
          <p>Congratulations! Your loan application has been approved.</p>
          <div class="amount">$${parseFloat(loan.amount).toFixed(2)}</div>
          <p><strong>Loan Details:</strong></p>
          <ul>
            <li>Loan Type: ${loan.loanType}</li>
            <li>Amount: $${parseFloat(loan.amount).toFixed(2)}</li>
            <li>Interest Rate: ${loan.interestRate}% APR</li>
            <li>Term: ${loan.termMonths} months</li>
            <li>Monthly Payment: $${parseFloat(loan.monthlyPayment).toFixed(2)}</li>
          </ul>
          <p>The loan amount has been disbursed to your account and is now available.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rosch Capital Bank. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(user.email, subject, html);
};

/**
 * Send KYC approval notification
 */
export const sendKYCApprovedEmail = async (user) => {
  const subject = 'KYC Verification Approved - Account Fully Activated';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ KYC Verified!</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName},</p>
          <p>Great news! Your identity verification has been approved.</p>
          <p>Your account is now fully activated with access to all banking features:</p>
          <ul>
            <li>✓ Unlimited deposits and withdrawals</li>
            <li>✓ International transfers</li>
            <li>✓ Loan applications</li>
            <li>✓ Credit card applications</li>
            <li>✓ Investment services</li>
          </ul>
          <a href="${config.frontendUrl}/dashboard" class="button">Access Your Account</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rosch Capital Bank. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(user.email, subject, html);
};

/**
 * Send password change notification
 */
export const sendPasswordChangedEmail = async (user) => {
  const subject = 'Password Changed Successfully';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔒 Password Changed</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName},</p>
          <p>Your password has been successfully changed.</p>
          <p><strong>Change Details:</strong></p>
          <ul>
            <li>Date: ${new Date().toLocaleString()}</li>
            <li>Account: ${user.email}</li>
          </ul>
          <div class="warning">
            <strong>⚠️ Didn't make this change?</strong><br>
            If you did not authorize this password change, please contact our support team immediately.
          </div>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rosch Capital Bank. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(user.email, subject, html);
};

/**
 * Send support ticket reply notification
 */
export const sendSupportReplyEmail = async (user, ticket, message) => {
  const subject = `Support Ticket #${ticket.ticketNumber} - New Reply`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .message { background: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #6366f1; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 New Support Reply</h1>
        </div>
        <div class="content">
          <p>Dear ${user.firstName},</p>
          <p>You have received a new reply to your support ticket.</p>
          <p><strong>Ticket Details:</strong></p>
          <ul>
            <li>Ticket #: ${ticket.ticketNumber}</li>
            <li>Subject: ${ticket.subject}</li>
            <li>Status: ${ticket.status}</li>
          </ul>
          <div class="message">
            <strong>Support Team:</strong><br>
            ${message}
          </div>
          <a href="${config.frontendUrl}/support-tickets/${ticket.id}" class="button">View Ticket</a>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Rosch Capital Bank. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail(user.email, subject, html);
};

export default {
  sendWelcomeEmail,
  sendDepositApprovedEmail,
  sendDepositRejectedEmail,
  sendWithdrawalApprovedEmail,
  sendLoanApprovedEmail,
  sendKYCApprovedEmail,
  sendPasswordChangedEmail,
  sendSupportReplyEmail
};
