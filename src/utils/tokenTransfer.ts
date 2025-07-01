import { Aptos } from '@aptos-labs/ts-sdk';
import { Token } from '../types/token';

export interface TransferTokensParams {
  aptosClient: Aptos;
  fromAddress: string;
  toAddress: string;
  token: Token;
  amount: string;
  signAndSubmitTransaction: (payload: any) => Promise<any>;
}

export async function transferTokens({
  aptosClient,
  fromAddress,
  toAddress,
  token,
  amount,
  signAndSubmitTransaction
}: TransferTokensParams): Promise<string> {
  const amountWithDecimals = Math.floor(parseFloat(amount) * Math.pow(10, token.decimals));

  let payload;

  if (token.address === '0x1::aptos_coin::AptosCoin') {
    // Transfer APT using aptos_account::transfer
    payload = {
      function: '0x1::aptos_account::transfer',
      type_arguments: [],
      arguments: [toAddress, amountWithDecimals.toString()],
    };
  } else {
    // Transfer other tokens using coin::transfer
    payload = {
      function: '0x1::coin::transfer',
      type_arguments: [token.address],
      arguments: [toAddress, amountWithDecimals.toString()],
    };
  }

  const response = await signAndSubmitTransaction(payload);
  
  if (!response || !response.hash) {
    throw new Error('Transfer failed: No transaction hash received');
  }

  await aptosClient.waitForTransaction({
    transactionHash: response.hash,
  });

  return response.hash;
}

export async function simulateSwapWithTransfers({
  aptosClient,
  fromAddress,
  contractAddress,
  fromToken,
  toToken,
  fromAmount,
  toAmount,
  signAndSubmitTransaction
}: {
  aptosClient: Aptos;
  fromAddress: string;
  contractAddress: string;
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  signAndSubmitTransaction: (payload: any) => Promise<any>;
}): Promise<string> {
  // For simulation, we'll just transfer a small amount of the input token
  // to show that a transaction occurred
  
  if (fromToken.symbol === 'APT') {
    // Transfer a small amount of APT to simulate the swap
    const simulationAmount = Math.min(parseFloat(fromAmount) * 0.1, 0.01); // 10% or 0.01 APT max
    
    return transferTokens({
      aptosClient,
      fromAddress,
      toAddress: contractAddress,
      token: fromToken,
      amount: simulationAmount.toString(),
      signAndSubmitTransaction
    });
  } else {
    // For other tokens, create a minimal self-transfer to show activity
    return transferTokens({
      aptosClient,
      fromAddress,
      toAddress: fromAddress,
      token: { ...fromToken, address: '0x1::aptos_coin::AptosCoin' }, // Use APT for self-transfer
      amount: '0.000001', // Minimal amount
      signAndSubmitTransaction
    });
  }
}