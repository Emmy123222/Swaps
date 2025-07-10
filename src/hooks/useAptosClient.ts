import { Aptos, AptosConfig } from '@aptos-labs/ts-sdk';
import { useMemo } from 'react';
import { NETWORK_CONFIG } from '../config/tokens';

export function useAptosClient() {
  const aptosClient = useMemo(() => {
    const config = new AptosConfig({
      network: NETWORK_CONFIG.name as any, // Use testnet from NETWORK_CONFIG
      fullnode: NETWORK_CONFIG.nodeUrl, // https://fullnode.testnet.aptoslabs.com/v1
      indexer: NETWORK_CONFIG.indexerUrl, // https://indexer-testnet.staging.gcp.aptosdev.com/v1/graphql
      // Fallback node for resilience
      additionalClientOptions: {
        fullnode: NETWORK_CONFIG.fallbackNodeUrl, // https://api.testnet.staging.aptoslabs.com/v1
      },
    });
    return new Aptos(config);
  }, [NETWORK_CONFIG.nodeUrl, NETWORK_CONFIG.indexerUrl, NETWORK_CONFIG.fallbackNodeUrl]);

  return aptosClient;
}