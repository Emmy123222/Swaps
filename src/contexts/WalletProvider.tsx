import React, { useEffect, useState } from 'react';
import { AptosWalletAdapterProvider, NetworkName } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';
import { RiseWallet } from '@rise-wallet/wallet-adapter';
import toast from 'react-hot-toast';

// Initialize wallets with error handling
const initializeWallets = () => {
  try {
    return [
      new PetraWallet(),
      new MartianWallet(),
      new RiseWallet(),
    ];
  } catch (error) {
    console.error('Failed to initialize wallets:', error);
    toast.error('Failed to load wallet adapters. Please refresh the page.');
    return [];
  }
};

interface WalletProviderProps {
  children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [wallets, setWallets] = useState(initializeWallets());

  useEffect(() => {
    if (!wallets.length) {
      console.warn('No wallets initialized. Retrying...');
      setWallets(initializeWallets());
    }
  }, [wallets]);

  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={false} // Manual connection to avoid race conditions
      dappConfig={{
        network: NetworkName.Devnet,
        aptosConnectDappId: 'aptosswap-devnet',
      }}
      onError={(error) => {
        console.error('Wallet adapter error:', error);
        toast.error(`Wallet connection error: ${error.message || 'Please try reconnecting your wallet.'}`);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}