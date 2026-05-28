import { describe, expect, it } from 'vitest';

import { INTUITION_MAINNET_CHAIN_ID } from '../deployments';
import { getMetaERC20SpokeAddressFromChainId } from './get-meta-erc20-spoke-address-from-chain-id';

describe('getMetaERC20SpokeAddressFromChainId', () => {
	it('returns configured deployment', () => {
		expect(getMetaERC20SpokeAddressFromChainId(INTUITION_MAINNET_CHAIN_ID, 'WETH')).toBe(
			'0xFB4BAa05BF339AD6074047176F90757A6C87f944'
		);
	});

	it('throws for unknown chain', () => {
		expect(() => getMetaERC20SpokeAddressFromChainId(999_999, 'USDC')).toThrow(
			'MetaERC20Spoke not found for asset USDC on chain ID 999999'
		);
	});
});
