import { base, baseSepolia } from 'viem/chains';
import { describe, expect, it } from 'vitest';

import { intuitionDeployments } from '../deployments';
import { intuitionMainnet, intuitionTestnet } from '../networks';
import { getContractAddressFromChainId } from './get-contract-address-from-chain-id';
import { getMultiVaultAddressFromChainId } from './get-multivault-address-from-chain-id';
import { getTrustAddressFromChainId } from './get-trust-address-from-chain-id';

describe('getContractAddressFromChainId', () => {
	it('returns known contract addresses for configured chains', () => {
		const trustAddress = intuitionDeployments.Trust?.[base.id];
		expect(trustAddress).toBeDefined();
		expect(getContractAddressFromChainId('Trust', base.id)).toBe(trustAddress);

		const testTrustAddress = intuitionDeployments.Trust?.[baseSepolia.id];
		expect(testTrustAddress).toBeDefined();
		expect(getContractAddressFromChainId('Trust', baseSepolia.id)).toBe(testTrustAddress);

		const mainnetMultiVaultAddress = intuitionDeployments.MultiVault?.[intuitionMainnet.id];
		expect(mainnetMultiVaultAddress).toBeDefined();
		expect(getContractAddressFromChainId('MultiVault', intuitionMainnet.id)).toBe(
			mainnetMultiVaultAddress
		);

		const testnetMultiVaultAddress = intuitionDeployments.MultiVault?.[intuitionTestnet.id];
		expect(testnetMultiVaultAddress).toBeDefined();
		expect(getContractAddressFromChainId('MultiVault', intuitionTestnet.id)).toBe(
			testnetMultiVaultAddress
		);

		const baseSepoliaEmissionsController =
			intuitionDeployments.BaseEmissionsController?.[baseSepolia.id];
		expect(baseSepoliaEmissionsController).toBeDefined();
		expect(getContractAddressFromChainId('BaseEmissionsController', baseSepolia.id)).toBe(
			baseSepoliaEmissionsController
		);

		expect(getContractAddressFromChainId('AtomWalletFactory', intuitionTestnet.id)).toBe(
			'0x900cff1007055c850FB48695a3CB121290d6f17b'
		);
		expect(getContractAddressFromChainId('AtomWalletBeacon', intuitionTestnet.id)).toBe(
			'0x16deCCF5484bE9FFb5c8a2d800E0fdf27b876012'
		);
		expect(getContractAddressFromChainId('EntryPoint', intuitionTestnet.id)).toBe(
			'0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108'
		);
		expect(getContractAddressFromChainId('AtomWalletFactory', intuitionMainnet.id)).toBe(
			'0x33827373a7D1c7C78a01094071C2f6CE74253B9B'
		);
		expect(getContractAddressFromChainId('AtomWalletBeacon', intuitionMainnet.id)).toBe(
			'0xC23cD55CF924b3FE4b97deAA0EAF222a5082A1FF'
		);
		expect(getContractAddressFromChainId('EntryPoint', intuitionMainnet.id)).toBe(
			'0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108'
		);
	});

	it('throws for unsupported contract deployment lookups', () => {
		expect(() => getContractAddressFromChainId('MultiVault', 999_999)).toThrow(
			'Contract MultiVault not found for chain ID 999999'
		);
	});
});

describe('address shortcut helpers', () => {
	it('returns the same Trust address as the generic helper', () => {
		expect(getTrustAddressFromChainId(base.id)).toBe(
			getContractAddressFromChainId('Trust', base.id)
		);
	});

	it('returns the same MultiVault address as the generic helper', () => {
		expect(getMultiVaultAddressFromChainId(intuitionMainnet.id)).toBe(
			getContractAddressFromChainId('MultiVault', intuitionMainnet.id)
		);
	});
});
