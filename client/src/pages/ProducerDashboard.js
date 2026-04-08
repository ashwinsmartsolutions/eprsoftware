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
  Settings,
  Menu,
  X,
  Factory
} from 'lucide-react';
import { transactionAPI } from '../services/api';
import DistributorManagement from '../components/DistributorManagement';
import StockAllocation from '../components/StockAllocation';
import DistributorAnalytics from '../components/DistributorAnalytics';
import ProducerProduction from '../components/ProducerProduction';

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
    { path: '/producer/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/producer/production', icon: Factory, label: 'Production' },
    { path: '/producer/distributors', icon: Users, label: 'Distributors' },
    { path: '/producer/stock-allocation', icon: Package, label: 'Stock Allocation' },
    { path: '/producer/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(false)}
      />
      
      <div className={`sidebar ${isOpen ? 'open' : ''} lg:fixed lg:top-0 lg:left-0 lg:h-screen lg:overflow-y-auto`}>
        {/* Close button for mobile */}
        <button 
          className="sidebar-close-btn"
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-xl">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">EPR System</h2>
              <p className="text-gray-400 text-xs">Producer</p>
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
            <p className="text-sm text-white font-medium truncate">{user?.username || 'Producer'}</p>
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
      title: 'Total Distributors',
      value: overview.totalDistributors,
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

const Dashboard = () => {
  const [overview, setOverview] = useState({
    totalDistributors: 0,
    totalStockIssued: 0,
    totalSold: 0,
    totalEmptyBottles: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getProducerOverview();
      if (response.data.success) {
        setOverview(response.data.overview);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="heading-1 mb-6 sm:mb-8">Producer Dashboard</h1>
      <OverviewCards overview={overview} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
        <div className="card">
          <h2 className="heading-3 mb-4">Recent Activity</h2>
          <p className="text-body">Transaction history and recent updates will appear here.</p>
        </div>
        
        <div className="card">
          <h2 className="heading-3 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/producer/distributors"
              className="btn btn-primary w-full"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Distributor</span>
            </Link>
            <Link
              to="/producer/stock-allocation"
              className="btn btn-secondary w-full"
            >
              <Package className="h-5 w-5" />
              <span>Allocate Stock</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProducerDashboard = () => {
  const { user } = useAuth();
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

        <div className="page-header lg:sticky">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                Welcome back, {user?.username || 'Producer'}!
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
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/production" element={<ProducerProduction />} />
            <Route path="/distributors" element={<DistributorManagement />} />
            <Route path="/stock-allocation" element={<StockAllocation />} />
            <Route path="/analytics" element={<ComingSoon />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default ProducerDashboard;
