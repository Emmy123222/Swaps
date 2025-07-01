import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Users, Zap, Activity, BarChart3, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import { APTOS_TOKENS } from '../config/tokens';

interface PoolStats {
  pair: string;
  tvl: string;
  volume24h: string;
  fees24h: string;
  apr: string;
  change24h: number;
}

interface TokenStats {
  symbol: string;
  name: string;
  price: string;
  change24h: number;
  volume24h: string;
  marketCap: string;
  logoUrl: string;
}

export function StatsPage() {
  const { isDark } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'pools' | 'tokens'>('overview');
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d'>('24h');

  // Mock data for demonstration
  const overviewStats = [
    {
      label: 'Total Value Locked',
      value: '$24.7M',
      change: '+15.3%',
      icon: <DollarSign className="h-6 w-6" />
    },
    {
      label: '24h Volume',
      value: '$4.2M',
      change: '+8.7%',
      icon: <TrendingUp className="h-6 w-6" />
    },
    {
      label: 'Total Users',
      value: '12,456',
      change: '+23.1%',
      icon: <Users className="h-6 w-6" />
    },
    {
      label: 'Total Transactions',
      value: '89,234',
      change: '+12.4%',
      icon: <Zap className="h-6 w-6" />
    }
  ];

  const poolStats: PoolStats[] = [
    { pair: 'APT/USDC', tvl: '$8.4M', volume24h: '$1.2M', fees24h: '$3,600', apr: '24.5%', change24h: 12.3 },
    { pair: 'USDC/USDT', tvl: '$5.2M', volume24h: '$890K', fees24h: '$2,670', apr: '18.7%', change24h: -2.1 },
    { pair: 'APT/WETH', tvl: '$3.8M', volume24h: '$650K', fees24h: '$1,950', apr: '31.2%', change24h: 8.9 },
    { pair: 'WBTC/USDC', tvl: '$2.9M', volume24h: '$420K', fees24h: '$1,260', apr: '22.8%', change24h: 5.4 },
    { pair: 'BNB/APT', tvl: '$1.7M', volume24h: '$280K', fees24h: '$840', apr: '28.9%', change24h: -1.2 },
  ];

  const tokenStats: TokenStats[] = [
    { symbol: 'APT', name: 'Aptos', price: '$8.45', change24h: 12.3, volume24h: '$2.1M', marketCap: '$3.2B', logoUrl: APTOS_TOKENS[0].logoUrl },
    { symbol: 'USDC', name: 'USD Coin', price: '$1.00', change24h: 0.1, volume24h: '$1.8M', marketCap: '$24.1B', logoUrl: APTOS_TOKENS[1].logoUrl },
    { symbol: 'WETH', name: 'Wrapped Ethereum', price: '$2,340', change24h: -2.1, volume24h: '$890K', marketCap: '$281B', logoUrl: APTOS_TOKENS[3].logoUrl },
    { symbol: 'WBTC', name: 'Wrapped Bitcoin', price: '$43,200', change24h: 5.4, volume24h: '$650K', marketCap: '$850B', logoUrl: APTOS_TOKENS[4].logoUrl },
    { symbol: 'BNB', name: 'Binance Coin', price: '$310', change24h: -1.2, volume24h: '$420K', marketCap: '$47B', logoUrl: APTOS_TOKENS[5].logoUrl },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Analytics & Statistics
        </h1>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Track performance and metrics across the AptosSwap ecosystem
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-8 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
        {[
          { key: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
          { key: 'pools', label: 'Pools', icon: <Activity className="h-4 w-4" /> },
          { key: 'tokens', label: 'Tokens', icon: <PieChart className="h-4 w-4" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-6">
        {['24h', '7d', '30d'].map((period) => (
          <button
            key={period}
            onClick={() => setTimeframe(period as any)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              timeframe === period
                ? 'bg-blue-500 text-white'
                : isDark
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {overviewStats.map((stat, index) => (
              <div
                key={stat.label}
                className={`p-6 rounded-xl border transition-colors ${
                  isDark 
                    ? 'bg-gray-900 border-gray-700' 
                    : 'bg-white border-gray-200 shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
                    {React.cloneElement(stat.icon as React.ReactElement, {
                      className: 'h-6 w-6 text-blue-500'
                    })}
                  </div>
                  <span className="text-green-500 text-sm font-medium">{stat.change}</span>
                </div>
                <div>
                  <div className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {stat.value}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart Placeholder */}
          <div className={`p-8 rounded-xl border ${
            isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
          }`}>
            <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Volume & TVL Trends
            </h3>
            <div className={`h-64 rounded-lg flex items-center justify-center ${
              isDark ? 'bg-gray-800' : 'bg-gray-50'
            }`}>
              <div className="text-center">
                <BarChart3 className={`h-12 w-12 mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Chart visualization would be implemented here
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'pools' && (
        <div className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Top Liquidity Pools
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Pool
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    TVL
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    24h Volume
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    24h Fees
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    APR
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {poolStats.map((pool, index) => (
                  <tr key={pool.pair} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {pool.pair}
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {pool.tvl}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      <div className="flex items-center">
                        {pool.volume24h}
                        {pool.change24h > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500 ml-1" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500 ml-1" />
                        )}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {pool.fees24h}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-green-500 font-medium">{pool.apr}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tokens' && (
        <div className={`rounded-xl border overflow-hidden ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Token Statistics
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Token
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Price
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    24h Change
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    24h Volume
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Market Cap
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tokenStats.map((token, index) => (
                  <tr key={token.symbol} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img 
                          src={token.logoUrl} 
                          alt={token.symbol}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <div>
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {token.symbol}
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {token.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {token.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`flex items-center ${
                        token.change24h > 0 ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {token.change24h > 0 ? (
                          <ArrowUpRight className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 mr-1" />
                        )}
                        {Math.abs(token.change24h)}%
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {token.volume24h}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                      {token.marketCap}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}