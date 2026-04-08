import React, { useState, useEffect } from 'react';
import { productionAPI } from '../services/api';
import { Plus, History, Factory, ChevronDown, ChevronUp } from 'lucide-react';

const OwnerProduction = () => {
  const [productionHistory, setProductionHistory] = useState([]);
  const [inventory, setInventory] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedItems, setExpandedItems] = useState({});

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchProductionData();
  }, []);

  const fetchProductionData = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching production data:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');

    try {
      const stock = {
        orange: parseInt(formData.orange) || 0,
        blueberry: parseInt(formData.blueberry) || 0,
        jira: parseInt(formData.jira) || 0,
        lemon: parseInt(formData.lemon) || 0,
        mint: parseInt(formData.mint) || 0,
        guava: parseInt(formData.guava) || 0,
      };

      const total = Object.values(stock).reduce((sum, val) => sum + val, 0);
      if (total === 0) {
        alert('Please enter at least some production quantity');
        setLoading(false);
        return;
      }

      await productionAPI.record({
        date: formData.date,
        stock,
        notes: formData.notes
      });

      setSuccessMessage('Production recorded successfully!');
      setFormData({ date: new Date().toISOString().split('T')[0], notes: '' });
      setShowForm(false);
      fetchProductionData();
    } catch (error) {
      console.error('Error recording production:', error);
      alert('Error recording production: ' + (error.response?.data?.message || error.message));
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

  const totalProduced = Object.values(inventory).reduce((sum, val) => sum + val, 0);

  // Group production history by date
  const groupProductionByDate = (records) => {
    const grouped = {};
    
    records.forEach(record => {
      const date = new Date(record.date || record.createdAt).toDateString();
      
      if (!grouped[date]) {
        grouped[date] = {
          date: record.date || record.createdAt,
          totalQuantity: 0,
          records: [],
          flavorTotals: {}
        };
      }
      
      const recordTotal = record.totalProduced || Object.values(record.stock).reduce((a, b) => a + b, 0);
      grouped[date].totalQuantity += recordTotal;
      grouped[date].records.push(record);
      
      // Aggregate flavors
      flavors.forEach(flavor => {
        const qty = record.stock[flavor.key] || 0;
        if (!grouped[date].flavorTotals[flavor.key]) {
          grouped[date].flavorTotals[flavor.key] = 0;
        }
        grouped[date].flavorTotals[flavor.key] += qty;
      });
    });
    
    return Object.values(grouped);
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => {
      const isCurrentlyExpanded = prev[id];
      if (isCurrentlyExpanded) {
        return {}; // Close current
      }
      return { [id]: true }; // Open only the new one, close others
    });
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

  return (
    <div className="section-spacing">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <Factory className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600" />
          <h2 className="heading-2">Production Management</h2>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary w-full sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          <span>{showForm ? 'Cancel' : 'Record Production'}</span>
        </button>
      </div>

      {/* Total Production Overview */}
      <div className="dashboard-grid mb-6">
        <div className="stat-card bg-gradient-to-br from-primary-50 to-primary-100 col-span-full">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-gray-500 text-xs sm:text-sm font-medium">Total Bottles Produced</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{totalProduced.toLocaleString()}</p>
              <p className="text-emerald-600 text-xs sm:text-sm mt-1">Across all flavors</p>
            </div>
            <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <Factory className="h-5 w-5 sm:h-7 sm:w-7 text-primary-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Flavor Breakdown - Single row layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {flavors.map((flavor) => (
          <div key={flavor.key} className="stat-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-4 h-4 rounded ${flavor.color} flex-shrink-0`}></div>
                <span className="text-gray-500 text-xs sm:text-sm font-medium truncate">{flavor.label}</span>
              </div>
              <span className="text-xl sm:text-2xl font-bold text-gray-900 flex-shrink-0">
                {inventory[flavor.key]?.toLocaleString() || ''}
              </span>
            </div>
          </div>
        ))}
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 animate-slide-up">
          {successMessage}
        </div>
      )}

      {showForm && (
        <div className="card mb-6 animate-slide-up">
          <h3 className="heading-3 mb-4 flex items-center">
            <Plus className="h-5 w-5 mr-2" />
            Record New Production
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {flavors.map((flavor) => (
                <div key={flavor.key} className="space-y-2">
                  <label className="form-label flex items-center gap-2">
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
                  />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="form-label">Notes (optional)</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="input"
                rows="3"
                placeholder="Enter any production notes..."
              />
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="text-sm">
                <span className="text-gray-500">Total to Record: </span>
                <span className="font-bold text-primary-600">
                  {flavors.reduce((sum, flavor) => sum + (parseInt(formData[flavor.key]) || 0), 0)} bottles
                </span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary disabled:opacity-50"
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
          </form>
        </div>
      )}

      {/* Production History */}
      <div className="card">
        <h3 className="heading-3 mb-4 flex items-center">
          <History className="h-5 w-5 mr-2" />
          Production History
        </h3>

        {productionHistory.length === 0 ? (
          <div className="empty-state py-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
              <Factory className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No production records yet</h3>
            <p className="text-gray-500 mb-4 max-w-sm mx-auto text-sm sm:text-base">Start recording your daily production to track inventory.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Summary */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <p className="text-sm font-medium text-gray-700">
                Showing {groupProductionByDate(productionHistory).length} grouped production record{groupProductionByDate(productionHistory).length !== 1 ? 's' : ''}
                <span className="text-gray-500"> ({productionHistory.length} individual entries)</span>
              </p>
            </div>
            
            {groupProductionByDate(productionHistory).map((group, index) => (
              <div
                key={group.date}
                className="card hover:shadow-lg transition-all duration-200 border-l-4 border-l-purple-500 py-2 px-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {/* Left: Serial & Date */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-900 font-medium w-6">
                      {index + 1}.
                    </span>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center flex-shrink-0">
                      <Factory className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 text-lg">
                        Production Record
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatDateOnly(group.date)}
                        </span>
                        <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                          {group.records.length} entry{group.records.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Right: Total & Expand */}
                  <div className="flex items-center gap-4 sm:pl-4 sm:border-l border-gray-200">
                    <div className="text-right">
                      <p className="text-3xl font-bold text-purple-600">
                        {group.totalQuantity.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 font-medium">total bottles</p>
                    </div>
                    <button
                      onClick={() => toggleExpand(group.date)}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      {expandedItems[group.date] ? (
                        <ChevronUp className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Expanded Details */}
                {expandedItems[group.date] && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    {/* Total by Flavor */}
                    <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500"></div>
                      Total by Flavor
                    </h5>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                      {flavors.map((f) => {
                        const qty = group.flavorTotals[f.key] || 0;
                        if (qty === 0) return null;
                        return (
                          <div key={f.key} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 text-center border border-gray-100">
                            <div className={`w-3 h-3 rounded-full ${f.color} mx-auto mb-1 shadow-sm`}></div>
                            <p className="text-xs font-medium text-gray-600">{f.label}</p>
                            <p className="text-base font-bold text-gray-900">{qty.toLocaleString()}</p>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Individual Production Details */}
                    <div className="border-t border-gray-200 pt-3">
                      <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                        Individual Production Details ({group.records.length} entries)
                      </h5>
                      <div className="space-y-2">
                        {group.records.map((record, rIndex) => (
                          <div key={record._id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-gray-500">
                                Entry #{rIndex + 1} • {formatDate(record.createdAt)}
                              </span>
                              <span className="text-sm font-bold text-purple-600">
                                {(record.totalProduced || Object.values(record.stock).reduce((a, b) => a + b, 0)).toLocaleString()} bottles
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {flavors.map(f => {
                                const qty = record.stock[f.key] || 0;
                                if (qty === 0) return null;
                                return (
                                  <span key={f.key} className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-200">
                                    <span className={`w-2 h-2 rounded-full ${f.color}`}></span>
                                    <span>{f.label}:</span>
                                    <span className="font-bold">{qty}</span>
                                  </span>
                                );
                              })}
                            </div>
                            {record.notes && (
                              <p className="text-xs text-gray-500 mt-2 italic">
                                Note: {record.notes}
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
  );
};

export default OwnerProduction;
