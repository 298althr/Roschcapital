import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DecLoginPage = () => {
  const navigate = useNavigate();
  const { devLogin } = useAuth();

  const handleUserLogin = () => {
    const result = devLogin({
      id: 'dev-user',
      email: 'customer@roschcapital.test',
      firstName: 'Demo',
      lastName: 'Customer',
      isAdmin: false,
    });

    if (result?.success) {
      navigate('/dashboard');
    }
  };

  const handleAdminLogin = () => {
    const result = devLogin({
      id: 'dev-admin',
      email: 'admin@roschcapital.test',
      firstName: 'Demo',
      lastName: 'Admin',
      isAdmin: true,
    });

    if (result?.success) {
      navigate('/mybanker');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-lg font-semibold text-slate-900">Dev Login</h1>
          <p className="text-xs text-slate-500">
            This page is for local development only. It skips real authentication so you can preview
            the Rosch Capital Bank dashboards without a running backend.
          </p>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleUserLogin}
            className="w-full inline-flex items-center justify-center rounded-xl bg-purple-700 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5"
          >
            View User Dashboard
          </button>

          <button
            type="button"
            onClick={handleAdminLogin}
            className="w-full inline-flex items-center justify-center rounded-xl bg-slate-900 hover:bg-black text-white text-sm font-medium px-4 py-2.5"
          >
            View Admin Dashboard
          </button>
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          When you are ready for real testing, use the normal login flow and remove this dev-only
          page before production.
        </p>
      </div>
    </div>
  );
};

export default DecLoginPage;
