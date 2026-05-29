import type { Address } from 'viem';

import { intuitionPeripheryMetaERC20SpokeDeployments, type MetaBridgeAsset } from '../deployments';

/**
 * Resolves the MetaERC20Spoke address for a chain and asset.
 * @throws Error if no deployment exists for the asset/chain pair.
 */
export function getMetaERC20SpokeAddressFromChainId(
	chainId: number,
	asset: MetaBridgeAsset
): Address {
	const address = intuitionPeripheryMetaERC20SpokeDeployments[asset]?.[chainId];

	if (!address) {
		throw new Error(`MetaERC20Spoke not found for asset ${asset} on chain ID ${chainId}`);
	}

	return address;
}
