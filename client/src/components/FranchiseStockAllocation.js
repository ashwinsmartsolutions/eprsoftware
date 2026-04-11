import React, { useState, useEffect } from 'react';
import { franchiseAPI, stockAPI, shopAPI } from '../services/api';
import { Package, Store, ChevronDown, ChevronUp, History, Plus, X, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FranchiseStockAllocation = () => {
  const { user } = useAuth();
  const [franchiseData, setFranchiseData] = useState(null);
  const [allocationHistory, setAllocationHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [stock, setStock] = useState({
    orange: '',
    blueberry: '',
    jira: '',
    lemon: '',
    mint: '',
    guava: ''
  });
  const [successMessage, setSuccessMessage] = useState('');

  const flavors = [
    { key: 'orange', label: 'Orange', color: 'bg-orange-500', textColor: 'text-orange-600' },
    { key: 'blueberry', label: 'Blueberry', color: 'bg-blue-600', textColor: 'text-blue-600' },
    { key: 'jira', label: 'Jira', color: 'bg-purple-500', textColor: 'text-purple-600' },
    { key: 'lemon', label: 'Lemon', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
    { key: 'mint', label: 'Mint', color: 'bg-green-500', textColor: 'text-green-600' },
    { key: 'guava', label: 'Guava', color: 'bg-pink-500', textColor: 'text-pink-600' },
  ];

  useEffect(() => {
    if (user?.franchiseId) {
      fetchFranchiseData();
      fetchAllocationHistory();
      fetchShops();

      // Poll for real-time updates every 5 seconds
      const interval = setInterval(() => {
        fetchFranchiseData();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [user?.franchiseId]);

  const fetchFranchiseData = async () => {
    try {
      const response = await franchiseAPI.getDetails(user.franchiseId);
      if (response.data.success) {
        setFranchiseData(response.data.details);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching franchise data:', error);
    }
  };

  const fetchAllocationHistory = async () => {
    try {
      setLoading(true);
      const response = await franchiseAPI.getAllocationHistory(user.franchiseId);
      if (response.data.success) {
        setAllocationHistory(response.data.allocations || []);
      }
    } catch (error) {
      console.error('Error fetching allocation history:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchShops = async () => {
    try {
      const response = await shopAPI.getAll();
      if (response.data.success) {
        setShops(response.data.shops || []);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const handleStockChange = (flavor, value) => {
    setStock(prev => ({
      ...prev,
      [flavor]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedShop) {
      alert('Please select a shop');
      return;
    }

    const totalToAllocate = Object.values(stock).reduce((sum, qty) => sum + (parseInt(qty) || 0), 0);
    if (totalToAllocate === 0) {
      alert('Please enter at least one quantity');
      return;
    }

    setLoading(true);
    try {
      const items = flavors
        .filter(f => parseInt(stock[f.key]) > 0)
        .map(f => ({
          flavor: f.label,
          quantity: parseInt(stock[f.key])
        }));

      const response = await stockAPI.allocateToShop({
        shopId: selectedShop,
        items
      });

      if (response.data.success) {
        setSuccessMessage(`Stock allocated successfully! Total: ${totalToAllocate} bottles`);
        setTimeout(() => setSuccessMessage(''), 3000);
        setStock({
          orange: '',
          blueberry: '',
          jira: '',
          lemon: '',
          mint: '',
          guava: ''
        });
        setSelectedShop('');
        setShowForm(false);
        fetchFranchiseData();
        fetchAllocationHistory();
      }
    } catch (error) {
      console.error('Error allocating stock:', error);
      alert(error.response?.data?.message || 'Failed to allocate stock');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const stats = franchiseData?.stats || {};
  const totalReceived = stats.totalStockAllocated || 0;
  const totalDistributed = Object.values(stats.allocatedToShopsByFlavor || {}).reduce((a, b) => a + b, 0);
  const currentStock = totalReceived - totalDistributed;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="heading-2 flex items-center gap-2">
            <Package className="h-6 w-6 text-primary-600" />
            Stock Allocation
          </h2>
          <p className="text-gray-600 mt-1">
            {lastUpdated 
              ? `Last updated: ${lastUpdated.toLocaleTimeString()}`
              : 'Loading...'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary w-full sm:w-auto"
          disabled={currentStock === 0}
          title={currentStock === 0 ? 'No stock available to allocate' : 'Allocate stock to shops'}
        >
          <Plus className="h-5 w-5" />
          <span>Allocate to Shop</span>
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          {successMessage}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Received</p>
              <p className="text-2xl font-bold text-gray-900">{totalReceived.toLocaleString()}</p>
              <p className="text-xs text-gray-500">bottles from owner</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <Store className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Distributed to Shops</p>
              <p className="text-2xl font-bold text-gray-900">{totalDistributed.toLocaleString()}</p>
              <p className="text-xs text-gray-500">bottles allocated</p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-emerald-50 to-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm">
              <Package className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Stock</p>
              <p className="text-2xl font-bold text-gray-900">{Math.max(0, currentStock).toLocaleString()}</p>
              <p className="text-xs text-gray-500">bottles available</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stock by Flavor */}
      <div className="card">
        <h3 className="heading-3 flex items-center gap-2 mb-4">
          <Package className="h-5 w-5" />
          Stock by Flavor
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {flavors.map((flavor) => {
            const received = stats.totalStockAllocatedByFlavor?.[flavor.key] || 0;
            const distributed = stats.allocatedToShopsByFlavor?.[flavor.key] || 0;
            const available = Math.max(0, received - distributed);
            
            return (
              <div key={flavor.key} className="rounded-xl p-4 text-center bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100">
                <div className={`w-4 h-4 rounded-full ${flavor.color} mx-auto mb-2`}></div>
                <p className="text-sm font-medium text-gray-600">{flavor.label}</p>
                <p className={`text-xl font-bold ${available > 0 ? flavor.textColor : 'text-gray-400'}`}>
                  {available}
                </p>
                <p className="text-xs text-gray-500">available</p>
                {received > 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    {distributed}/{received} allocated
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Popup for Allocating Stock */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => !loading && setShowForm(false)}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h3 className="heading-3 flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary-600" />
                Allocate Stock to Shop
              </h3>
              <button
                onClick={() => !loading && setShowForm(false)}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Shop Selection */}
              <div className="space-y-2">
                <label className="form-label">Select Shop</label>
                <select
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                  className="input"
                  required
                  disabled={loading}
                >
                  <option value="">Choose a shop...</option>
                  {shops.map((shop) => (
                    <option key={shop._id} value={shop._id}>
                      {shop.name} - {shop.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Flavor Inputs */}
              <div className="space-y-3">
                <label className="form-label">Allocation Quantities</label>
                <div className="space-y-3">
                  {flavors.map((flavor) => {
                    const availableQty = stats.currentStock?.[flavor.key] || 0;
                    return (
                      <div key={flavor.key} className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className={`w-4 h-4 rounded-full ${flavor.color} flex-shrink-0`}></div>
                          <span className={`text-sm font-semibold ${flavor.textColor} truncate`}>
                            {flavor.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            (Available: {availableQty})
                          </span>
                        </div>
                        <input
                          type="number"
                          value={stock[flavor.key]}
                          onChange={(e) => handleStockChange(flavor.key, e.target.value)}
                          className="w-24 input text-center text-sm"
                          placeholder="0"
                          min="0"
                          max={availableQty}
                          inputMode="numeric"
                          pattern="[0-9]*"
                          disabled={loading}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 border-t border-gray-200">
                <div className="text-sm bg-gray-50 px-4 py-2 rounded-lg">
                  <span className="text-gray-500">Total to Allocate: </span>
                  <span className="font-bold text-primary-600">
                    {flavors.reduce((sum, flavor) => sum + (parseInt(stock[flavor.key]) || 0), 0)} bottles
                  </span>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => !loading && setShowForm(false)}
                    disabled={loading}
                    className="btn btn-secondary flex-1 sm:flex-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedShop}
                    className="btn btn-primary flex-1 sm:flex-none disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
                        Allocating...
                      </span>
                    ) : (
                      'Allocate Stock'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocation History */}
      <div className="card">
        <h3 className="heading-3 flex items-center gap-2 mb-4">
          <History className="h-5 w-5" />
          Allocation History
        </h3>
        
        {allocationHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No allocation history found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allocationHistory.map((allocation) => {
              const isExpanded = expandedItems[allocation._id];
              const totalQty = allocation.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
              
              return (
                <div key={allocation._id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleExpand(allocation._id)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-blue-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {new Date(allocation.createdAt).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-500">{totalQty} bottles allocated</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full capitalize">
                        {allocation.type}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 py-3 bg-white">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {allocation.items?.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${flavors.find(f => f.key === item.flavor.toLowerCase())?.color || 'bg-gray-400'}`}></div>
                            <span className="text-sm text-gray-600">{item.flavor}:</span>
                            <span className="font-medium">{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FranchiseStockAllocation;
