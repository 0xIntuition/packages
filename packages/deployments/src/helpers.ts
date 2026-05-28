import type { Address } from 'viem';

import { type IntuitionDeploymentName, intuitionDeployments } from './deployments.js';

export function getContractAddressFromChainId(
	name: IntuitionDeploymentName,
	chainId: number
): Address {
	const address = intuitionDeployments[name]?.[chainId];
	if (!address) {
		throw new Error(`Contract ${name} not found for chain ID ${chainId}`);
	}
	return address;
}

export function getMultiVaultAddressFromChainId(chainId: number): Address {
	return getContractAddressFromChainId('MultiVault', chainId);
}

export function getTrustAddressFromChainId(chainId: number): Address {
	return getContractAddressFromChainId('Trust', chainId);
}
