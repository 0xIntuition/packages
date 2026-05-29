import { base } from 'viem/chains';
import { describe, expect, it } from 'vitest';

import { intuitionPeripheryDeployments } from '../deployments';
import { getTrustSwapAndBridgeRouterAddressFromChainId } from './get-trust-swap-and-bridge-router-address-from-chain-id';

describe('getTrustSwapAndBridgeRouterAddressFromChainId', () => {
	it('returns configured Base deployment', () => {
		expect(getTrustSwapAndBridgeRouterAddressFromChainId(base.id)).toBe(
			intuitionPeripheryDeployments.TrustSwapAndBridgeRouter?.[base.id]
		);
	});

	it('throws for unknown chain', () => {
		expect(() => getTrustSwapAndBridgeRouterAddressFromChainId(999_999)).toThrow(
			'Contract TrustSwapAndBridgeRouter not found for chain ID 999999'
		);
	});
});
