import React from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Wallet, LogOut, Copy, Check, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { useThemeStore } from '../store/useThemeStore';

export function WalletSelector() {
  const { connect, disconnect, account, connected, wallets, network } = useWallet();
  const { isDark } = useThemeStore();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    if (account?.address) {
      await navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isDevnet = network?.name?.toLowerCase() === 'devnet';

  if (connected && account) {
    return (
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border ${
          isDark 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isDevnet ? 'bg-green-400' : 'bg-orange-400'}`} />
          <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {formatAddress(account.address)}
          </span>
          <button
            onClick={handleCopyAddress}
            className={`p-1 rounded transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-400" />
            ) : (
              <Copy className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            )}
          </button>
        </div>
        
        {/* Network indicator */}
        <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
          isDevnet 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
        }`}>
          {network?.name || 'Unknown'}
        </div>
        
        <button
          onClick={disconnect}
          className={`p-2 rounded-xl transition-colors ${
            isDark 
              ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white px-4 py-2 rounded-xl font-semibold transition-all transform hover:scale-105">
        <Wallet className="h-4 w-4" />
        Connect
      </button>
      
      <div className={`absolute top-full right-0 mt-2 w-64 rounded-xl shadow-xl border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 ${
        isDark 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-4 space-y-2">
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Connect a wallet
          </h3>
          
          {/* Devnet Notice */}
          <div className={`p-3 rounded-lg border mb-3 ${
            isDark 
              ? 'bg-blue-900/20 border-blue-700' 
              : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center gap-2 text-xs">
              <AlertTriangle className="h-3 w-3 text-blue-500" />
              <span className="text-blue-600 dark:text-blue-400 font-medium">
                Make sure your wallet is on Devnet
              </span>
            </div>
          </div>
          
          {wallets.map((wallet) => (
            <button
              key={wallet.name}
              onClick={() => connect(wallet.name)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                isDark 
                  ? 'hover:bg-gray-700' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <img 
                src={wallet.icon} 
                alt={wallet.name} 
                className="w-8 h-8 rounded-lg"
              />
              <div>
                <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {wallet.name}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {wallet.readyState === 'Installed' ? 'Installed' : 'Not Installed'}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}