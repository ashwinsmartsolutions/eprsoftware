import React, { useState, useEffect } from 'react';
import { franchiseAPI, stockAPI, shopAPI } from '../services/api';
import { Package, TrendingUp, Store, MapPin, Phone } from 'lucide-react';

const StockAllocation = () => {
  const [franchises, setFranchises] = useState([]);
  const [selectedFranchise, setSelectedFranchise] = useState('');
  const [franchiseShops, setFranchiseShops] = useState([]);
  const [ownerInventory, setOwnerInventory] = useState({
    available: {},
    totalProduced: {},
    totalAllocated: {},
  });
  const [stock, setStock] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchFranchises();
    fetchOwnerInventory();

    // Poll for real-time inventory updates every 5 seconds
    const interval = setInterval(() => {
      fetchOwnerInventory();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedFranchise) {
      fetchFranchiseShops(selectedFranchise);
    } else {
      setFranchiseShops([]);
    }
  }, [selectedFranchise]);

  const fetchOwnerInventory = async () => {
    try {
      const response = await stockAPI.getOwnerInventory();
      if (response.data.success) {
        setOwnerInventory({
          available: response.data.available,
          totalProduced: response.data.totalProduced,
          totalAllocated: response.data.totalAllocated,
        });
      }
    } catch (error) {
      console.error('Error fetching producer inventory:', error);
    }
  };

  const fetchFranchises = async () => {
    try {
      const response = await franchiseAPI.getAll();
      if (response.data.success) {
        // Set all franchise stock to zero as requested
        const franchisesWithZeroStock = response.data.franchises.map(fr => ({
          ...fr,
          stock: {
            orange: 0,
            blueberry: 0,
            jira: 0,
            lemon: 0,
            mint: 0,
            guava: 0,
          }
        }));
        setFranchises(franchisesWithZeroStock);
      }
    } catch (error) {
      console.error('Error fetching franchises:', error);
    }
  };

  const fetchFranchiseShops = async (franchiseId) => {
    try {
      const response = await shopAPI.getByFranchise(franchiseId);
      if (response.data.success) {
        setFranchiseShops(response.data.shops);
      }
    } catch (error) {
      console.error('Error fetching franchise shops:', error);
      setFranchiseShops([]);
    }
  };

  const handleStockChange = (flavor, value) => {
    setStock({
      ...stock,
      [flavor]: parseInt(value) || 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFranchise) {
      alert('Please select a franchise');
      return;
    }

    const totalStock = Object.values(stock).reduce((sum, val) => sum + val, 0);
    if (totalStock === 0) {
      alert('Please allocate at least some stock');
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      const response = await stockAPI.allocateToFranchise({
        franchiseId: selectedFranchise,
        stock,
      });
      
      setSuccessMessage('Stock allocated successfully!');
      setStock({});
      setSelectedFranchise('');
      // Refresh owner inventory to show updated available stock
      fetchOwnerInventory();
    } catch (error) {
      console.error('Error allocating stock:', error);
      alert('Error allocating stock: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
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
      <h2 className="heading-2">Stock Allocation</h2>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="card">
              <h3 className="heading-3 mb-4 flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Allocate Stock to Franchise
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="form-group">
                <label className="form-label">
                  Select Franchise
                </label>
                <select
                  value={selectedFranchise}
                  onChange={(e) => setSelectedFranchise(e.target.value)}
                  className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-12 text-sm text-gray-800 hover:border-blue-300 hover:shadow-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2720%27 height=%2720%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%233b82f6%27 stroke-width=%272.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat font-semibold shadow-sm"
                  required
                >
                  <option value="">🏢 Choose a franchise...</option>
                  {franchises
                    .filter(fr => fr.status === 'active')
                    .map((franchise) => (
                      <option key={franchise._id} value={franchise._id}>
                        🏢 {franchise.name} - {franchise.email}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Stock Quantity per Flavor
                </label>
                <div className="space-y-3">
                  {flavors.map((flavor) => (
                    <div key={flavor.key} className="flex items-center justify-between gap-2 sm:gap-3 py-1">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <div className={`w-4 h-4 rounded ${flavor.color} flex-shrink-0`}></div>
                        <label className="text-sm font-medium text-gray-700 truncate">
                          {flavor.label}
                        </label>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <div className="text-xs text-gray-500 hidden sm:block whitespace-nowrap">
                          Available: {ownerInventory.available[flavor.key] || ''}
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={ownerInventory.available[flavor.key] || ''}
                          value={stock[flavor.key] || ''}
                          onChange={(e) => handleStockChange(flavor.key, e.target.value)}
                          className="w-20 sm:w-24 input text-center text-sm"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-medium text-gray-700">Total Stock:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {Object.values(stock).reduce((sum, val) => sum + val, 0)} bottles
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
                      Allocating...
                    </span>
                  ) : (
                    'Allocate Stock'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="card">
            <h3 className="heading-3 mb-4 flex items-center">
              <Store className="h-5 w-5 mr-2" />
              Owner Available Stock
            </h3>
            <div className="space-y-2 sm:space-y-3">
              {flavors.map((flavor) => (
                <div key={flavor.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-3 h-3 rounded ${flavor.color} flex-shrink-0`}></div>
                    <span className="text-sm font-medium text-gray-700 truncate">{flavor.label}</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                    {ownerInventory.available[flavor.key] || 0}
                  </span>
                </div>
              ))}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Available:</span>
                  <span className="text-lg font-bold text-primary-600">
                    {Object.values(ownerInventory.available).reduce((sum, val) => sum + val, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="heading-3 mb-4">
              Production Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Produced:</span>
                <span className="font-medium">{Object.values(ownerInventory.totalProduced).reduce((sum, val) => sum + val, 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Allocated:</span>
                <span className="font-medium">{Object.values(ownerInventory.totalAllocated).reduce((sum, val) => sum + val, 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remaining:</span>
                <span className="font-bold text-emerald-600">{Object.values(ownerInventory.available).reduce((sum, val) => sum + val, 0)}</span>
              </div>
            </div>
          </div>

          {selectedFranchise && franchiseShops.length > 0 && (
            <div className="card mt-4">
              <h3 className="heading-3 mb-4 flex items-center">
                <Store className="h-5 w-5 mr-2" />
                Shops under this Franchise ({franchiseShops.length})
              </h3>
              <div className="space-y-3">
                {franchiseShops.map((shop) => (
                  <div key={shop._id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-medium text-gray-900">{shop.name}</div>
                    <div className="text-sm text-gray-600 flex items-center mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {shop.location}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">Area:</span> {shop.area}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center mt-1">
                      <Phone className="h-3 w-3 mr-1" />
                      {shop.contact}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockAllocation;
