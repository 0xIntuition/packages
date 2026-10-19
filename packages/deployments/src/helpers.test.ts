import { base, baseSepolia } from 'viem/chains';
import { describe, expect, it } from 'vitest';

import type { AddressOverrides } from './address-overrides.js';
import { intuitionDeployments } from './deployments.js';
import {
	getContractAddressFromChainId,
	getMultiVaultAddressFromChainId,
	getTrustAddressFromChainId,
} from './helpers.js';
import { intuitionMainnet, intuitionTestnet } from './networks.js';

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
			'0xdbaDd9a5f5B75A32ae403B7D44F5510Ac16939CA'
		);
		expect(getContractAddressFromChainId('AtomWalletBeacon', intuitionTestnet.id)).toBe(
			'0x8497Eb80fB9742265AeFE711856b2ecACABF1Cb0'
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

	describe('with overrides', () => {
		const LEGACY_TESTNET_MULTIVAULT = '0xeBc49d356B7f64D888130D85CC6D17114a6843ec' as const;
		const overrides: AddressOverrides = {
			MultiVault: { [intuitionTestnet.id]: LEGACY_TESTNET_MULTIVAULT },
		};

		it('returns the override when (name, chainId) matches', () => {
			expect(getContractAddressFromChainId('MultiVault', intuitionTestnet.id, overrides)).toBe(
				LEGACY_TESTNET_MULTIVAULT
			);
		});

		it('does not affect other contracts on the same chain', () => {
			const atomWalletFactoryOnTestnet =
				intuitionDeployments.AtomWalletFactory?.[intuitionTestnet.id];
			expect(atomWalletFactoryOnTestnet).toBeDefined();
			expect(
				getContractAddressFromChainId('AtomWalletFactory', intuitionTestnet.id, overrides)
			).toBe(atomWalletFactoryOnTestnet);
		});

		it('does not affect the same contract on other chains', () => {
			const mainnetMultiVault = intuitionDeployments.MultiVault?.[intuitionMainnet.id];
			expect(mainnetMultiVault).toBeDefined();
			expect(getContractAddressFromChainId('MultiVault', intuitionMainnet.id, overrides)).toBe(
				mainnetMultiVault
			);
		});

		it('falls back to default when override map is empty', () => {
			const defaultTestnetMultiVault = intuitionDeployments.MultiVault?.[intuitionTestnet.id];
			expect(defaultTestnetMultiVault).toBeDefined();
			expect(getContractAddressFromChainId('MultiVault', intuitionTestnet.id, {})).toBe(
				defaultTestnetMultiVault
			);
		});

		it('falls back to default when overrides param is undefined', () => {
			const defaultTestnetMultiVault = intuitionDeployments.MultiVault?.[intuitionTestnet.id];
			expect(defaultTestnetMultiVault).toBeDefined();
			expect(getContractAddressFromChainId('MultiVault', intuitionTestnet.id)).toBe(
				defaultTestnetMultiVault
			);
		});

		it('still throws for unknown (name, chainId) when overrides do not cover it', () => {
			expect(() => getContractAddressFromChainId('MultiVault', 999_999, overrides)).toThrow(
				'Contract MultiVault not found for chain ID 999999'
			);
		});

		it('propagates through getMultiVaultAddressFromChainId', () => {
			expect(getMultiVaultAddressFromChainId(intuitionTestnet.id, overrides)).toBe(
				LEGACY_TESTNET_MULTIVAULT
			);
		});

		it('propagates through getTrustAddressFromChainId', () => {
			const LEGACY_TRUST = '0xeBc49d356B7f64D888130D85CC6D17114a6843e0' as const;
			const trustOverrides: AddressOverrides = {
				Trust: { [intuitionTestnet.id]: LEGACY_TRUST },
			};
			expect(getTrustAddressFromChainId(intuitionTestnet.id, trustOverrides)).toBe(LEGACY_TRUST);
		});
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
