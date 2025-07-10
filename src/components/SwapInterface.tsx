import React, { useState, useEffect } from 'react';
import { ArrowDown, Settings, RefreshCw, Info, ExternalLink, AlertCircle, RotateCcw } from 'lucide-react';
import { TokenSelector } from './TokenSelector';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useTokenBalances } from '../hooks/useTokenBalances';
import { useSwap } from '../hooks/useSwap';
import { useThemeStore } from '../store/useThemeStore';
import { CONTRACT_CONFIG } from '../config/contract';
import toast from 'react-hot-toast';

export function SwapInterface() {
  const { account, network } = useWallet();
  const { tokens, refetch: refetchBalances } = useTokenBalances();
  const { loading, quote, getSwapQuote, executeSwap } = useSwap();
  const { isDark } = useThemeStore();
  
  const [fromToken, setFromToken] = useState(tokens[0]);
  const [toToken, setToToken] = useState(tokens[1]);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(CONTRACT_CONFIG.DEFAULT_SLIPPAGE);
  const [showSettings, setShowSettings] = useState(false);
  const [lastSwapHash, setLastSwapHash] = useState<string | null>(null);

  const isTestnet = network?.name?.toLowerCase() === 'testnet';

  // Update tokens when balances are loaded
  useEffect(() => {
    if (tokens.length > 0) {
      setFromToken(tokens[0]);
      setToToken(tokens[1]);
    }
  }, [tokens]);

  // Update toAmount when quote changes
  useEffect(() => {
    if (quote) {
      setToAmount(quote.outputAmount);
    } else {
      setToAmount('');
    }
  }, [quote]);

  const handleSwapTokens = () => {
    if (toToken) {
      const temp = fromToken;
      setFromToken(toToken);
      setToToken(temp);
      setFromAmount(toAmount);
      setToAmount('');
    }
  };

  // Get quote when amount or tokens change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (fromToken && toToken && fromAmount && parseFloat(fromAmount) > 0) {
        getSwapQuote(fromToken, toToken, fromAmount);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [fromAmount, fromToken, toToken, getSwapQuote]);

  const handleSwap = async () => {
    if (!account) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!isTestnet) {
      toast.error('Please switch to Testnet in your wallet');
      return;
    }

    if (!fromToken || !toToken || !fromAmount || !quote) {
      toast.error('Please enter amounts and select tokens');
      return;
    }

    try {
      const txHash = await executeSwap(fromToken, toToken, fromAmount, quote.minimumReceived);
      
      if (txHash) {
        setLastSwapHash(txHash);
        setFromAmount('');
        setToAmount('');
        
        // Refresh balances after successful swap
        setTimeout(() => {
          refetchBalances();
        }, 2000);
      }
    } catch (error) {
      // Error handling is done in useSwap hook
    }
  };

  const canSwap = fromToken && toToken && fromAmount && quote && parseFloat(fromAmount) > 0 && isTestnet;
  const insufficientBalance = fromToken && fromAmount && parseFloat(fromAmount) > parseFloat(fromToken.balance?.replace(',', '') || '0');

  return (
    <div className="w-full">
      {/* Network Warning */}
      {account && !isTestnet && (
        <div className={`mb-4 p-4 rounded-xl border ${
          isDark 
            ? 'bg-orange-900/20 border-orange-700' 
            : 'bg-orange-50 border-orange-200'
        }`}>
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-orange-500" />
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              Wrong Network: Please switch to Testnet in your wallet
            </span>
          </div>
        </div>
      )}

      {/* Main Swap Card */}
      <div className={`rounded-2xl border transition-colors duration-200 ${
        isDark 
          ? 'bg-gray-800/50 border-gray-700 backdrop-blur-sm' 
          : 'bg-white border-gray-200 shadow-lg'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Swap
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={refetchBalances}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
                title="Refresh balances"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark 
                    ? 'hover:bg-gray-700 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className={`p-4 border-b transition-colors ${
            isDark ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
          }`}>
            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Slippage tolerance
                </label>
                <div className="flex gap-2">
                  {[0.1, 0.5, 1.0].map((value) => (
                    <button
                      key={value}
                      onClick={() => setSlippage(value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        slippage === value
                          ? 'bg-pink-500 text-white'
                          : isDark
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {value}%
                    </button>
                  ))}
                  <input
                    type="number"
                    step="0.1"
                    value={slippage}
                    onChange={(e) => setSlippage(parseFloat(e.target.value) || 0)}
                    className={`w-20 px-3 py-2 rounded-lg text-sm border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="Custom"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="p-4 space-y-1">
          {/* From Token */}
          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark 
              ? 'bg-gray-900/50 border-gray-600 hover:border-gray-500' 
              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                You pay
              </span>
              {fromToken?.balance && (
                <button
                  onClick={() => setFromAmount(fromToken.balance || '')}
                  className={`text-sm hover:underline ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-500'}`}
                >
                  Balance: {fromToken.balance}
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0"
                className={`flex-1 text-2xl font-semibold bg-transparent border-none outline-none ${
                  isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                }`}
              />
              <TokenSelector
                selectedToken={fromToken}
                onTokenSelect={setFromToken}
                tokens={tokens}
                isDark={isDark}
              />
            </div>
          </div>

          {/* Swap Arrow */}
          <div className="flex justify-center py-2">
            <button
              onClick={handleSwapTokens}
              className={`p-2 rounded-xl border-4 transition-all hover:scale-110 ${
                isDark 
                  ? 'bg-gray-800 border-gray-900 hover:bg-gray-700' 
                  : 'bg-white border-gray-50 hover:bg-gray-50 shadow-sm'
              }`}
            >
              <ArrowDown className={`h-4 w-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            </button>
          </div>

          {/* To Token */}
          <div className={`p-4 rounded-2xl border transition-colors ${
            isDark 
              ? 'bg-gray-900/50 border-gray-600 hover:border-gray-500' 
              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
          }`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                You receive
              </span>
              {toToken?.balance && (
                <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Balance: {toToken.balance}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={loading ? 'Calculating...' : toAmount}
                readOnly
                placeholder="0"
                className={`flex-1 text-2xl font-semibold bg-transparent border-none outline-none cursor-not-allowed ${
                  isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                }`}
              />
              <TokenSelector
                selectedToken={toToken}
                onTokenSelect={setToToken}
                tokens={tokens.filter(token => token.symbol !== fromToken?.symbol)}
                isDark={isDark}
              />
            </div>
          </div>

          {/* Price Info */}
          {quote && fromToken && toToken && (
            <div className={`p-3 rounded-xl border transition-colors ${
              isDark 
                ? 'bg-gray-900/30 border-gray-700' 
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-1">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Rate</span>
                  <Info className={`h-3 w-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <span className={isDark ? 'text-white' : 'text-gray-900'}>
                  1 {fromToken.symbol} = {(parseFloat(quote.outputAmount) / parseFloat(quote.inputAmount)).toFixed(4)} {toToken.symbol}
                </span>
              </div>
              {quote.priceImpact > 0 && (
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Price impact</span>
                  <span className={`${
                    quote.priceImpact > 3 ? 'text-red-500' : quote.priceImpact > 1 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {quote.priceImpact.toFixed(2)}%
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm mt-1">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Minimum received</span>
                <span className={isDark ? 'text-white' : 'text-gray-900'}>
                  {quote.minimumReceived} {toToken.symbol}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm mt-1">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Fee</span>
                <span className={isDark ? 'text-white' : 'text-gray-900'}>
                  {quote.fee} {fromToken.symbol}
                </span>
              </div>
            </div>
          )}

          {/* Swap Button */}
          <button
            onClick={handleSwap}
            disabled={!canSwap || loading || insufficientBalance}
            className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all ${
              canSwap && !loading && !insufficientBalance
                ? 'bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white shadow-lg transform hover:scale-[1.02]'
                : isDark
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="h-5 w-5 animate-spin" />
                {quote ? 'Swapping...' : 'Calculating...'}
              </div>
            ) : !account ? (
              'Connect Wallet'
            ) : !isTestnet ? (
              'Switch to Testnet'
            ) : insufficientBalance ? (
              `Insufficient ${fromToken?.symbol} balance`
            ) : !fromToken || !toToken ? (
              'Select tokens'
            ) : !fromAmount ? (
              'Enter amount'
            ) : (
              `Swap ${fromToken.symbol} for ${toToken.symbol}`
            )}
          </button>
        </div>
      </div>

      {/* Last Transaction */}
      {lastSwapHash && (
        <div className={`mt-4 p-4 rounded-xl border ${
          isDark 
            ? 'bg-green-900/20 border-green-700' 
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-green-600 dark:text-green-400 font-medium">
                Last transaction successful
              </span>
            </div>
            <a 
              href={`${CONTRACT_CONFIG.NETWORK.explorerUrl}/txn/${lastSwapHash}?network=testnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 dark:text-green-400 hover:underline flex items-center gap-1 text-sm"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* Testnet Notice */}
      <div className={`mt-4 p-4 rounded-xl border ${
        isDark 
          ? 'bg-blue-900/20 border-blue-700' 
          : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center gap-2 text-sm">
          <Info className="h-4 w-4 text-blue-500" />
          <span className="text-blue-600 dark:text-blue-400 font-medium">
           Testnet Testing Environment
          </span>
        </div>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
          Swaps are simulated for testing. Real transactions create small APT transfers to demonstrate functionality.
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          Get test tokens from the{' '}
          <a 
            href={CONTRACT_CONFIG.NETWORK.faucetUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            Aptos Faucet
          </a>
        </p>
      </div>
    </div>
  );
}