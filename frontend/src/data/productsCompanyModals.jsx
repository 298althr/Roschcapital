import React from 'react';
import { Link } from 'react-router-dom';

export const productsCompanyModals = {
  // Products
  personalBanking: {
    title: 'Personal Banking',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Banking Made Simple</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">Your Everyday Banking Solution</h3>
          <p>Rosch Capital Bank's Personal Banking offers everything you need to manage your money with confidence. From checking and savings accounts to mobile banking and bill pay, we provide modern banking tools designed for your lifestyle.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">Key Features</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Free Checking Accounts:</strong> No monthly fees, no minimum balance requirements</li>
            <li><strong>High-Yield Savings:</strong> Competitive interest rates to grow your money</li>
            <li><strong>Mobile Banking:</strong> Manage your accounts anytime, anywhere</li>
            <li><strong>Instant Transfers:</strong> Send money to friends and family in seconds</li>
            <li><strong>Bill Pay:</strong> Schedule and automate your bill payments</li>
            <li><strong>24/7 Customer Support:</strong> We're here whenever you need us</li>
          </ul>
        </section>

        <div className="mt-8 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
          <h4 className="text-lg font-bold text-purple-950 mb-3">Ready to Get Started?</h4>
          <p className="text-purple-900 mb-4">Open your free account in just 5 minutes.</p>
          <Link to="/register" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-lg hover:from-purple-800 hover:to-purple-950 transition-all font-semibold">
            Open Free Account
          </Link>
        </div>
      </div>
    )
  },

  businessBanking: {
    title: 'Business Banking',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Banking Solutions for Your Business</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">Grow Your Business with Confidence</h3>
          <p>Rosch Capital Bank's Business Banking provides comprehensive financial solutions tailored to businesses of all sizes. From startups to established enterprises, we offer the tools and support you need to succeed.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">Business Account Features</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Business Checking:</strong> Unlimited transactions with no monthly fees</li>
            <li><strong>Merchant Services:</strong> Accept payments online and in-person</li>
            <li><strong>Business Credit Cards:</strong> Earn rewards on business expenses</li>
            <li><strong>Payroll Services:</strong> Automated payroll processing</li>
            <li><strong>Cash Management:</strong> Advanced tools for managing cash flow</li>
          </ul>
        </section>

        <div className="mt-8 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
          <h4 className="text-lg font-bold text-purple-950 mb-3">Start Banking for Business</h4>
          <p className="text-purple-900 mb-4">Open a business account and get access to powerful financial tools.</p>
          <Link to="/register" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-lg hover:from-purple-800 hover:to-purple-950 transition-all font-semibold">
            Open Business Account
          </Link>
        </div>
      </div>
    )
  },

  cryptoWallets: {
    title: 'Crypto Wallets',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Secure Cryptocurrency Banking</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">Your Gateway to Digital Assets</h3>
          <p>Rosch Capital Bank's Crypto Wallets seamlessly integrate traditional banking with cryptocurrency management. Buy, sell, store, and transfer Bitcoin, Ethereum, and USDT with bank-level security.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">Supported Cryptocurrencies</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Bitcoin (BTC):</strong> The original and most trusted cryptocurrency</li>
            <li><strong>Ethereum (ETH):</strong> Smart contract platform and digital currency</li>
            <li><strong>Tether (USDT):</strong> Stable coin pegged to the US Dollar</li>
          </ul>
        </section>

        <div className="mt-8 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
          <h4 className="text-lg font-bold text-purple-950 mb-3">Start Your Crypto Journey</h4>
          <p className="text-purple-900 mb-4">Create an account and get instant access to crypto wallets.</p>
          <Link to="/register" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-lg hover:from-purple-800 hover:to-purple-950 transition-all font-semibold">
            Get Started with Crypto
          </Link>
        </div>
      </div>
    )
  },

  creditCards: {
    title: 'Credit Cards',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Smart Credit Solutions</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">Credit Cards Designed for You</h3>
          <p>Rosch Capital Bank offers premium credit cards with competitive rates, generous rewards, and powerful security features. Build credit or maximize rewards with the perfect card for your needs.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">Credit Card Benefits</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>No Annual Fee:</strong> Keep more of your money</li>
            <li><strong>Cashback Rewards:</strong> Earn on every purchase</li>
            <li><strong>Fraud Protection:</strong> Zero liability for unauthorized charges</li>
            <li><strong>Virtual Cards:</strong> Generate temporary card numbers for online shopping</li>
            <li><strong>Travel Benefits:</strong> No foreign transaction fees</li>
          </ul>
        </section>

        <div className="mt-8 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
          <h4 className="text-lg font-bold text-purple-950 mb-3">Apply for Your Credit Card</h4>
          <p className="text-purple-900 mb-4">Get approved in minutes and start earning rewards today.</p>
          <Link to="/register" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-lg hover:from-purple-800 hover:to-purple-950 transition-all font-semibold">
            Apply Now
          </Link>
        </div>
      </div>
    )
  },

  loansFinancing: {
    title: 'Loans & Financing',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Flexible Financing Solutions</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">Achieve Your Goals with Rosch Capital Loans</h3>
          <p>Whether you're buying a home, starting a business, or consolidating debt, Rosch Capital Bank offers competitive loan products with transparent terms and personalized service.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">Loan Products</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Loans:</strong> $1,000 - $50,000 for any purpose</li>
            <li><strong>Business Loans:</strong> Flexible financing for business growth</li>
            <li><strong>Auto Loans:</strong> Competitive rates for new and used vehicles</li>
            <li><strong>Home Equity Lines:</strong> Tap into your home's equity</li>
          </ul>
        </section>

        <div className="mt-8 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
          <h4 className="text-lg font-bold text-purple-950 mb-3">Ready to Apply?</h4>
          <p className="text-purple-900 mb-4">Start your loan application and get approved quickly.</p>
          <Link to="/register" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-lg hover:from-purple-800 hover:to-purple-950 transition-all font-semibold">
            Apply for a Loan
          </Link>
        </div>
      </div>
    )
  },

  // Company
  aboutUs: {
    title: 'About Us',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Banking Reimagined for the Digital Age</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">Our Story</h3>
          <p>Founded in 2020, Rosch Capital Bank was born from a simple idea: banking should be accessible, transparent, and designed for the modern world. We've grown to serve over 50,000 customers across 150+ countries.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">Our Mission</h3>
          <p>To provide innovative, secure, and user-friendly banking services that empower individuals and businesses to achieve their financial goals through cutting-edge technology and personalized service.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">By the Numbers</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>50,000+ active users worldwide</li>
            <li>$2.5B+ in transactions processed</li>
            <li>150+ countries supported</li>
            <li>99.9% uptime guarantee</li>
          </ul>
        </section>

        <div className="mt-8 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
          <h4 className="text-lg font-bold text-purple-950 mb-3">Join Our Community</h4>
          <p className="text-purple-900 mb-4">Be part of the banking revolution. Open your account today.</p>
          <Link to="/register" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-lg hover:from-purple-800 hover:to-purple-950 transition-all font-semibold">
            Get Started
          </Link>
        </div>
      </div>
    )
  },

  careers: {
    title: 'Careers',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Join the Rosch Capital Bank Team</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">Build Your Career with Us</h3>
          <p>At Rosch Capital Bank, we're always looking for talented, passionate individuals who want to shape the future of banking. Join a team that values innovation, collaboration, and making a real impact.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">Why Work at Rosch Capital Bank?</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Competitive Compensation:</strong> Salary, bonuses, and equity options</li>
            <li><strong>Health & Wellness:</strong> Comprehensive medical, dental, and vision coverage</li>
            <li><strong>Work-Life Balance:</strong> Flexible hours and remote work options</li>
            <li><strong>Professional Growth:</strong> Training programs and career development</li>
            <li><strong>Diverse Team:</strong> Inclusive workplace that celebrates diversity</li>
          </ul>
        </section>

        <div className="mt-8 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
          <h4 className="text-lg font-bold text-purple-950 mb-3">Ready to Apply?</h4>
          <p className="text-purple-900 mb-4">Explore opportunities and join our growing team.</p>
          <Link to="/register" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-lg hover:from-purple-800 hover:to-purple-950 transition-all font-semibold">
            View Open Positions
          </Link>
        </div>
      </div>
    )
  },

  pressMedia: {
    title: 'Press & Media',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Rosch Capital Bank in the News</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">Media Resources</h3>
          <p>Welcome to Rosch Capital Bank's press center. Here you'll find the latest news, press releases, and media kits.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">Recent Press Releases</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>November 2025:</strong> Rosch Capital Bank Reaches 50,000 User Milestone</li>
            <li><strong>October 2025:</strong> New Crypto Wallet Features Launched</li>
            <li><strong>September 2025:</strong> Expansion to 150+ Countries Completed</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">Media Contact</h3>
          <p><strong>Email:</strong> press@roschcapital.com</p>
          <p><strong>Phone:</strong> +1 (234) 567-893</p>
        </section>

        <div className="mt-8 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
          <h4 className="text-lg font-bold text-purple-950 mb-3">Experience Rosch Capital Bank</h4>
          <p className="text-purple-900 mb-4">See what the press is talking about. Try Rosch Capital Bank today.</p>
          <Link to="/register" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-lg hover:from-purple-800 hover:to-purple-950 transition-all font-semibold">
            Open Account
          </Link>
        </div>
      </div>
    )
  },

  blogResources: {
    title: 'Blog & Resources',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Financial Education & Insights</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">Learn, Grow, Succeed</h3>
          <p>Our blog provides valuable insights, tips, and resources to help you make informed financial decisions. From budgeting basics to investment strategies, we cover topics that matter to you.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">Popular Topics</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Personal Finance:</strong> Budgeting, saving, and debt management</li>
            <li><strong>Investing:</strong> Stocks, bonds, and retirement planning</li>
            <li><strong>Cryptocurrency:</strong> Understanding digital assets</li>
            <li><strong>Business Finance:</strong> Tips for entrepreneurs and small businesses</li>
            <li><strong>Security:</strong> Protecting yourself from fraud</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">Financial Tools</h3>
          <p>Access free calculators, templates, and guides to help you plan your financial future.</p>
        </section>

        <div className="mt-8 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
          <h4 className="text-lg font-bold text-purple-950 mb-3">Start Your Financial Journey</h4>
          <p className="text-purple-900 mb-4">Put your knowledge into action with a Rosch Capital Bank account.</p>
          <Link to="/register" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-lg hover:from-purple-800 hover:to-purple-950 transition-all font-semibold">
            Open Account
          </Link>
        </div>
      </div>
    )
  },

  partnerProgram: {
    title: 'Partner Program',
    content: (
      <div className="space-y-6">
        <p className="text-lg font-semibold">Grow Together with Rosch Capital Bank</p>
        
        <section>
          <h3 className="text-xl font-bold mb-3">Partnership Opportunities</h3>
          <p>Rosch Capital Bank's Partner Program offers businesses and organizations the opportunity to integrate our banking services, earn revenue, and provide value to their customers.</p>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">Partner Benefits</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Revenue Sharing:</strong> Earn commissions on referred customers</li>
            <li><strong>API Access:</strong> Integrate banking features into your platform</li>
            <li><strong>Co-Marketing:</strong> Joint marketing campaigns and materials</li>
            <li><strong>Dedicated Support:</strong> Partner success team</li>
            <li><strong>White-Label Options:</strong> Branded banking solutions</li>
          </ul>
        </section>

        <section>
          <h3 className="text-xl font-bold mb-3">Who Can Partner?</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Fintech companies</li>
            <li>E-commerce platforms</li>
            <li>Financial advisors</li>
            <li>Business consultants</li>
            <li>Technology providers</li>
          </ul>
        </section>

        <div className="mt-8 p-6 bg-purple-50 rounded-xl border-2 border-purple-200">
          <h4 className="text-lg font-bold text-purple-950 mb-3">Become a Partner</h4>
          <p className="text-purple-900 mb-4">Join our partner network and grow your business with Rosch Capital Bank.</p>
          <Link to="/register" className="inline-block px-6 py-3 bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-lg hover:from-purple-800 hover:to-purple-950 transition-all font-semibold">
            Apply Now
          </Link>
        </div>
      </div>
    )
  }
};
