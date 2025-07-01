import React from 'react';
import { TrendingUp, Github, Twitter, Moon, Sun } from 'lucide-react';
import { WalletSelector } from './WalletSelector';
import { useThemeStore } from '../store/useThemeStore';

interface HeaderProps {
  activePage: 'swap' | 'liquidity' | 'stats';
  setActivePage: (page: 'swap' | 'liquidity' | 'stats') => void;
}

export function Header({ activePage, setActivePage }: HeaderProps) {
  const { isDark, toggleTheme } = useThemeStore();

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 md:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">AptosSwap</h1>
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">Decentralized Exchange</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => setActivePage('swap')}
              className={`font-medium transition-colors ${
                activePage === 'swap'
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Swap
            </button>
            <button
              onClick={() => setActivePage('liquidity')}
              className={`font-medium transition-colors ${
                activePage === 'liquidity'
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Liquidity
            </button>
            <button
              onClick={() => setActivePage('stats')}
              className={`font-medium transition-colors ${
                activePage === 'stats'
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Stats
            </button>
          </nav>

          {/* Mobile Navigation */}
          <nav className="flex md:hidden items-center gap-4">
            <button
              onClick={() => setActivePage('swap')}
              className={`text-sm font-medium transition-colors ${
                activePage === 'swap'
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Swap
            </button>
            <button
              onClick={() => setActivePage('liquidity')}
              className={`text-sm font-medium transition-colors ${
                activePage === 'liquidity'
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Liquidity
            </button>
            <button
              onClick={() => setActivePage('stats')}
              className={`text-sm font-medium transition-colors ${
                activePage === 'stats'
                  ? 'text-blue-500 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Stats
            </button>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            <div className="hidden sm:flex items-center gap-2">
              <a 
                href="https://github.com" 
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="https://twitter.com" 
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Twitter className="h-5 w-5" />
              </a>
            </div>
            
            <WalletSelector />
          </div>
        </div>
      </div>
    </header>
  );
}