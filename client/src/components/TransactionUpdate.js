import React, { useState, useEffect } from 'react';
import { shopAPI, transactionAPI } from '../services/api';
import { TrendingUp, Recycle, Store } from 'lucide-react';

const TransactionUpdate = () => {
  const [shops, setShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState('');
  const [shopStock, setShopStock] = useState({});
  const [salesData, setSalesData] = useState({});
  const [emptyBottlesData, setEmptyBottlesData] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('sales');

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    if (selectedShop) {
      fetchShopStock(selectedShop);
    }
  }, [selectedShop]);

  const fetchShops = async () => {
    try {
      const response = await shopAPI.getAll();
      if (response.data.success) {
        setShops(response.data.shops.filter(shop => shop.status === 'active').sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    }
  };

  const fetchShopStock = async (shopId) => {
    try {
      const response = await shopAPI.getById(shopId);
      if (response.data.success) {
        setShopStock(response.data.shop.stock);
      }
    } catch (error) {
      console.error('Error fetching shop stock:', error);
    }
  };

  const handleSalesChange = (flavor, value) => {
    setSalesData({
      ...salesData,
      [flavor]: parseInt(value) || 0,
    });
  };

  const handleEmptyBottlesChange = (flavor, value) => {
    setEmptyBottlesData({
      ...emptyBottlesData,
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

    // Check if shop has enough stock
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
      
      // Refresh data
      fetchShopStock(selectedShop);
    } catch (error) {
      console.error('Error recording sales:', error);
      alert('Error recording sales: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
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
    } catch (error) {
      console.error('Error recording empty bottles:', error);
      alert('Error recording empty bottles: ' + (error.response?.data?.message || error.message));
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
      <h2 className="heading-2">Update Sales & Empty Bottles</h2>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="tab-container">
              <nav>
                <button
                  onClick={() => setActiveTab('sales')}
                  className={activeTab === 'sales' ? 'tab-btn-active' : 'tab-btn-inactive'}
                >
                  <TrendingUp className="h-4 w-4 inline mr-2" />
                  Record Sales
                </button>
                <button
                  onClick={() => setActiveTab('empty-bottles')}
                  className={activeTab === 'empty-bottles' ? 'tab-btn-active' : 'tab-btn-inactive'}
                >
                  <Recycle className="h-4 w-4 inline mr-2" />
                  Empty Bottles
                </button>
              </nav>
            </div>

            <div className="pt-4 sm:pt-6">
              <div className="form-group mb-4 sm:mb-6">
                <label className="form-label">
                  Select Shop
                </label>
                <select
                  value={selectedShop}
                  onChange={(e) => setSelectedShop(e.target.value)}
                  className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-12 text-sm text-gray-800 hover:border-blue-300 hover:shadow-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2720%27 height=%2720%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%233b82f6%27 stroke-width=%272.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat font-semibold shadow-sm"
                  required
                >
                  <option value="">🏪 Choose a shop...</option>
                  {shops.map((shop) => (
                    <option key={shop._id} value={shop._id}>
                      🏪 {shop.name} - {shop.location}
                    </option>
                  ))}
                </select>
              </div>

              {activeTab === 'sales' && (
                <form onSubmit={handleSalesSubmit} className="space-y-4 sm:space-y-6">
                  <div className="form-group">
                    <label className="form-label">
                      Sales Quantity per Flavor
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
                              Available: {shopStock[flavor.key] || ''}
                            </div>
                            <input
                              type="number"
                              min="0"
                              max={shopStock[flavor.key] || ''}
                              value={salesData[flavor.key] || ''}
                              onChange={(e) => handleSalesChange(flavor.key, e.target.value)}
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
                      <span className="text-sm font-medium text-gray-700">Total Sales:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {Object.values(salesData).reduce((sum, val) => sum + val, 0)} bottles
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
                        'Record Sales'
                      )}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'empty-bottles' && (
                <form onSubmit={handleEmptyBottlesSubmit} className="space-y-4 sm:space-y-6">
                  <div className="form-group">
                    <label className="form-label">
                      Empty Bottles Returned per Flavor
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
                          <input
                            type="number"
                            min="0"
                            value={emptyBottlesData[flavor.key] || ''}
                            onChange={(e) => handleEmptyBottlesChange(flavor.key, e.target.value)}
                            className="w-20 sm:w-24 input text-center text-sm flex-shrink-0"
                            placeholder="0"
                          />
                        </div>
                      ))}
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
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {selectedShop && shopStock && (
            <div className="card">
              <h3 className="heading-3 mb-4 flex items-center">
                <Store className="h-5 w-5 mr-2" />
                Current Shop Stock
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {flavors.map((flavor) => (
                  <div key={flavor.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-3 h-3 rounded ${flavor.color} flex-shrink-0`}></div>
                      <span className="text-sm font-medium text-gray-700 truncate">{flavor.label}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900 flex-shrink-0">
                      {shopStock[flavor.key] || ''}
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

          <div className="card">
            <h3 className="heading-3 mb-4">Quick Tips</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Record sales daily to maintain accurate inventory</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Empty bottle returns help track recycling efforts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Check available stock before recording sales</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <span>Regular updates ensure accurate reporting</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionUpdate;
