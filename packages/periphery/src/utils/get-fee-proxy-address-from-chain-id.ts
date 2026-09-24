import type { Address } from 'viem';

import { intuitionPeripheryDeployments } from '../deployments';

/**
 * Resolves the FeeProxy contract address for a given chain ID.
 * @param chainId Chain ID for the deployment.
 * @returns FeeProxy contract address.
 * @throws Error if the deployment is missing.
 */
export function getFeeProxyAddressFromChainId(chainId: number): Address {
	const address = intuitionPeripheryDeployments.FeeProxy?.[chainId];
	if (!address) {
		throw new Error(`Contract FeeProxy not found for chain ID ${chainId}`);
	}

	return address;
}
