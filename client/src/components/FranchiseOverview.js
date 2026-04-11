import React from 'react';
import { Package, Store, TrendingUp, Recycle } from 'lucide-react';

const FranchiseOverview = ({ overview }) => {
  const cards = [
    {
      title: 'Current Stock',
      value: overview.totalStock,
      icon: Package,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
    },
    {
      title: 'Total Shops',
      value: overview.totalShops,
      icon: Store,
      gradient: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      title: 'Total Sold',
      value: overview.totalSold,
      icon: TrendingUp,
      gradient: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      title: 'Empty Bottles',
      value: overview.totalEmptyBottles,
      icon: Recycle,
      gradient: 'from-violet-500 to-violet-600',
      bgColor: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
  ];

  const flavors = [
    { key: 'orange', label: 'Orange', color: 'bg-orange-500', gradient: 'from-orange-500 to-orange-600' },
    { key: 'blueberry', label: 'Blueberry', color: 'bg-blue-600', gradient: 'from-blue-600 to-blue-700' },
    { key: 'jira', label: 'Jira', color: 'bg-purple-500', gradient: 'from-purple-500 to-purple-600' },
    { key: 'lemon', label: 'Lemon', color: 'bg-yellow-500', gradient: 'from-yellow-400 to-yellow-500' },
    { key: 'mint', label: 'Mint', color: 'bg-green-500', gradient: 'from-green-500 to-emerald-600' },
    { key: 'guava', label: 'Guava', color: 'bg-pink-500', gradient: 'from-pink-500 to-pink-600' },
  ];

  return (
    <div className="section-spacing">
      <div className="dashboard-grid">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="stat-card card-hover">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-xs sm:text-sm font-medium">{card.title}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{card.value || 0}</p>
                </div>
                <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl ${card.bgColor} flex items-center justify-center ${card.iconColor} flex-shrink-0`}>
                  <Icon className="h-5 w-5 sm:h-7 sm:w-7" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
        <div className="card">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="heading-3">Stock by Flavor</h3>
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {flavors.length} flavors
            </span>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {flavors.map((flavor) => {
              const stockValue = overview.stock[flavor.key] || 0;
              const maxStock = Math.max(...Object.values(overview.stock || {}));
              const percentage = maxStock > 0 ? (stockValue / maxStock) * 100 : 0;
              
              return (
                <div key={flavor.key} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${flavor.gradient} flex-shrink-0`}></div>
                      <span className="text-sm font-medium text-gray-700 truncate">{flavor.label}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <div className="w-16 sm:w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full bg-gradient-to-r ${flavor.gradient} transition-all duration-500`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 w-8 sm:w-12 text-right">
                        {stockValue}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h3 className="heading-3">Performance Metrics</h3>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
              Real-time
            </span>
          </div>
          <div className="space-y-4 sm:space-y-5">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Sales Efficiency
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  {(() => {
                    const totalInventory = overview.totalSold + overview.totalStock;
                    return totalInventory > 0 
                      ? Math.round((overview.totalSold / totalInventory) * 100) 
                      : 0;
                  })()}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-700 ease-out" 
                  style={{ 
                    width: `${(() => {
                      const totalInventory = overview.totalSold + overview.totalStock;
                      return totalInventory > 0 
                        ? Math.round((overview.totalSold / totalInventory) * 100) 
                        : 0;
                    })()}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Ratio of sold bottles to total inventory</p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                  Bottle Recovery Rate
                </span>
                <span className="text-xs sm:text-sm font-bold text-gray-900">
                  {overview.totalSold > 0 
                    ? Math.round((overview.totalEmptyBottles / overview.totalSold) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-violet-500 to-violet-400 h-full rounded-full transition-all duration-700 ease-out" 
                  style={{ 
                    width: `${overview.totalSold > 0 
                      ? Math.round((overview.totalEmptyBottles / overview.totalSold) * 100) 
                      : 0}%` 
                  }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Percentage of bottles returned for recycling</p>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs text-gray-500 block mb-1">Avg Stock/Shop</span>
                  <span className="text-base sm:text-lg font-bold text-gray-900">
                    {overview.totalShops > 0 
                      ? Math.round(overview.totalStock / overview.totalShops) 
                      : 0}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-xs text-gray-500 block mb-1">Total Inventory</span>
                  <span className="text-base sm:text-lg font-bold text-gray-900">
                    {overview.totalStock || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FranchiseOverview;
