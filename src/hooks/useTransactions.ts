import { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useAptosClient } from './useAptosClient';
import { Transaction } from '../types/token';

export function useTransactions() {
  const { account } = useWallet();
  const aptosClient = useAptosClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!account?.address) return;

    setLoading(true);
    try {
      const txns = await aptosClient.getAccountTransactions({
        accountAddress: account.address,
        options: {
          limit: 20,
        },
      });

      const swapTransactions: Transaction[] = txns
        .filter((txn: any) => 
          txn.type === 'user_transaction' && 
          txn.payload?.function?.includes('swap')
        )
        .map((txn: any) => ({
          hash: txn.hash,
          type: 'swap' as const,
          status: txn.success ? 'success' as const : 'failed' as const,
          timestamp: parseInt(txn.timestamp),
        }));

      setTransactions(swapTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [account?.address]);

  return {
    transactions,
    loading,
    refetch: fetchTransactions,
  };
}