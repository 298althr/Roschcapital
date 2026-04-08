import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Shield, Lock, FileCheck } from 'lucide-react';
import { InfoModal } from '../modals/InfoModal';
import { modalContent } from '../../data/modalContent.jsx';
import { productsCompanyModals } from '../../data/productsCompanyModals.jsx';

export const Footer = () => {
  const [activeModal, setActiveModal] = useState(null);

  const openModal = (modalKey) => {
    setActiveModal(modalKey);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <footer className="bg-gray-900 text-gray-300">
      {/* Compliance Bar */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <span>KYC/AML Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <span>PCI-DSS Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-purple-400" />
              <span>GDPR Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Rosch Capital Bank</span>
            </div>
            <p className="text-gray-400 text-sm mb-4 max-w-sm">
              Global banking made simple. Send, receive, and manage money across borders with enterprise-grade security.
            </p>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Products</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => openModal('personalBanking')} className="hover:text-purple-400 transition-colors text-left">Personal Banking</button></li>
              <li><button onClick={() => openModal('businessBanking')} className="hover:text-purple-400 transition-colors text-left">Business Banking</button></li>
              <li><button onClick={() => openModal('cryptoWallets')} className="hover:text-purple-400 transition-colors text-left">Multi-Currency</button></li>
              <li><button onClick={() => openModal('creditCards')} className="hover:text-purple-400 transition-colors text-left">Virtual Cards</button></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => openModal('aboutUs')} className="hover:text-purple-400 transition-colors text-left">About Us</button></li>
              <li><button onClick={() => openModal('careers')} className="hover:text-purple-400 transition-colors text-left">Careers</button></li>
              <li><button onClick={() => openModal('pressMedia')} className="hover:text-purple-400 transition-colors text-left">Press</button></li>
              <li><button onClick={() => openModal('blogResources')} className="hover:text-purple-400 transition-colors text-left">Blog</button></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => openModal('privacy')} className="hover:text-purple-400 transition-colors text-left">Privacy Policy</button></li>
              <li><button onClick={() => openModal('terms')} className="hover:text-purple-400 transition-colors text-left">Terms of Service</button></li>
              <li><button onClick={() => openModal('cookies')} className="hover:text-purple-400 transition-colors text-left">Cookie Policy</button></li>
              <li><button onClick={() => openModal('security')} className="hover:text-purple-400 transition-colors text-left">Security</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">
              2025 Rosch Capital Bank. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="mailto:support@roschcapital.com" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
                support@roschcapital.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal && (
        <InfoModal
          isOpen={!!activeModal}
          onClose={closeModal}
          title={modalContent[activeModal]?.title || productsCompanyModals[activeModal]?.title}
          content={modalContent[activeModal]?.content || productsCompanyModals[activeModal]?.content}
        />
      )}
    </footer>
  );
};
