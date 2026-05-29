import { describe, expect, it } from 'vitest';

import { intuitionPeripheryBaseBridgeAssetDeployments } from '../deployments';
import { getBaseBridgeAssetAddress } from './get-base-bridge-asset-address';

describe('getBaseBridgeAssetAddress', () => {
	it('returns the configured Base bridge asset address', () => {
		expect(getBaseBridgeAssetAddress('USDC')).toBe(
			intuitionPeripheryBaseBridgeAssetDeployments.USDC
		);
		expect(getBaseBridgeAssetAddress('WETH')).toBe(
			intuitionPeripheryBaseBridgeAssetDeployments.WETH
		);
	});

	it('throws for an unknown bridge asset', () => {
		expect(() => getBaseBridgeAssetAddress('DAI' as 'USDC')).toThrow(
			'Base bridge asset not found for asset DAI'
		);
	});
});
