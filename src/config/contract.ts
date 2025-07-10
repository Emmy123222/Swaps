// src/config/contract.ts
import abi from '../../abi.json'; // Adjusted path assuming contract.ts is in src/config/
console.log('ABI loaded:', abi);

// Contract configuration object
export const CONTRACT_CONFIG = {
  // Liquidswap contract address on testnet
  CONTRACT_ADDRESS: '0xaf2366228c2bcaeb4afdf700b349042ed71298286b32f6f2f8b9af268bacced5',
  // Liquidswap module for swap functions
  SWAP_MODULE: 'swap',
  // Network configuration for testnet
  NETWORK: {
    name: 'testnet',
    nodeUrl: 'https://fullnode.testnet.aptoslabs.com/v1',
    indexerUrl: 'https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql',
    faucetUrl: 'https://faucet.testnet.aptoslabs.com',
    explorerUrl: 'https://explorer.aptoslabs.com',
  },
  // Fee configuration (0.3% = 30 basis points)
  FEE_RATE: 30,
  // Slippage tolerance (0.5% default)
  DEFAULT_SLIPPAGE: 0.5,
  // ABI for contract interactions
  ABI: abi,
};

// Helper function to get contract address
export const getContractAddress = () => {
  return import.meta.env.VITE_CONTRACT_ADDRESS || CONTRACT_CONFIG.CONTRACT_ADDRESS;
};

// Helper function to build function ID for Liquidswap
export const buildFunctionId = (functionName: string): string => {
  return `${getContractAddress()}::${CONTRACT_CONFIG.SWAP_MODULE}::${functionName}`;
};

// Function IDs for Liquidswap
export const FUNCTION_IDS = {
  SWAP_EXACT_COIN_FOR_COIN: (): string => buildFunctionId('swap_exact_coin_for_coin_with_signer'),
  GET_QUOTE: (): string => buildFunctionId('get_amount_out'),
  EXECUTE_SWAP: (): string => buildFunctionId('execute_swap'), // Added execute_swap
};

// Example function to call execute_swap
export const callExecuteSwap = async (wallet: any, amountIn: number, minAmountOut: number) => {
  if (!wallet || !wallet.signAndSubmitTransaction) {
    throw new Error('Wallet not connected');
  }

  const payload = {
    type: 'entry_function_payload',
    function: FUNCTION_IDS.EXECUTE_SWAP(),
    // Add type_arguments if required by the contract (e.g., ['0x1::aptos_coin::AptosCoin', '0x1::aptos_coin::AptosCoin'])
    type_arguments: [], 
    arguments: [
      wallet.account.address, // Signer address
      amountIn.toString(),    // Amount in as string (u64)
      minAmountOut.toString(), // Min amount out as string (u64)
    ],
  };

  try {
    const response = await wallet.signAndSubmitTransaction(payload);
    console.log('Transaction submitted:', response);
    return response;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};

// Export the config
export default CONTRACT_CONFIG;