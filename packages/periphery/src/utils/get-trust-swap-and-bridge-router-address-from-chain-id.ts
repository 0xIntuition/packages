import type { Address } from 'viem';

import { intuitionPeripheryDeployments } from '../deployments';

/**
 * Resolves the TrustSwapAndBridgeRouter contract address for a given chain ID.
 * @param chainId Chain ID for the deployment.
 * @returns TrustSwapAndBridgeRouter contract address.
 * @throws Error if the deployment is missing.
 */
export function getTrustSwapAndBridgeRouterAddressFromChainId(chainId: number): Address {
	const address = intuitionPeripheryDeployments.TrustSwapAndBridgeRouter?.[chainId];
	if (!address) {
		throw new Error(`Contract TrustSwapAndBridgeRouter not found for chain ID ${chainId}`);
	}

	return address;
}
