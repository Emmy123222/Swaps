import React, { useEffect, useState, Component } from 'react';
import { AptosWalletAdapterProvider, NetworkName } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { MartianWallet } from '@martianwallet/aptos-wallet-adapter';
import { RiseWallet } from '@rise-wallet/wallet-adapter';
import toast from 'react-hot-toast';

const initializeWallets = () => {
  try {
    return [
      new PetraWallet(),
      new MartianWallet(),
      new RiseWallet(),
    ];
  } catch (error) {
    console.error('Failed to initialize wallets:', error);
    toast.error('Failed to load wallet adapters. Using Petra as fallback.');
    return [new PetraWallet()];
  }
};

class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div>Wallet provider error. Please refresh the page.</div>;
    }
    return this.props.children;
  }
}

interface WalletProviderProps {
  children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [wallets, setWallets] = useState(initializeWallets());

  useEffect(() => {
    console.log('Wallets initialized:', wallets);
    if (!wallets.length) {
      console.warn('No wallets initialized. Retrying...');
      setWallets(initializeWallets());
    }
  }, [wallets]);

  return (
    <ErrorBoundary>
      <AptosWalletAdapterProvider
        plugins={wallets}
        autoConnect={false}
        dappConfig={{
          network: NetworkName.Testnet,
          aptosConnectDappId: 'aptosswap-testnet',
        }}
        onError={(error) => {
          console.error('Wallet adapter error:', error);
          toast.error(`Wallet connection error: ${error.message || 'Please try reconnecting your wallet.'}`);
        }}
      >
        {children}
      </AptosWalletAdapterProvider>
    </ErrorBoundary>
  );
}