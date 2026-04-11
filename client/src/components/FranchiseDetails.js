import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { franchiseAPI } from '../services/api';
import { 
  ArrowLeft, 
  Store, 
  TrendingUp, 
  Recycle, 
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Circle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Radio,
  Factory,
  Calendar,
  Filter,
  X
} from 'lucide-react';

const FranchiseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    shops: true,
    sales: true,
    returns: true,
    production: true
  });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [liveMode, setLiveMode] = useState(true);
  const [changedValues, setChangedValues] = useState(new Set());
  const [productionData, setProductionData] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filteredData, setFilteredData] = useState(null);
  const prevDetailsRef = useRef(null);

  useEffect(() => {
    fetchFranchiseDetails();
    fetchProductionData();
    
    // Set up real-time polling every 5 seconds when live mode is on
    let intervalId;
    if (liveMode) {
      intervalId = setInterval(() => {
        fetchFranchiseDetails(true); // silent refresh (no loading spinner)
        fetchProductionData(true); // silent refresh for production data
      }, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [id, liveMode]);

  const fetchFranchiseDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      if (silent) setIsRefreshing(true);
      setError(null);
      
      const response = await franchiseAPI.getDetails(id);
      
      if (response.data.success) {
        const newDetails = response.data.details;
        
        // Debug logging with timestamp
        console.log(`[FranchiseDetails ${new Date().toLocaleTimeString()}] Franchise: ${newDetails.franchise?.name} (${id})`);
        console.log('[FranchiseDetails] Current Stock (Remaining):', newDetails.stats?.currentStock);
        console.log('[FranchiseDetails] Stock from Owner:', newDetails.stats?.totalStockAllocated);
        console.log('[FranchiseDetails] Franchise Production:', newDetails.stats?.producedByFranchise);
        console.log('[FranchiseDetails] Allocated to Shops:', newDetails.stats?.allocatedToShopsByFlavor);
        console.log('[FranchiseDetails] Sales by Flavor:', newDetails.stats?.salesByFlavor);
        console.log('[FranchiseDetails] Total Current Stock:', newDetails.stats?.totalCurrentStock);
        console.log('[FranchiseDetails] Total Stats:', {
          totalSales: newDetails.stats?.totalSales,
          totalStockAllocated: newDetails.stats?.totalStockAllocated,
          totalShops: newDetails.stats?.totalShops,
          totalReturns: newDetails.stats?.totalReturns
        });
        
        // Track which values changed for visual highlighting
        if (prevDetailsRef.current && details) {
          const changed = new Set();
          const prevStats = prevDetailsRef.current.stats;
          const newStats = newDetails.stats;
          
          // Check main stats
          if (prevStats.totalSales !== newStats.totalSales) changed.add('totalSales');
          if (prevStats.totalReturns !== newStats.totalReturns) changed.add('totalReturns');
          if (prevStats.totalStockAllocated !== newStats.totalStockAllocated) changed.add('totalStockAllocated');
          if (prevStats.totalShops !== newStats.totalShops) changed.add('totalShops');
          
          // Check flavor values
          flavors.forEach(f => {
            const key = f.key;
            if ((prevStats.currentStock?.[key] || 0) !== (newStats.currentStock?.[key] || 0)) {
              changed.add(`stock-${key}`);
            }
            if ((prevStats.salesByFlavor?.[key] || 0) !== (newStats.salesByFlavor?.[key] || 0)) {
              changed.add(`sales-${key}`);
            }
            if ((prevStats.returnsByFlavor?.[key] || 0) !== (newStats.returnsByFlavor?.[key] || 0)) {
              changed.add(`returns-${key}`);
            }
          });
          
          if (changed.size > 0) {
            setChangedValues(changed);
            // Clear highlights after 2 seconds
            setTimeout(() => setChangedValues(new Set()), 2000);
          }
        }
        
        prevDetailsRef.current = newDetails;
        setDetails(newDetails);
        setLastUpdated(new Date());
      } else {
        setError('Failed to load franchise details: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error fetching franchise details:', err);
      if (!silent) {
        setError('Failed to load franchise details: ' + (err.response?.data?.message || err.message || 'Unknown error'));
      }
    } finally {
      if (!silent) setLoading(false);
      if (silent) setIsRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    console.log('[FranchiseDetails] Manual refresh triggered for franchise:', id);
    fetchFranchiseDetails(true);
    fetchProductionData(true);
  };

  const fetchProductionData = async (silent = false) => {
    try {
      const response = await franchiseAPI.getProduction(id);
      if (response.data.success) {
        setProductionData(response.data.production);
        console.log('[FranchiseDetails] Production data loaded:', response.data.production);
      }
    } catch (err) {
      console.error('Error fetching production data:', err);
    }
  };

  // Filter data by selected date
  const handleDateFilter = (date) => {
    setFilterDate(date);
    
    if (!date || !details) {
      setFilteredData(null);
      return;
    }
    
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    // Filter sales by date
    const filteredSales = details.recentSales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      return saleDate >= selectedDate && saleDate < nextDay;
    });
    
    // Filter returns by date
    const filteredReturns = details.recentReturns.filter(ret => {
      const retDate = new Date(ret.createdAt);
      return retDate >= selectedDate && retDate < nextDay;
    });
    
    // Calculate filtered stats by flavor
    const filteredSalesByFlavor = {};
    const filteredReturnsByFlavor = {};
    const filteredStockByFlavor = {};
    
    flavors.forEach(flavor => {
      // Sales for this flavor on selected date
      filteredSalesByFlavor[flavor.key] = filteredSales.reduce((sum, sale) => {
        const items = sale.items || [];
        return sum + items.filter(item => item.flavor?.toLowerCase() === flavor.key)
          .reduce((s, item) => s + (item.quantity || 0), 0);
      }, 0);
      
      // Returns for this flavor on selected date
      filteredReturnsByFlavor[flavor.key] = filteredReturns.reduce((sum, ret) => {
        const items = ret.items || [];
        return sum + items.filter(item => item.flavor?.toLowerCase() === flavor.key)
          .reduce((s, item) => s + (item.quantity || 0), 0);
      }, 0);
      
      // Stock is cumulative up to selected date
      // Calculate stock from allocations up to selected date minus sales up to selected date
      const allocationsUpToDate = (details.stats.allocatedToShopsByFlavor?.[flavor.key] || 0);
      const salesUpToDate = details.recentSales
        .filter(sale => new Date(sale.createdAt) < nextDay)
        .reduce((sum, sale) => {
          const items = sale.items || [];
          return sum + items.filter(item => item.flavor?.toLowerCase() === flavor.key)
            .reduce((s, item) => s + (item.quantity || 0), 0);
        }, 0);
      
      filteredStockByFlavor[flavor.key] = Math.max(0, allocationsUpToDate - salesUpToDate);
    });
    
    setFilteredData({
      date: date,
      stock: filteredStockByFlavor,
      sales: filteredSalesByFlavor,
      returns: filteredReturnsByFlavor,
      totalSales: Object.values(filteredSalesByFlavor).reduce((a, b) => a + b, 0),
      totalReturns: Object.values(filteredReturnsByFlavor).reduce((a, b) => a + b, 0),
      salesTransactions: filteredSales,
      returnsTransactions: filteredReturns
    });
  };

  const clearDateFilter = () => {
    setFilterDate('');
    setFilteredData(null);
  };

  const toggleLiveMode = () => {
    setLiveMode(prev => !prev);
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isValueChanged = (key) => changedValues.has(key);

  const flavors = [
    { key: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { key: 'blueberry', label: 'Blueberry', color: 'bg-blue-600' },
    { key: 'jira', label: 'Jira', color: 'bg-purple-500' },
    { key: 'lemon', label: 'Lemon', color: 'bg-yellow-500' },
    { key: 'mint', label: 'Mint', color: 'bg-green-500' },
    { key: 'guava', label: 'Guava', color: 'bg-pink-500' },
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="section-spacing">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary-600 rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="section-spacing">
        <div className="text-center py-8">
          <p className="text-red-600">{error || 'Franchise not found'}</p>
          <button
            onClick={() => navigate('/owner/franchises')}
            className="btn btn-primary mt-4"
          >
            Back to Franchises
          </button>
        </div>
      </div>
    );
  }

  const { franchise, user, shops, stats, recentSales, recentReturns } = details;

  return (
    <div className="section-spacing">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/owner/franchises')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h2 className="heading-2">{franchise.name}</h2>
            <p className="text-sm text-gray-500">Franchise Details</p>
          </div>
        </div>
        
        {/* Live indicator and controls */}
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-gray-500 hidden sm:block">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          
          <button
            onClick={toggleLiveMode}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              liveMode 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={liveMode ? 'Live updates ON (click to pause)' : 'Live updates OFF (click to resume)'}
          >
            <Radio className={`h-4 w-4 ${liveMode ? 'animate-pulse' : ''}`} />
            {liveMode ? 'Live' : 'Paused'}
          </button>
          
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-all disabled:opacity-50"
            title="Refresh now"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Franchise Info Card */}
      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
            <Store className="h-8 w-8 text-primary-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{franchise.name}</h3>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                franchise.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                <Circle className={`h-2 w-2 ${franchise.status === 'active' ? 'fill-green-500' : 'fill-gray-400'}`} />
                {franchise.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              {user?.onlineStatus === 'online' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  <Circle className="h-2 w-2 fill-green-500 animate-pulse" />
                  Online
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {user && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{user.username}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{franchise.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{franchise.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{franchise.address}</span>
              </div>
            </div>
            {user?.lastActive && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                <Clock className="h-4 w-4" />
                <span>Last active: {formatDate(user.lastActive)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className={`stat-card bg-gradient-to-br from-blue-50 to-blue-100 transition-all duration-300 ${isValueChanged('totalShops') ? 'ring-2 ring-blue-400 ring-offset-2 scale-105 shadow-lg' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Shops</p>
              <p className={`text-2xl font-bold mt-1 transition-colors duration-300 ${isValueChanged('totalShops') ? 'text-blue-600' : 'text-gray-900'}`}>{stats.totalShops}</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${isValueChanged('totalShops') ? 'bg-blue-200' : 'bg-blue-100'}`}>
              <Store className={`h-6 w-6 transition-colors duration-300 ${isValueChanged('totalShops') ? 'text-blue-700' : 'text-blue-600'}`} />
            </div>
          </div>
        </div>

        <div className={`stat-card bg-gradient-to-br from-purple-50 to-purple-100 transition-all duration-300 ${isValueChanged('totalStockAllocated') ? 'ring-2 ring-purple-400 ring-offset-2 scale-105 shadow-lg' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Stock Allocated</p>
              <p className={`text-2xl font-bold mt-1 transition-colors duration-300 ${isValueChanged('totalStockAllocated') ? 'text-purple-600' : 'text-gray-900'}`}>{stats.totalStockAllocated.toLocaleString()}</p>
              <p className="text-xs text-gray-500">bottles</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${isValueChanged('totalStockAllocated') ? 'bg-purple-200' : 'bg-purple-100'}`}>
              <Package className={`h-6 w-6 transition-colors duration-300 ${isValueChanged('totalStockAllocated') ? 'text-purple-700' : 'text-purple-600'}`} />
            </div>
          </div>
        </div>

        <div className={`stat-card bg-gradient-to-br from-green-50 to-green-100 transition-all duration-300 ${isValueChanged('totalSales') ? 'ring-2 ring-green-400 ring-offset-2 scale-105 shadow-lg' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Sales</p>
              <p className={`text-2xl font-bold mt-1 transition-colors duration-300 ${isValueChanged('totalSales') ? 'text-green-600' : 'text-gray-900'}`}>{stats.totalSales.toLocaleString()}</p>
              <p className="text-xs text-gray-500">bottles sold</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${isValueChanged('totalSales') ? 'bg-green-200' : 'bg-green-100'}`}>
              <TrendingUp className={`h-6 w-6 transition-colors duration-300 ${isValueChanged('totalSales') ? 'text-green-700' : 'text-green-600'}`} />
            </div>
          </div>
        </div>

        <div className={`stat-card bg-gradient-to-br from-orange-50 to-orange-100 transition-all duration-300 ${isValueChanged('totalReturns') ? 'ring-2 ring-orange-400 ring-offset-2 scale-105 shadow-lg' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Returns</p>
              <p className={`text-2xl font-bold mt-1 transition-colors duration-300 ${isValueChanged('totalReturns') ? 'text-orange-600' : 'text-gray-900'}`}>{stats.totalReturns.toLocaleString()}</p>
              <p className="text-xs text-gray-500">empty bottles</p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 ${isValueChanged('totalReturns') ? 'bg-orange-200' : 'bg-orange-100'}`}>
              <Recycle className={`h-6 w-6 transition-colors duration-300 ${isValueChanged('totalReturns') ? 'text-orange-700' : 'text-orange-600'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Sort - Combined Section with Date Filter */}
      <div className="card mb-6">
        {/* Header with Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="heading-3 flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter and Sort
            {filterDate && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                (Showing data for {new Date(filterDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })})
              </span>
            )}
          </h3>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => handleDateFilter(e.target.value)}
                className="input pl-10 pr-4 py-2 text-sm"
                placeholder="Select date"
              />
            </div>
            {filterDate && (
              <button
                onClick={clearDateFilter}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                title="Clear filter"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Current Stock by Flavor - Remaining Stock */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Current Stock (Remaining)
            {filteredData && (
              <span className="text-xs font-normal text-gray-400">(up to selected date)</span>
            )}
          </h4>
          
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            {flavors.map((flavor) => {
              const stockQty = filteredData 
                ? (filteredData.stock[flavor.key] || 0)
                : (stats.currentStock[flavor.key] || 0);
              const changed = isValueChanged(`stock-${flavor.key}`);
              return (
                <div key={flavor.key} className={`rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border transition-all duration-300 ${changed ? 'bg-gradient-to-br from-emerald-100 to-emerald-200 border-emerald-300 ring-2 ring-emerald-400 scale-105 shadow-lg' : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-100'}`}>
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${flavor.color} mx-auto mb-1 sm:mb-2 shadow-sm ${changed ? 'scale-125' : ''} transition-transform duration-300`}></div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{flavor.label}</p>
                  <p className={`text-base sm:text-xl font-bold transition-colors duration-300 ${changed ? 'text-emerald-600' : 'text-gray-900'}`}>{stockQty.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sales by Flavor */}
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Sales by Flavor
            {filteredData && (
              <span className="text-xs font-normal text-gray-400">(on selected date)</span>
            )}
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            {flavors.map((flavor) => {
              const salesQty = filteredData
                ? (filteredData.sales[flavor.key] || 0)
                : (stats.salesByFlavor[flavor.key] || 0);
              const changed = isValueChanged(`sales-${flavor.key}`);
              return (
                <div key={flavor.key} className={`rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border transition-all duration-300 ${changed ? 'bg-gradient-to-br from-green-100 to-green-200 border-green-300 ring-2 ring-green-400 scale-105 shadow-lg' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-100'}`}>
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${flavor.color} mx-auto mb-1 sm:mb-2 shadow-sm ${changed ? 'scale-125' : ''} transition-transform duration-300`}></div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{flavor.label}</p>
                  <p className={`text-base sm:text-xl font-bold transition-colors duration-300 ${changed ? 'text-green-600' : 'text-gray-900'}`}>{salesQty.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Returns by Flavor */}
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center gap-2">
            <Recycle className="h-4 w-4" />
            Returns by Flavor
            {filteredData && (
              <span className="text-xs font-normal text-gray-400">(on selected date)</span>
            )}
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
            {flavors.map((flavor) => {
              const returnQty = filteredData
                ? (filteredData.returns[flavor.key] || 0)
                : (stats.returnsByFlavor[flavor.key] || 0);
              const changed = isValueChanged(`returns-${flavor.key}`);
              return (
                <div key={flavor.key} className={`rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border transition-all duration-300 ${changed ? 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300 ring-2 ring-orange-400 scale-105 shadow-lg' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-100'}`}>
                  <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${flavor.color} mx-auto mb-1 sm:mb-2 shadow-sm ${changed ? 'scale-125' : ''} transition-transform duration-300`}></div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{flavor.label}</p>
                  <p className={`text-base sm:text-xl font-bold transition-colors duration-300 ${changed ? 'text-orange-600' : 'text-gray-900'}`}>{returnQty.toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Stock Produced by Franchise */}
      {productionData && productionData.totalProduced > 0 && (
        <div className="card mb-6">
          <div 
            className="flex items-center justify-between cursor-pointer"
            onClick={() => toggleSection('production')}
          >
            <h3 className="heading-3 flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Stock Produced by Franchise
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({productionData.totalProduced.toLocaleString()} bottles total)
              </span>
            </h3>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              {expandedSections.production ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
          </div>
          
          {expandedSections.production && (
            <div className="mt-4">
              {/* Production Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Total Produced</p>
                  <p className="text-2xl font-bold text-blue-700">{productionData.totalProduced.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">bottles</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Distributed to Shops</p>
                  <p className="text-2xl font-bold text-amber-700">{productionData.totalDistributed.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">bottles</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-gray-600 mb-1">Remaining at Franchise</p>
                  <p className="text-2xl font-bold text-emerald-700">{productionData.totalRemaining.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">bottles</p>
                </div>
              </div>
              
              {/* Production by Flavor */}
              <h4 className="font-medium text-gray-700 mb-3">Production by Flavor</h4>
              <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4 mb-6">
                {flavors.map((flavor) => {
                  const producedQty = productionData.totalProducedByFlavor[flavor.key] || 0;
                  return (
                    <div key={flavor.key} className="rounded-lg sm:rounded-xl p-2 sm:p-3 text-center border bg-gradient-to-br from-blue-50 to-blue-100 border-blue-100">
                      <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full ${flavor.color} mx-auto mb-1 sm:mb-2 shadow-sm`}></div>
                      <p className="text-xs sm:text-sm font-medium text-gray-600">{flavor.label}</p>
                      <p className="text-base sm:text-xl font-bold text-gray-900">{producedQty.toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
              
              {/* Recent Production Records */}
              {productionData.recentProductions && productionData.recentProductions.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-3">Recent Production Records</h4>
                  <div className="space-y-2">
                    {productionData.recentProductions.slice(0, 5).map((prod) => {
                      const totalQty = Object.values(prod.stock || {}).reduce((a, b) => a + b, 0);
                      return (
                        <div key={prod._id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              <Factory className="h-4 w-4 inline mr-1 text-blue-600" />
                              {totalQty.toLocaleString()} bottles
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(prod.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {flavors.map((flavor) => {
                              const qty = prod.stock?.[flavor.key] || 0;
                              if (qty === 0) return null;
                              return (
                                <span key={flavor.key} className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-200">
                                  <span className={`w-2 h-2 rounded-full ${flavor.color}`}></span>
                                  <span className="capitalize">{flavor.label}:</span>
                                  <span className="font-bold">{qty}</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Shops Section */}
      <div className="card mb-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('shops')}
        >
          <h3 className="heading-3 flex items-center gap-2">
            <Store className="h-5 w-5" />
            Shops ({shops.length})
          </h3>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {expandedSections.shops ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
        
        {expandedSections.shops && (
          <div className="mt-4">
            {shops.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No shops registered yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Shop Name</th>
                      <th className="text-left">Location</th>
                      <th className="text-left">Area</th>
                      <th className="text-right">Stock</th>
                      <th className="text-right">Total Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.map((shop) => {
                      const shopStock = Object.values(shop.stock || {}).reduce((a, b) => a + b, 0);
                      return (
                        <tr key={shop._id}>
                          <td className="font-medium">{shop.name}</td>
                          <td>{shop.location}</td>
                          <td>{shop.area}</td>
                          <td className="text-right">{shopStock.toLocaleString()}</td>
                          <td className="text-right">{(shop.totalSold || 0).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Sales */}
      <div className="card mb-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('sales')}
        >
          <h3 className="heading-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Sales ({recentSales.length})
          </h3>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {expandedSections.sales ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
        
        {expandedSections.sales && (
          <div className="mt-4 space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No sales recorded yet</p>
            ) : (
              recentSales.map((sale) => (
                <div key={sale._id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {sale.shopId?.name || sale.shopId?.location || 'Unknown Shop'}
                    </span>
                    <span className="text-sm text-gray-500">{formatDate(sale.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sale.items?.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-200">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        <span className="capitalize">{item.flavor}:</span>
                        <span className="font-bold">{item.quantity}</span>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-sm font-bold text-green-600">
                      Total: {sale.totalQuantity} bottles
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Recent Returns */}
      <div className="card">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('returns')}
        >
          <h3 className="heading-3 flex items-center gap-2">
            <Recycle className="h-5 w-5" />
            Recent Returns ({recentReturns.length})
          </h3>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {expandedSections.returns ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
        
        {expandedSections.returns && (
          <div className="mt-4 space-y-3">
            {recentReturns.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No returns recorded yet</p>
            ) : (
              recentReturns.map((ret) => (
                <div key={ret._id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {ret.shopId?.name || ret.shopId?.location || 'Unknown Shop'}
                    </span>
                    <span className="text-sm text-gray-500">{formatDate(ret.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ret.items?.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-200">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        <span className="capitalize">{item.flavor}:</span>
                        <span className="font-bold">{item.quantity}</span>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-sm font-bold text-orange-600">
                      Total: {ret.totalQuantity} bottles
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FranchiseDetails;
