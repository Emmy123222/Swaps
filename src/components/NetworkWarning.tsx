import React from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useThemeStore } from '../store/useThemeStore';

export function NetworkWarning() {
  const { network, connected } = useWallet();
  const { isDark } = useThemeStore();
  
  const isTestnet = network?.name?.toLowerCase() === 'testnet';
  
  if (!connected || isTestnet) {
    return null;
  }

  return (
    <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4`}>
      <div className={`p-4 rounded-xl border shadow-lg ${
        isDark 
          ? 'bg-orange-900/90 border-orange-700 backdrop-blur-sm' 
          : 'bg-orange-50 border-orange-200'
      }`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className={`font-semibold text-sm ${
              isDark ? 'text-orange-200' : 'text-orange-800'
            }`}>
              Wrong Network Detected
            </h3>
            <p className={`text-xs mt-1 ${
              isDark ? 'text-orange-300' : 'text-orange-700'
            }`}>
              You're connected to <strong>{network?.name || 'Mainnet'}</strong>. 
              Please switch to <strong>Testnet</strong> in your wallet to use this dApp.
            </p>
            <div className="mt-2 flex gap-2">
              <a
                href="https://petra.app/"
                target="_blank"
                rel="noopener noreferrer"
                className={`text-xs underline hover:no-underline flex items-center gap-1 ${
                  isDark ? 'text-orange-200' : 'text-orange-600'
                }`}
              >
                Petra Wallet Guide <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}