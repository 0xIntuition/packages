import { describe, expect, it } from 'vitest';

import { getFeeProxyAddressFromChainId } from './get-fee-proxy-address-from-chain-id';

describe('getFeeProxyAddressFromChainId', () => {
	it('resolves the testnet FeeProxy', () => {
		expect(getFeeProxyAddressFromChainId(13579)).toBe('0x847801465DcB17811089107c0051c49E0135F6B8');
	});

	it('throws on mainnet until FeeProxy is deployed there', () => {
		expect(() => getFeeProxyAddressFromChainId(1155)).toThrow(
			'Contract FeeProxy not found for chain ID 1155'
		);
	});
});
