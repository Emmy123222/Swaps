// Contract configuration for Aptos Devnet
export const CONTRACT_CONFIG = {
  // Your deployed contract address
  CONTRACT_ADDRESS: '0x3645e4adcc4bc90328f4f399b65c46583ab9252feb0dba983b8cafa226c47aec',
  
  // Module names
  SWAP_MODULE: '0x3645e4adcc4bc90328f4f399b65c46583ab9252feb0dba983b8cafa226c47aec::swap',
  
  // Network configuration
  NETWORK: {
    name: 'devnet',
    nodeUrl: 'https://fullnode.devnet.aptoslabs.com/v1',
    indexerUrl: 'https://indexer-devnet.staging.gcp.aptosdev.com/v1/graphql',
    faucetUrl: 'https://faucet.devnet.aptoslabs.com',
    explorerUrl: 'https://explorer.aptoslabs.com',
  },
  
  // Fee configuration (0.3% = 30 basis points)
  FEE_RATE: 30,
  
  // Slippage tolerance (0.5% default)
  DEFAULT_SLIPPAGE: 0.5,
};

// Helper function to get contract address
export const getContractAddress = () => {
  return import.meta.env.VITE_CONTRACT_ADDRESS || CONTRACT_CONFIG.CONTRACT_ADDRESS;
};

// Helper function to build function ID
export const buildFunctionId = (functionName: string) => {
  return `${getContractAddress()}::swap::${functionName}`;
};

// Function IDs for easy access
export const FUNCTION_IDS = {
  INITIALIZE: () => buildFunctionId('initialize'),
  CREATE_POOL: () => buildFunctionId('create_pool'),
  SWAP_X_TO_Y: () => buildFunctionId('swap_x_to_y'),
  SWAP_Y_TO_X: () => buildFunctionId('swap_y_to_x'),
  GET_RESERVES: () => buildFunctionId('get_reserves'),
  GET_QUOTE: () => buildFunctionId('get_quote'),
};