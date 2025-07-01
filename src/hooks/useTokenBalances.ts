import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useAptosClient } from './useAptosClient';
import { Token } from '../types/token';
import { APTOS_TOKENS } from '../config/tokens';

export function useTokenBalances() {
  const { account } = useWallet();
  const aptosClient = useAptosClient();
  const [tokens, setTokens] = useState<Token[]>(APTOS_TOKENS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokenBalances = useCallback(async () => {
    if (!account?.address) {
      // Reset balances when no account
      setTokens(APTOS_TOKENS.map(token => ({ ...token, balance: undefined })));
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const updatedTokens = await Promise.all(
        APTOS_TOKENS.map(async (token) => {
          try {
            let balance: number;
            
            // For APT (native coin), use getAccountAPTAmount
            if (token.address === '0x1::aptos_coin::AptosCoin') {
              balance = await aptosClient.getAccountAPTAmount({
                accountAddress: account.address,
              });
            } else {
              // For other tokens, use getAccountCoinAmount
              balance = await aptosClient.getAccountCoinAmount({
                accountAddress: account.address,
                coinType: token.address,
              });
            }
            
            const formattedBalance = (Number(balance) / Math.pow(10, token.decimals)).toFixed(6);
            
            return {
              ...token,
              balance: formattedBalance,
            };
          } catch (error) {
            // If token doesn't exist in account, balance is 0
            return {
              ...token,
              balance: '0.000000',
            };
          }
        })
      );

      setTokens(updatedTokens);
    } catch (error) {
      console.error('Error fetching token balances:', error);
      setError('Failed to fetch token balances');
      
      // Set all balances to 0 on error
      setTokens(APTOS_TOKENS.map(token => ({ ...token, balance: '0.000000' })));
    } finally {
      setLoading(false);
    }
  }, [account?.address, aptosClient]);

  // Auto-refresh balances every 10 seconds when connected
  useEffect(() => {
    if (!account?.address) return;

    fetchTokenBalances();
    
    const interval = setInterval(() => {
      fetchTokenBalances();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, [account?.address, fetchTokenBalances]);

  // Manual refresh function
  const refetch = useCallback(() => {
    fetchTokenBalances();
  }, [fetchTokenBalances]);

  return {
    tokens,
    loading,
    error,
    refetch,
  };
}