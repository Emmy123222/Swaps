export interface Token {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  logoUrl: string;
  balance?: string;
  price?: number;
  verified?: boolean;
}

export interface TokenPair {
  tokenX: Token;
  tokenY: Token;
  reserveX: string;
  reserveY: string;
  lpSupply: string;
}

export interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  priceImpact: number;
  minimumReceived: string;
  route: string[];
  fee: string;
}

export interface Transaction {
  hash: string;
  type: 'swap' | 'add_liquidity' | 'remove_liquidity';
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  tokenIn?: Token;
  tokenOut?: Token;
  amountIn?: string;
  amountOut?: string;
}