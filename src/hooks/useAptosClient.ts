import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { useMemo } from 'react';

export function useAptosClient() {
  const aptosClient = useMemo(() => {
    const config = new AptosConfig({ 
      network: Network.DEVNET,
      fullnode: 'https://fullnode.devnet.aptoslabs.com/v1',
      indexer: 'https://indexer-devnet.staging.gcp.aptosdev.com/v1/graphql',
    });
    return new Aptos(config);
  }, []);

  return aptosClient;
}