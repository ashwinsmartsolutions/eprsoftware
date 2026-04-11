import React, { useState, useEffect } from 'react';
import { productionAPI } from '../services/api';
import { Factory, History, Package, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';

const FranchiseProduction = () => {
  const [productionHistory, setProductionHistory] = useState([]);
  const [inventory, setInventory] = useState({});
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    orange: '',
    blueberry: '',
    jira: '',
    lemon: '',
    mint: '',
    guava: '',
    notes: ''
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
    fetchProductionData();
  }, []);

  const fetchProductionData = async () => {
    try {
      setLoading(true);
      
      const [historyRes, inventoryRes] = await Promise.all([
        productionAPI.getHistory(),
        productionAPI.getInventory()
      ]);

      if (historyRes.data.success) {
        setProductionHistory(historyRes.data.productions);
      }

      if (inventoryRes.data.success) {
        setInventory(inventoryRes.data.inventory);
      }
      
      console.log('[FranchiseProduction] Data loaded:', {
        inventory: inventoryRes.data?.inventory,
        historyCount: historyRes.data?.productions?.length
      });
    } catch (error) {
      console.error('Error fetching production data:', error);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await productionAPI.record({
        date: formData.date,
        stock: {
          orange: parseInt(formData.orange) || 0,
          blueberry: parseInt(formData.blueberry) || 0,
          jira: parseInt(formData.jira) || 0,
          lemon: parseInt(formData.lemon) || 0,
          mint: parseInt(formData.mint) || 0,
          guava: parseInt(formData.guava) || 0,
        },
        notes: formData.notes
      });

      if (response.data.success) {
        setSuccessMessage('Production recorded successfully!');
        setTimeout(() => setSuccessMessage(''), 3000);
        setFormData({
          date: new Date().toISOString().split('T')[0],
          orange: '',
          blueberry: '',
          jira: '',
          lemon: '',
          mint: '',
          guava: '',
          notes: ''
        });
        setShowForm(false);
        fetchProductionData();
      }
    } catch (error) {
      console.error('Error recording production:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to record production. Please try again.';
      alert('Error: ' + errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const totalProduced = Object.values(inventory).reduce((sum, val) => sum + val, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="heading-2 flex items-center gap-2">
            <Factory className="h-6 w-6 text-primary-600" />
            Production Overview
          </h2>
          <p className="text-gray-600 mt-1">Record and manage your production</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary flex-1 sm:flex-none"
          >
            <Plus className="h-5 w-5" />
            <span>Record Production</span>
          </button>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
          {successMessage}
        </div>
      )}

      {/* Total Production Stats */}
      <div className="card bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm">
            <Factory className="h-7 w-7 text-primary-600" />
          </div>
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Production</p>
            <p className="text-3xl font-bold text-gray-900">{totalProduced.toLocaleString()}</p>
            <p className="text-sm text-gray-500">bottles produced across all flavors</p>
          </div>
        </div>
      </div>

      {/* Production by Flavor */}
      <div className="card">
        <h3 className="heading-3 flex items-center gap-2 mb-4">
          <Package className="h-5 w-5" />
          Production by Flavor
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {flavors.map((flavor) => (
            <div key={flavor.key} className="rounded-xl p-4 text-center bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-100">
              <div className={`w-4 h-4 rounded-full ${flavor.color} mx-auto mb-2`}></div>
              <p className="text-sm font-medium text-gray-600">{flavor.label}</p>
              <p className="text-xl font-bold text-gray-900">{inventory[flavor.key] || 0}</p>
              <p className="text-xs text-gray-500">bottles</p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Popup for Recording Production */}
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
                <Plus className="h-5 w-5 text-primary-600" />
                Record New Production
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
              {/* Date Field */}
              <div className="space-y-2">
                <label className="form-label">Production Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  className="input"
                  required
                  disabled={loading}
                />
              </div>

              {/* Flavor Inputs */}
              <div className="space-y-3">
                <label className="form-label">Production Quantities</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {flavors.map((flavor) => (
                    <div key={flavor.key} className="space-y-2">
                      <label className="form-label flex items-center gap-2 text-sm">
                        <div className={`w-3 h-3 rounded ${flavor.color}`}></div>
                        {flavor.label} (bottles)
                      </label>
                      <input
                        type="number"
                        name={flavor.key}
                        value={formData[flavor.key]}
                        onChange={handleChange}
                        className="input"
                        placeholder="0"
                        min="0"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        disabled={loading}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="form-label">Notes (optional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="input"
                  rows="3"
                  placeholder="Enter any production notes..."
                  disabled={loading}
                />
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 border-t border-gray-200">
                <div className="text-sm bg-gray-50 px-4 py-2 rounded-lg">
                  <span className="text-gray-500">Total to Record: </span>
                  <span className="font-bold text-primary-600">
                    {flavors.reduce((sum, flavor) => sum + (parseInt(formData[flavor.key]) || 0), 0)} bottles
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
                    disabled={loading}
                    className="btn btn-primary flex-1 sm:flex-none disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
                        Recording...
                      </span>
                    ) : (
                      'Record Production'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Production History */}
      <div className="card">
        <h3 className="heading-3 flex items-center gap-2 mb-4">
          <History className="h-5 w-5" />
          Production History
        </h3>
        
        {productionHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Factory className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No production records found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {productionHistory.map((production) => {
              const isExpanded = expandedItems[production._id];
              const totalQty = Object.values(production.stock || {}).reduce((a, b) => a + b, 0);
              
              return (
                <div key={production._id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleExpand(production._id)}
                    className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Factory className="h-5 w-5 text-primary-600" />
                      <div className="text-left">
                        <p className="font-medium text-gray-900">
                          {new Date(production.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-sm text-gray-500">{totalQty} bottles produced</p>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 py-3 bg-white">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {flavors.map((flavor) => {
                          const qty = production.stock?.[flavor.key] || 0;
                          if (qty === 0) return null;
                          return (
                            <div key={flavor.key} className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${flavor.color}`}></div>
                              <span className="text-sm text-gray-600">{flavor.label}:</span>
                              <span className="font-medium">{qty}</span>
                            </div>
                          );
                        })}
                      </div>
                      {production.notes && (
                        <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <span className="font-medium">Notes:</span> {production.notes}
                        </p>
                      )}
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

export default FranchiseProduction;
