import React, { useState, useEffect } from 'react';
import { franchiseAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, Recycle } from 'lucide-react';

const FranchiseAnalytics = () => {
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
    (acc, fr) => ({
      totalStock: acc.totalStock + fr.totalStock,
      totalSold: acc.totalSold + fr.totalSold,
      totalEmptyBottles: acc.totalEmptyBottles + fr.totalEmptyBottles,
    }),
    { totalStock: 0, totalSold: 0, totalEmptyBottles: 0 }
  );

  const chartData = analytics.map((fr) => ({
    name: fr.name.length > 15 ? fr.name.substring(0, 15) + '...' : fr.name,
    stock: fr.totalStock,
    sold: fr.totalSold,
    emptyBottles: fr.totalEmptyBottles,
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
      trend: 'Recycled',
    },
  ];

  return (
    <div className="section-spacing">
      <h2 className="heading-2 mb-6">Franchise Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="stat-card card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm font-medium">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value || 0}</p>
                  <p className="text-xs text-emerald-600 mt-1">{card.trend}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center ${card.iconColor}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <h3 className="heading-3 mb-4">Stock Distribution by Franchise</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="stock" fill="#3B82F6" name="Stock" />
              <Bar dataKey="sold" fill="#10B981" name="Sold" />
              <Bar dataKey="emptyBottles" fill="#8B5CF6" name="Empty Bottles" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default FranchiseAnalytics;
