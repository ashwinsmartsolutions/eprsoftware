import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { shopAPI, stockAPI, transactionAPI } from '../services/api';
import { Store, MapPin, History, Filter, ChevronDown, ChevronUp, ShoppingCart } from 'lucide-react';

const UpdateSales = () => {
  const [searchParams] = useSearchParams();
  const navigateShopId = searchParams.get('shopId');
  
  // Shared state
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [areas, setAreas] = useState([]);
  
  // Record Sales Section State
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedShop, setSelectedShop] = useState(navigateShopId || '');
  const [shopStock, setShopStock] = useState({});
  const [franchiseStock, setFranchiseStock] = useState({});
  const [salesData, setSalesData] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Sales History Section State
  const [historyArea, setHistoryArea] = useState('');
  const [historyShop, setHistoryShop] = useState('');
  const [salesHistory, setSalesHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sortBy, setSortBy] = useState('shop');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDate, setSelectedDate] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  
  // Tab state
  const [activeTab, setActiveTab] = useState('record'); // 'record' or 'history'

  useEffect(() => {
    fetchShops();
    fetchFranchiseStock();
    if (navigateShopId) {
      fetchShopStock(navigateShopId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const uniqueAreas = [...new Set(shops.map(shop => shop.area).filter(Boolean))].sort();
    setAreas(uniqueAreas);
  }, [shops]);

  useEffect(() => {
    // When shops are loaded and navigateShopId is set, pre-select the area and shop
    if (navigateShopId && shops.length > 0) {
      const shop = shops.find(s => s._id === navigateShopId);
      if (shop && shop.area) {
        setSelectedArea(shop.area);
        // Ensure the shop is selected after the filter is applied
        setTimeout(() => setSelectedShop(navigateShopId), 0);
      }
    }
  }, [shops, navigateShopId]);

  useEffect(() => {
    let filtered = shops;
    if (selectedArea) {
      filtered = shops.filter(shop => shop.area === selectedArea);
    }
    setFilteredShops(filtered.sort((a, b) => a.name.localeCompare(b.name)));
    // Only clear selected shop if it was NOT from URL navigation
    // and it's not in the filtered list
    if (selectedShop && !filtered.find(s => s._id === selectedShop) && !navigateShopId) {
      setSelectedShop('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArea, shops, navigateShopId]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedShop) {
      const selectedShopData = shops.find(s => s._id === selectedShop);
      if (selectedShopData?.stock) {
        setShopStock(selectedShopData.stock);
      }
      fetchShopStock(selectedShop);
    } else {
      setShopStock({});
    }
  }, [selectedShop, shops]);

  // Fetch sales history when filters change
  useEffect(() => {
    fetchSalesHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyArea, historyShop, sortBy, sortOrder, selectedDate]);

  const fetchFranchiseStock = async () => {
    try {
      const response = await stockAPI.getFranchiseStock();
      if (response.data.success) {
        setFranchiseStock(response.data.stock || {});
      }
    } catch (error) {
      console.error('Error fetching franchise stock:', error);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await shopAPI.getAll();
      if (response.data.success) {
        setShops(response.data.shops.filter(shop => shop.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const fetchShopStock = async (shopId) => {
    try {
      const response = await stockAPI.getShopStock(shopId);
      if (response.data.success) {
        setShopStock(response.data.stock || {});
      }
    } catch (error) {
      console.error('Error fetching shop stock:', error);
    }
  };

  const fetchSalesHistory = async () => {
    setHistoryLoading(true);
    try {
      let params = { type: 'sale', limit: 100 };
      
      // If specific shop selected, fetch only for that shop
      if (historyShop) {
        const response = await transactionAPI.getTransactions({ 
          ...params, 
          shopId: historyShop 
        });
        if (response.data && response.data.success) {
          let transactions = response.data.transactions || [];
          transactions = sortTransactions(transactions);
          setSalesHistory(transactions);
        }
      } 
      // If area selected (but no specific shop), fetch for all shops in area
      else if (historyArea) {
        const targetShops = shops.filter(shop => shop.area === historyArea);
        const shopIds = targetShops.map(s => s._id);
        const allTransactions = [];
        
        for (const shopId of shopIds) {
          const response = await transactionAPI.getTransactions({ 
            ...params, 
            shopId 
          });
          if (response.data && response.data.success) {
            allTransactions.push(...(response.data.transactions || []));
          }
        }
        
        const sorted = sortTransactions(allTransactions);
        setSalesHistory(sorted);
      } 
      // No filters - fetch all
      else {
        const response = await transactionAPI.getTransactions(params);
        if (response.data && response.data.success) {
          let transactions = response.data.transactions || [];
          transactions = sortTransactions(transactions);
          setSalesHistory(transactions);
        }
      }
    } catch (error) {
      console.error('Error fetching sales history:', error);
      setSalesHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const sortTransactions = (transactions) => {
    // Filter by date if selected
    let filtered = transactions;
    if (selectedDate) {
      const selectedDateObj = new Date(selectedDate);
      filtered = transactions.filter(t => {
        const tDate = new Date(t.createdAt);
        return tDate.toDateString() === selectedDateObj.toDateString();
      });
    }
    
    // Sort the filtered results
    return [...filtered].sort((a, b) => {
      let valA, valB;
      
      switch (sortBy) {
        case 'shop':
          valA = a.shopId?.name || '';
          valB = b.shopId?.name || '';
          break;
        case 'quantity':
          valA = a.totalQuantity || 0;
          valB = b.totalQuantity || 0;
          break;
        default:
          valA = new Date(a.createdAt);
          valB = new Date(b.createdAt);
      }
      
      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  };

  const handleSalesChange = (flavor, value) => {
    setSalesData({
      ...salesData,
      [flavor]: parseInt(value) || 0,
    });
  };

  const handleSalesSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedShop) {
      alert('Please select a shop');
      return;
    }

    const totalSales = Object.values(salesData).reduce((sum, val) => sum + val, 0);
    if (totalSales === 0) {
      alert('Please record at least some sales');
      return;
    }

    for (const [flavor, quantity] of Object.entries(salesData)) {
      if (quantity > 0 && (shopStock[flavor] || 0) < quantity) {
        alert(`Insufficient stock for ${flavor}. Available: ${shopStock[flavor] || 0}, Requested: ${quantity}`);
        return;
      }
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      const items = Object.entries(salesData)
        .filter(([_, quantity]) => quantity > 0)
        .map(([flavor, quantity]) => ({ flavor, quantity }));

      await transactionAPI.recordSales({
        shopId: selectedShop,
        items,
      });
      
      setSuccessMessage('Sales recorded successfully!');
      setSalesData({});
      await fetchShopStock(selectedShop);
      await fetchFranchiseStock();
      await fetchSalesHistory();
    } catch (error) {
      console.error('Error recording sales:', error);
      alert('Error recording sales: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => {
      // If clicking the same item, close it. If clicking different item, open only that one.
      const isCurrentlyExpanded = prev[id];
      if (isCurrentlyExpanded) {
        return {}; // Close current
      }
      return { [id]: true }; // Open only the new one, close others
    });
  };

  // Group sales history by shop and date
  const groupSalesByShopAndDate = (transactions) => {
    const grouped = {};
    
    transactions.forEach(transaction => {
      const shopId = transaction.shopId?._id || transaction.shopId;
      const shopName = transaction.shopId?.name || transaction.shopId?.location || 'Unknown Shop';
      const shopArea = transaction.shopId?.area || transaction.area;
      const date = new Date(transaction.createdAt).toDateString();
      const key = `${shopId}_${date}`;
      
      if (!grouped[key]) {
        grouped[key] = {
          shopId,
          shopName,
          shopArea,
          date: transaction.createdAt,
          totalQuantity: 0,
          transactions: [],
          flavorTotals: {}
        };
      }
      
      grouped[key].totalQuantity += transaction.totalQuantity || 0;
      grouped[key].transactions.push(transaction);
      
      // Aggregate flavors
      transaction.items?.forEach(item => {
        const flavor = item.flavor.toLowerCase();
        if (!grouped[key].flavorTotals[flavor]) {
          grouped[key].flavorTotals[flavor] = 0;
        }
        grouped[key].flavorTotals[flavor] += item.quantity;
      });
    });
    
    return Object.values(grouped);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateOnly = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const flavors = [
    { key: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { key: 'blueberry', label: 'Blueberry', color: 'bg-blue-600' },
    { key: 'jira', label: 'Jira', color: 'bg-purple-500' },
    { key: 'lemon', label: 'Lemon', color: 'bg-yellow-500' },
    { key: 'mint', label: 'Mint', color: 'bg-green-500' },
    { key: 'guava', label: 'Guava', color: 'bg-pink-500' },
  ];

  return (
    <div className="section-spacing">
      {/* Tab Buttons */}
      <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('record')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'record'
              ? 'bg-white text-primary-600 shadow-md'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }`}
        >
          <ShoppingCart className="h-5 w-5" />
          Record Sales
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'history'
              ? 'bg-white text-primary-600 shadow-md'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }`}
        >
          <History className="h-5 w-5" />
          Sales History
        </button>
      </div>

      {successMessage && activeTab === 'record' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {successMessage}
        </div>
      )}

      {/* Tab 1: Record Sales */}
      {activeTab === 'record' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="card">
            {/* Shop Selection */}
            <div className="form-group mb-4 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Area Selection */}
                <div>
                  <label className="form-label flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    Select Area
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSelectedArea(value);
                      if (!value) {
                        setSelectedShop('');
                      }
                    }}
                    className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-12 text-sm text-gray-800 hover:border-blue-300 hover:shadow-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2720%27 height=%2720%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%233b82f6%27 stroke-width=%272.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat font-semibold shadow-sm"
                  >
                    <option value="">📍 All Areas</option>
                    {areas.map((area) => (
                      <option key={area} value={area}>📍 {area}</option>
                    ))}
                  </select>
                </div>

                {/* Shop Selection */}
                <div>
                  <label className="form-label flex items-center gap-2 mb-2">
                    <Store className="h-4 w-4" />
                    Select Shop
                  </label>
                  <select
                    value={selectedShop}
                    onChange={(e) => setSelectedShop(e.target.value)}
                    className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-12 text-sm text-gray-800 hover:border-blue-300 hover:shadow-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2720%27 height=%2720%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%233b82f6%27 stroke-width=%272.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat font-semibold shadow-sm"
                    required
                  >
                    <option value="">🏪 Choose a shop...</option>
                    {filteredShops.map((shop) => (
                      <option key={shop._id} value={shop._id}>
                        🏪 {shop.name} - {shop.location}
                      </option>
                    ))}
                  </select>
                  {selectedArea && filteredShops.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      No shops found in {selectedArea}. Select a different area.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sales Form */}
            <form onSubmit={handleSalesSubmit} className="space-y-4">
              <div className="form-group">
                <label className="form-label mb-3">Sales Quantity per Flavor</label>
                <div className="space-y-3">
                  {flavors.map((flavor) => (
                    <div key={flavor.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-4 h-4 rounded-full ${flavor.color} flex-shrink-0`}></div>
                        <label className="text-sm font-medium text-gray-700">
                          {flavor.label}
                        </label>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px]">Available: {shopStock[flavor.key] || 0}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={shopStock[flavor.key] || 0}
                          value={salesData[flavor.key] || ''}
                          onChange={(e) => handleSalesChange(flavor.key, e.target.value)}
                          className="w-20 sm:w-24 input text-center text-sm flex-shrink-0"
                          placeholder="0"
                          disabled={!selectedShop}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">
                  Total: <span className="font-bold text-primary-600 text-lg">{Object.values(salesData).reduce((sum, val) => sum + val, 0)} bottles</span>
                </span>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary disabled:opacity-50 w-full sm:w-auto"
                >
                  {loading ? 'Recording...' : 'Record Sales'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4 sm:space-y-6">
          {/* Shop Stock - Show when shop selected */}
          {selectedShop && shopStock && (
            <div className="card">
              <h3 className="heading-3 mb-4 flex items-center">
                <Store className="h-5 w-5 mr-2" />
                Shop Stock Available
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {flavors.map((flavor) => (
                  <div key={flavor.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-3 h-3 rounded ${flavor.color} flex-shrink-0`}></div>
                      <span className="text-sm font-medium text-gray-700 truncate">{flavor.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                      {shopStock[flavor.key] || 0}
                    </span>
                  </div>
                ))}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total:</span>
                    <span className="text-lg font-bold text-primary-600">
                      {Object.values(shopStock).reduce((sum, val) => sum + val, 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!selectedShop && (
            <div className="card bg-gray-50 border-gray-200">
              <p className="text-sm text-gray-500 text-center py-4">
                Select a shop to view available stock
              </p>
            </div>
          )}

          {/* Quick Tips */}
          <div className="card">
            <h3 className="heading-3 mb-4">Quick Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Select a shop to record sales</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Enter quantity sold for each flavor</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Check shop stock levels before recording</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      )}

      {/* Tab 2: Sales History */}
      {activeTab === 'history' && (
      <div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
            <span className="text-blue-600 block text-xs font-medium">Grouped Sales</span>
            <span className="font-bold text-blue-900 text-2xl">
              {groupSalesByShopAndDate(salesHistory).length}
            </span>
            <span className="text-xs text-blue-500">
              ({salesHistory.length} individual entries)
            </span>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <span className="text-green-600 block text-xs font-medium">Total Bottles</span>
            <span className="font-bold text-green-900 text-2xl">
              {salesHistory.reduce((sum, t) => sum + (t.totalQuantity || 0), 0)}
            </span>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
            <span className="text-purple-600 block text-xs font-medium">Shops</span>
            <span className="font-bold text-purple-900 text-2xl">
              {new Set(salesHistory.map(t => t.shopId?._id || t.shopId)).size}
            </span>
          </div>
        </div>

        {/* Filters Card */}
        <div className="card mb-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <Filter className="h-4 w-4 text-primary-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Filters & Sorting</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Area Filter */}
            <div>
              <label className="form-label text-xs mb-1.5 text-gray-500">Area</label>
              <select
                value={historyArea}
                onChange={(e) => {
                  setHistoryArea(e.target.value);
                  setHistoryShop('');
                }}
                className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
              >
                <option value="">All Areas</option>
                {areas.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </div>

            {/* Shop Filter */}
            <div>
              <label className="form-label text-xs mb-1.5 text-gray-500">Shop</label>
              <select
                value={historyShop}
                onChange={(e) => setHistoryShop(e.target.value)}
                className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                disabled={!historyArea}
              >
                <option value="">{historyArea ? 'All Shops' : 'Select Area First'}</option>
                {shops.filter(s => !historyArea || s.area === historyArea).map((shop) => (
                  <option key={shop._id} value={shop._id}>{shop.name}</option>
                ))}
              </select>
            </div>

            {/* Date Filter */}
            <div>
              <label className="form-label text-xs mb-1.5 text-gray-500">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            {/* Sort Options */}
            <div>
              <label className="form-label text-xs mb-1.5 text-gray-500">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 hover:border-blue-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%236b7280%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
                >
                  <option value="shop">Shop Name</option>
                  <option value="quantity">Quantity</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? <ChevronUp className="h-4 w-4 text-gray-600" /> : <ChevronDown className="h-4 w-4 text-gray-600" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <p className="text-sm font-medium text-gray-700">
              {historyLoading ? 'Loading...' : selectedDate ? `${groupSalesByShopAndDate(salesHistory).length} grouped records for ${new Date(selectedDate).toLocaleDateString('en-IN')}` : `Showing ${groupSalesByShopAndDate(salesHistory).length} grouped sales record${groupSalesByShopAndDate(salesHistory).length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-3">
          {historyLoading ? (
            <div className="card text-center py-12">
              <div className="animate-spin h-10 w-10 border-b-2 border-primary-600 rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-3">Loading sales history...</p>
            </div>
          ) : salesHistory.length === 0 ? (
            <div className="card text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <History className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No sales history found</p>
              <p className="text-sm text-gray-400 mt-1">
                {selectedDate ? `No records for ${new Date(selectedDate).toLocaleDateString('en-IN')}` : historyArea || historyShop ? 'Try adjusting your filters' : 'Select filters to view history'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupSalesByShopAndDate(salesHistory).map((group, index) => (
                <div
                  key={`${group.shopId}_${group.date}`}
                  className="card hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500 py-2 px-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Left: Shop Info */}
                    <div className="flex items-center gap-3">
                      {/* Serial Number */}
                      <span className="text-sm text-gray-900 font-medium w-6">
                        {index + 1}.
                      </span>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {group.shopName}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          {group.shopArea && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              <MapPin className="h-3 w-3" />
                              {group.shopArea}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatDateOnly(group.date)}
                          </span>
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                            {group.transactions.length} sale{group.transactions.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: Quantity & Expand */}
                    <div className="flex items-center gap-4 sm:pl-4 sm:border-l border-gray-200">
                      <div className="text-right">
                        <p className="text-3xl font-bold text-blue-600">
                          {group.totalQuantity}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">total bottles</p>
                      </div>
                      <button
                        onClick={() => toggleExpand(`${group.shopId}_${group.date}`)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        {expandedItems[`${group.shopId}_${group.date}`] ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Details - Flavor Totals */}
                  {expandedItems[`${group.shopId}_${group.date}`] && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      {/* Total by Flavor */}
                      <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                        Total by Flavor
                      </h5>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                        {Object.entries(group.flavorTotals).map(([flavor, quantity], idx) => {
                          const flavorInfo = flavors.find(f => f.key === flavor.toLowerCase());
                          if (quantity === 0) return null;
                          return (
                            <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 text-center border border-gray-100">
                              <div className={`w-3 h-3 rounded-full ${flavorInfo?.color || 'bg-gray-400'} mx-auto mb-1 shadow-sm`}></div>
                              <p className="text-xs font-medium text-gray-600 capitalize">{flavor}</p>
                              <p className="text-base font-bold text-gray-900">{quantity}</p>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Individual Sales Details Dropdown */}
                      <div className="border-t border-gray-200 pt-3">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                          Individual Sales Details ({group.transactions.length} entries)
                        </h5>
                        <div className="space-y-2">
                          {group.transactions.map((transaction, tIndex) => (
                            <div key={transaction._id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-500">
                                  Entry #{tIndex + 1} • {formatDate(transaction.createdAt)}
                                </span>
                                <span className="text-sm font-bold text-blue-600">
                                  {transaction.totalQuantity} bottles
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {transaction.items?.map((item, idx) => (
                                  <span key={idx} className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-200">
                                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                    <span className="capitalize">{item.flavor}:</span>
                                    <span className="font-bold">{item.quantity}</span>
                                  </span>
                                ))}
                              </div>
                              {transaction.description && (
                                <p className="text-xs text-gray-500 mt-2 italic">
                                  Note: {transaction.description}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};

export default UpdateSales;
