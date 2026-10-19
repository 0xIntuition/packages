import { base } from 'viem/chains';
import { describe, expect, it } from 'vitest';

import { getTrustSwapAndBridgeRouterAddressFromChainId } from './get-trust-swap-and-bridge-router-address-from-chain-id';

describe('getTrustSwapAndBridgeRouterAddressFromChainId', () => {
	it('throws for Base while the deadline router awaits redeployment', () => {
		expect(() => getTrustSwapAndBridgeRouterAddressFromChainId(base.id)).toThrow(
			`Contract TrustSwapAndBridgeRouter not found for chain ID ${base.id}`
		);
	});

	it('throws for unknown chain', () => {
		expect(() => getTrustSwapAndBridgeRouterAddressFromChainId(999_999)).toThrow(
			'Contract TrustSwapAndBridgeRouter not found for chain ID 999999'
		);
	});
});
