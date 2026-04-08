import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Lock, Globe } from 'lucide-react';

export const CTASection = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-700 via-purple-800 to-purple-900 relative overflow-hidden">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>

      <div className="max-w-4xl mx-auto relative z-10 text-center">
        {/* Main heading */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
          Start Managing Your Money Globally, Stress Free
        </h2>
        <p className="text-lg text-purple-200 max-w-2xl mx-auto mb-10">
          Join 50,000+ professionals and businesses who trust Rosch Capital for their cross-border banking needs.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Link 
            to="/register"
            className="group px-8 py-4 bg-white text-purple-700 rounded-full font-bold text-lg hover:shadow-xl hover:scale-105 transition-all duration-200 flex items-center gap-3"
          >
            Open Free Account
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            to="/login"
            className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-full font-semibold text-lg hover:bg-white/20 transition-all duration-200"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap justify-center gap-6 text-purple-200 text-sm">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span>Bank-grade security</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span>256-bit encryption</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>150+ countries</span>
          </div>
        </div>
      </div>
    </section>
  );
};
