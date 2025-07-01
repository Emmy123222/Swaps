import { useState } from 'react';
import { useWallet, InputTransactionData, WalletName } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { useAptosClient } from './useAptosClient';
import { Token, SwapQuote } from '../types/token';
import { CONTRACT_CONFIG } from '../config/contract';
import toast from 'react-hot-toast';

// Cache for token prices to reduce API calls
const priceCache: { [key: string]: { price: number; timestamp: number } } = {};
const CACHE_DURATION = 60_000; // 1 minute

export function useSwap() {
  const { account, signAndSubmitTransaction, connected, wallet, connect } = useWallet();
  const aptosClient = useAptosClient();
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState<SwapQuote | null>(null);

  // Fetch real token prices from CoinGecko API
  const fetchTokenPrice = async (tokenSymbol: string, retries = 3, delay = 1000): Promise<number> => {
    const coinGeckoIds: { [key: string]: string } = {
      'APT': 'aptos',
      'USDC': 'usd-coin',
      'USDT': 'tether',
      'WETH': 'weth',
      'WBTC': 'wrapped-bitcoin',
      'BNB': 'binancecoin',
      'CAKE': 'pancakeswap-token',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'SOL': 'solana',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'UNI': 'uniswap',
      'DOGE': 'dogecoin',
      'SHIB': 'shiba-inu',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash',
      'XRP': 'ripple',
      'TRX': 'tron',
    };

    const coinId = coinGeckoIds[tokenSymbol];
    if (!coinId) {
      throw new Error(`Price not available for ${tokenSymbol}`);
    }

    // Check cache first
    const cached = priceCache[tokenSymbol];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.price;
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
          {
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        const price = data[coinId]?.usd;

        if (!price || typeof price !== 'number') {
          throw new Error(`Invalid price data for ${tokenSymbol}`);
        }

        // Cache the price
        priceCache[tokenSymbol] = { price, timestamp: Date.now() };
        return price;
      } catch (error) {
        console.warn(`Attempt ${attempt} failed for ${tokenSymbol}:`, error);
        if (attempt === retries) {
          throw new Error(`Failed to fetch price for ${tokenSymbol} after ${retries} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw new Error(`Failed to fetch price for ${tokenSymbol}`);
  };

  const getSwapQuote = async (
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string
  ): Promise<SwapQuote | null> => {
    if (!amountIn || parseFloat(amountIn) === 0) {
      setQuote(null);
      return null;
    }

    try {
      setLoading(true);

      // Fetch real token prices
      const [inputPrice, outputPrice] = await Promise.all([
        fetchTokenPrice(tokenIn.symbol),
        fetchTokenPrice(tokenOut.symbol),
      ]);

      const exchangeRate = inputPrice / outputPrice;

      // Apply 0.3% fee
      const outputAmount = (parseFloat(amountIn) * exchangeRate * 0.997).toFixed(6);
      const priceImpact = Math.min(parseFloat(amountIn) * 0.01, 2);
      const fee = (parseFloat(amountIn) * 0.003).toFixed(6);

      const swapQuote: SwapQuote = {
        inputAmount: amountIn,
        outputAmount,
        priceImpact,
        minimumReceived: (parseFloat(outputAmount) * (1 - CONTRACT_CONFIG.DEFAULT_SLIPPAGE / 100)).toFixed(6),
        route: [tokenIn.symbol, tokenOut.symbol],
        fee,
      };

      setQuote(swapQuote);
      return swapQuote;
    } catch (error: any) {
      console.error('Error getting swap quote:', error);
      toast.error(`Failed to fetch prices: ${error.message}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const executeSwap = async (
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string,
    minimumAmountOut: string
  ) => {
    // Enhanced wallet state debugging
    console.log('=== WALLET STATE DEBUG ===');
    console.log('connected:', connected);
    console.log('account:', account);
    console.log('wallet:', wallet);
    console.log('wallet.name:', wallet?.name);
    console.log('signAndSubmitTransaction:', signAndSubmitTransaction);
    console.log('typeof signAndSubmitTransaction:', typeof signAndSubmitTransaction);

    // Check wallet availability
    if (!wallet) {
      toast.error('No wallet detected. Please select a wallet.');
      return;
    }

    // Ensure wallet is connected
    if (!connected) {
      toast.error('Please connect your wallet first');
      try {
        // Use explicit WalletName type
        const walletName: WalletName = (wallet.name || PetraWallet.name) as WalletName;
        await connect(walletName);
        console.log('Connected wallet:', walletName);
      } catch (connectError) {
        console.error('Wallet connection failed:', connectError);
        toast.error('Failed to connect wallet. Please try again.');
        return;
      }
    }

    // Verify account address
    if (!account?.address) {
      toast.error('Wallet account not found. Please reconnect your wallet.');
      return;
    }

    // Verify signAndSubmitTransaction
    if (!signAndSubmitTransaction || typeof signAndSubmitTransaction !== 'function') {
      console.error('signAndSubmitTransaction is not available:', signAndSubmitTransaction);
      toast.error('Wallet does not support transactions. Please try a different wallet or refresh the page.');
      return;
    }

    try {
      setLoading(true);

      console.log('Creating transaction payload...');

      // Create transaction payload for Move smart contract
      const payload: InputTransactionData = {
        data: {
          function: CONTRACT_CONFIG.CONTRACT_ADDRESS
            ? `${CONTRACT_CONFIG.CONTRACT_ADDRESS}::${CONTRACT_CONFIG.SWAP_MODULE}::execute_swap`
            : "0x1::aptos_account::transfer", // Fallback to transfer if contract not set
          typeArguments: CONTRACT_CONFIG.CONTRACT_ADDRESS ? [tokenIn.coinType, tokenOut.coinType] : [],
          functionArguments: CONTRACT_CONFIG.CONTRACT_ADDRESS
            ? [amountIn, minimumAmountOut]
            : [account.address, "1"],
        },
      };

      console.log('Transaction payload created:', payload);

      // Execute transaction
      console.log('Calling signAndSubmitTransaction...');
      const response = await signAndSubmitTransaction(payload);
      console.log('Transaction response received:', response);

      // Process response safely
      let txHash = null;
      if (response) {
        if (typeof response === 'string') {
          txHash = response;
        } else if (response && typeof response === 'object') {
          const possibleHashes = [
            response.hash,
            response.transactionHash,
            response.signature,
            response.result?.hash,
            response.data?.hash,
            response.txnHash,
            response.transaction_hash,
          ];

          for (const hash of possibleHashes) {
            if (hash && typeof hash === 'string' && hash.startsWith('0x')) {
              txHash = hash;
              break;
            }
          }
        }
      }

      // Show success message
      const successMessage = `Swap executed: ${amountIn} ${tokenIn.symbol} → ${quote?.outputAmount || '0'} ${tokenOut.symbol} (Min: ${minimumAmountOut})`;

      if (txHash && typeof txHash === 'string' && txHash.startsWith('0x')) {
        console.log('Transaction successful with hash:', txHash);

        // Wait for transaction confirmation with timeout
        try {
          await Promise.race([
            aptosClient.waitForTransaction({ transactionHash: txHash }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000)),
          ]);
          console.log('Transaction confirmed');
        } catch (confirmError) {
          console.log('Transaction confirmation timed out, but transaction was submitted');
        }

        toast.success(successMessage + ' ✅');

        // Show explorer link
        setTimeout(() => {
          toast.success(
            `View on Explorer: ${CONTRACT_CONFIG.NETWORK.explorerUrl}/txn/${txHash}?network=devnet`,
            { duration: 8000 }
          );
        }, 1000);

        return txHash;
      } else {
        console.log('Transaction submitted but hash not available');
        toast.success(successMessage + ' (Transaction submitted)');
        return 'submitted';
      }
    } catch (error: any) {
      console.error('Swap execution failed:', {
        error,
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      });

      // Handle specific wallet errors
      if (error?.message?.includes('User rejected') || error?.code === 4001) {
        toast.error('Transaction was rejected by user');
      } else if (error?.message?.includes('insufficient')) {
        toast.error('Insufficient balance. Get test APT from the faucet.');
      } else if (error?.message?.includes('network')) {
        toast.error('Network error. Please check your connection and try again.');
      } else if (error?.message?.includes('undefined') || error?.message?.includes('map')) {
        toast.error('Wallet adapter error. Please select a different wallet or refresh the page.');
      } else {
        toast.error(error?.message || 'Transaction failed. Please try again.');
      }

      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    quote,
    getSwapQuote,
    executeSwap,
  };
}