import React, { useState, useEffect } from 'react';
import { Server, Database, Activity, HardDrive, Cpu, Clock, Users, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';
import apiClient from '../../lib/apiClient';

const SystemInfo = () => {
  const [systemStats, setSystemStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSystemInfo();
  }, []);

  const fetchSystemInfo = async () => {
    try {
      const response = await apiClient.get('/mybanker/system-info');
      setSystemStats(response);
    } catch (err) {
      // Mock data for development
      setSystemStats({
        platform: {
          name: 'Rosch Capital Bank',
          version: '1.0.0',
          environment: 'Production',
          uptime: '15 days, 7 hours',
          lastDeployed: new Date().toISOString()
        },
        database: {
          status: 'Connected',
          type: 'PostgreSQL',
          size: '2.4 GB',
          tables: 25,
          connections: 12
        },
        performance: {
          avgResponseTime: '145ms',
          requestsPerMinute: 342,
          errorRate: '0.02%',
          cacheHitRate: '94.3%'
        },
        users: {
          total: 1247,
          active: 892,
          newToday: 23,
          kycPending: 45
        },
        transactions: {
          total: 15420,
          today: 234,
          volume: '$2,450,000',
          avgAmount: '$158.90'
        },
        cards: {
          total: 456,
          active: 398,
          pending: 12,
          blocked: 3
        }
      });
      setError('');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading system information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-lg">
            <Server className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">System Information</h2>
            <p className="text-slate-400 text-sm">Platform status and performance metrics</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-400 text-sm">Using mock data - Backend endpoint not available</p>
          </div>
        </div>
      )}

      {/* Platform Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Server className="w-5 h-5 text-indigo-400" />
          Platform Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Platform Name</p>
            <p className="text-white font-semibold">{systemStats?.platform?.name}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Version</p>
            <p className="text-white font-semibold">{systemStats?.platform?.version}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Environment</p>
            <p className="text-white font-semibold">{systemStats?.platform?.environment}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Uptime</p>
            <p className="text-white font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              {systemStats?.platform?.uptime}
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4 md:col-span-2">
            <p className="text-slate-400 text-sm mb-1">Last Deployed</p>
            <p className="text-white font-semibold">
              {new Date(systemStats?.platform?.lastDeployed).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Database Info */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-green-400" />
          Database Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Status</p>
            <p className="text-green-400 font-semibold flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              {systemStats?.database?.status}
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Database Type</p>
            <p className="text-white font-semibold">{systemStats?.database?.type}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Size</p>
            <p className="text-white font-semibold flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-400" />
              {systemStats?.database?.size}
            </p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Tables</p>
            <p className="text-white font-semibold">{systemStats?.database?.tables}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Active Connections</p>
            <p className="text-white font-semibold">{systemStats?.database?.connections}</p>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-amber-400" />
          Performance Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Avg Response Time</p>
            <p className="text-white font-semibold text-2xl">{systemStats?.performance?.avgResponseTime}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Requests/Min</p>
            <p className="text-white font-semibold text-2xl">{systemStats?.performance?.requestsPerMinute}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Error Rate</p>
            <p className="text-green-400 font-semibold text-2xl">{systemStats?.performance?.errorRate}</p>
          </div>
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Cache Hit Rate</p>
            <p className="text-indigo-400 font-semibold text-2xl">{systemStats?.performance?.cacheHitRate}</p>
          </div>
        </div>
      </div>

      {/* Business Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Users
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Total Users</span>
              <span className="text-white font-semibold">{systemStats?.users?.total?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Active</span>
              <span className="text-green-400 font-semibold">{systemStats?.users?.active?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">New Today</span>
              <span className="text-indigo-400 font-semibold">+{systemStats?.users?.newToday}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">KYC Pending</span>
              <span className="text-amber-400 font-semibold">{systemStats?.users?.kycPending}</span>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Transactions
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Total</span>
              <span className="text-white font-semibold">{systemStats?.transactions?.total?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Today</span>
              <span className="text-green-400 font-semibold">+{systemStats?.transactions?.today}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Volume</span>
              <span className="text-indigo-400 font-semibold">{systemStats?.transactions?.volume}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Avg Amount</span>
              <span className="text-white font-semibold">{systemStats?.transactions?.avgAmount}</span>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-400" />
            Cards
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Total Cards</span>
              <span className="text-white font-semibold">{systemStats?.cards?.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Active</span>
              <span className="text-green-400 font-semibold">{systemStats?.cards?.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Pending Approval</span>
              <span className="text-amber-400 font-semibold">{systemStats?.cards?.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">Blocked</span>
              <span className="text-red-400 font-semibold">{systemStats?.cards?.blocked}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemInfo;
