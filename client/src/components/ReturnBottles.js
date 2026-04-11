import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { shopAPI, transactionAPI } from '../services/api';
import { Store, Recycle, MapPin, History, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const ReturnBottles = () => {
  const [searchParams] = useSearchParams();
  const navigateShopId = searchParams.get('shopId');
  // Shared state
  const [shops, setShops] = useState([]);
  const [areas, setAreas] = useState([]);
  
  // Return Bottles Section State
  const [filteredShops, setFilteredShops] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedShop, setSelectedShop] = useState('');
  const [shopSales, setShopSales] = useState({});
  const [emptyBottlesReturned, setEmptyBottlesReturned] = useState({});
  const [emptyBottlesData, setEmptyBottlesData] = useState({});
  const [loading, setLoading] = useState(false);
  const [shopDataLoading, setShopDataLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Return History Section State
  const [historyArea, setHistoryArea] = useState('');
  const [historyShop, setHistoryShop] = useState('');
  const [returnHistory, setReturnHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sortBy, setSortBy] = useState('shop');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDate, setSelectedDate] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  
  // Tab state
  const [activeTab, setActiveTab] = useState('return'); // 'return' or 'history'

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchShops();
    if (navigateShopId) {
      setSelectedShop(navigateShopId);
    }
  }, []);

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
    // Extract unique areas from shops
    const uniqueAreas = [...new Set(shops.map(shop => shop.area).filter(Boolean))].sort();
    setAreas(uniqueAreas);
  }, [shops]);

  useEffect(() => {
    // Filter shops by selected area
    let filtered = shops;
    if (selectedArea) {
      filtered = shops.filter(shop => shop.area === selectedArea);
    }
    setFilteredShops(filtered.sort((a, b) => a.name.localeCompare(b.name)));
    // Only clear selected shop if it was NOT from URL navigation
    if (selectedShop && !filtered.find(s => s._id === selectedShop) && !navigateShopId) {
      setSelectedShop('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArea, shops, navigateShopId]);

  // Fetch return history when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchReturnHistory();
  }, [historyArea, historyShop, sortBy, sortOrder, selectedDate]);

  // Fetch shop data when selected shop changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedShop) {
      fetchShopSalesAndReturns(selectedShop);
    } else {
      setShopSales({});
      setEmptyBottlesReturned({});
      setEmptyBottlesData({});
    }
  }, [selectedShop]);

  const fetchShopSalesAndReturns = async (shopId) => {
    setShopDataLoading(true);
    try {
      console.log('Fetching data for shop:', shopId);
      
      // Get accurate per-flavor sales data from shop sales records
      const salesResponse = await transactionAPI.getShopSales(shopId);
      
      // Get returns from transactions
      const returnsResponse = await transactionAPI.getTransactions({ type: 'empty_bottle_return', shopId });
      
      // Set sales data from accurate shop sales API
      if (salesResponse.data && salesResponse.data.success) {
        console.log('Shop sales data for', shopId, ':', salesResponse.data.flavorSales);
        setShopSales(salesResponse.data.flavorSales || {});
      } else {
        console.warn('No sales data returned for shop:', shopId);
        setShopSales({});
      }
      
      // Calculate bottles already returned per flavor
      const returned = {};
      if (returnsResponse.data && returnsResponse.data.success) {
        returnsResponse.data.transactions.forEach(transaction => {
          if (transaction.items) {
            transaction.items.forEach(item => {
              const flavor = item.flavor.toLowerCase();
              returned[flavor] = (returned[flavor] || 0) + item.quantity;
            });
          }
        });
      }
      
      console.log('Shop returns data for', shopId, ':', returned);
      setEmptyBottlesReturned(returned);
    } catch (error) {
      console.error('Error fetching shop sales for shop', shopId, ':', error);
      setShopSales({});
      setEmptyBottlesReturned({});
    } finally {
      setShopDataLoading(false);
    }
  };

  const fetchReturnHistory = async () => {
    setHistoryLoading(true);
    try {
      let params = { type: 'empty_bottle_return', limit: 100 };
      
      // If specific shop selected, fetch only for that shop
      if (historyShop) {
        const response = await transactionAPI.getTransactions({ 
          ...params, 
          shopId: historyShop 
        });
        if (response.data && response.data.success) {
          let transactions = response.data.transactions || [];
          transactions = sortTransactions(transactions);
          setReturnHistory(transactions);
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
        setReturnHistory(sorted);
      } 
      // No filters - fetch all
      else {
        const response = await transactionAPI.getTransactions(params);
        if (response.data && response.data.success) {
          let transactions = response.data.transactions || [];
          transactions = sortTransactions(transactions);
          setReturnHistory(transactions);
        }
      }
    } catch (error) {
      console.error('Error fetching return history:', error);
      setReturnHistory([]);
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

  const fetchShops = async () => {
    try {
      const response = await shopAPI.getAll();
      if (response.data.success) {
        console.log('Fetched shops:', response.data.shops);
        setShops(response.data.shops.filter(shop => shop.status === 'active'));
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  // Empty Bottles handlers
  const handleEmptyBottlesChange = (flavor, value) => {
    setEmptyBottlesData({
      ...emptyBottlesData,
      [flavor]: parseInt(value) || 0,
    });
  };

  const handleEmptyBottlesSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedShop) {
      alert('Please select a shop');
      return;
    }

    const totalEmptyBottles = Object.values(emptyBottlesData).reduce((sum, val) => sum + val, 0);
    if (totalEmptyBottles === 0) {
      alert('Please record at least some empty bottle returns');
      return;
    }

    // Validate not returning more than available
    for (const [flavor, quantity] of Object.entries(emptyBottlesData)) {
      const available = getAvailableEmptyBottles(flavor);
      if (quantity > available) {
        alert(`Cannot return more ${flavor} bottles than sold. Available: ${available}, Requested: ${quantity}`);
        return;
      }
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      const items = Object.entries(emptyBottlesData)
        .filter(([_, quantity]) => quantity > 0)
        .map(([flavor, quantity]) => ({ flavor, quantity }));

      await transactionAPI.recordEmptyBottles({
        shopId: selectedShop,
        items,
      });
      
      setSuccessMessage('Empty bottles recorded successfully!');
      setEmptyBottlesData({});
      await fetchShopSalesAndReturns(selectedShop);
    } catch (error) {
      console.error('Error recording empty bottles:', error);
      alert('Error recording empty bottles: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getAvailableEmptyBottles = (flavor) => {
    const sold = shopSales[flavor] || 0;
    const returned = emptyBottlesReturned[flavor] || 0;
    return Math.max(0, sold - returned);
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

  // Group returns history by shop and date
  const groupReturnsByShopAndDate = (transactions) => {
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
          onClick={() => setActiveTab('return')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'return'
              ? 'bg-white text-primary-600 shadow-md'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }`}
        >
          <Recycle className="h-5 w-5" />
          Return Empty Bottles
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
          Return History
        </button>
      </div>

      {successMessage && activeTab === 'return' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
          {successMessage}
        </div>
      )}

      {/* Tab 1: Return Empty Bottles */}
      {activeTab === 'return' && (

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="card">
            {/* Shop Selection */}
            <div className="form-group mb-4 sm:mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4" />
                    Select Area
                  </label>
                  <select
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                    className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-12 text-sm text-gray-800 hover:border-blue-300 hover:shadow-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2720%27 height=%2720%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%233b82f6%27 stroke-width=%272.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat font-semibold shadow-sm"
                  >
                    <option value="">📍 All Areas</option>
                    {areas.map((area) => (
                      <option key={area} value={area}>📍 {area}</option>
                    ))}
                  </select>
                </div>
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
                        🏪 {shop.name}
                      </option>
                    ))}
                  </select>
                  {selectedArea && filteredShops.length === 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      No shops in {selectedArea}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Shop Sales Details Card */}
            {selectedShop && shopDataLoading && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 text-center">
                <div className="animate-spin h-5 w-5 border-b-2 border-primary-600 rounded-full mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">Loading shop data...</p>
              </div>
            )}
            
            {selectedShop && !shopDataLoading && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Shop Sales Summary
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div className="bg-white rounded-lg p-3">
                    <span className="text-green-600 block text-xs">Total Sold</span>
                    <span className="font-bold text-green-900 text-lg">
                      {Object.values(shopSales).reduce((a, b) => a + b, 0)}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <span className="text-green-600 block text-xs">Returned</span>
                    <span className="font-bold text-green-900 text-lg">
                      {Object.values(emptyBottlesReturned).reduce((a, b) => a + b, 0)}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <span className="text-green-600 block text-xs">Pending</span>
                    <span className="font-bold text-amber-600 text-lg">
                      {flavors.reduce((sum, f) => sum + getAvailableEmptyBottles(f.key), 0)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Empty Bottles Form */}
            <form onSubmit={handleEmptyBottlesSubmit} className="space-y-4 sm:space-y-6">
              <div className="form-group">
                <label className="form-label">
                  Empty Bottles Returned per Flavor
                </label>
                <div className="space-y-3">
                  {flavors.map((flavor) => {
                    const sold = shopSales[flavor.key] || 0;
                    const returned = emptyBottlesReturned[flavor.key] || 0;
                    const available = getAvailableEmptyBottles(flavor.key);
                    return (
                      <div key={flavor.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded-lg">
                        {/* Flavor name - full width on mobile */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded-full ${flavor.color} flex-shrink-0`}></div>
                          <label className="text-sm font-medium text-gray-700">
                            {flavor.label}
                          </label>
                        </div>
                        {/* Badges and input - second row on mobile, same row on sm+ */}
                        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 w-full sm:w-auto">
                          <div className="text-xs text-gray-500 flex items-center gap-1 flex-wrap">
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px]">Sold: {sold}</span>
                            <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px]">Returned: {returned}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${available > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              Available: {available}
                            </span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            max={available}
                            value={emptyBottlesData[flavor.key] || ''}
                            onChange={(e) => handleEmptyBottlesChange(flavor.key, e.target.value)}
                            className="w-20 sm:w-24 input text-center text-sm flex-shrink-0"
                            placeholder="0"
                            disabled={!selectedShop || available === 0}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-700">Total Empty Bottles:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {Object.values(emptyBottlesData).reduce((sum, val) => sum + val, 0)} bottles
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full btn btn-primary disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
                      Recording...
                    </span>
                  ) : (
                    'Record Empty Bottles'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setEmptyBottlesData({})}
                  className="w-full btn btn-secondary mt-2"
                  disabled={loading || Object.values(emptyBottlesData).every(v => v === 0 || !v)}
                >
                  Reset Form
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4 sm:space-y-6">
          {/* Available Empty Bottles */}
          <div className="card">
            <h3 className="heading-3 mb-4 flex items-center">
              <Recycle className="h-5 w-5 mr-2" />
              Empty Bottles Available
            </h3>
            {selectedShop ? (
              <div className="space-y-2 sm:space-y-3">
                {flavors.map((flavor) => {
                  const available = getAvailableEmptyBottles(flavor.key);
                  const sold = shopSales[flavor.key] || 0;
                  return (
                    <div key={flavor.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-3 h-3 rounded-full ${flavor.color} flex-shrink-0`}></div>
                        <span className="text-sm font-medium text-gray-700 truncate">{flavor.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${available > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                          {available}
                        </span>
                        <span className="text-xs text-gray-400">/ {sold} sold</span>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-gray-200 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Total Available:</span>
                    <span className="text-lg font-bold text-green-600">
                      {flavors.reduce((sum, f) => sum + getAvailableEmptyBottles(f.key), 0)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">
                Select a shop to view available empty bottles
              </p>
            )}
          </div>

          {/* EPR Info */}
          <div className="card">
            <h3 className="heading-3 mb-4">EPR Compliance</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Track empty bottle returns for EPR compliance</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Record returns from each shop accurately</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Helps maintain sustainability records</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      )}

      {/* Tab 2: Return History */}
      {activeTab === 'history' && (
      <div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <span className="text-green-600 block text-xs font-medium">Grouped Returns</span>
            <span className="font-bold text-green-900 text-2xl">
              {groupReturnsByShopAndDate(returnHistory).length}
            </span>
            <span className="text-xs text-green-500">
              ({returnHistory.length} individual entries)
            </span>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
            <span className="text-blue-600 block text-xs font-medium">Total Bottles</span>
            <span className="font-bold text-blue-900 text-2xl">
              {returnHistory.reduce((sum, t) => sum + (t.totalQuantity || 0), 0)}
            </span>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
            <span className="text-purple-600 block text-xs font-medium">Shops</span>
            <span className="font-bold text-purple-900 text-2xl">
              {new Set(returnHistory.map(t => t.shopId?._id || t.shopId)).size}
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
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <p className="text-sm font-medium text-gray-700">
              {historyLoading ? 'Loading...' : selectedDate ? `${groupReturnsByShopAndDate(returnHistory).length} grouped records for ${new Date(selectedDate).toLocaleDateString('en-IN')}` : `Showing ${groupReturnsByShopAndDate(returnHistory).length} grouped return record${groupReturnsByShopAndDate(returnHistory).length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-3">
          {historyLoading ? (
            <div className="card text-center py-12">
              <div className="animate-spin h-10 w-10 border-b-2 border-primary-600 rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-3">Loading return history...</p>
            </div>
          ) : returnHistory.length === 0 ? (
            <div className="card text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <History className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No return history found</p>
              <p className="text-sm text-gray-400 mt-1">
                {selectedDate ? `No records for ${new Date(selectedDate).toLocaleDateString('en-IN')}` : historyArea || historyShop ? 'Try adjusting your filters' : 'Select filters to view history'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupReturnsByShopAndDate(returnHistory).map((group, index) => (
                <div
                  key={`${group.shopId}_${group.date}`}
                  className="card hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500 py-2 px-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Left: Shop Info */}
                    <div className="flex items-center gap-3">
                      {/* Serial Number */}
                      <span className="text-sm text-gray-900 font-medium w-6">
                        {index + 1}.
                      </span>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center flex-shrink-0">
                        <Recycle className="h-6 w-6 text-green-600" />
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
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                            {group.transactions.length} return{group.transactions.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: Quantity & Expand */}
                    <div className="flex items-center gap-4 sm:pl-4 sm:border-l border-gray-200">
                      <div className="text-right">
                        <p className="text-3xl font-bold text-green-600">
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
                      
                      {/* Individual Returns Details Dropdown */}
                      <div className="border-t border-gray-200 pt-3">
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                          Individual Return Details ({group.transactions.length} entries)
                        </h5>
                        <div className="space-y-2">
                          {group.transactions.map((transaction, tIndex) => (
                            <div key={transaction._id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-500">
                                  Entry #{tIndex + 1} • {formatDate(transaction.createdAt)}
                                </span>
                                <span className="text-sm font-bold text-green-600">
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

export default ReturnBottles;
