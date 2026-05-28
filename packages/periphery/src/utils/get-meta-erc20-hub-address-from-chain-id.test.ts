import { base } from 'viem/chains';
import { describe, expect, it } from 'vitest';

import { getMetaERC20HubAddressFromChainId } from './get-meta-erc20-hub-address-from-chain-id';

describe('getMetaERC20HubAddressFromChainId', () => {
	it('returns configured deployment', () => {
		expect(getMetaERC20HubAddressFromChainId(base.id, 'USDC')).toBe(
			'0x7e41962bE9B2640e653BfA8c8713A905659FE157'
		);
	});

	it('throws for unknown chain', () => {
		expect(() => getMetaERC20HubAddressFromChainId(999_999, 'USDC')).toThrow(
			'MetaERC20Hub not found for asset USDC on chain ID 999999'
		);
	});
});
