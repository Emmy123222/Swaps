import React from 'react';
import { ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useTransactions } from '../hooks/useTransactions';
import { LoadingSpinner } from './ui/LoadingSpinner';

export function TransactionHistory() {
  const { transactions, loading } = useTransactions();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp / 1000).toLocaleString();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Transactions</h3>
      
      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div
              key={tx.hash}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(tx.status)}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white capitalize">
                    {tx.type.replace('_', ' ')}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTimestamp(tx.timestamp)}
                  </div>
                </div>
              </div>
              
              <a
                href={`https://explorer.aptoslabs.com/txn/${tx.hash}?network=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}