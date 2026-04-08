import React from 'react';
import { UserPlus, Wallet, Send, CheckCircle } from 'lucide-react';

export const NewsSection = () => {
  const steps = [
    {
      step: '01',
      icon: <UserPlus className="w-8 h-8" />,
      title: 'Create an account',
      description: 'Sign up in minutes with just your email and ID. No paperwork, no branch visits required.',
      features: ['Instant verification', 'No minimum deposit', 'Free to open']
    },
    {
      step: '02',
      icon: <Wallet className="w-8 h-8" />,
      title: 'Set up your wallet',
      description: 'Add funds and get local bank details in USD, EUR, GBP and more. Start receiving payments immediately.',
      features: ['50+ currencies', 'Local bank details', 'Instant top-up']
    },
    {
      step: '03',
      icon: <Send className="w-8 h-8" />,
      title: 'Start receiving & spending',
      description: 'Get paid from anywhere, convert currencies, and spend with your virtual or physical card.',
      features: ['Global transfers', 'Multi-currency cards', 'Real-time tracking']
    }
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get Started With Rosch Capital in{' '}
            <span className="text-purple-700">Three Simple Steps</span>
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start managing your global finances in minutes
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((item, index) => (
            <div 
              key={index}
              className="relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100"
            >
              {/* Step number */}
              <div className="absolute -top-4 left-8 bg-purple-700 text-white text-sm font-bold px-3 py-1 rounded-full">
                Step {item.step}
              </div>
              
              {/* Icon */}
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-700 mb-6 mt-2">
                {item.icon}
              </div>
              
              {/* Content */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {item.title}
              </h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                {item.description}
              </p>

              {/* Features */}
              <div className="space-y-2">
                {item.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {feature}
                  </div>
                ))}
              </div>

              {/* Connector line (not for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 w-8 h-0.5 bg-purple-200"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
