import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { franchiseAPI } from '../services/api';
import { 
  ArrowLeft, 
  Store, 
  TrendingUp, 
  Recycle, 
  Package,
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Circle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const FranchiseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    shops: true,
    sales: true,
    returns: true
  });

  useEffect(() => {
    fetchFranchiseDetails();
  }, [id]);

  const fetchFranchiseDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching franchise details for ID:', id);
      const response = await franchiseAPI.getDetails(id);
      console.log('Franchise details response:', response.data);
      if (response.data.success) {
        setDetails(response.data.details);
      } else {
        setError('Failed to load franchise details: ' + (response.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error fetching franchise details:', err);
      setError('Failed to load franchise details: ' + (err.response?.data?.message || err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const flavors = [
    { key: 'orange', label: 'Orange', color: 'bg-orange-500' },
    { key: 'blueberry', label: 'Blueberry', color: 'bg-blue-600' },
    { key: 'jira', label: 'Jira', color: 'bg-purple-500' },
    { key: 'lemon', label: 'Lemon', color: 'bg-yellow-500' },
    { key: 'mint', label: 'Mint', color: 'bg-green-500' },
    { key: 'guava', label: 'Guava', color: 'bg-pink-500' },
  ];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="section-spacing">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-b-2 border-primary-600 rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="section-spacing">
        <div className="text-center py-8">
          <p className="text-red-600">{error || 'Franchise not found'}</p>
          <button
            onClick={() => navigate('/owner/franchises')}
            className="btn btn-primary mt-4"
          >
            Back to Franchises
          </button>
        </div>
      </div>
    );
  }

  const { franchise, user, shops, stats, recentSales, recentReturns } = details;

  return (
    <div className="section-spacing">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/owner/franchises')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div>
          <h2 className="heading-2">{franchise.name}</h2>
          <p className="text-sm text-gray-500">Franchise Details</p>
        </div>
      </div>

      {/* Franchise Info Card */}
      <div className="card mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center flex-shrink-0">
            <Store className="h-8 w-8 text-primary-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-gray-900">{franchise.name}</h3>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                franchise.status === 'active' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                <Circle className={`h-2 w-2 ${franchise.status === 'active' ? 'fill-green-500' : 'fill-gray-400'}`} />
                {franchise.status === 'active' ? 'Active' : 'Inactive'}
              </span>
              {user?.onlineStatus === 'online' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  <Circle className="h-2 w-2 fill-green-500 animate-pulse" />
                  Online
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
              {user && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{user.username}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{franchise.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{franchise.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{franchise.address}</span>
              </div>
            </div>
            {user?.lastActive && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                <Clock className="h-4 w-4" />
                <span>Last active: {formatDate(user.lastActive)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="stat-card bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Shops</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalShops}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Store className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-purple-50 to-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Stock Allocated</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalStockAllocated.toLocaleString()}</p>
              <p className="text-xs text-gray-500">bottles</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-green-50 to-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalSales.toLocaleString()}</p>
              <p className="text-xs text-gray-500">bottles sold</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-orange-50 to-orange-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Returns</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalReturns.toLocaleString()}</p>
              <p className="text-xs text-gray-500">empty bottles</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Recycle className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Current Stock by Flavor */}
      <div className="card mb-6">
        <h3 className="heading-3 mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          Current Stock
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {flavors.map((flavor) => {
            const stockQty = stats.currentStock[flavor.key] || 0;
            return (
              <div key={flavor.key} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-3 text-center border border-gray-100">
                <div className={`w-4 h-4 rounded-full ${flavor.color} mx-auto mb-2 shadow-sm`}></div>
                <p className="text-sm font-medium text-gray-600">{flavor.label}</p>
                <p className="text-xl font-bold text-gray-900">{stockQty.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sales by Flavor */}
      <div className="card mb-6">
        <h3 className="heading-3 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Sales by Flavor
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {flavors.map((flavor) => {
            const salesQty = stats.salesByFlavor[flavor.key] || 0;
            return (
              <div key={flavor.key} className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-3 text-center border border-green-100">
                <div className={`w-4 h-4 rounded-full ${flavor.color} mx-auto mb-2 shadow-sm`}></div>
                <p className="text-sm font-medium text-gray-600">{flavor.label}</p>
                <p className="text-xl font-bold text-gray-900">{salesQty.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Returns by Flavor */}
      <div className="card mb-6">
        <h3 className="heading-3 mb-4 flex items-center gap-2">
          <Recycle className="h-5 w-5" />
          Returns by Flavor
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {flavors.map((flavor) => {
            const returnQty = stats.returnsByFlavor[flavor.key] || 0;
            return (
              <div key={flavor.key} className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-3 text-center border border-orange-100">
                <div className={`w-4 h-4 rounded-full ${flavor.color} mx-auto mb-2 shadow-sm`}></div>
                <p className="text-sm font-medium text-gray-600">{flavor.label}</p>
                <p className="text-xl font-bold text-gray-900">{returnQty.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shops Section */}
      <div className="card mb-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('shops')}
        >
          <h3 className="heading-3 flex items-center gap-2">
            <Store className="h-5 w-5" />
            Shops ({shops.length})
          </h3>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {expandedSections.shops ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
        
        {expandedSections.shops && (
          <div className="mt-4">
            {shops.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No shops registered yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Shop Name</th>
                      <th className="text-left">Location</th>
                      <th className="text-left">Area</th>
                      <th className="text-right">Stock</th>
                      <th className="text-right">Total Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shops.map((shop) => {
                      const shopStock = Object.values(shop.stock || {}).reduce((a, b) => a + b, 0);
                      return (
                        <tr key={shop._id}>
                          <td className="font-medium">{shop.name}</td>
                          <td>{shop.location}</td>
                          <td>{shop.area}</td>
                          <td className="text-right">{shopStock.toLocaleString()}</td>
                          <td className="text-right">{(shop.totalSold || 0).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Sales */}
      <div className="card mb-6">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('sales')}
        >
          <h3 className="heading-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Sales ({recentSales.length})
          </h3>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {expandedSections.sales ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
        
        {expandedSections.sales && (
          <div className="mt-4 space-y-3">
            {recentSales.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No sales recorded yet</p>
            ) : (
              recentSales.map((sale) => (
                <div key={sale._id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {sale.shopId?.name || sale.shopId?.location || 'Unknown Shop'}
                    </span>
                    <span className="text-sm text-gray-500">{formatDate(sale.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sale.items?.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-200">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        <span className="capitalize">{item.flavor}:</span>
                        <span className="font-bold">{item.quantity}</span>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-sm font-bold text-green-600">
                      Total: {sale.totalQuantity} bottles
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Recent Returns */}
      <div className="card">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('returns')}
        >
          <h3 className="heading-3 flex items-center gap-2">
            <Recycle className="h-5 w-5" />
            Recent Returns ({recentReturns.length})
          </h3>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {expandedSections.returns ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
        
        {expandedSections.returns && (
          <div className="mt-4 space-y-3">
            {recentReturns.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No returns recorded yet</p>
            ) : (
              recentReturns.map((ret) => (
                <div key={ret._id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {ret.shopId?.name || ret.shopId?.location || 'Unknown Shop'}
                    </span>
                    <span className="text-sm text-gray-500">{formatDate(ret.createdAt)}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {ret.items?.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded border border-gray-200">
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                        <span className="capitalize">{item.flavor}:</span>
                        <span className="font-bold">{item.quantity}</span>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 text-right">
                    <span className="text-sm font-bold text-orange-600">
                      Total: {ret.totalQuantity} bottles
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FranchiseDetails;
