import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Users, 
  TrendingUp, 
  Recycle, 
  LogOut, 
  Plus,
  ChevronRight,
  Home,
  BarChart3,
  Menu,
  X,
  Factory
} from 'lucide-react';
import { transactionAPI, stockAPI } from '../services/api';
import FranchiseManagement from '../components/FranchiseManagement';
import StockAllocation from '../components/StockAllocation';
import OwnerProduction from '../components/OwnerProduction';
import FranchiseDetails from '../components/FranchiseDetails';

// Coming Soon component
const ComingSoon = () => (
  <div className="flex flex-col items-center justify-center h-96">
    <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-4 rounded-2xl mb-6">
      <BarChart3 className="h-12 w-12 text-white" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics</h2>
    <p className="text-gray-500 text-lg">Coming Soon</p>
    <p className="text-gray-400 text-sm mt-2">Advanced analytics and insights are under development</p>
  </div>
);

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/owner/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/owner/production', icon: Factory, label: 'Production' },
    { path: '/owner/franchises', icon: Users, label: 'Franchises' },
    { path: '/owner/stock-allocation', icon: Package, label: 'Stock Allocation' },
    { path: '/owner/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      />
      
      <div className={`sidebar ${isOpen ? 'open' : ''} lg:fixed lg:top-0 lg:left-0 lg:h-screen lg:overflow-y-auto`}>
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-xl">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">EPR System</h2>
              <p className="text-gray-400 text-xs">Owner</p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
                {isActive && <ChevronRight className="h-4 w-4 ml-auto flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="mb-4 px-4">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Logged in as</p>
            <p className="text-sm text-white font-medium truncate">{user?.username || 'Owner'}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

const OverviewCards = ({ overview }) => {
  const cards = [
    {
      title: 'Total Franchises',
      value: overview.totalFranchises,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Stock Issued',
      value: overview.totalStockIssued,
      icon: Package,
      gradient: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Total Bottles Sold',
      value: overview.totalSold,
      icon: TrendingUp,
      gradient: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Empty Bottles Returned',
      value: overview.totalEmptyBottles,
      icon: Recycle,
      gradient: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
  ];

  return (
    <div className="dashboard-grid">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div key={index} className="stat-card card-hover">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-gray-500 text-xs sm:text-sm font-medium">{card.title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{card.value || 0}</p>
                <div className="flex items-center mt-2 text-sm">
                  <span className="text-emerald-600 font-medium flex items-center text-xs sm:text-sm">
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Active
                  </span>
                </div>
              </div>
              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${card.bgColor} flex items-center justify-center ${card.iconColor} flex-shrink-0`}>
                <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const flavors = [
  { key: 'orange', label: 'Orange', color: 'bg-orange-500', textColor: 'text-orange-600', bgColor: 'bg-orange-50' },
  { key: 'blueberry', label: 'Blueberry', color: 'bg-blue-600', textColor: 'text-blue-600', bgColor: 'bg-blue-50' },
  { key: 'jira', label: 'Jira', color: 'bg-purple-500', textColor: 'text-purple-600', bgColor: 'bg-purple-50' },
  { key: 'lemon', label: 'Lemon', color: 'bg-yellow-500', textColor: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { key: 'mint', label: 'Mint', color: 'bg-green-500', textColor: 'text-green-600', bgColor: 'bg-green-50' },
  { key: 'guava', label: 'Guava', color: 'bg-pink-500', textColor: 'text-pink-600', bgColor: 'bg-pink-50' },
];

const Dashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [overview, setOverview] = useState({
    totalFranchises: 0,
    totalStockIssued: 0,
    totalSold: 0,
    totalEmptyBottles: 0,
  });
  const [inventory, setInventory] = useState({
    available: {},
    totalProduced: {},
    totalAllocated: {},
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOverview();
    fetchInventory();
  }, [location.pathname]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getOwnerOverview();
      if (response.data.success) {
        setOverview(response.data.overview);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await stockAPI.getOwnerInventory();
      if (response.data.success) {
        setInventory({
          available: response.data.available || {},
          totalProduced: response.data.totalProduced || {},
          totalAllocated: response.data.totalAllocated || {},
        });
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const totalAvailable = Object.values(inventory.available).reduce((sum, val) => sum + val, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header !mt-0 !pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
              Welcome back, {user?.username || 'Owner'}!
            </h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your EPR system and track sustainability metrics</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs sm:text-sm font-medium inline-flex items-center">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              System Active
            </span>
          </div>
        </div>
      </div>
      <h1 className="heading-1 mb-6 sm:mb-8 mt-6">Owner Dashboard</h1>
      <OverviewCards overview={overview} />
      
      {/* Available Stock Section */}
      <div className="mt-6 sm:mt-8">
        <div className="card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Package className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="heading-3">Available Stock</h2>
              <p className="text-sm text-gray-500">Current inventory available for allocation</p>
            </div>
          </div>
          
          {/* Total Available Stock Card */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-600 text-sm font-medium">Total Available Stock</p>
                <p className="text-3xl sm:text-4xl font-bold text-emerald-900 mt-1">{totalAvailable}</p>
                <p className="text-sm text-emerald-600 mt-1">bottles ready for allocation</p>
              </div>
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-emerald-500 flex items-center justify-center">
                <Package className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
              </div>
            </div>
          </div>
          
          {/* Stock by Flavor Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {flavors.map((flavor) => {
              const quantity = inventory.available[flavor.key] || 0;
              return (
                <div key={flavor.key} className={`${flavor.bgColor} border border-gray-200 rounded-xl p-3 sm:p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${flavor.color}`}></div>
                    <span className={`text-sm font-semibold ${flavor.textColor}`}>{flavor.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{quantity}</p>
                  <p className="text-xs text-gray-500">bottles</p>
                </div>
              );
            })}
          </div>
          
          {/* Production Summary */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-500">Total Produced</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.values(inventory.totalProduced).reduce((sum, val) => sum + val, 0)}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-500">Total Allocated</p>
                <p className="text-xl font-bold text-gray-900">
                  {Object.values(inventory.totalAllocated).reduce((sum, val) => sum + val, 0)}
                </p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-sm text-gray-500">Remaining</p>
                <p className="text-xl font-bold text-emerald-600">{totalAvailable}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OwnerPanel = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 min-h-screen lg:ml-[280px] overflow-y-auto">
        {/* Mobile Menu Toggle / Close */}
        {!sidebarOpen ? (
          <button
            onClick={() => setSidebarOpen(true)}
            className="mobile-menu-toggle"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        ) : (
          <button
            onClick={() => setSidebarOpen(false)}
            className="mobile-menu-toggle"
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        )}

        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/production" element={<OwnerProduction />} />
            <Route path="/franchises" element={<FranchiseManagement />} />
            <Route path="/franchises/:id" element={<FranchiseDetails />} />
            <Route path="/stock-allocation" element={<StockAllocation />} />
            <Route path="/analytics" element={<ComingSoon />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default OwnerPanel;
