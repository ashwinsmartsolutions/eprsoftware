import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Receipt,
  FileText,
  Settings,
  LogOut,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  UserCircle,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Activity,
  Database,
  Clock,
  Filter,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  X,
  Key,
  Power,
  ArrowLeftRight
} from 'lucide-react';
import { adminAPI } from '../services/api';

// Tab Components
const DashboardTab = ({ stats, recentActivity }) => {
  if (!stats) return <div className="p-8 text-center">Loading...</div>;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: 'blue' },
    { label: 'Franchises', value: stats.totalFranchises || 0, icon: Building2, color: 'green' },
    { label: 'Shops', value: stats.totalShops || 0, icon: Building2, color: 'purple' },
    { label: 'Online Users', value: stats.onlineUsers || 0, icon: Activity, color: 'orange' },
    { label: 'Transactions', value: stats.totalTransactions || 0, icon: Receipt, color: 'pink' },
    { label: 'Total Sales', value: stats.totalSales || 0, icon: CheckCircle, color: 'teal' },
  ];

  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    teal: 'from-teal-500 to-teal-600',
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value.toLocaleString()}</p>
                </div>
                <div className={`bg-gradient-to-br ${colors[card.color]} p-3 rounded-xl`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Recent Admin Activity</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {recentActivity?.slice(0, 10).map((activity, idx) => (
            <div key={idx} className="p-4 flex items-center gap-4 hover:bg-gray-50">
              <div className="bg-gray-100 p-2 rounded-lg">
                <Activity className="h-4 w-4 text-gray-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.performedBy?.username || 'Unknown'} - {activity.action}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${activity.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {activity.success ? 'Success' : 'Failed'}
              </span>
            </div>
          ))}
          {(!recentActivity || recentActivity.length === 0) && (
            <p className="p-8 text-center text-gray-500">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
};

const UserManagementTab = ({ users, pagination, onPageChange, onRefresh, onEdit, onDelete, onToggleStatus, onResetPassword }) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'franchise', franchiseId: '' });
  const [franchises, setFranchises] = useState([]);

  useEffect(() => {
    const fetchFranchises = async () => {
      try {
        const res = await adminAPI.getFranchises();
        setFranchises(res.data.franchises || []);
      } catch (error) {
        console.error('Error fetching franchises:', error);
      }
    };
    fetchFranchises();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.createUser(newUser);
      setShowCreateModal(false);
      setNewUser({ username: '', email: '', password: '', role: 'franchise', franchiseId: '' });
      onRefresh();
    } catch (error) {
      alert(error.response?.data?.message || 'Error creating user');
    }
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch = !search || 
      user.username?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    const matchesStatus = statusFilter === '' || user.isActive === (statusFilter === 'true');
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const roles = [
    { value: 'super_admin', label: 'Super Admin', color: 'bg-red-100 text-red-700' },
    { value: 'owner', label: 'Owner', color: 'bg-blue-100 text-blue-700' },
    { value: 'franchise', label: 'Franchise', color: 'bg-green-100 text-green-700' },
    { value: 'distributor', label: 'Distributor', color: 'bg-purple-100 text-purple-700' },
  ];

  return (
    <div className="space-y-4">
      {/* Filters & Actions */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent w-64"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Roles</option>
              {roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <button onClick={onRefresh} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <Plus className="h-4 w-4" />
            Create User
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Franchise</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const roleConfig = roles.find(r => r.value === user.role) || roles[2];
                return (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2 rounded-full">
                          <UserCircle className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.username}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleConfig.color}`}>
                        {roleConfig.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.franchiseId?.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.lastActive ? new Date(user.lastActive).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(user)}
                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onToggleStatus(user)}
                          className={`p-1.5 rounded-lg ${user.isActive ? 'text-green-600 hover:bg-green-50' : 'text-red-600 hover:bg-red-50'}`}
                          title={user.isActive ? 'Deactivate' : 'Activate'}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onResetPassword(user)}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                          title="Reset Password"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(user)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Create New User</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  {roles.filter(r => r.value !== 'super_admin').map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              {newUser.role === 'franchise' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Franchise</label>
                  <select
                    value={newUser.franchiseId}
                    onChange={(e) => setNewUser({...newUser, franchiseId: e.target.value})}
                    required={newUser.role === 'franchise'}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Franchise</option>
                    {franchises.map(f => (
                      <option key={f._id} value={f._id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const FranchiseManagementTab = ({ franchises, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [stockForm, setStockForm] = useState({
    orange: 0, blueberry: 0, jira: 0, lemon: 0, mint: 0, guava: 0
  });

  const filteredFranchises = franchises?.filter(f => 
    !search || f.name?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const handleViewAudit = async (franchise) => {
    try {
      const res = await adminAPI.getFranchiseAudit(franchise._id);
      setAuditData(res.data.audit);
      setSelectedFranchise(franchise);
      setShowAuditModal(true);
    } catch (error) {
      alert('Error loading audit data');
    }
  };

  const handleOverrideStock = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.overrideFranchiseStock(selectedFranchise._id, {
        stock: stockForm,
        reason: 'Admin override'
      });
      setShowStockModal(false);
      onRefresh();
      alert('Stock updated successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating stock');
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search franchises..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 w-full"
            />
          </div>
          <button onClick={onRefresh} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Franchises Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFranchises.map((franchise) => (
          <div key={franchise._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{franchise.name}</h3>
                <p className="text-sm text-gray-500">{franchise.email}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${franchise.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                {franchise.status}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Total Stock</p>
                <p className="font-semibold text-gray-900">
                  {Object.values(franchise.stock || {}).reduce((a, b) => a + b, 0)}
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500">Total Sold</p>
                <p className="font-semibold text-gray-900">{franchise.totalSold || 0}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleViewAudit(franchise)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Eye className="h-4 w-4" />
                Audit
              </button>
              <button
                onClick={() => {
                  setSelectedFranchise(franchise);
                  setStockForm(franchise.stock || { orange: 0, blueberry: 0, jira: 0, lemon: 0, mint: 0, guava: 0 });
                  setShowStockModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
              >
                <Edit2 className="h-4 w-4" />
                Override Stock
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Audit Modal */}
      {showAuditModal && auditData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">
                Franchise Audit: {selectedFranchise?.name}
              </h3>
              <button onClick={() => setShowAuditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Shops</p>
                  <p className="text-2xl font-bold text-gray-900">{auditData.stats?.totalShops || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{auditData.stats?.totalSales || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Total Returns</p>
                  <p className="text-2xl font-bold text-gray-900">{auditData.stats?.totalReturns || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Productions</p>
                  <p className="text-2xl font-bold text-gray-900">{auditData.stats?.totalProductions || 0}</p>
                </div>
              </div>

              {/* Stock */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Current Stock</h4>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {Object.entries(auditData.franchise?.stock || {}).map(([flavor, qty]) => (
                    <div key={flavor} className="bg-blue-50 p-3 rounded-lg text-center">
                      <p className="text-xs text-blue-600 capitalize">{flavor}</p>
                      <p className="font-bold text-blue-900">{qty}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Transactions */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Transactions</h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-left">Quantity</th>
                        <th className="px-4 py-2 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {auditData.transactions?.slice(0, 10).map((t, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 capitalize">{t.type}</td>
                          <td className="px-4 py-2">{t.totalQuantity}</td>
                          <td className="px-4 py-2">{new Date(t.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Override Modal */}
      {showStockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Override Stock: {selectedFranchise?.name}</h3>
              <button onClick={() => setShowStockModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleOverrideStock} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.keys(stockForm).map((flavor) => (
                  <div key={flavor}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{flavor}</label>
                    <input
                      type="number"
                      min="0"
                      value={stockForm[flavor]}
                      onChange={(e) => setStockForm({...stockForm, [flavor]: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStockModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                >
                  Override Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const TransactionsTab = ({ transactions, pagination, onPageChange, onRefresh, onDelete }) => {
  const [filters, setFilters] = useState({ type: '', franchiseId: '', startDate: '', endDate: '' });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filters.type}
            onChange={(e) => setFilters({...filters, type: e.target.value})}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Types</option>
            <option value="sale">Sale</option>
            <option value="stock_allocation">Stock Allocation</option>
            <option value="empty_bottle_return">Empty Bottle Return</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="End Date"
          />
          <button onClick={onRefresh} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Franchise</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shop</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions?.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      t.type === 'sale' ? 'bg-green-100 text-green-700' :
                      t.type === 'stock_allocation' ? 'bg-blue-100 text-blue-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{t.franchiseId?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{t.shopId?.name || '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.totalQuantity}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => onDelete(t)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transactions
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AuditLogsTab = ({ logs, pagination, onPageChange, onRefresh }) => {
  const [filters, setFilters] = useState({ action: '', startDate: '', endDate: '' });

  const actionColors = {
    user_create: 'bg-green-100 text-green-700',
    user_update: 'bg-blue-100 text-blue-700',
    user_delete: 'bg-red-100 text-red-700',
    user_reset_password: 'bg-amber-100 text-amber-700',
    stock_override: 'bg-purple-100 text-purple-700',
    transaction_delete: 'bg-red-100 text-red-700',
    system_cleanup: 'bg-gray-100 text-gray-700',
    impersonate_start: 'bg-pink-100 text-pink-700',
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filters.action}
            onChange={(e) => setFilters({...filters, action: e.target.value})}
            className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">All Actions</option>
            <option value="user_create">User Create</option>
            <option value="user_update">User Update</option>
            <option value="user_delete">User Delete</option>
            <option value="stock_override">Stock Override</option>
            <option value="transaction_delete">Transaction Delete</option>
            <option value="system_cleanup">System Cleanup</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            className="px-3 py-2 border border-gray-200 rounded-lg"
          />
          <button onClick={onRefresh} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performed By</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs?.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${actionColors[log.action] || 'bg-gray-100 text-gray-700'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {log.performedBy?.username || 'Unknown'}
                    <span className="text-xs text-gray-500 block">{log.performedByRole}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {log.targetUser?.username || log.targetFranchise?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {JSON.stringify(log.details || {}).substring(0, 50)}...
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {pagination && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <div className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="p-2 border border-gray-200 rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Admin Panel Component
const AdminPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [dashboardStats, setDashboardStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [userPagination, setUserPagination] = useState(null);
  const [franchises, setFranchises] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transactionPagination, setTransactionPagination] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditPagination, setAuditPagination] = useState(null);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [tempPassword, setTempPassword] = useState('');

  useEffect(() => {
    // Redirect if not super_admin
    if (user && user.role !== 'super_admin') {
      navigate('/');
    }
  }, [user, navigate]);

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'dashboard') loadDashboard();
    else if (activeTab === 'users') loadUsers();
    else if (activeTab === 'franchises') loadFranchises();
    else if (activeTab === 'transactions') loadTransactions();
    else if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab]);

  const loadDashboard = async () => {
    try {
      const res = await adminAPI.getDashboardStats();
      setDashboardStats(res.data.stats);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadUsers = async (page = 1) => {
    try {
      const res = await adminAPI.getUsers({ page, limit: 20 });
      setUsers(res.data.users);
      setUserPagination(res.data.pagination);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadFranchises = async () => {
    try {
      const res = await adminAPI.getFranchises();
      setFranchises(res.data.franchises);
    } catch (error) {
      console.error('Error loading franchises:', error);
    }
  };

  const loadTransactions = async (page = 1) => {
    try {
      const res = await adminAPI.getTransactions({ page, limit: 50 });
      setTransactions(res.data.transactions);
      setTransactionPagination(res.data.pagination);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadAuditLogs = async (page = 1) => {
    try {
      const res = await adminAPI.getAuditLogs({ page, limit: 50 });
      setAuditLogs(res.data.logs);
      setAuditPagination(res.data.summary);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  // User actions
  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleToggleStatus = async (user) => {
    try {
      await adminAPI.toggleUserStatus(user._id);
      loadUsers(userPagination?.page || 1);
    } catch (error) {
      alert(error.response?.data?.message || 'Error toggling status');
    }
  };

  const handleResetPassword = async (user) => {
    setSelectedUser(user);
    setShowResetPasswordModal(true);
    try {
      const res = await adminAPI.resetUserPassword(user._id);
      setTempPassword(res.data.tempPassword);
    } catch (error) {
      alert(error.response?.data?.message || 'Error resetting password');
    }
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
    setPasswordConfirm('');
  };

  const confirmDeleteUser = async () => {
    try {
      await adminAPI.deleteUser(selectedUser._id, passwordConfirm);
      setShowDeleteModal(false);
      loadUsers(userPagination?.page || 1);
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting user');
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    
    const password = prompt('Enter your password to confirm:');
    if (!password) return;

    try {
      await adminAPI.deleteTransaction(transaction._id, password);
      loadTransactions(transactionPagination?.page || 1);
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting transaction');
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'franchises', label: 'Franchises', icon: Building2 },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-xl">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Super Admin Panel</h1>
                <p className="text-xs text-gray-500">System Management Console</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                <p className="text-xs text-red-600 font-medium">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <DashboardTab stats={dashboardStats} recentActivity={[]} />
        )}
        
        {activeTab === 'users' && (
          <UserManagementTab
            users={users}
            pagination={userPagination}
            onPageChange={loadUsers}
            onRefresh={() => loadUsers(userPagination?.page || 1)}
            onEdit={handleEditUser}
            onDelete={handleDeleteUser}
            onToggleStatus={handleToggleStatus}
            onResetPassword={handleResetPassword}
          />
        )}
        
        {activeTab === 'franchises' && (
          <FranchiseManagementTab
            franchises={franchises}
            onRefresh={loadFranchises}
          />
        )}
        
        {activeTab === 'transactions' && (
          <TransactionsTab
            transactions={transactions}
            pagination={transactionPagination}
            onPageChange={loadTransactions}
            onRefresh={() => loadTransactions(transactionPagination?.page || 1)}
            onDelete={handleDeleteTransaction}
          />
        )}
        
        {activeTab === 'audit' && (
          <AuditLogsTab
            logs={auditLogs}
            pagination={auditPagination}
            onPageChange={loadAuditLogs}
            onRefresh={() => loadAuditLogs(auditPagination?.page || 1)}
          />
        )}
      </main>

      {/* Delete User Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Delete User</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete <strong>{selectedUser?.username}</strong>? This action cannot be undone.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter your password to confirm
                </label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500"
                  placeholder="Your password"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Password Reset</h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-sm text-amber-800">
                  Temporary password for <strong>{selectedUser?.username}</strong>:
                </p>
                <p className="text-lg font-mono font-bold text-amber-900 mt-2">{tempPassword}</p>
                <p className="text-xs text-amber-600 mt-2">
                  User will be required to change this password on next login.
                </p>
              </div>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
