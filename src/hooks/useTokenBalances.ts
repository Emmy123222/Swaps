import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useAptosClient } from './useAptosClient';
import { Token } from '../types/token';
import { APTOS_TOKENS } from '../config/tokens';

export function useTokenBalances() {
  const { account, network, connected, wallets } = useWallet();
  const aptosClient = useAptosClient();
  const [tokens, setTokens] = useState<Token[]>(APTOS_TOKENS.map(t => ({ ...t, balance: '0.000000' })));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async (token: Token): Promise<string> => {
    if (!token.verified || !connected || !account?.address) {
      console.log(`Skipping ${token.symbol}: ${!token.verified ? 'unverified' : 'not connected'}`);
      return '0.000000';
    }

    try {
      const balance = token.coinType === '0x1::aptos_coin::AptosCoin'
        ? await aptosClient.getAccountAPTAmount({
            accountAddress: account.address,
          })
        : await aptosClient.getAccountCoinAmount({
            accountAddress: account.address,
            coinType: token.coinType,
          });
      const formattedBalance = (Number(balance) / 10 ** token.decimals).toFixed(6);
      console.log(`Fetched ${token.symbol} balance for ${account.address}: ${formattedBalance}`);
      return formattedBalance;
    } catch (err: any) {
      console.error(`${token.symbol} SDK failure: ${err.message}`);
      if (err.message.includes('resource not found')) console.log(`${token.symbol} not registered for ${account.address}`);
      else if (err.message.includes('undefined (reading \'from\')')) console.warn(`${token.symbol} Serialization error - check Buffer polyfill`);
      return '0.000000';
    }
  }, [account?.address, connected, aptosClient]);

  const fetchTokenBalances = useCallback(async () => {
    if (!connected || !account?.address || !network?.name || network.name.toLowerCase() !== 'testnet') {
      console.warn('Invalid state:', { connected, address: account?.address, network: network?.name, wallets: wallets.map(w => w.name) });
      setTokens(APTOS_TOKENS.map(t => ({ ...t, balance: '0.000000' })));
      setError('Connect to Aptos Testnet with Petra wallet');
      return;
    }

    setLoading(true);
    console.time('Balance Fetch');
    try {
      const updatedTokens = await Promise.all(
        APTOS_TOKENS.map(async token => ({
          ...token,
          balance: await fetchBalance(token),
        }))
      );
      setTokens(updatedTokens);
      console.log('Balances:', updatedTokens.reduce((acc, t) => ({ ...acc, [t.symbol]: t.balance }), {}));
    } catch (err: any) {
      console.error('Critical fetch failure:', err);
      setError(`Balance fetch failed: ${err.message}`);
      setTokens(APTOS_TOKENS.map(t => ({ ...t, balance: '0.000000' })));
    } finally {
      setLoading(false);
      console.timeEnd('Balance Fetch');
    }
  }, [account?.address, connected, network?.name, fetchBalance, wallets]);

  useEffect(() => {
    fetchTokenBalances();
    const interval = setInterval(fetchTokenBalances, 15000); // 15s interval for stability
    return () => clearInterval(interval);
  }, [fetchTokenBalances]);

  const refetch = useCallback(() => fetchTokenBalances(), [fetchTokenBalances]);

  return { tokens, loading, error, refetch };
}