import React, { useState, useEffect } from 'react';
import { distributorAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Recycle } from 'lucide-react';

const DistributorAnalytics = () => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Keeping values at zero as requested
    setLoading(false);
  }, []);

  const fetchAnalytics = async () => {
    // Disabled - values remain at zero
  };

  const totalStats = analytics.reduce(
    (acc, dist) => ({
      totalStock: acc.totalStock + dist.totalStock,
      totalSold: acc.totalSold + dist.totalSold,
      totalEmptyBottles: acc.totalEmptyBottles + dist.totalEmptyBottles,
    }),
    { totalStock: 0, totalSold: 0, totalEmptyBottles: 0 }
  );

  const chartData = analytics.map((dist) => ({
    name: dist.name.length > 15 ? dist.name.substring(0, 15) + '...' : dist.name,
    stock: dist.totalStock,
    sold: dist.totalSold,
    emptyBottles: dist.totalEmptyBottles,
  }));

  const cards = [
    {
      title: 'Total Stock',
      value: totalStats.totalStock,
      icon: Package,
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: 'Available',
    },
    {
      title: 'Total Sold',
      value: totalStats.totalSold,
      icon: TrendingUp,
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      trend: 'Completed',
    },
    {
      title: 'Empty Bottles',
      value: totalStats.totalEmptyBottles,
      icon: Recycle,
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-600',
      trend: 'Returned',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="section-spacing">
      <h2 className="heading-2">Distributor Analytics</h2>

      <div className="dashboard-grid">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="stat-card card-hover">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-xs sm:text-sm font-medium">{card.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{card.value || 0}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-emerald-600 text-xs sm:text-sm font-medium flex items-center">
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      {card.trend}
                    </span>
                  </div>
                </div>
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${card.bgColor} flex items-center justify-center ${card.iconColor} flex-shrink-0`}>
                  <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        <div className="card">
          <h3 className="heading-3 mb-4">Stock vs Sales Comparison</h3>
          <div className="h-[200px] sm:h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="stock" fill="#3b82f6" name="Current Stock" />
                <Bar dataKey="sold" fill="#10b981" name="Total Sold" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <h3 className="heading-3 mb-4">Empty Bottle Collection</h3>
          <div className="h-[200px] sm:h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-45} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="emptyBottles" fill="#8b5cf6" name="Empty Bottles" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-0 sm:p-0 overflow-hidden">
        <h3 className="heading-3 p-4 sm:p-6 border-b border-gray-100">Detailed Distributor Performance</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Distributor</th>
                <th>Email</th>
                <th>Stock</th>
                <th>Sold</th>
                <th>Returns</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {analytics.map((dist) => (
                <tr key={dist.id}>
                  <td>
                    <div className="text-sm font-medium text-gray-900">{dist.name}</div>
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">{dist.email}</div>
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">{dist.totalStock}</div>
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">{dist.totalSold}</div>
                  </td>
                  <td>
                    <div className="text-sm text-gray-900">{dist.totalEmptyBottles}</div>
                  </td>
                  <td>
                    <span className={`badge ${
                      dist.status === 'active'
                        ? 'badge-success'
                        : 'badge-danger'
                    }`}>
                      {dist.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DistributorAnalytics;
