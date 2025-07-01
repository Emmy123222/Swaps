import React from 'react';
import { TrendingUp, DollarSign, Users, Zap } from 'lucide-react';

interface Stat {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
}

const stats: Stat[] = [
  {
    label: 'Total Value Locked',
    value: '$12.4M',
    change: '+12.3%',
    icon: <DollarSign className="h-6 w-6" />
  },
  {
    label: '24h Volume',
    value: '$2.1M',
    change: '+8.7%',
    icon: <TrendingUp className="h-6 w-6" />
  },
  {
    label: 'Active Users',
    value: '1,234',
    change: '+15.2%',
    icon: <Users className="h-6 w-6" />
  },
  {
    label: 'Total Swaps',
    value: '45,678',
    change: '+23.1%',
    icon: <Zap className="h-6 w-6" />
  }
];

export function StatsCard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="bg-white dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 group shadow-sm hover:shadow-md"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg group-hover:scale-110 transition-transform duration-200">
              {React.cloneElement(stat.icon as React.ReactElement, {
                className: 'h-6 w-6 text-blue-500'
              })}
            </div>
            <span className="text-green-500 text-sm font-medium">{stat.change}</span>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{stat.value}</div>
            <div className="text-gray-600 dark:text-gray-400 text-sm">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}