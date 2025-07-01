#!/usr/bin/env node

/**
 * Deployment script for AptosSwap Move contract
 * Run with: npm run move:deploy
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DEVNET_FAUCET = 'https://faucet.devnet.aptoslabs.com';
const DEVNET_EXPLORER = 'https://explorer.aptoslabs.com';

console.log('🚀 AptosSwap Deployment Script');
console.log('================================\n');

// Check if Aptos CLI is installed
try {
  const version = execSync('aptos --version', { encoding: 'utf8' });
  console.log(`✅ Aptos CLI installed: ${version.trim()}`);
} catch (error) {
  console.error('❌ Aptos CLI not found. Please install it first:');
  console.error('   brew install aptos  # macOS');
  console.error('   curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3  # Linux');
  process.exit(1);
}

// Check if .aptos directory exists
const aptosConfigPath = path.join(process.env.HOME || process.env.USERPROFILE, '.aptos');
if (!fs.existsSync(aptosConfigPath)) {
  console.log('⚠️  Aptos CLI not initialized. Initializing now...');
  try {
    execSync('aptos init --profile devnet --network devnet --assume-yes', { stdio: 'inherit' });
    console.log('✅ Aptos CLI initialized for devnet\n');
  } catch (error) {
    console.log('❌ Failed to initialize Aptos CLI. Please run manually:');
    console.log('   aptos init --profile devnet --network devnet');
    process.exit(1);
  }
}

try {
  // Step 1: Get account address first
  console.log('📍 Getting account address...');
  const accountInfo = execSync('aptos account list --profile devnet', { encoding: 'utf8' });
  const addressMatch = accountInfo.match(/0x[a-fA-F0-9]+/);
  
  if (!addressMatch) {
    console.error('❌ Could not find account address. Please run: aptos init --profile devnet');
    process.exit(1);
  }
  
  const contractAddress = addressMatch[0];
  console.log(`📍 Account Address: ${contractAddress}`);
  
  // Step 2: Update Move.toml with correct address
  console.log('📝 Updating Move.toml...');
  const moveTomlContent = `[package]
name = "AptosSwap"
version = "1.0.0"
authors = ["AptosSwap Team"]

[addresses]
aptos_swap = "${contractAddress}"

[dependencies.AptosFramework]
git = "https://github.com/aptos-labs/aptos-core.git"
rev = "mainnet"
subdir = "aptos-move/framework/aptos-framework"

[dev-dependencies]
`;
  
  fs.writeFileSync('Move.toml', moveTomlContent);
  console.log('✅ Move.toml updated with correct address\n');

  // Step 3: Fund account if needed
  console.log('💰 Checking account balance...');
  try {
    const balance = execSync(`aptos account balance --profile devnet`, { encoding: 'utf8' });
    console.log(`Current balance: ${balance.trim()}`);
    
    if (balance.includes('0')) {
      console.log('💸 Funding account from faucet...');
      execSync('aptos account fund-with-faucet --profile devnet', { stdio: 'inherit' });
      console.log('✅ Account funded\n');
    }
  } catch (error) {
    console.log('💸 Funding account from faucet...');
    execSync('aptos account fund-with-faucet --profile devnet', { stdio: 'inherit' });
    console.log('✅ Account funded\n');
  }

  // Step 4: Compile the contract
  console.log('📦 Compiling Move contract...');
  execSync('aptos move compile --profile devnet', { stdio: 'inherit' });
  console.log('✅ Contract compiled successfully\n');

  // Step 5: Deploy to devnet
  console.log('🌐 Deploying to Aptos Devnet...');
  const deployOutput = execSync('aptos move publish --profile devnet --assume-yes', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });
  
  console.log('✅ Contract deployed successfully!');
  
  // Extract transaction hash from output
  const txHashMatch = deployOutput.match(/Transaction hash: (0x[a-fA-F0-9]+)/);
  if (txHashMatch) {
    const txHash = txHashMatch[1];
    console.log(`📋 Transaction Hash: ${txHash}`);
    console.log(`🔍 View on Explorer: ${DEVNET_EXPLORER}/txn/${txHash}?network=devnet`);
  }

  console.log(`📍 Contract Address: ${contractAddress}`);
  console.log(`🔍 View Account: ${DEVNET_EXPLORER}/account/${contractAddress}?network=devnet`);
  
  // Step 6: Wait a moment for deployment to propagate
  console.log('\n⏳ Waiting for deployment to propagate...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 7: Initialize the swap module
  console.log('🔧 Initializing swap module...');
  try {
    const initOutput = execSync(
      `aptos move run --function-id ${contractAddress}::swap::initialize --profile devnet --assume-yes`,
      { encoding: 'utf8', stdio: 'pipe' }
    );
    
    const initTxMatch = initOutput.match(/Transaction hash: (0x[a-fA-F0-9]+)/);
    if (initTxMatch) {
      console.log(`✅ Swap module initialized!`);
      console.log(`📋 Init Transaction: ${initTxMatch[1]}`);
    }
  } catch (error) {
    console.log('⚠️  Module might already be initialized or initialization failed');
    console.log('   You can initialize manually later from the dApp');
  }

  // Step 8: Update environment file
  const envContent = `# Aptos Devnet Configuration
VITE_APTOS_NETWORK=devnet
VITE_APTOS_NODE_URL=https://fullnode.devnet.aptoslabs.com/v1
VITE_APTOS_INDEXER_URL=https://indexer-devnet.staging.gcp.aptosdev.com/v1/graphql
VITE_CONTRACT_ADDRESS=${contractAddress}
VITE_APTOS_FAUCET_URL=${DEVNET_FAUCET}
`;

  fs.writeFileSync('.env.local', envContent);
  console.log('\n✅ Environment file updated (.env.local)');

  // Step 9: Update contract config
  const contractConfigContent = `// Contract configuration for Aptos Devnet
export const CONTRACT_CONFIG = {
  // Your deployed contract address
  CONTRACT_ADDRESS: '${contractAddress}',
  
  // Module names
  SWAP_MODULE: '${contractAddress}::swap',
  
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
  return \`\${getContractAddress()}::swap::\${functionName}\`;
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
`;

  fs.writeFileSync('src/config/contract.ts', contractConfigContent);
  console.log('✅ Contract config updated');

  console.log('\n🎉 Deployment Complete!');
  console.log('================================');
  console.log('Contract Address:', contractAddress);
  console.log('Network: Aptos Devnet');
  console.log('Explorer:', `${DEVNET_EXPLORER}/account/${contractAddress}?network=devnet`);
  console.log('\nNext steps:');
  console.log('1. Restart your dev server: npm run dev');
  console.log('2. Get test tokens from faucet:', DEVNET_FAUCET);
  console.log('3. Test your dApp with the deployed contract');
  console.log('4. Create liquidity pools for trading pairs');

} catch (error) {
  console.error('\n❌ Deployment failed:');
  console.error(error.message);
  
  if (error.message.includes('INSUFFICIENT_BALANCE')) {
    console.log('\n💡 Solution: Get test APT from the faucet:');
    console.log(`   ${DEVNET_FAUCET}`);
  }
  
  if (error.message.includes('SEQUENCE_NUMBER_TOO_OLD')) {
    console.log('\n💡 Solution: Wait a moment and try again');
  }
  
  if (error.message.includes('COMPILATION_ERROR')) {
    console.log('\n💡 Solution: Check your Move code for syntax errors');
  }
  
  process.exit(1);
}

// Helper function for async operations in Node.js
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}