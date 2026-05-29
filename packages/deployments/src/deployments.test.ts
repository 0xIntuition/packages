import { base, baseSepolia } from 'viem/chains';
import { describe, expect, it } from 'vitest';

import {
	getContractAddressFromChainId,
	getMultiVaultAddressFromChainId,
	getTrustAddressFromChainId,
	INTUITION_MAINNET_CHAIN_ID,
	INTUITION_TESTNET_CHAIN_ID,
	intuitionDeployments,
	intuitionMainnet,
	intuitionTestnet,
} from './index.js';

describe('@0xintuition/deployments', () => {
	it('exports typed Intuition chain metadata', () => {
		expect(intuitionMainnet.id).toBe(INTUITION_MAINNET_CHAIN_ID);
		expect(intuitionTestnet.id).toBe(INTUITION_TESTNET_CHAIN_ID);
	});

	it('resolves protocol deployment addresses', () => {
		expect(getTrustAddressFromChainId(base.id)).toBe(intuitionDeployments.Trust[base.id]);
		expect(getContractAddressFromChainId('Trust', baseSepolia.id)).toBe(
			intuitionDeployments.Trust[baseSepolia.id]
		);
		expect(getMultiVaultAddressFromChainId(INTUITION_MAINNET_CHAIN_ID)).toBe(
			intuitionDeployments.MultiVault[INTUITION_MAINNET_CHAIN_ID]
		);
	});

	it('throws for missing deployment lookups', () => {
		expect(() => getContractAddressFromChainId('MultiVault', 999_999)).toThrow(
			'Contract MultiVault not found for chain ID 999999'
		);
	});
});
