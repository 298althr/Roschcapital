import React from 'react';
import { X, Building2 } from 'lucide-react';

export const InfoModal = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-purple-100 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-purple-100 border-b border-purple-200 px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-700 to-purple-900 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-purple-950">{title}</h2>
              <p className="text-sm text-purple-800">Rosch Capital Bank</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg bg-purple-200 hover:bg-purple-300 flex items-center justify-center text-purple-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6">
          <div className="prose prose-purple max-w-none text-purple-950">
            {content}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-purple-100 border-t border-purple-200 px-8 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gradient-to-r from-purple-700 to-purple-900 text-white rounded-lg hover:from-purple-800 hover:to-purple-950 transition-all font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
