import type { Address } from 'viem';

import { getContractAddressFromChainId } from './get-contract-address-from-chain-id';

/**
 * Resolves the Trust contract address for a given chain ID.
 * @param chainId Chain ID for the deployment.
 * @returns Trust contract address.
 * @throws Error if the deployment is missing.
 */
export function getTrustAddressFromChainId(chainId: number): Address {
	return getContractAddressFromChainId('Trust', chainId);
}
