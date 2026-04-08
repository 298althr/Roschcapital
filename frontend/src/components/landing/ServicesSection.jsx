import React from 'react';
import { Landmark, Globe, Briefcase, Phone, ArrowRight, ShieldCheck, RefreshCw, Building } from 'lucide-react';

export const ServicesSection = () => {
  const services = [
    {
      icon: Landmark,
      title: 'Enterprise-Grade Treasury',
      description: 'Move large sums with confidence. We offer high-limit wire transfers (domestic & international), ACH batches, and real-time gross settlement.',
      features: ['Same-day Wire Transfers', 'High Transaction Limits', 'Bulk Payment Processing'],
      color: 'bg-blue-50 text-blue-700'
    },
    {
      icon: Globe,
      title: 'Global Banking Power',
      description: 'Operate locally in 30+ countries. Get local IBANs and account details to pay and get paid like a local business, without the foreign entity headache.',
      features: ['30+ Local Currencies', 'Instant FX Conversion', 'No Hidden Foreign Fees'],
      color: 'bg-purple-50 text-purple-700'
    },
    {
      icon: Briefcase,
      title: 'Business Operations',
      description: 'Streamline your back office. Integrate directly with Xero, QuickBooks, and major payroll providers. Automate recurring payments and vendor settlements.',
      features: ['Payroll Integration', 'Automated Expense Sync', 'Vendor Management'],
      color: 'bg-emerald-50 text-emerald-700'
    },
    {
      icon: ShieldCheck,
      title: 'Concierge Support',
      description: 'Forget chat bots. Our business clients get dedicated account managers who understand your industry and can help navigate complex financial needs.',
      features: ['Dedicated Banker', 'Priority Phone Support', 'Strategic Financial Planning'],
      color: 'bg-amber-50 text-amber-700'
    }
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 rounded-full mb-6">
              <Building className="w-4 h-4 text-purple-700" />
              <span className="text-sm font-semibold text-purple-900">Regional Bank Capabilities</span>
            </div>
            <h2 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
              Digital Speed. <br />
              <span className="text-purple-700">Institutional Power.</span>
            </h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              We've combined the agility of a fintech with the robust capabilities of a top-tier regional bank. Whether you need to wire $500,000 for a closing or manage payroll for a global team, Rosch Capital is built to handle serious business.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                <span className="font-medium text-slate-700">FDIC Insured up to $250k</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-slate-700">Real-time Clearing</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl transform rotate-3"></div>
            <img 
              src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1632&q=80" 
              alt="Business meeting" 
              className="relative rounded-3xl shadow-2xl w-full object-cover h-[400px]"
            />
            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-xl border border-slate-100 max-w-xs">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Landmark className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Wire Transfer</p>
                  <p className="font-bold text-slate-900">$250,000.00</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                <ShieldCheck className="w-4 h-4" />
                <span>Cleared & Settled</span>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div key={index} className="group bg-white p-6 rounded-2xl border border-slate-100 hover:border-purple-200 hover:shadow-xl transition-all duration-300">
              <div className={`w-14 h-14 ${service.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <service.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
              <p className="text-slate-600 mb-6 text-sm leading-relaxed h-20">
                {service.description}
              </p>
              <ul className="space-y-3 mb-6">
                {service.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-slate-700 font-medium leading-relaxed"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1"></div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <a href="#" className="inline-flex items-center text-purple-700 font-semibold hover:gap-2 transition-all text-sm">
                Learn more <ArrowRight className="w-4 h-4 ml-1" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
