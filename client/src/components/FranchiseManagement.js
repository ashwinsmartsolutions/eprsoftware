import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { franchiseAPI, authAPI } from '../services/api';
import { Plus, Edit, Trash2, RefreshCw, Circle, Eye, X } from 'lucide-react';

const FranchiseForm = ({ franchise, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    franchiseName: '',
    phone: '',
    address: '',
    status: 'active',
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (franchise) {
      setFormData({
        username: franchise.userId?.username || '',
        email: franchise.email,
        password: '',
        franchiseName: franchise.name,
        phone: franchise.phone,
        address: franchise.address,
        status: franchise.status,
      });
    }
  }, [franchise]);

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
      if (franchise) {
        // Update existing franchise
        await franchiseAPI.update(franchise._id, {
          name: formData.franchiseName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          status: formData.status,
        });
      } else {
        // Create new franchise
        await authAPI.registerFranchise({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          franchiseName: formData.franchiseName,
          phone: formData.phone,
          address: formData.address,
        });
      }
      
      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error saving franchise:', error);
      alert('Error saving franchise: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal w-full max-w-md mx-4">
        <div className="modal-header flex justify-between items-center">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            {franchise ? 'Edit Franchise' : 'Add New Franchise'}
          </h3>
          <button
            onClick={onClose}
            className="action-btn-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body space-y-4 sm:space-y-5">
          {!franchise && (
            <>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input"
                  required
                  placeholder="Enter username"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input"
                  required
                  placeholder="Enter password"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Franchise Name</label>
            <input
              type="text"
              name="franchiseName"
              value={formData.franchiseName}
              onChange={handleChange}
              className="input"
              required
              placeholder="Enter franchise name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input"
              required
              placeholder="Enter email address"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              className="input"
              required
              maxLength={10}
              pattern="[0-9]{10}"
              placeholder="Enter 10 digit phone number"
              inputMode="numeric"
            />
            <p className="text-xs text-gray-500 mt-1">Must be exactly 10 digits</p>
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="input min-h-[80px]"
              rows="3"
              required
              placeholder="Enter complete address"
            />
          </div>

          {franchise && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl px-4 py-2.5 pr-12 text-sm text-gray-800 hover:border-blue-300 hover:shadow-lg focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2720%27 height=%2720%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%233b82f6%27 stroke-width=%272.5%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat font-semibold shadow-sm"
              >
                <option value="active">🟢 Active</option>
                <option value="inactive">🔴 Inactive</option>
              </select>
            </div>
          )}

          <div className="modal-footer !mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary w-full sm:w-auto order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full sm:w-auto order-1 sm:order-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-b-2 border-white rounded-full" />
                  Saving...
                </span>
              ) : (
                franchise ? 'Update' : 'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const FranchiseManagement = () => {
  const [franchises, setFranchises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedFranchise, setSelectedFranchise] = useState(null);
  const [refreshingId, setRefreshingId] = useState(null);

  useEffect(() => {
    fetchFranchises();
    
    // Auto-refresh status every 5 minutes to sync with backend status check
    const intervalId = setInterval(() => {
      fetchFranchises();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchFranchises = async () => {
    try {
      const response = await franchiseAPI.getAll();
      if (response.data.success) {
        setFranchises(response.data.franchises);
      }
    } catch (error) {
      console.error('Error fetching franchises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (franchise) => {
    setSelectedFranchise(franchise);
    setShowForm(true);
  };

  const handleDelete = async (franchiseId) => {
    if (window.confirm('Are you sure you want to delete this franchise?')) {
      try {
        await franchiseAPI.delete(franchiseId);
        fetchFranchises();
      } catch (error) {
        console.error('Error deleting franchise:', error);
        alert('Error deleting franchise');
      }
    }
  };

  const handleRefresh = async (franchiseId) => {
    setRefreshingId(franchiseId);
    await fetchFranchises();
    setRefreshingId(null);
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
        <h2 className="heading-2">Franchise Management</h2>
        <button
          onClick={() => {
            setSelectedFranchise(null);
            setShowForm(true);
          }}
          className="btn btn-primary w-full sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          <span>Add Franchise</span>
        </button>
      </div>

      <div className="card p-0 sm:p-0 overflow-hidden">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th className="text-center">Refresh</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {franchises.map((franchise) => (
                <tr key={franchise._id}>
                  <td>
                    <Link 
                      to={`/owner/franchises/${franchise._id}`}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                    >
                      {franchise.name}
                    </Link>
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">{franchise.email}</div>
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">{franchise.phone}</div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Circle 
                        className={`h-3 w-3 ${
                          franchise.status === 'active' && franchise.userId?.onlineStatus === 'online'
                            ? 'text-green-500 fill-green-500'
                            : franchise.status === 'active'
                            ? 'text-yellow-500 fill-yellow-500'
                            : 'text-gray-400 fill-gray-400'
                        }`} 
                      />
                      <span className={`text-sm font-medium ${
                        franchise.status === 'active' && franchise.userId?.onlineStatus === 'online'
                          ? 'text-green-600'
                          : franchise.status === 'active'
                          ? 'text-yellow-600'
                          : 'text-gray-500'
                      }`}>
                        {franchise.status === 'active' && franchise.userId?.onlineStatus === 'online'
                          ? 'Active'
                          : franchise.status === 'active'
                          ? 'Inactive'
                          : 'Offline'}
                      </span>
                    </div>
                  </td>
                  <td className="text-center">
                    <button
                      onClick={() => handleRefresh(franchise._id)}
                      disabled={refreshingId === franchise._id}
                      className="text-xs font-medium text-primary-600 hover:text-primary-700 hover:underline disabled:opacity-50 disabled:no-underline transition-colors"
                      title="Refresh status"
                    >
                      {refreshingId === franchise._id ? 'Refreshing...' : 'Refresh'}
                    </button>
                  </td>
                  <td>
                    <div className="table-actions justify-end">
                      <Link
                        to={`/owner/franchises/${franchise._id}`}
                        className="action-btn-primary"
                        aria-label="View franchise details"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleEdit(franchise)}
                        className="action-btn-primary"
                        aria-label="Edit franchise"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(franchise._id)}
                        className="action-btn-danger"
                        aria-label="Delete franchise"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <FranchiseForm
          franchise={selectedFranchise}
          onClose={() => setShowForm(false)}
          onSubmit={() => fetchFranchises()}
        />
      )}
    </div>
  );
};

export default FranchiseManagement;
