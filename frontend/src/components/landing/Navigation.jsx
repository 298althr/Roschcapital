import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, ArrowRight } from 'lucide-react';
import { Logo } from '../ui/Logo';

export const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { href: '#features', label: 'Features' },
    { href: '#how-it-works', label: 'How It Works' },
    { href: '#testimonials', label: 'Reviews' },
    { href: '#faq', label: 'FAQ' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100 py-3' 
        : 'bg-transparent py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <Logo size="md" />
          </Link>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a 
                key={link.href}
                href={link.href} 
                className="text-slate-600 hover:text-purple-700 font-medium transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link 
              to="/login" 
              className="px-5 py-2.5 text-slate-600 hover:text-purple-700 font-medium transition-colors duration-200"
            >
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="group px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-full font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg shadow-purple-700/20 hover:shadow-purple-700/30 hover:-translate-y-0.5"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-700"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden transition-all duration-300 overflow-hidden bg-white absolute w-full shadow-xl border-t border-slate-100 ${
        mobileMenuOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="px-4 py-6 space-y-4">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <a 
                key={link.href}
                href={link.href} 
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-3 text-slate-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl font-medium transition-all duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>
          
          <div className="pt-4 border-t border-slate-100 grid gap-3">
            <Link 
              to="/login" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center px-4 py-3 text-slate-700 font-semibold bg-slate-50 rounded-xl hover:bg-slate-100"
            >
              Sign In
            </Link>
            <Link 
              to="/register" 
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center px-4 py-3 bg-purple-700 text-white font-semibold rounded-xl hover:bg-purple-800 shadow-lg shadow-purple-700/20"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
