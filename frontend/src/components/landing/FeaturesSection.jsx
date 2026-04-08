import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, CreditCard, RefreshCw, Shield, Globe, Send, Zap, BarChart3, ArrowRight, Smartphone, Lock, Sparkles } from 'lucide-react';

export const FeaturesSection = ({ activeFeature, setActiveFeature }) => {
  const features = [
    {
      icon: Wallet,
      title: 'Multi-Currency Wallets',
      description: 'Hold 50+ currencies in one account. Instant conversion at real exchange rates.',
      gradient: 'from-purple-500 to-violet-600'
    },
    {
      icon: Zap,
      title: 'Instant Transfers',
      description: 'Send money globally in seconds. No delays, no hidden fees.',
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      icon: CreditCard,
      title: 'Premium Cards',
      description: 'Virtual & physical cards that work worldwide. Earn rewards on every purchase.',
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      icon: Shield,
      title: 'Bank-Grade Security',
      description: '256-bit encryption, 2FA, biometrics, and 24/7 fraud monitoring.',
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Track spending, set budgets, and get AI-powered financial insights.',
      gradient: 'from-blue-500 to-cyan-600'
    },
    {
      icon: Smartphone,
      title: 'Mobile-First Design',
      description: 'Full banking power in your pocket. Manage everything on the go.',
      gradient: 'from-violet-500 to-purple-600'
    },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white via-purple-50/30 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-purple-100/50 to-transparent"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>
      
      <div className="max-w-7xl mx-auto relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-semibold text-purple-700">Powerful Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
            Everything You Need to
            <br />
            <span className="bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent">
              Bank Smarter
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Modern banking tools designed for the digital age. No legacy systems, just pure innovation.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative bg-white rounded-3xl p-8 border border-gray-100 hover:border-purple-200 shadow-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 cursor-pointer overflow-hidden"
            >
              {/* Hover gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-violet-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              
              <div className="relative">
                {/* Icon */}
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                
                {/* Content */}
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-900 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Learn more link */}
                <div className="mt-4 flex items-center gap-2 text-purple-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span>Learn more</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="relative bg-gradient-to-r from-purple-900 via-purple-800 to-violet-900 rounded-3xl p-8 md:p-12 overflow-hidden">
          {/* Background patterns */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet-500 rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                Ready to experience modern banking?
              </h3>
              <p className="text-purple-200 text-lg">
                Join 50,000+ users who switched to smarter banking. It's free to start.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/register"
                className="group px-8 py-4 bg-white text-purple-900 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105 hover:shadow-xl"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a 
                href="#how-it-works"
                className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl font-semibold text-lg transition-all duration-300 flex items-center justify-center gap-2 hover:bg-white/20"
              >
                <Globe className="w-5 h-5" />
                See How It Works
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
