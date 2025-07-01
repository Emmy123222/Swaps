import React, { useState, useEffect } from 'react';
import { Plus, Minus, Info, TrendingUp, DollarSign } from 'lucide-react';
import { TokenSelector } from './TokenSelector';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useAptosClient } from '../hooks/useAptosClient';
import { useTokenBalances } from '../hooks/useTokenBalances';
import { useThemeStore } from '../store/useThemeStore';
import { Button } from './ui/Button';
import toast from 'react-hot-toast';

export function LiquidityInterface() {
  const { account, signAndSubmitTransaction } = useWallet();
  const aptosClient = useAptosClient();
  const { tokens } = useTokenBalances();
  const { isDark } = useThemeStore();
  const [activeTab, setActiveTab] = useState<'add' | 'remove'>('add');
  const [tokenA, setTokenA] = useState(tokens[0]);
  const [tokenB, setTokenB] = useState(tokens[1]);
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [poolExists, setPoolExists] = useState(false);
  const [poolData, setPoolData] = useState<any>(null);

  // Update tokens when balances are loaded
  useEffect(() => {
    if (tokens.length > 0) {
      setTokenA(tokens[0]);
      setTokenB(tokens[1]);
    }
  }, [tokens]);

  const checkPoolExists = async () => {
    if (!tokenA || !tokenB) return;
    
    try {
      // Real pool check would be implemented here for production
      // For devnet demonstration, we'll simulate pool existence
      setPoolExists(Math.random() > 0.3); // 70% chance pool exists
      setPoolData({
        reserveA: '1000000',
        reserveB: '5000000',
        totalSupply: '2236067',
        userLiquidity: '0',
      });
    } catch (error) {
      setPoolExists(false);
    }
  };

  useEffect(() => {
    checkPoolExists();
  }, [tokenA, tokenB]);

  const calculateAmountB = (inputAmountA: string) => {
    if (!inputAmountA || !poolData || !poolExists) return;
    
    const ratio = parseFloat(poolData.reserveB) / parseFloat(poolData.reserveA);
    const calculatedB = (parseFloat(inputAmountA) * ratio).toFixed(6);
    setAmountB(calculatedB);
  };

  const handleAddLiquidity = async () => {
    if (!account || !tokenA || !tokenB || !amountA || !amountB) {
      toast.error('Please connect wallet and enter amounts');
      return;
    }

    try {
      setIsLoading(true);
      
      // Real liquidity addition would be implemented here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Successfully added liquidity to ${tokenA.symbol}/${tokenB.symbol} pool!`);
      setAmountA('');
      setAmountB('');
    } catch (error) {
      console.error('Add liquidity failed:', error);
      toast.error('Failed to add liquidity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!account || !tokenA || !tokenB || !amountA) {
      toast.error('Please connect wallet and enter LP amount');
      return;
    }

    try {
      setIsLoading(true);
      
      // Real liquidity removal would be implemented here
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Successfully removed liquidity from ${tokenA.symbol}/${tokenB.symbol} pool!`);
      setAmountA('');
      setAmountB('');
    } catch (error) {
      console.error('Remove liquidity failed:', error);
      toast.error('Failed to remove liquidity. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className={`rounded-2xl border transition-colors duration-200 ${
        isDark 
          ? 'bg-gray-800/50 border-gray-700 backdrop-blur-sm' 
          : 'bg-white border-gray-200 shadow-lg'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex rounded-xl p-1 bg-gray-100 dark:bg-gray-800">
            <button
              onClick={() => setActiveTab('add')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'add'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Plus className="h-4 w-4 inline mr-2" />
              Add Liquidity
            </button>
            <button
              onClick={() => setActiveTab('remove')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'remove'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <Minus className="h-4 w-4 inline mr-2" />
              Remove Liquidity
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Pool Status */}
          {tokenA && tokenB && (
            <div className={`p-3 rounded-xl border ${
              poolExists
                ? isDark ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
                : isDark ? 'bg-yellow-900/20 border-yellow-700' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4" />
                <span className={poolExists ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}>
                  {poolExists ? 'Pool exists' : 'Pool will be created'}
                </span>
              </div>
              {poolExists && poolData && (
                <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                  <div>Reserve A: {(parseFloat(poolData.reserveA) / 1e8).toFixed(2)} {tokenA.symbol}</div>
                  <div>Reserve B: {(parseFloat(poolData.reserveB) / 1e8).toFixed(2)} {tokenB.symbol}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'add' ? (
            <>
              {/* Token A Input */}
              <div className={`p-4 rounded-2xl border ${
                isDark 
                  ? 'bg-gray-900/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Token A
                  </span>
                  {tokenA?.balance && (
                    <button
                      onClick={() => setAmountA(tokenA.balance || '')}
                      className={`text-sm hover:underline ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-500'}`}
                    >
                      Balance: {tokenA.balance}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={amountA}
                    onChange={(e) => {
                      setAmountA(e.target.value);
                      calculateAmountB(e.target.value);
                    }}
                    placeholder="0"
                    className={`flex-1 text-xl font-semibold bg-transparent border-none outline-none ${
                      isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                    }`}
                  />
                  <TokenSelector
                    selectedToken={tokenA}
                    onTokenSelect={setTokenA}
                    tokens={tokens}
                    isDark={isDark}
                  />
                </div>
              </div>

              {/* Plus Icon */}
              <div className="flex justify-center">
                <div className={`p-2 rounded-xl border-4 ${
                  isDark 
                    ? 'bg-gray-800 border-gray-900' 
                    : 'bg-white border-gray-50 shadow-sm'
                }`}>
                  <Plus className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
              </div>

              {/* Token B Input */}
              <div className={`p-4 rounded-2xl border ${
                isDark 
                  ? 'bg-gray-900/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Token B
                  </span>
                  {tokenB?.balance && (
                    <button
                      onClick={() => setAmountB(tokenB.balance || '')}
                      className={`text-sm hover:underline ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-500'}`}
                    >
                      Balance: {tokenB.balance}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={amountB}
                    onChange={(e) => setAmountB(e.target.value)}
                    placeholder="0"
                    className={`flex-1 text-xl font-semibold bg-transparent border-none outline-none ${
                      isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                    }`}
                  />
                  <TokenSelector
                    selectedToken={tokenB}
                    onTokenSelect={setTokenB}
                    tokens={tokens.filter(token => token.symbol !== tokenA?.symbol)}
                    isDark={isDark}
                  />
                </div>
              </div>

              <Button
                onClick={handleAddLiquidity}
                loading={isLoading}
                disabled={!account || !amountA || !amountB}
                className="w-full py-4 text-lg"
              >
                {!account ? 'Connect Wallet' : 'Add Liquidity'}
              </Button>
            </>
          ) : (
            <>
              {/* LP Token Input */}
              <div className={`p-4 rounded-2xl border ${
                isDark 
                  ? 'bg-gray-900/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    LP Tokens
                  </span>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Balance: {poolData?.userLiquidity || '0.000000'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={amountA}
                    onChange={(e) => setAmountA(e.target.value)}
                    placeholder="0"
                    className={`flex-1 text-xl font-semibold bg-transparent border-none outline-none ${
                      isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                    }`}
                  />
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl font-semibold ${
                    isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    <span>{tokenA?.symbol}/{tokenB?.symbol}</span>
                  </div>
                </div>
              </div>

              {/* Percentage Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => {
                      const maxAmount = poolData?.userLiquidity || '0';
                      const amount = (parseFloat(maxAmount) * percentage / 100).toFixed(6);
                      setAmountA(amount);
                    }}
                    className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {percentage}%
                  </button>
                ))}
              </div>

              <Button
                onClick={handleRemoveLiquidity}
                loading={isLoading}
                disabled={!account || !amountA}
                variant="secondary"
                className="w-full py-4 text-lg"
              >
                {!account ? 'Connect Wallet' : 'Remove Liquidity'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Devnet Notice */}
      <div className={`mt-4 p-4 rounded-xl border ${
        isDark 
          ? 'bg-blue-900/20 border-blue-700' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center gap-2 text-sm">
          <Info className="h-4 w-4 text-blue-500" />
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            Devnet Environment
          </span>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Liquidity pools are simulated for devnet testing. Real pools will be available on mainnet.
        </p>
      </div>
    </div>
  );
}