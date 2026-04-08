import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, AlertTriangle, Info, CheckCircle } from 'lucide-react';
import apiClient from '../../lib/apiClient';

export const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');

  useEffect(() => {
    fetchAuditLogs();
  }, [filterAction, filterSeverity]);

  const fetchAuditLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filterAction !== 'all') params.append('action', filterAction);
      if (filterSeverity !== 'all') params.append('severity', filterSeverity);
      
      const response = await apiClient.get(`/mybanker/audit-logs?${params.toString()}`);
      setLogs(response.logs || []);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
    setIsLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.action?.toLowerCase().includes(searchLower) ||
      log.user?.email?.toLowerCase().includes(searchLower) ||
      log.ipAddress?.includes(searchTerm)
    );
  });

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'HIGH': return <AlertTriangle className="w-5 h-5 text-red-400" />;
      case 'MEDIUM': return <Info className="w-5 h-5 text-amber-400" />;
      case 'LOW': return <CheckCircle className="w-5 h-5 text-green-400" />;
      default: return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'MEDIUM': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'LOW': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Audit Logs</h2>
        <p className="text-slate-400 text-sm">Monitor security events and user activities</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Total Events</div>
          <div className="text-2xl font-bold text-white mt-1">{logs.length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">High Severity</div>
          <div className="text-2xl font-bold text-red-400 mt-1">
            {logs.filter(l => l.severity === 'HIGH').length}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Medium Severity</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {logs.filter(l => l.severity === 'MEDIUM').length}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Low Severity</div>
          <div className="text-2xl font-bold text-green-400 mt-1">
            {logs.filter(l => l.severity === 'LOW').length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Action Filter */}
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Actions</option>
            <option value="LOGIN">Login</option>
            <option value="LOGOUT">Logout</option>
            <option value="FAILED_LOGIN">Failed Login</option>
            <option value="PASSWORD_CHANGE">Password Change</option>
            <option value="TRANSACTION">Transaction</option>
            <option value="KYC_SUBMISSION">KYC Submission</option>
          </select>

          {/* Severity Filter */}
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Severity</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Logs Timeline */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Audit Logs Found</h3>
            <p className="text-slate-400">No events match your current filters</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredLogs.map((log) => (
              <div key={log.id} className="p-6 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getSeverityIcon(log.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <h3 className="text-white font-semibold">{log.action}</h3>
                        <p className="text-slate-400 text-sm mt-1">{log.description}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-slate-400">
                      <div>
                        <span className="font-medium">User:</span> {log.user?.email || 'System'}
                      </div>
                      <div>
                        <span className="font-medium">IP:</span> {log.ipAddress || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Time:</span> {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </div>
                    {log.metadata && (
                      <div className="mt-3 p-3 bg-slate-900 rounded-lg">
                        <pre className="text-xs text-slate-300 overflow-x-auto">
                          {JSON.stringify(log.metadata, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
