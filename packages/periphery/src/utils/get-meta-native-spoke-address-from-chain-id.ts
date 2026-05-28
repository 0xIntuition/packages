import type { Address } from 'viem';

import { intuitionPeripheryDeployments } from '../deployments';

/**
 * Resolves the MetaNativeSpoke address for a chain.
 * @throws Error if no deployment exists on the chain.
 */
export function getMetaNativeSpokeAddressFromChainId(chainId: number): Address {
	const address = intuitionPeripheryDeployments.MetaNativeSpoke?.[chainId];

	if (!address) {
		throw new Error(`MetaNativeSpoke not found for chain ID ${chainId}`);
	}

	return address;
}
