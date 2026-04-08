import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shopAPI } from '../services/api';
import { Plus, Edit, Trash2, X, MapPin, Phone, Store, ShoppingCart, TrendingUp } from 'lucide-react';

const ShopForm = ({ shop, areas, onClose, onSubmit, onAddArea, viewMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    area: '',
    contact: '',
  });
  const [loading, setLoading] = useState(false);
  const [showAddNew, setShowAddNew] = useState(false);
  const [newAreaValue, setNewAreaValue] = useState('');

  useEffect(() => {
    console.log('ShopForm - shop prop changed:', shop);
    if (shop) {
      setFormData({
        name: shop.name || '',
        location: shop.location || '',
        area: shop.area || '',
        contact: shop.contact || '',
      });
    }
  }, [shop]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (shop) {
        await shopAPI.update(shop._id, formData);
      } else {
        await shopAPI.create(formData);
      }
      
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error saving shop:', error);
      alert('Error saving shop: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal animate-slide-up">
        <div className="modal-header flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary-500 to-primary-600 p-2 rounded-xl">
              <Store className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              {viewMode ? 'Shop Details' : (shop ? 'Edit Shop' : 'Add New Shop')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body space-y-5">
          <div>
            <label className="form-label">
              Shop Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input"
              placeholder="Enter shop name"
              required
              disabled={viewMode}
            />
          </div>

          <div>
            <label className="form-label">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <textarea
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="input pl-10"
                rows="3"
                placeholder="Enter complete address"
                required
                disabled={viewMode}
              />
            </div>
          </div>

          <div>
            <label className="form-label">
              Area
            </label>
            <select
              name="area"
              value={formData.area}
              onChange={handleChange}
              className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-12 text-sm text-gray-800 hover:border-blue-300 hover:shadow-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2720%27 height=%2720%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%233b82f6%27 stroke-width=%272.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat font-semibold shadow-sm"
              required
              disabled={viewMode}
            >
              <option value="">📍 Select Area</option>
              {areas.map((area) => (
                <option key={area} value={area}>📍 {area}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">
              Contact Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="tel"
                name="contact"
                value={formData.contact}
                onChange={handlePhoneChange}
                className="input pl-10"
                placeholder="Enter 10 digit phone number"
                required
                maxLength={10}
                pattern="[0-9]{10}"
                inputMode="numeric"
                disabled={viewMode}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Must be exactly 10 digits</p>
          </div>

          <div className="modal-footer flex space-x-3">
            {viewMode ? (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn btn-primary"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn btn-primary disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
                      Saving...
                    </span>
                  ) : (
                    shop ? 'Update Shop' : 'Create Shop'
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const ShopManagement = () => {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('');
  const [showAddArea, setShowAddArea] = useState(false);
  const [newArea, setNewArea] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [viewMode, setViewMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [shopToDelete, setShopToDelete] = useState(null);

  useEffect(() => {
    fetchShops();
  }, []);

  // Extract unique areas from shops
  useEffect(() => {
    const uniqueAreas = [...new Set(shops.map(shop => shop.area).filter(Boolean))].sort();
    setAreas(uniqueAreas);
  }, [shops]);

  useEffect(() => {
    let filtered = shops;
    
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(shop =>
        shop.name.toLowerCase().includes(query) ||
        shop.location.toLowerCase().includes(query) ||
        shop.area.toLowerCase().includes(query) ||
        shop.contact.includes(query)
      );
    }
    
    if (selectedArea && selectedArea !== 'all') {
      filtered = filtered.filter(shop => shop.area === selectedArea);
    }
    
    setFilteredShops(filtered);
  }, [searchQuery, selectedArea, shops]);

  const fetchShops = async () => {
    try {
      const response = await shopAPI.getAll();
      if (response.data.success) {
        setShops(response.data.shops);
        setFilteredShops(response.data.shops);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (shop) => {
    setSelectedShop(shop);
    setViewMode(false);
    setShowForm(true);
  };

  const handleShopCardClick = (shop) => {
    console.log('Shop card clicked:', shop);
    if (deleteMode) {
      setShopToDelete(shop);
    } else {
      setSelectedShop(shop);
      setViewMode(true);
      setShowForm(true);
      console.log('Opening shop details for:', shop.name);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!shopToDelete) return;
    if (window.confirm(`Are you sure you want to delete "${shopToDelete.name}"?`)) {
      try {
        await shopAPI.delete(shopToDelete._id);
        fetchShops();
        setDeleteMode(false);
        setShopToDelete(null);
        alert('Shop deleted successfully!');
      } catch (error) {
        console.error('Error deleting shop:', error);
        const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
        alert('Error deleting shop: ' + errorMsg);
      }
    }
  };

  const cancelDeleteMode = () => {
    setDeleteMode(false);
    setShopToDelete(null);
  };

  const handleAddArea = () => {
    if (newArea.trim()) {
      const trimmedArea = newArea.trim();
      if (!areas.includes(trimmedArea)) {
        setAreas([...areas, trimmedArea].sort());
      }
      setSelectedArea(trimmedArea);
      setNewArea('');
      setShowAddArea(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  return (
    <div className="section-spacing">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h2 className="heading-2">Shop Management</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search shops..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input w-full sm:w-48 py-2.5"
          />
          {!showAddArea ? (
            <div className="relative">
              <select
                value={selectedArea}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === 'add-new') {
                    setShowAddArea(true);
                  } else {
                    setSelectedArea(value);
                  }
                }}
                className="w-full sm:w-56 min-w-[160px] bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-12 text-sm text-gray-800 hover:border-blue-300 hover:shadow-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2720%27 height=%2720%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%233b82f6%27 stroke-width=%272.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat font-semibold shadow-sm"
              >
                <option value="">📍 All Areas</option>
                {areas.map((area) => (
                  <option key={area} value={area}>📍 {area}</option>
                ))}
                <option value="add-new" className="font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100">➕ Add New Area</option>
              </select>
              {selectedArea && (
                <span className="absolute right-10 top-1/2 -translate-y-1/2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  {filteredShops.length}
                </span>
              )}
            </div>
          ) : null}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedShop(null);
                setShowForm(true);
              }}
              className="btn btn-primary flex-1 sm:flex-none py-2.5"
            >
              <Plus className="h-5 w-5" />
              <span>Add Shop</span>
            </button>
            {!deleteMode ? (
              <button
                onClick={() => setDeleteMode(true)}
                className="btn btn-danger flex-1 sm:flex-none py-2.5"
              >
                <Trash2 className="h-5 w-5" />
                <span>Delete Shop</span>
              </button>
            ) : (
              <button
                onClick={cancelDeleteMode}
                className="btn btn-secondary flex-1 sm:flex-none py-2.5"
              >
                <X className="h-5 w-5" />
                <span>Cancel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {deleteMode && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700">
              <Trash2 className="h-5 w-5" />
              <span className="font-medium">Delete Mode: Click on a shop card to select it for deletion</span>
            </div>
            {shopToDelete && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-red-600">
                  Selected: <strong>{shopToDelete.name}</strong>
                </span>
                <button
                  onClick={handleDeleteConfirm}
                  className="btn btn-danger btn-sm"
                >
                  Confirm Delete
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card-grid">
        {filteredShops.map((shop) => (
          <div
            key={shop._id}
            onClick={() => handleShopCardClick(shop)}
            className={`card card-hover group cursor-pointer transition-all duration-200 ${
              deleteMode
                ? shopToDelete?._id === shop._id
                  ? 'ring-2 ring-red-500 bg-red-50'
                  : 'hover:bg-red-50'
                : ''
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  deleteMode && shopToDelete?._id === shop._id
                    ? 'bg-red-100'
                    : 'bg-gradient-to-br from-primary-100 to-primary-50'
                }`}>
                  <Store className={`h-5 w-5 ${
                    deleteMode && shopToDelete?._id === shop._id
                      ? 'text-red-600'
                      : 'text-primary-600'
                  }`} />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{shop.name}</h3>
              </div>
              <span className={`badge flex-shrink-0 ${
                shop.status === 'active'
                  ? 'badge-success'
                  : 'badge-danger'
              }`}>
                {shop.status}
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                <span className="line-clamp-1">{shop.location}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <span className="font-medium text-gray-500 mr-2">Area:</span>
                <span className="line-clamp-1">{shop.area}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                {shop.contact}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
              <div className="text-center">
                <span className="text-xs text-gray-500 block">Sold</span>
                <span className="text-base sm:text-lg font-bold text-gray-900">{shop.totalSold}</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-gray-500 block">Returned</span>
                <span className="text-base sm:text-lg font-bold text-emerald-600">{shop.emptyBottlesReturned}</span>
              </div>
            </div>

            {!deleteMode && (
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(shop);
                  }}
                  className="btn btn-secondary btn-xs px-2"
                  title="Edit"
                >
                  <Edit className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/franchise/update-sales', { state: { shopId: shop._id } });
                  }}
                  className="flex-1 btn btn-primary btn-sm"
                >
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Sales
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert('Orders feature coming soon!');
                  }}
                  className="flex-1 btn btn-success btn-sm"
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  Orders
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredShops.length === 0 && (
        <div className="empty-state">
          <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
            <Store className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No shops found</h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto text-sm sm:text-base px-4">Get started by adding your first shop to manage inventory and track sales.</p>
          <button
            onClick={() => {
              setSelectedShop(null);
              setShowForm(true);
            }}
            className="btn btn-primary btn-lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Your First Shop
          </button>
        </div>
      )}

      {showForm && (
        <ShopForm
          key={selectedShop?._id || 'new'}
          shop={selectedShop}
          areas={areas}
          viewMode={viewMode}
          onClose={() => setShowForm(false)}
          onSubmit={fetchShops}
          onAddArea={(newArea) => {
            if (!areas.includes(newArea)) {
              setAreas([...areas, newArea].sort());
            }
          }}
        />
      )}

      {/* Add New Area Popup */}
      {showAddArea && (
        <div className="modal-overlay">
          <div className="modal animate-slide-up">
            <div className="modal-header flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">Add New Area</h3>
              <button
                onClick={() => {
                  setShowAddArea(false);
                  setNewArea('');
                }}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="modal-body space-y-4">
              <div>
                <label className="form-label">Area Name</label>
                <input
                  type="text"
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  className="input"
                  placeholder="Enter area name"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddArea()}
                  autoFocus
                />
              </div>
              <div className="modal-footer flex space-x-3">
                <button
                  onClick={() => {
                    setShowAddArea(false);
                    setNewArea('');
                  }}
                  className="flex-1 btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddArea}
                  disabled={!newArea.trim()}
                  className="flex-1 btn btn-primary disabled:opacity-50"
                >
                  Add Area
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopManagement;
