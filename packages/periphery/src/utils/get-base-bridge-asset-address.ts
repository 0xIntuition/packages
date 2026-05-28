import type { Address } from 'viem';

import { intuitionPeripheryBaseBridgeAssetDeployments, type MetaBridgeAsset } from '../deployments';

/**
 * Resolves the canonical Base asset address used for direct bridge approvals.
 * @throws Error if no deployment exists for the asset.
 */
export function getBaseBridgeAssetAddress(asset: MetaBridgeAsset): Address {
	const address = intuitionPeripheryBaseBridgeAssetDeployments[asset];

	if (!address) {
		throw new Error(`Base bridge asset not found for asset ${asset}`);
	}

	return address;
}
