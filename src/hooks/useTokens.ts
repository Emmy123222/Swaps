import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useAptosClient } from './useAptosClient';
import { Token } from '../types/token';
import { APTOS_TOKENS } from '../config/tokens';

export function useTokens() {
  const { account } = useWallet();
  const aptosClient = useAptosClient();
  const [tokens, setTokens] = useState<Token[]>(APTOS_TOKENS);
  const [loading, setLoading] = useState(false);

  const fetchTokenBalances = async () => {
    if (!account?.address) return;

    setLoading(true);
    try {
      const updatedTokens = await Promise.all(
        APTOS_TOKENS.map(async (token) => {
          try {
            const balance = await aptosClient.getAccountCoinAmount({
              accountAddress: account.address,
              coinType: token.address,
            });
            
            const formattedBalance = (Number(balance) / Math.pow(10, token.decimals)).toFixed(6);
            
            return {
              ...token,
              balance: formattedBalance,
            };
          } catch (error) {
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenBalances();
  }, [account?.address]);

  return {
    tokens,
    loading,
    refetch: fetchTokenBalances,
  };
}