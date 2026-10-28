import type { Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';

import { intuitionMainnet, intuitionTestnet } from './networks';

export const BASE_CHAIN_ID = base.id;
export const BASE_SEPOLIA_CHAIN_ID = baseSepolia.id;
export const INTUITION_MAINNET_CHAIN_ID = 1155;
export const INTUITION_TESTNET_CHAIN_ID = 13579;

export type IntuitionDeploymentName =
	| 'Trust'
	| 'BaseEmissionsController'
	| 'WrappedTrust'
	| 'MultiVault'
	| 'TrustBonding'
	| 'SatelliteEmissionsController'
	| 'BondingCurveRegistry'
	| 'LinearCurve'
	| 'OffsetProgressiveCurve'
	| 'DynamicFeeFlatPriceCurve'
	| 'AtomWalletFactory'
	| 'AtomWalletBeacon'
	| 'AtomWarden'
	| 'EntryPoint';

export const intuitionDeployments: {
	[key in IntuitionDeploymentName]: {
		[chainId: number]: Address;
	};
} = {
	Trust: {
		[base.id]: '0x6cd905dF2Ed214b22e0d48FF17CD4200C1C6d8A3',
		[baseSepolia.id]: '0xA54b4E6e356b963Ee00d1C947f478d9194a1a210',
	},
	BaseEmissionsController: {
		[base.id]: '0x7745bDEe668501E5eeF7e9605C746f9cDfb60667',
		[baseSepolia.id]: '0x6B96fB3867b666A7957fa589866627ea902ec2C6',
	},
	WrappedTrust: {
		[intuitionTestnet.id]: '0xDE80b6EE63f7D809427CA350e30093F436A0fe35',
		[intuitionMainnet.id]: '0x81cFb09cb44f7184Ad934C09F82000701A4bF672',
	},
	MultiVault: {
		// Reference canonical testnet deployment; historical instances use overrides.
		[intuitionTestnet.id]: '0xF76d6976DeBFbB012ebc53e925BC4AEFCaA7C6c6',
		[intuitionMainnet.id]: '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e',
	},
	TrustBonding: {
		[intuitionTestnet.id]: '0x9E79446fE4B1683eF1678654554535a9c90B1C3D',
		[intuitionMainnet.id]: '0x635bBD1367B66E7B16a21D6E5A63C812fFC00617',
	},
	SatelliteEmissionsController: {
		[intuitionTestnet.id]: '0x2f4ef00b05f5AA9976154125Cc46D47CAB75B1b7',
		[intuitionMainnet.id]: '0x73B8819f9b157BE42172E3866fB0Ba0d5fA0A5c6',
	},
	BondingCurveRegistry: {
		[intuitionTestnet.id]: '0xb3bfd62d259E07d623844fC7bDB7D54F74Ff9052',
		[intuitionMainnet.id]: '0xd0E488Fb32130232527eedEB72f8cE2BFC0F9930',
	},
	LinearCurve: {
		[intuitionTestnet.id]: '0x7499bFa918DBc73Ace4A05D6194a5Cd343AE32Dd',
		[intuitionMainnet.id]: '0xc3eFD5471dc63d74639725f381f9686e3F264366',
	},
	OffsetProgressiveCurve: {
		[intuitionTestnet.id]: '0x96bb9020ba4D027E42C29eCB3CEcc2471E505E6C',
		[intuitionMainnet.id]: '0x23afF95153aa88D28B9B97Ba97629E05D5fD335d',
	},
	// Registered as curve id 3 in the testnet BondingCurveRegistry. The mainnet curve deploys and
	// registers separately, after the v1.1.0 upgrade; add its address then.
	DynamicFeeFlatPriceCurve: {
		[intuitionTestnet.id]: '0x3Bd2D1335161f3F2FA9eaA35a537415F7b10156A',
	},
	AtomWalletFactory: {
		[intuitionTestnet.id]: '0x900cff1007055c850FB48695a3CB121290d6f17b',
		[intuitionMainnet.id]: '0x33827373a7D1c7C78a01094071C2f6CE74253B9B',
	},
	AtomWalletBeacon: {
		[intuitionTestnet.id]: '0x16deCCF5484bE9FFb5c8a2d800E0fdf27b876012',
		[intuitionMainnet.id]: '0xC23cD55CF924b3FE4b97deAA0EAF222a5082A1FF',
	},
	AtomWarden: {
		[intuitionTestnet.id]: '0xf3f875E0d390C9bA8Aa21881E983baDe91866A38',
		[intuitionMainnet.id]: '0x98C9BCecf318d0D1409Bf81Ea3551b629fAEC165',
	},
	EntryPoint: {
		[intuitionTestnet.id]: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
		[intuitionMainnet.id]: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
	},
};
