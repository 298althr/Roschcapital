import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowRight, Globe, CreditCard, Send, Wallet, Lock, CheckCircle, Zap, TrendingUp, Users, ChevronRight } from 'lucide-react';

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-28 lg:pt-32 pb-16 lg:pb-24 overflow-hidden bg-white">
      {/* Subtle modern background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-[0.4]"></div>
      
      {/* Gradient Accents */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-purple-100/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-100/60 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          {/* Left Content */}
          <div className="flex-1 w-full text-center lg:text-left space-y-8 z-10">
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-full shadow-sm mx-auto lg:mx-0 hover:bg-white transition-colors cursor-default">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-sm font-semibold text-slate-600 tracking-wide uppercase text-[10px] sm:text-xs">Banking for the Future</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-slate-900 tracking-tight leading-[1.1]">
              Banking, but <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-indigo-800">
                Brilliantly Simple.
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Experience the elegance of modern finance. Instant global transfers, multi-currency accounts, and concierge-level support—without the fees.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Link 
                to="/register" 
                className="group px-8 py-4 bg-slate-900 text-white rounded-xl font-semibold text-lg shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
              >
                Open Account
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/login" 
                className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl font-semibold text-lg hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center justify-center gap-2"
              >
                Sign In
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-4 opacity-80 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">FDIC Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-500">Global Access</span>
              </div>
            </div>
          </div>

          {/* Right Content - 3D/Dashboard Preview */}
          <div className="flex-1 w-full relative lg:h-[600px] flex items-center justify-center perspective-1000">
            {/* Main Card - Tilted slightly for premium feel */}
            <div className="relative w-full max-w-md lg:max-w-none bg-slate-900 rounded-3xl p-1 shadow-2xl shadow-purple-900/20 rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-0 transition-transform duration-700 ease-out">
              <div className="bg-slate-900 rounded-[22px] overflow-hidden border border-slate-800">
                {/* Fake Browser Header */}
                <div className="bg-slate-950 px-4 py-3 flex items-center gap-2 border-b border-slate-800">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
                  </div>
                  <div className="ml-4 px-3 py-1 bg-slate-800 rounded-md text-[10px] text-slate-400 font-mono flex-1 text-center">
                    roschcapital.com/dashboard
                  </div>
                </div>

                {/* Dashboard Content */}
                <div className="p-6 space-y-6">
                  {/* Balance Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-slate-400 text-sm font-medium">Total Balance</p>
                      <h3 className="text-3xl font-bold text-white mt-1">$84,250.50</h3>
                      <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> +2.4% this month
                      </p>
                    </div>
                    <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
                      <Wallet className="w-6 h-6 text-purple-400" />
                    </div>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-4 rounded-xl text-white relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-20">
                        <CreditCard className="w-12 h-12" />
                      </div>
                      <p className="text-purple-200 text-xs mb-4">Business Elite</p>
                      <p className="font-mono text-sm mb-1">•••• 4242</p>
                      <div className="flex justify-between items-end">
                        <p className="text-xs opacity-80">Exp 12/28</p>
                        <div className="w-8 h-5 bg-white/20 rounded"></div>
                      </div>
                    </div>
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col justify-center items-center gap-2 text-slate-400 hover:bg-slate-750 transition-colors cursor-pointer">
                      <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-700">
                        <Plus className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-medium">Add Card</span>
                    </div>
                  </div>

                  {/* Transactions List */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Activity</p>
                    {[
                      { name: 'Apple Store', date: 'Today', amount: '-$1,299.00', icon: ShoppingBag },
                      { name: 'Deposit Received', date: 'Yesterday', amount: '+$5,400.00', icon: ArrowDownLeft, green: true },
                      { name: 'Uber Trip', date: 'Yesterday', amount: '-$24.50', icon: Car },
                    ].map((tx, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-xl border border-slate-800 hover:bg-slate-800 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.green ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-300'}`}>
                            <tx.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{tx.name}</p>
                            <p className="text-[10px] text-slate-500">{tx.date}</p>
                          </div>
                        </div>
                        <span className={`text-sm font-semibold ${tx.green ? 'text-emerald-400' : 'text-white'}`}>
                          {tx.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -right-6 top-12 bg-white p-4 rounded-xl shadow-xl animate-bounce duration-[3000ms]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Transfer Complete</p>
                    <p className="text-sm font-bold text-slate-900">+$5,400.00</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Helper icons
const Plus = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>;
const ShoppingBag = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>;
const ArrowDownLeft = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 5l-7 7-7-7" /></svg>; // Simplified for visual
const Car = ({ className }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>; // Placeholder


const PhoneMockup = () => (
  <div className="relative mx-auto max-w-sm lg:max-w-md">
    {/* Glow effect behind phone */}
    <div className="absolute inset-0 bg-gradient-to-br from-purple-400/20 to-blue-400/20 rounded-full blur-3xl scale-110"></div>
    
    {/* Phone Frame */}
    <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
      {/* Phone notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-2xl z-20"></div>
      
      {/* Screen */}
      <div className="bg-white rounded-[2.5rem] overflow-hidden">
        {/* Status bar */}
        <div className="bg-purple-700 px-6 py-3 flex justify-between items-center text-white text-xs">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <div className="w-4 h-2 border border-white rounded-sm">
              <div className="w-3 h-full bg-white rounded-sm"></div>
            </div>
          </div>
        </div>

        {/* App content */}
        <div className="p-5 space-y-5">
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 text-white">
            <div className="flex items-center justify-between mb-1">
              <span className="text-purple-200 text-sm">Total Balance</span>
              <Shield className="w-4 h-4 text-purple-200" />
            </div>
            <div className="text-3xl font-bold mb-4">$24,580.00</div>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/15 rounded-xl px-3 py-2">
                <div className="text-purple-200 text-xs">USD</div>
                <div className="font-semibold text-sm">$18,450.00</div>
              </div>
              <div className="flex-1 bg-white/15 rounded-xl px-3 py-2">
                <div className="text-purple-200 text-xs">EUR</div>
                <div className="font-semibold text-sm">5,230.00</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: <Send className="w-5 h-5" />, label: 'Send' },
              { icon: <Wallet className="w-5 h-5" />, label: 'Receive' },
              { icon: <CreditCard className="w-5 h-5" />, label: 'Cards' },
              { icon: <Globe className="w-5 h-5" />, label: 'Exchange' }
            ].map((action, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 mx-auto bg-purple-50 rounded-xl flex items-center justify-center text-purple-700 mb-1">
                  {action.icon}
                </div>
                <span className="text-xs text-gray-600">{action.label}</span>
              </div>
            ))}
          </div>

          {/* Recent Transactions */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <span className="font-semibold text-gray-900">Recent Activity</span>
              <span className="text-sm text-purple-600">See all</span>
            </div>
            <div className="space-y-3">
              {[
                { name: 'Transfer to UK', amount: '-2,500.00', currency: 'GBP', type: 'debit' },
                { name: 'Payment Received', amount: '+3,500.00', currency: 'USD', type: 'credit' },
                { name: 'Card Purchase', amount: '-89.99', currency: 'EUR', type: 'debit' }
              ].map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      tx.type === 'credit' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <ArrowRight className={`w-4 h-4 ${
                        tx.type === 'credit' ? 'text-green-600 rotate-[135deg]' : 'text-gray-600 -rotate-45'
                      }`} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{tx.name}</div>
                      <div className="text-xs text-gray-500">{tx.currency}</div>
                    </div>
                  </div>
                  <span className={`text-sm font-semibold ${
                    tx.type === 'credit' ? 'text-green-600' : 'text-gray-900'
                  }`}>
                    {tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Floating cards */}
    <div className="absolute -right-4 top-20 bg-white rounded-xl p-3 shadow-xl border border-gray-100 animate-float">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-4 h-4 text-green-600" />
        </div>
        <div>
          <div className="text-xs text-gray-500">Transfer Complete</div>
          <div className="text-sm font-semibold text-gray-900">+$3,500.00</div>
        </div>
      </div>
    </div>

    <div className="absolute -left-4 bottom-32 bg-white rounded-xl p-3 shadow-xl border border-gray-100 animate-float" style={{ animationDelay: '1s' }}>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
          <Globe className="w-4 h-4 text-purple-600" />
        </div>
        <div>
          <div className="text-xs text-gray-500">150+ Countries</div>
          <div className="text-sm font-semibold text-gray-900">Supported</div>
        </div>
      </div>
    </div>
  </div>
);
