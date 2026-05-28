import { describe, expect, it } from 'vitest';

import { INTUITION_MAINNET_CHAIN_ID } from '../deployments';
import { getMetaNativeSpokeAddressFromChainId } from './get-meta-native-spoke-address-from-chain-id';

describe('getMetaNativeSpokeAddressFromChainId', () => {
	it('returns configured deployment', () => {
		expect(getMetaNativeSpokeAddressFromChainId(INTUITION_MAINNET_CHAIN_ID)).toBe(
			'0x375135fe908dD62f3C7939FA4e65bf41Da721AB9'
		);
	});

	it('throws for unknown chain', () => {
		expect(() => getMetaNativeSpokeAddressFromChainId(999_999)).toThrow(
			'MetaNativeSpoke not found for chain ID 999999'
		);
	});
});
