import { base, baseSepolia } from 'viem/chains';
import { describe, expect, it } from 'vitest';

import {
	BASE_CHAIN_ID,
	BASE_SEPOLIA_CHAIN_ID,
	getContractAddressFromChainId,
	getMultiVaultAddressFromChainId,
	getTrustAddressFromChainId,
	INTUITION_MAINNET_CHAIN_ID,
	INTUITION_TESTNET_CHAIN_ID,
	intuitionDeployments,
	intuitionMainnet,
	intuitionPeripheryDeployments,
	intuitionTestnet,
} from './index';

describe('@0xintuition/deployments', () => {
	it('exports typed Intuition chain metadata', () => {
		expect(intuitionMainnet.id).toBe(INTUITION_MAINNET_CHAIN_ID);
		expect(intuitionTestnet.id).toBe(INTUITION_TESTNET_CHAIN_ID);
		expect(BASE_CHAIN_ID).toBe(base.id);
		expect(BASE_SEPOLIA_CHAIN_ID).toBe(baseSepolia.id);
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

	// Canonical testnet set: the contracts the 13579 MultiVault is wired to on chain.
	it('pins the canonical chain 13579 set', () => {
		const testnet = Object.fromEntries(
			Object.entries(intuitionDeployments).flatMap(([name, byChain]) => {
				const address = byChain[INTUITION_TESTNET_CHAIN_ID];
				return address ? [[name, address]] : [];
			})
		);
		expect(testnet).toEqual({
			WrappedTrust: '0xDE80b6EE63f7D809427CA350e30093F436A0fe35',
			MultiVault: '0xF76d6976DeBFbB012ebc53e925BC4AEFCaA7C6c6',
			TrustBonding: '0x9E79446fE4B1683eF1678654554535a9c90B1C3D',
			SatelliteEmissionsController: '0x2f4ef00b05f5AA9976154125Cc46D47CAB75B1b7',
			BondingCurveRegistry: '0xb3bfd62d259E07d623844fC7bDB7D54F74Ff9052',
			LinearCurve: '0x7499bFa918DBc73Ace4A05D6194a5Cd343AE32Dd',
			OffsetProgressiveCurve: '0x96bb9020ba4D027E42C29eCB3CEcc2471E505E6C',
			DynamicFeeFlatPriceCurve: '0x3Bd2D1335161f3F2FA9eaA35a537415F7b10156A',
			AtomWalletFactory: '0x900cff1007055c850FB48695a3CB121290d6f17b',
			AtomWalletBeacon: '0x16deCCF5484bE9FFb5c8a2d800E0fdf27b876012',
			AtomWarden: '0xf3f875E0d390C9bA8Aa21881E983baDe91866A38',
			EntryPoint: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
		});
	});

	it('carries the mainnet and testnet FeeProxy', () => {
		expect(intuitionPeripheryDeployments.FeeProxy).toEqual({
			[INTUITION_MAINNET_CHAIN_ID]: '0x45B65BB9FFC4BC51C9e3a56902d9183dcff51B55',
			[INTUITION_TESTNET_CHAIN_ID]: '0x847801465DcB17811089107c0051c49E0135F6B8',
		});
	});

	it('carries no TrustSwapAndBridgeRouter address until the deadline router is redeployed', () => {
		expect(intuitionPeripheryDeployments.TrustSwapAndBridgeRouter).toEqual({});
	});
});
