import { base } from 'viem/chains';
import { describe, expect, it } from 'vitest';
import * as utils from './index.js';
import { intuitionMainnet } from './networks.js';

describe('utils index exports', () => {
	it('re-exports address lookup helpers', () => {
		expect(typeof utils.getContractAddressFromChainId).toBe('function');
		expect(typeof utils.getMultiVaultAddressFromChainId).toBe('function');
		expect(typeof utils.getTrustAddressFromChainId).toBe('function');
		expect(typeof utils.parseAddressOverrides).toBe('function');
		expect(typeof utils.mergeAddressOverrides).toBe('function');
		expect(typeof utils.resolveContractAddressSet).toBe('function');
		expect(typeof utils.listOverriddenContractNames).toBe('function');
		expect(typeof utils.summarizeContractAddressSet).toBe('function');
		expect(typeof utils.hasAddressOverrides).toBe('function');
		expect(typeof utils.isIntuitionDeploymentName).toBe('function');
		expect(utils.AddressOverridesParseError.prototype).toBeInstanceOf(Error);

		expect(utils.getTrustAddressFromChainId(base.id)).toBe(
			utils.getContractAddressFromChainId('Trust', base.id)
		);
		expect(utils.getMultiVaultAddressFromChainId(intuitionMainnet.id)).toBe(
			utils.getContractAddressFromChainId('MultiVault', intuitionMainnet.id)
		);
	});
});

describe('package override surface', () => {
	it('freezes the canonical name list', () => {
		expect(Object.isFrozen(utils.INTUITION_DEPLOYMENT_NAMES)).toBe(true);
	});

	it('applies overrides through the chain-first overload', () => {
		const overrides: utils.AddressOverrides = {
			Trust: { 31337: '0x0000000000000000000000000000000000000001' },
		};
		const options: utils.ParseAddressOverridesOptions = { source: 'caller' };
		const summary: utils.ContractAddressSetSummary = utils.summarizeContractAddressSet(
			31337,
			utils.parseAddressOverrides(JSON.stringify(overrides), options)
		);
		expect(utils.getContractAddressFromChainId(31337, 'Trust', overrides)).toBe(
			summary.resolvedSet.Trust
		);
	});
});
