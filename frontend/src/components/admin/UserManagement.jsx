import React, { useState, useEffect } from 'react';
import { Search, Filter, UserPlus, Edit, Trash2, Eye, MoreVertical, DollarSign, CreditCard, Wallet, ChevronDown, Shield, ExternalLink } from 'lucide-react';
import apiClient from '../../lib/apiClient';
import AddUserModal from './AddUserModal';
import GodModeUserModal from './GodModeUserModal';
import CreditDebitModal from './CreditDebitModal';
import EditUserModal from './EditUserModal';

export const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterKYC, setFilterKYC] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserForMoney, setSelectedUserForMoney] = useState(null);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMoneyModal, setShowMoneyModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filterStatus, filterKYC, searchTerm]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('accountStatus', filterStatus);
      if (filterKYC !== 'all') params.append('kycStatus', filterKYC);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await apiClient.get(`/mybanker/users?${params.toString()}`);
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
    setIsLoading(false);
  };

  const handleViewAsUser = async (userId) => {
    try {
      const response = await apiClient.post(`/mybanker/users/${userId}/impersonate`);
      if (response.success && response.token) {
        // Open dashboard in new tab with the impersonation token
        const dashboardUrl = `${window.location.origin}/dashboard?impersonate=${response.token}`;
        window.open(dashboardUrl, '_blank');
      } else {
        alert('Failed to generate impersonation token');
      }
    } catch (error) {
      console.error('Failed to impersonate user:', error);
      alert('Failed to view as user: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      console.log('Changing status for user', userId, 'to', newStatus);
      const response = await apiClient.put(`/mybanker/users/${userId}/status`, { accountStatus: newStatus });
      console.log('Status change response:', response);
      if (response.success) {
        alert(`Status updated to ${newStatus}`);
      }
      fetchUsers();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await apiClient.delete(`/mybanker/users/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  // Users are now filtered on the backend
  const displayUsers = users;

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'SUSPENDED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'PND': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
      case 'PENDING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'LIMITED': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getKYCColor = (status) => {
    switch (status) {
      case 'VERIFIED': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'PENDING': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
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
      {/* Add User Modal */}
      <AddUserModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchUsers}
      />

      {/* God Mode User Modal */}
      <GodModeUserModal 
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedUser(null);
        }}
        userId={selectedUser}
        onSuccess={fetchUsers}
      />

      {/* Credit/Debit Money Modal */}
      <CreditDebitModal 
        isOpen={showMoneyModal}
        onClose={() => {
          setShowMoneyModal(false);
          setSelectedUserForMoney(null);
        }}
        user={selectedUserForMoney}
        onSuccess={fetchUsers}
      />

      {/* Edit User Modal */}
      <EditUserModal 
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedUserForEdit(null);
        }}
        userId={selectedUserForEdit}
        onSuccess={fetchUsers}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">User Management</h2>
          <p className="text-slate-400 text-sm">Manage all user accounts and permissions</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Account Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="LIMITED">Limited</option>
            <option value="PND">PND (No Debit)</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* KYC Status Filter */}
          <select
            value={filterKYC}
            onChange={(e) => setFilterKYC(e.target.value)}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All KYC Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="REJECTED">Rejected</option>
            <option value="NOT_SUBMITTED">Not Submitted</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Account</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">KYC</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {displayUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    No users found
                  </td>
                </tr>
              ) : (
                displayUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
                          <span className="text-indigo-400 font-semibold">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-slate-400 text-sm">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {user.accounts && user.accounts.length > 0 ? (
                          <div className="relative group">
                            <div className="flex items-center gap-2 cursor-pointer">
                              <Wallet className="w-4 h-4 text-indigo-400" />
                              <span className="text-white font-mono text-sm">
                                {user.accounts.length} Account{user.accounts.length > 1 ? 's' : ''}
                              </span>
                              <ChevronDown className="w-3 h-3 text-slate-400" />
                            </div>
                            {/* Dropdown on hover */}
                            <div className="absolute left-0 top-full mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-20 min-w-[280px] hidden group-hover:block">
                              <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
                                {user.accounts.map((acc, idx) => (
                                  <div 
                                    key={acc.id} 
                                    className={`p-2 rounded ${acc.isPrimary ? 'bg-indigo-500/10 border border-indigo-500/30' : 'hover:bg-slate-800'}`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs text-slate-400">{acc.accountType}</span>
                                      {acc.isPrimary && (
                                        <span className="text-xs bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded">Primary</span>
                                      )}
                                    </div>
                                    <div className="text-white font-mono text-sm">{acc.accountNumber}</div>
                                    <div className="text-green-400 text-sm font-semibold">
                                      {acc.currency === 'USD' ? '$' : acc.currency === 'EUR' ? '€' : acc.currency === 'GBP' ? '£' : acc.currency === 'NGN' ? '₦' : acc.currency} {parseFloat(acc.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-sm">No accounts</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(user.accountStatus)}`}>
                        {user.accountStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getKYCColor(user.kycStatus)}`}>
                        {user.kycStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-semibold flex items-center gap-1">
                        <span className="text-xs text-slate-500 font-normal">Total:</span>
                        ${parseFloat(user.balance || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                      </div>
                      <div className="text-slate-400 text-xs">{user.accountsCount || 0} acct{user.accountsCount !== 1 ? 's' : ''} • {user.cardsCount || 0} card{user.cardsCount !== 1 ? 's' : ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-400 text-sm">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleViewAsUser(user.id)}
                          className="p-2 hover:bg-cyan-600/30 bg-cyan-500/10 rounded-lg transition-colors border border-cyan-500/30"
                          title="View as User (opens in new tab)"
                        >
                          <ExternalLink className="w-4 h-4 text-cyan-400" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user.id);
                            setShowViewModal(true);
                          }}
                          className="p-2 hover:bg-purple-600/30 bg-purple-500/10 rounded-lg transition-colors border border-purple-500/30"
                          title="Open account controls"
                        >
                          <Eye className="w-4 h-4 text-purple-300" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedUserForEdit(user.id);
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit className="w-4 h-4 text-blue-400" />
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedUserForMoney(user);
                            setShowMoneyModal(true);
                          }}
                          className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                          title="Credit/Debit Money"
                        >
                          <DollarSign className="w-4 h-4 text-green-400" />
                        </button>
                        <select
                          value={user.accountStatus}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleStatusChange(user.id, e.target.value);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className={`px-2 py-1 text-xs rounded-lg border cursor-pointer bg-slate-800 ${getStatusColor(user.accountStatus)}`}
                          title="Change Status"
                        >
                          <option value="ACTIVE" className="bg-slate-800 text-green-400">Active</option>
                          <option value="LIMITED" className="bg-slate-800 text-yellow-400">Limited</option>
                          <option value="PND" className="bg-slate-800 text-orange-400">PND</option>
                          <option value="SUSPENDED" className="bg-slate-800 text-red-400">Suspended</option>
                        </select>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Total Users</div>
          <div className="text-2xl font-bold text-white mt-1">{users.length}</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Active</div>
          <div className="text-2xl font-bold text-green-400 mt-1">
            {users.filter(u => u.accountStatus === 'ACTIVE').length}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Suspended</div>
          <div className="text-2xl font-bold text-red-400 mt-1">
            {users.filter(u => u.accountStatus === 'SUSPENDED').length}
          </div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
          <div className="text-slate-400 text-sm">Pending KYC</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">
            {users.filter(u => u.kycStatus === 'PENDING').length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
