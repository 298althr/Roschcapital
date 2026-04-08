import React from 'react';
import { Star, Building2, Globe, Briefcase, TrendingUp, ChevronDown } from 'lucide-react';

export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: 'Sarah Mitchell',
      role: 'Founder & CEO',
      company: 'Mitchell Retail Group',
      rating: 5,
      text: 'Rosch Capital bridges the gap between modern fintech and traditional banking. I can run payroll for 50 employees and approve wire transfers instantly.',
      initials: 'SM',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      name: 'Marcus Thorne',
      role: 'Principal Broker',
      company: 'Thorne Real Estate',
      rating: 5,
      text: 'In real estate, speed is everything. We move large sums for closings daily. Rosch Capital\'s high limits and instant wire execution have saved us countless deals.',
      initials: 'MT',
      color: 'from-emerald-500 to-green-600'
    },
    {
      name: 'Elena Kova',
      role: 'Director of Operations',
      company: 'Kova Logistics Global',
      rating: 5,
      text: 'We manage imports across 12 countries. Rosch Capital\'s multi-currency accounts allow us to pay suppliers in local currency instantly, avoiding massive FX fees.',
      initials: 'EK',
      color: 'from-purple-500 to-violet-600'
    },
    {
      name: 'James Rodriguez',
      role: 'Creative Director',
      company: 'Rodriguez Design',
      rating: 5,
      text: 'The integration between my business checking and crypto assets is flawless. I can receive payments in USDC and convert to USD for expenses in seconds.',
      initials: 'JR',
      color: 'from-orange-500 to-amber-600'
    },
    {
      name: 'Dr. Emily Chen',
      role: 'Co-Founder',
      company: 'BioTech Innovations',
      rating: 5,
      text: 'As a startup scaling rapidly, we needed a bank that could keep up. The API integration for our accounting software and dedicated support is unmatched.',
      initials: 'EC',
      color: 'from-pink-500 to-rose-600'
    },
    {
      name: 'Robert Vance',
      role: 'Managing Partner',
      company: 'Silverstone Capital',
      rating: 5,
      text: 'For our venture fund, we need robust treasury management. Rosch Capital provides institutional-grade security with the UX of a consumer app.',
      initials: 'RV',
      color: 'from-slate-600 to-slate-800'
    },
    {
      name: 'Sofia Moretti',
      role: 'General Manager',
      company: 'Aurora Hospitality Group',
      rating: 5,
      text: 'Managing finances for 5 hotel locations used to be a nightmare. Rosch Capital centralized everything into one dashboard with sub-accounts for each property.',
      initials: 'SM',
      color: 'from-indigo-500 to-blue-600'
    },
    {
      name: 'David Chen',
      role: 'Senior Partner',
      company: 'Quantum Legal Partners',
      rating: 5,
      text: 'Trust accounts and client fund segregation are critical for us. Rosch Capital made compliance easy while giving us real-time visibility on all transactions.',
      initials: 'DC',
      color: 'from-teal-500 to-emerald-600'
    },
    {
      name: 'Michael Ross',
      role: 'Director',
      company: 'Nexus Construction',
      rating: 5,
      text: 'Paying subcontractors used to take days. Now we do it in batches instantly. The project tagging feature helps us track profitability per site effortlessly.',
      initials: 'MR',
      color: 'from-amber-500 to-orange-600'
    }
  ];

  return (
    <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-100/50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/50 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm mb-6">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="text-sm font-semibold text-slate-700">Trusted by 50,000+ Businesses</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Powering the World's <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-blue-600">Most Ambitious Leaders</span>
          </h2>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            From real estate moguls moving millions to global logistics firms managing complex FX needs, see why business leaders are switching to Rosch Capital.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group hover:-translate-y-1"
            >
              {/* Company & Rating */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-0.5">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <Building2 className="w-3 h-3" />
                  {testimonial.company}
                </div>
              </div>

              {/* Text */}
              <p className="text-slate-700 mb-8 text-lg leading-relaxed italic">
                "{testimonial.text}"
              </p>

              {/* Author Profile */}
              <div className="flex items-center gap-4 pt-6 border-t border-slate-50">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-white font-bold shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  {testimonial.initials}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{testimonial.name}</div>
                  <div className="text-sm text-purple-700 font-medium">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View More Button */}
        <div className="text-center">
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-full text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
            Read more success stories
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
