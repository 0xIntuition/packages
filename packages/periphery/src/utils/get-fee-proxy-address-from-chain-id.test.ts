import { describe, expect, it } from 'vitest';

import { getFeeProxyAddressFromChainId } from './get-fee-proxy-address-from-chain-id';

describe('getFeeProxyAddressFromChainId', () => {
	it('throws for any chain — no FeeProxy has been deployed yet', () => {
		expect(() => getFeeProxyAddressFromChainId(999_999)).toThrow(
			'Contract FeeProxy not found for chain ID 999999'
		);
	});
});
