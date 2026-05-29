import type { Address } from 'viem';

import { intuitionPeripheryMetaERC20HubDeployments, type MetaBridgeAsset } from '../deployments';

/**
 * Resolves the MetaERC20Hub address for a chain and asset.
 * @throws Error if no deployment exists for the asset/chain pair.
 */
export function getMetaERC20HubAddressFromChainId(
	chainId: number,
	asset: MetaBridgeAsset
): Address {
	const address = intuitionPeripheryMetaERC20HubDeployments[asset]?.[chainId];

	if (!address) {
		throw new Error(`MetaERC20Hub not found for asset ${asset} on chain ID ${chainId}`);
	}

	return address;
}
