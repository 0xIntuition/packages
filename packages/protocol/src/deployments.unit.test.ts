import { describe, expect, it } from 'vitest';

import { intuitionDeployments } from './deployments';
import { intuitionTestnet } from './networks';

describe('intuitionDeployments — chain 13579 golden pin', () => {
	it('resolves the canonical testnet set for chain 13579', () => {
		expect(intuitionTestnet.id).toBe(13_579);
		const testnetSet = Object.fromEntries(
			Object.entries(intuitionDeployments).flatMap(([name, addresses]) => {
				const address = addresses[13_579];
				return address ? [[name, address]] : [];
			})
		);
		expect(testnetSet).toEqual({
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

	it('keeps the Base-only contracts off chain 13579', () => {
		expect(intuitionDeployments.Trust[13_579]).toBeUndefined();
		expect(intuitionDeployments.BaseEmissionsController[13_579]).toBeUndefined();
	});
});
