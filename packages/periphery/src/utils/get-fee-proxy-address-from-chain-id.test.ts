import { describe, expect, it } from 'vitest';

import { getFeeProxyAddressFromChainId } from './get-fee-proxy-address-from-chain-id';

describe('getFeeProxyAddressFromChainId', () => {
	it('resolves the testnet FeeProxy', () => {
		expect(getFeeProxyAddressFromChainId(13579)).toBe('0x847801465DcB17811089107c0051c49E0135F6B8');
	});

	it('resolves the mainnet FeeProxy', () => {
		expect(getFeeProxyAddressFromChainId(1155)).toBe('0x45B65BB9FFC4BC51C9e3a56902d9183dcff51B55');
	});

	it('throws for a chain without a FeeProxy', () => {
		expect(() => getFeeProxyAddressFromChainId(8453)).toThrow(
			'Contract FeeProxy not found for chain ID 8453'
		);
	});
});
