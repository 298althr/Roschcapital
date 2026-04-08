import React, { useState, useEffect } from 'react';
import { HeroSection } from '../components/landing/HeroSection';
import { TrustBadges } from '../components/landing/TrustBadges';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { ServicesSection } from '../components/landing/ServicesSection';
import { TestimonialsSection } from '../components/landing/TestimonialsSection';
import { ComparisonSection } from '../components/landing/ComparisonSection';
import { NewsSection } from '../components/landing/NewsSection';
import { CTASection } from '../components/landing/CTASection';
import { Footer } from '../components/landing/Footer';
import { Navigation } from '../components/landing/Navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';
import CookieConsent from '../components/CookieConsent';

// FAQ Section Component
const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How do I open a Rosch Capital Bank account?',
      answer: 'Opening an account takes just 5 minutes. Simply download our app or sign up online, verify your identity with a valid ID, and you\'re ready to start banking globally.'
    },
    {
      question: 'What currencies does Rosch Capital Bank support?',
      answer: 'We support over 50 currencies including USD, EUR, GBP, CAD, AUD, and many more. You can hold, send, and receive money in multiple currencies from a single account.'
    },
    {
      question: 'How fast are international transfers?',
      answer: 'Most international transfers arrive within minutes. For some currencies and destinations, transfers may take up to 1-2 business days depending on local banking systems.'
    },
    {
      question: 'Is my money safe with Rosch Capital Bank?',
      answer: 'Yes. We use bank-grade security including 256-bit encryption, two-factor authentication, and 24/7 fraud monitoring. Customer funds are held with licensed partner banks.'
    },
    {
      question: 'What are the fees for using Rosch Capital Bank?',
      answer: 'We believe in transparent pricing. Account opening is free, and we charge minimal fees for currency exchange at competitive mid-market rates. No hidden fees, ever.'
    }
  ];

  return (
    <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Frequently Asked <span className="text-purple-700">Questions</span>
          </h2>
          <p className="text-lg text-gray-600">
            Everything you need to know about Rosch Capital Bank
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              <div 
                className={`transition-all duration-300 ease-in-out ${
                  openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                } overflow-hidden`}
              >
                <div className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const LandingPageV2 = () => {
  const [activeFeature, setActiveFeature] = useState(0);

  // Auto-rotate features every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 5);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <Navigation />
      <HeroSection />
      <TrustBadges />
      <ServicesSection />
      <FeaturesSection activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
      <ComparisonSection />
      <TestimonialsSection />
      <NewsSection />
      <FAQSection />
      <CTASection />
      <Footer />
      
      {/* Cookie Consent Banner */}
      <CookieConsent />
    </div>
  );
};
