import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Package, 
  Store, 
  LogOut, 
  Plus,
  ChevronRight,
  Home,
  Menu,
  X
} from 'lucide-react';
import { transactionAPI } from '../services/api';
import ShopManagement from '../components/ShopManagement';
import ShopOperations from '../components/ShopOperations';
import DistributorOverview from '../components/DistributorOverview';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/distributor/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/distributor/shops', icon: Store, label: 'Shop Management' },
    { path: '/distributor/operations', icon: Package, label: 'Stock & Sales' },
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
            <div className="bg-gradient-to-br from-secondary-500 to-secondary-600 p-2 rounded-xl">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">EPR System</h2>
              <p className="text-gray-400 text-xs">Distributor</p>
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
            <p className="text-sm text-white font-medium truncate">{user?.username || 'Distributor'}</p>
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

const Dashboard = () => {
  const [overview, setOverview] = useState({
    totalStock: 0,
    totalShops: 0,
    totalSold: 0,
    totalEmptyBottles: 0,
    stock: {
      orange: 0,
      blueberry: 0,
      jira: 0,
      lemon: 0,
      mint: 0,
      guava: 0,
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await transactionAPI.getDistributorOverview();
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
      <h1 className="heading-1 mb-6 sm:mb-8">Distributor Dashboard</h1>
      <DistributorOverview overview={overview} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
        <div className="card">
          <h2 className="heading-3 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              to="/distributor/shops"
              className="btn btn-primary w-full"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Shop</span>
            </Link>
            <Link
              to="/distributor/operations"
              className="btn btn-secondary w-full"
            >
              <Package className="h-5 w-5" />
              <span>Stock & Sales</span>
            </Link>
          </div>
        </div>
        
        <div className="card">
          <h2 className="heading-3 mb-4">Recent Activity</h2>
          <p className="text-body">Your recent transactions and updates will appear here.</p>
        </div>
      </div>
    </div>
  );
};

const DistributorDashboard = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="flex-1 min-h-screen lg:ml-[280px] overflow-y-auto">
        {/* Mobile Menu Toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="mobile-menu-toggle"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="page-header lg:sticky">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                Welcome back, {user?.username || 'Distributor'}!
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Manage your shops and inventory efficiently</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-xs sm:text-sm font-medium inline-flex items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                Online
              </span>
            </div>
          </div>
        </div>
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/shops" element={<ShopManagement />} />
            <Route path="/operations" element={<ShopOperations />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DistributorDashboard;
