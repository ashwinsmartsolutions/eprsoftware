import React, { useState, useEffect } from 'react';
import { shopAPI, stockAPI, transactionAPI } from '../services/api';
import { Package, Store, MapPin, Truck, CheckCircle, History, Filter, ChevronDown, ChevronUp, Pencil, Building2 } from 'lucide-react';

const DistributeStock = () => {
  // Shared state
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [areas, setAreas] = useState([]);
  
  // Distribute Stock Section State
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedShop, setSelectedShop] = useState('');
  const [shopDetails, setShopDetails] = useState(null);
  const [franchiseStock, setFranchiseStock] = useState({});
  const [stock, setStock] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // History Section State
  const [historyArea, setHistoryArea] = useState('');
  const [historyShop, setHistoryShop] = useState('');
  const [distributionHistory, setDistributionHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sortBy, setSortBy] = useState('shop');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedDate, setSelectedDate] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  
  // Edit Modal State
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('distribute'); // 'distribute' or 'history'

  useEffect(() => {
    fetchShops();
    fetchFranchiseStock();
  }, []);

  useEffect(() => {
    const uniqueAreas = [...new Set(shops.map(shop => shop.area).filter(Boolean))].sort();
    setAreas(uniqueAreas);
  }, [shops]);

  useEffect(() => {
    let filtered = shops;
    if (selectedArea) {
      filtered = shops.filter(shop => shop.area === selectedArea);
    }
    setFilteredShops(filtered);
    if (selectedShop && !filtered.find(s => s._id === selectedShop)) {
      setSelectedShop('');
      setShopDetails(null);
    }
  }, [selectedArea, shops]);

  useEffect(() => {
    if (selectedShop) {
      const shop = shops.find(s => s._id === selectedShop);
      setShopDetails(shop);
    } else {
      setShopDetails(null);
    }
  }, [selectedShop, shops]);

  // Fetch distribution history when filters change
  useEffect(() => {
    fetchDistributionHistory();
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

  const fetchDistributionHistory = async () => {
    setHistoryLoading(true);
    try {
      let params = { type: 'stock_allocation', limit: 100 };
      
      // If specific shop selected, fetch only for that shop
      if (historyShop) {
        const response = await transactionAPI.getTransactions({ 
          ...params, 
          shopId: historyShop 
        });
        if (response.data && response.data.success) {
          let transactions = response.data.transactions || [];
          transactions = sortTransactions(transactions);
          setDistributionHistory(transactions);
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
        setDistributionHistory(sorted);
      } 
      // No filters - fetch all
      else {
        const response = await transactionAPI.getTransactions(params);
        if (response.data && response.data.success) {
          let transactions = response.data.transactions || [];
          transactions = sortTransactions(transactions);
          setDistributionHistory(transactions);
        }
      }
    } catch (error) {
      console.error('Error fetching distribution history:', error);
      setDistributionHistory([]);
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

  const handleStockChange = (flavor, value) => {
    setStock({
      ...stock,
      [flavor]: parseInt(value) || 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedShop) {
      alert('Please select a shop');
      return;
    }

    const totalStock = Object.values(stock).reduce((sum, val) => sum + val, 0);
    if (totalStock === 0) {
      alert('Please allocate at least some stock');
      return;
    }

    for (const [flavor, quantity] of Object.entries(stock)) {
      if (quantity > 0 && (franchiseStock[flavor] || 0) < quantity) {
        alert(`Insufficient stock for ${flavor}. Available: ${franchiseStock[flavor] || 0}, Requested: ${quantity}`);
        return;
      }
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      const response = await stockAPI.allocateToShop({
        shopId: selectedShop,
        stock,
      });
      
      if (response.data.success) {
        setSuccessMessage(`Stock distributed successfully to ${shopDetails?.name || 'shop'}!`);
        setStock({});
        await fetchFranchiseStock();
        await fetchShops();
        await fetchDistributionHistory();
      }
    } catch (error) {
      console.error('Error distributing stock:', error);
      alert('Error distributing stock: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStock({});
    setSuccessMessage('');
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openEditModal = (transaction) => {
    setEditingTransaction(transaction);
    // Initialize form data with current values
    const formData = {};
    flavors.forEach(flavor => {
      const item = transaction.items?.find(i => i.flavor.toLowerCase() === flavor.key);
      formData[flavor.key] = item?.quantity || 0;
    });
    setEditFormData(formData);
  };

  const closeEditModal = () => {
    setEditingTransaction(null);
    setEditFormData({});
    setEditLoading(false);
  };

  const handleEditChange = (flavor, value) => {
    setEditFormData({
      ...editFormData,
      [flavor]: parseInt(value) || 0,
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTransaction) return;

    setEditLoading(true);
    try {
      // Build items array from form data
      const items = Object.entries(editFormData)
        .filter(([_, quantity]) => quantity > 0)
        .map(([flavor, quantity]) => ({ flavor, quantity }));

      const response = await transactionAPI.update(editingTransaction._id, { items });
      
      if (response.data.success) {
        // Refresh data
        await fetchFranchiseStock();
        await fetchShops();
        await fetchDistributionHistory();
        closeEditModal();
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Error updating allocation: ' + (error.response?.data?.message || error.message));
    } finally {
      setEditLoading(false);
    }
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

  const flavors = [
    { key: 'orange', label: 'Orange', color: 'bg-orange-500', textColor: 'text-orange-600' },
    { key: 'blueberry', label: 'Blueberry', color: 'bg-blue-600', textColor: 'text-blue-600' },
    { key: 'jira', label: 'Jira', color: 'bg-purple-500', textColor: 'text-purple-600' },
    { key: 'lemon', label: 'Lemon', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { key: 'mint', label: 'Mint', color: 'bg-green-500', textColor: 'text-green-600' },
    { key: 'guava', label: 'Guava', color: 'bg-pink-500', textColor: 'text-pink-600' },
  ];

  const totalAllocated = Object.values(stock).reduce((sum, val) => sum + val, 0);
  const totalFranchiseStock = Object.values(franchiseStock).reduce((sum, val) => sum + val, 0);

  return (
    <div className="section-spacing">
      {/* Tab Buttons */}
      <div className="flex mb-6 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab('distribute')}
          className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'distribute'
              ? 'bg-white text-primary-600 shadow-md'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
          }`}
        >
          <Truck className="h-5 w-5" />
          Distribute Stock
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
          History
        </button>
      </div>

      {successMessage && activeTab === 'distribute' && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Tab 1: Distribute Stock */}
      {activeTab === 'distribute' && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="card">
            {/* Shop Selection */}
            <div className="form-group mb-6">
              <label className="form-label flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Select Area
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-12 text-sm text-gray-800 hover:border-blue-300 hover:shadow-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2720%27 height=%2720%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%233b82f6%27 stroke-width=%272.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat font-semibold shadow-sm mb-4"
              >
                <option value="">📍 All Areas</option>
                {areas.map((area) => (
                  <option key={area} value={area}>📍 {area}</option>
                ))}
              </select>

              <label className="form-label flex items-center gap-2">
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

            {/* Shop Details Card */}
            {shopDetails && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  Selected Shop
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600">Name:</span>
                    <p className="font-medium text-blue-900">{shopDetails.name}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Location:</span>
                    <p className="font-medium text-blue-900">{shopDetails.location}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Area:</span>
                    <p className="font-medium text-blue-900">{shopDetails.area}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">Current Total Stock:</span>
                    <p className="font-medium text-blue-900">
                      {Object.values(shopDetails.stock || {}).reduce((a, b) => a + b, 0)} bottles
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stock Distribution Form */}
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-6">
                <label className="form-label flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Allocate Stock per Flavor
                </label>
                <div className="space-y-3">
                  {flavors.map((flavor) => (
                    <div key={flavor.key} className="flex items-center justify-between gap-2 sm:gap-3 py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className={`w-4 h-4 rounded-full ${flavor.color} flex-shrink-0 shadow-sm`}></div>
                        <label className={`text-sm font-semibold ${flavor.textColor} truncate`}>
                          {flavor.label}
                        </label>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <div className="text-xs text-gray-500 hidden sm:block whitespace-nowrap">
                          Available: <span className="font-medium">{franchiseStock[flavor.key] || 0}</span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={franchiseStock[flavor.key] || 0}
                          value={stock[flavor.key] || ''}
                          onChange={(e) => handleStockChange(flavor.key, e.target.value)}
                          className="w-20 sm:w-24 input text-center text-sm"
                          placeholder="0"
                          disabled={!selectedShop}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-gray-200">
                <div className="text-sm">
                  <span className="text-gray-600">Total to Allocate:</span>
                  <span className="font-bold text-primary-600 text-lg ml-2">{totalAllocated} bottles</span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn btn-secondary"
                    disabled={loading || totalAllocated === 0}
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedShop || totalAllocated === 0}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
                        Distributing...
                      </span>
                    ) : (
                      <>
                        <Truck className="h-4 w-4" />
                        Distribute Stock
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4 sm:space-y-6">
          {/* Franchise Stock Overview */}
          <div className="card">
            <h3 className="heading-3 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Franchise Stock
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {flavors.map((flavor) => (
                <div key={flavor.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-3 h-3 rounded-full ${flavor.color} flex-shrink-0`}></div>
                    <span className="text-sm font-medium text-gray-700 truncate">{flavor.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                    {franchiseStock[flavor.key] || 0}
                  </span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-200 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Available:</span>
                  <span className="text-lg font-bold text-primary-600">
                    {totalFranchiseStock}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="card">
            <h3 className="heading-3 mb-4">How to Distribute</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
                <span>Select the shop you want to allocate stock to</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
                <span>Enter quantities for each flavor you want to allocate</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
                <span>Click "Distribute Stock" to transfer from franchise to shop</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-100 text-blue-600 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
                <span>The shop can now record sales from their allocated stock</span>
              </li>
            </ul>
          </div>

          {/* Quick Tip */}
          <div className="card bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <h3 className="heading-3 mb-2 text-amber-800">💡 Pro Tip</h3>
            <p className="text-sm text-amber-700">
              Always check the shop's current stock level before allocating. You can view this in the shop details card above.
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Tab 2: History */}
      {activeTab === 'history' && (
      <div>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
            <span className="text-blue-600 block text-xs font-medium">Distributed to Shops</span>
            <span className="font-bold text-blue-900 text-2xl">
              {distributionHistory.filter(t => t.shopId).length}
            </span>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
            <span className="text-green-600 block text-xs font-medium">Incoming from Owner</span>
            <span className="font-bold text-green-900 text-2xl">
              {distributionHistory.filter(t => !t.shopId).length}
            </span>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
            <span className="text-purple-600 block text-xs font-medium">Total Bottles Moved</span>
            <span className="font-bold text-purple-900 text-2xl">
              {distributionHistory.reduce((sum, t) => sum + (t.totalQuantity || 0), 0)}
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
              {historyLoading ? 'Loading...' : selectedDate ? `${distributionHistory.length} records for ${new Date(selectedDate).toLocaleDateString('en-IN')}` : `${distributionHistory.length} records (${distributionHistory.filter(t => !t.shopId).length} incoming, ${distributionHistory.filter(t => t.shopId).length} distributed)`}
            </p>
          </div>
        </div>

        {/* History List */}
        <div className="space-y-3">
          {historyLoading ? (
            <div className="card text-center py-12">
              <div className="animate-spin h-10 w-10 border-b-2 border-primary-600 rounded-full mx-auto"></div>
              <p className="text-gray-500 mt-3">Loading distribution history...</p>
            </div>
          ) : distributionHistory.length === 0 ? (
            <div className="card text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                <History className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No distribution history found</p>
              <p className="text-sm text-gray-400 mt-1">
                {selectedDate ? `No records for ${new Date(selectedDate).toLocaleDateString('en-IN')}` : historyArea || historyShop ? 'Try adjusting your filters' : 'Select filters to view history'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {distributionHistory.map((transaction, index) => {
                const isOwnerAllocation = !transaction.shopId;
                return (
                <div
                  key={transaction._id}
                  className={`card hover:shadow-lg transition-all duration-200 border-l-4 py-2 px-3 ${isOwnerAllocation ? 'border-l-green-500 bg-gradient-to-r from-green-50/30 to-white' : 'border-l-blue-500'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    {/* Left: Shop/Owner Info */}
                    <div className="flex items-center gap-3">
                      {/* Serial Number */}
                      <span className="text-sm text-gray-900 font-medium w-6">
                        {index + 1}.
                      </span>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${isOwnerAllocation ? 'bg-gradient-to-br from-green-100 to-emerald-100' : 'bg-gradient-to-br from-blue-100 to-cyan-100'}`}>
                        {isOwnerAllocation ? (
                          <Building2 className="h-6 w-6 text-green-600" />
                        ) : (
                          <Package className="h-6 w-6 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {isOwnerAllocation ? (
                            <span className="flex items-center gap-2">
                              Incoming Stock from Owner
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">Incoming</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              {transaction.shopId?.name || transaction.shopId?.location || 'Unknown Shop'}
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Distributed</span>
                            </span>
                          )}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          {(transaction.shopId?.area || transaction.area) && !isOwnerAllocation && (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                              <MapPin className="h-3 w-3" />
                              {transaction.shopId?.area || transaction.area}
                            </span>
                          )}
                          {isOwnerAllocation && (
                            <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                              <Building2 className="h-3 w-3" />
                              Stock received from Owner
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatDate(transaction.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Right: Quantity, Edit & Expand */}
                    <div className="flex items-center gap-2 sm:gap-4 sm:pl-4 sm:border-l border-gray-200">
                      {!isOwnerAllocation && (
                        <button
                          onClick={() => openEditModal(transaction)}
                          className="w-10 h-10 flex items-center justify-center hover:bg-blue-100 hover:text-blue-600 rounded-xl transition-colors"
                          title="Edit allocation"
                        >
                          <Pencil className="h-5 w-5 text-gray-500 hover:text-blue-600" />
                        </button>
                      )}
                      <div className="text-right">
                        <p className={`text-3xl font-bold ${isOwnerAllocation ? 'text-green-600' : 'text-blue-600'}`}>
                          {transaction.totalQuantity}
                        </p>
                        <p className="text-xs text-gray-500 font-medium">
                          {isOwnerAllocation ? 'incoming' : 'distributed'}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleExpand(transaction._id)}
                        className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        {expandedItems[transaction._id] ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedItems[transaction._id] && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <h5 className={`text-sm font-semibold mb-2 flex items-center gap-2 ${isOwnerAllocation ? 'text-green-700' : 'text-gray-700'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isOwnerAllocation ? 'bg-green-500' : 'bg-primary-500'}`}></div>
                        Details by Flavor
                      </h5>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {transaction.items?.map((item, idx) => {
                          const flavorInfo = flavors.find(f => f.key === item.flavor.toLowerCase());
                          return (
                            <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 text-center border border-gray-100">
                              <div className={`w-3 h-3 rounded-full ${flavorInfo?.color || 'bg-gray-400'} mx-auto mb-1 shadow-sm`}></div>
                              <p className="text-xs font-medium text-gray-600 capitalize">{item.flavor}</p>
                              <p className="text-base font-bold text-gray-900">{item.quantity}</p>
                            </div>
                          );
                        })}
                      </div>
                      {transaction.description && (
                        <div className={`mt-2 p-2 rounded-lg border ${isOwnerAllocation ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
                          <p className={`text-xs ${isOwnerAllocation ? 'text-green-700' : 'text-blue-700'}`}>
                            <span className="font-semibold">Note:</span> {transaction.description}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );})}
            </div>
          )}
        </div>
      </div>
      )}

      {/* Edit Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Edit Stock Allocation</h3>
                <button
                  onClick={closeEditModal}
                  className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="text-gray-500 text-lg">&times;</span>
                </button>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-semibold text-blue-900 mb-1">
                  {editingTransaction.shopId?.name || 'Unknown Shop'}
                </h4>
                <p className="text-sm text-blue-600">
                  {formatDate(editingTransaction.createdAt)}
                </p>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4 mb-6">
                  {flavors.map((flavor) => (
                    <div key={flavor.key} className="flex items-center justify-between gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full ${flavor.color} flex-shrink-0 shadow-sm`}></div>
                        <label className={`text-sm font-semibold ${flavor.textColor}`}>
                          {flavor.label}
                        </label>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={editFormData[flavor.key] || ''}
                        onChange={(e) => handleEditChange(flavor.key, e.target.value)}
                        className="w-24 input text-center text-sm"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="flex-1 py-2.5 px-4 border-2 border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 py-2.5 px-4 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    {editLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
                        Saving...
                      </span>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributeStock;
