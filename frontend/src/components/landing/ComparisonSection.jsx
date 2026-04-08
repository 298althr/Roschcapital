import React from 'react';
import { X, Check, Clock, DollarSign, AlertTriangle, Zap, Shield, Globe } from 'lucide-react';

export const ComparisonSection = () => {
  const oldWay = [
    { icon: <Clock className="w-5 h-5" />, text: 'Wait 3-5 days for international transfers' },
    { icon: <DollarSign className="w-5 h-5" />, text: 'Pay high fees and hidden charges' },
    { icon: <AlertTriangle className="w-5 h-5" />, text: 'Limited currency options' },
    { icon: <X className="w-5 h-5" />, text: 'Complex account opening process' },
  ];

  const roschWay = [
    { icon: <Zap className="w-5 h-5" />, text: 'Instant transfers to 150+ countries' },
    { icon: <Shield className="w-5 h-5" />, text: 'Transparent pricing, no hidden fees' },
    { icon: <Globe className="w-5 h-5" />, text: '50+ currencies supported' },
    { icon: <Check className="w-5 h-5" />, text: 'Open account in 5 minutes' },
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            The Old Way vs <span className="text-purple-700">The Rosch Capital Way</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See how we make global banking simple
          </p>
        </div>

        {/* Comparison Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Old Way Card */}
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <X className="w-5 h-5 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-700">Old Way</h3>
            </div>
            <div className="space-y-4">
              {oldWay.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center text-red-500 flex-shrink-0 mt-0.5">
                    {item.icon}
                  </div>
                  <span className="text-gray-600">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Rosch Capital Way Card */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-8 text-white relative overflow-hidden">
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">With Rosch Capital</h3>
              </div>
              <div className="space-y-4">
                {roschWay.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                      {item.icon}
                    </div>
                    <span className="text-purple-100">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
