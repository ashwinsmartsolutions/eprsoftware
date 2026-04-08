import React, { useState, useEffect } from 'react';
import { productionAPI } from '../services/api';
import { Plus, History, Factory } from 'lucide-react';

const ProducerProduction = () => {
  const [productionHistory, setProductionHistory] = useState([]);
  const [inventory, setInventory] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0], // Today's date as default
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
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="table-header">
                <tr>
                  <th className="table-cell px-3 sm:px-4 py-3 text-left">Date</th>
                  {flavors.map(f => (
                    <th key={f.key} className="table-cell px-2 sm:px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className={`w-2 h-2 rounded ${f.color}`}></div>
                        <span className="hidden sm:inline">{f.label}</span>
                      </div>
                    </th>
                  ))}
                  <th className="table-cell px-3 sm:px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {productionHistory.slice(0, 10).map((record) => (
                  <tr key={record._id} className="table-row hover:bg-gray-50">
                    <td className="table-cell px-3 sm:px-4 py-3 text-sm whitespace-nowrap">
                      {record.date ? new Date(record.date).toLocaleDateString('en-GB') : new Date(record.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    {flavors.map((f) => (
                      <td key={f.key} className="table-cell px-2 sm:px-4 py-3 text-center text-sm">
                        {record.stock[f.key]?.toLocaleString() || ''}
                      </td>
                    ))}
                    <td className="table-cell px-3 sm:px-4 py-3 text-right font-medium">
                      {record.totalProduced?.toLocaleString() || Object.values(record.stock).reduce((a, b) => a + b, 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProducerProduction;
