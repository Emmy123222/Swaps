import React, { useState } from 'react';
import { ChevronDown, Search, Star } from 'lucide-react';

interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoUrl: string;
  balance?: string;
}

interface TokenSelectorProps {
  selectedToken: Token | null;
  onTokenSelect: (token: Token) => void;
  tokens: Token[];
  isDark: boolean;
}

export function TokenSelector({ selectedToken, onTokenSelect, tokens, isDark }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const filteredTokens = tokens.filter(token =>
    token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    token.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageError = (tokenSymbol: string) => {
    setImageErrors(prev => new Set(prev).add(tokenSymbol));
  };

  const getTokenImage = (token: Token) => {
    if (imageErrors.has(token.symbol)) {
      // Fallback to a simple colored circle with the first letter
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="20" fill="#3B82F6"/>
          <text x="20" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16" font-weight="bold">
            ${token.symbol[0]}
          </text>
        </svg>
      `)}`;
    }
    return token.logoUrl;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-2 rounded-2xl font-semibold transition-colors ${
          isDark 
            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
            : 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
        }`}
      >
        {selectedToken ? (
          <>
            <img 
              src={getTokenImage(selectedToken)} 
              alt={selectedToken.symbol}
              className="w-6 h-6 rounded-full"
              onError={() => handleImageError(selectedToken.symbol)}
            />
            <span>{selectedToken.symbol}</span>
          </>
        ) : (
          <span>Select token</span>
        )}
        <ChevronDown className="h-4 w-4" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:transform md:-translate-x-1/2 md:-translate-y-1/2 z-50">
            <div className={`rounded-2xl border max-w-md w-full mx-auto max-h-[80vh] overflow-hidden ${
              isDark 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200 shadow-xl'
            }`}>
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-4">
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Select a token
                  </h3>
                  <button
                    onClick={() => setIsOpen(false)}
                    className={`text-2xl ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    ×
                  </button>
                </div>
                
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                    isDark ? 'text-gray-400' : 'text-gray-400'
                  }`} />
                  <input
                    type="text"
                    placeholder="Search name or paste address"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500'
                    }`}
                    autoFocus
                  />
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 space-y-1">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.address}
                      onClick={() => {
                        onTokenSelect(token);
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        isDark 
                          ? 'hover:bg-gray-700' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <img 
                        src={getTokenImage(token)} 
                        alt={token.symbol}
                        className="w-10 h-10 rounded-full"
                        onError={() => handleImageError(token.symbol)}
                      />
                      <div className="flex-1 text-left">
                        <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {token.symbol}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {token.name}
                        </div>
                      </div>
                      {token.balance && (
                        <div className="text-right">
                          <div className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {token.balance}
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                  
                  {filteredTokens.length === 0 && (
                    <div className="text-center py-8">
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        No tokens found
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}