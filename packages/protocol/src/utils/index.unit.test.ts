import { base } from 'viem/chains';
import { describe, expect, it } from 'vitest';

import { intuitionMainnet } from '../networks';
import * as utils from './index';

describe('utils index exports', () => {
	it('re-exports address lookup helpers', () => {
		expect(typeof utils.getContractAddressFromChainId).toBe('function');
		expect(typeof utils.getMultiVaultAddressFromChainId).toBe('function');
		expect(typeof utils.getTrustAddressFromChainId).toBe('function');

		expect(utils.getTrustAddressFromChainId(base.id)).toBe(
			utils.getContractAddressFromChainId('Trust', base.id)
		);
		expect(utils.getMultiVaultAddressFromChainId(intuitionMainnet.id)).toBe(
			utils.getContractAddressFromChainId('MultiVault', intuitionMainnet.id)
		);
	});
});
