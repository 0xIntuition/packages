import type { Address } from 'viem';

import type { AddressOverrides } from './address-overrides.js';
import { type IntuitionDeploymentName, intuitionDeployments } from './deployments.js';

/** Resolve an override first, then the canonical deployment table. */
export function getContractAddressFromChainId(
	name: IntuitionDeploymentName,
	chainId: number,
	overrides?: AddressOverrides
): Address;
export function getContractAddressFromChainId(
	chainId: number,
	name: IntuitionDeploymentName,
	overrides?: AddressOverrides
): Address;
export function getContractAddressFromChainId(
	nameOrChainId: IntuitionDeploymentName | number,
	chainIdOrName: number | IntuitionDeploymentName,
	overrides?: AddressOverrides
): Address {
	const name = (
		typeof nameOrChainId === 'string' ? nameOrChainId : chainIdOrName
	) as IntuitionDeploymentName;
	const chainId = (typeof nameOrChainId === 'number' ? nameOrChainId : chainIdOrName) as number;
	const address = overrides?.[name]?.[chainId] || intuitionDeployments[name]?.[chainId];
	if (!address) {
		throw new Error(`Contract ${name} not found for chain ID ${chainId}`);
	}
	return address;
}

export function getMultiVaultAddressFromChainId(
	chainId: number,
	overrides?: AddressOverrides
): Address {
	return getContractAddressFromChainId('MultiVault', chainId, overrides);
}

export function getTrustAddressFromChainId(chainId: number, overrides?: AddressOverrides): Address {
	return getContractAddressFromChainId('Trust', chainId, overrides);
}
