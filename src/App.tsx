import React, { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './contexts/WalletProvider';
import { Header } from './components/Header';
import { SwapInterface } from './components/SwapInterface';
import { LiquidityInterface } from './components/LiquidityInterface';
import { StatsCard } from './components/StatsCard';
import { StatsPage } from './components/StatsPage';
import { TransactionHistory } from './components/TransactionHistory';
import { NetworkWarning } from './components/NetworkWarning';
import { useThemeStore } from './store/useThemeStore';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

type ActivePage = 'swap' | 'liquidity' | 'stats';

function AppContent() {
  const { isDark } = useThemeStore();
  const { account } = useWallet();
  const [activePage, setActivePage] = useState<ActivePage>('swap');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Network Warning */}
      <NetworkWarning />
      
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234F46E5' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>
      
      <Header activePage={activePage} setActivePage={setActivePage} />
      
      <main className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {activePage === 'swap' && (
            <>
              {/* Hero Section */}
              <div className="text-center mb-12 md:mb-16">
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Trade on Aptos
                </h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-8">
                  The fastest, most secure decentralized exchange built on Aptos blockchain. 
                  Swap tokens with minimal fees and lightning-fast transactions.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>Live on Devnet</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span>0.3% Trading Fee</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span>Sub-second Finality</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <StatsCard />

              {/* Main Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Swap Interface */}
                <div className="lg:col-span-2">
                  <SwapInterface />
                </div>

                {/* Transaction History */}
                {account && (
                  <div className="lg:col-span-1">
                    <TransactionHistory />
                  </div>
                )}
              </div>

              {/* Features */}
              <div className="mt-16 md:mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Lightning Fast</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Experience sub-second transaction finality with Aptos's advanced blockchain technology.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">🔒</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Secure & Audited</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Built with Move's safety features and audited smart contracts for maximum security.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <span className="text-2xl">💎</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Low Fees</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Enjoy minimal trading fees with our efficient automated market maker protocol.
                  </p>
                </div>
              </div>
            </>
          )}

          {activePage === 'liquidity' && (
            <>
              <div className="text-center mb-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6 bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Provide Liquidity
                </h1>
                <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Earn fees by providing liquidity to trading pairs. Add or remove liquidity from pools and earn rewards.
                </p>
              </div>
              
              <div className="flex justify-center">
                <LiquidityInterface />
              </div>
            </>
          )}

          {activePage === 'stats' && <StatsPage />}
        </div>
      </main>

      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700',
          duration: 4000,
        }}
      />
    </div>
  );
}

function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

export default App;