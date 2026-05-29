import type { Address } from 'viem';
import { base, baseSepolia } from 'viem/chains';

export const BASE_CHAIN_ID = base.id;
export const BASE_SEPOLIA_CHAIN_ID = baseSepolia.id;
export const INTUITION_MAINNET_CHAIN_ID = 1155;
export const INTUITION_TESTNET_CHAIN_ID = 13579;

import { intuitionMainnet, intuitionTestnet } from './networks.js';

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
		[baseSepolia.id]: '0xEA4bB93907b35C09244f069c35A7E60EbeCA0f72',
	},
	WrappedTrust: {
		[intuitionTestnet.id]: '0xDE80b6EE63f7D809427CA350e30093F436A0fe35',
		[intuitionMainnet.id]: '0x81cFb09cb44f7184Ad934C09F82000701A4bF672',
	},
	MultiVault: {
		[intuitionTestnet.id]: '0xeBc49d356B7f64D888130D85CC6D17114a6843ec',
		[intuitionMainnet.id]: '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e',
	},
	TrustBonding: {
		[intuitionTestnet.id]: '0xfa1bF01055239C674845aAEe5A5416f98f801BE3',
		[intuitionMainnet.id]: '0x635bBD1367B66E7B16a21D6E5A63C812fFC00617',
	},
	SatelliteEmissionsController: {
		[intuitionTestnet.id]: '0x67bacf20FF9EE3092F71E5a48270f20F1DAb8309',
		[intuitionMainnet.id]: '0x73B8819f9b157BE42172E3866fB0Ba0d5fA0A5c6',
	},
	BondingCurveRegistry: {
		[intuitionTestnet.id]: '0xbFE8068d5C5117c57d37464e33c937bC08317F88',
		[intuitionMainnet.id]: '0xd0E488Fb32130232527eedEB72f8cE2BFC0F9930',
	},
	LinearCurve: {
		[intuitionTestnet.id]: '0x9f272DAEfa66e031081430Ec138FD34190d6f671',
		[intuitionMainnet.id]: '0xc3eFD5471dc63d74639725f381f9686e3F264366',
	},
	OffsetProgressiveCurve: {
		[intuitionTestnet.id]: '0xd50CB061b1CE0560108fc3D58685d4eDb7594f20',
		[intuitionMainnet.id]: '0x23afF95153aa88D28B9B97Ba97629E05D5fD335d',
	},
	AtomWalletFactory: {
		[intuitionTestnet.id]: '0xdbaDd9a5f5B75A32ae403B7D44F5510Ac16939CA',
		[intuitionMainnet.id]: '0x33827373a7D1c7C78a01094071C2f6CE74253B9B',
	},
	AtomWalletBeacon: {
		[intuitionTestnet.id]: '0x8497Eb80fB9742265AeFE711856b2ecACABF1Cb0',
		[intuitionMainnet.id]: '0xC23cD55CF924b3FE4b97deAA0EAF222a5082A1FF',
	},
	AtomWarden: {
		[intuitionTestnet.id]: '0x1f2622D57D09B5E21738a8e0acE24ed9d4a2E32F',
		[intuitionMainnet.id]: '0x98C9BCecf318d0D1409Bf81Ea3551b629fAEC165',
	},
	EntryPoint: {
		[intuitionTestnet.id]: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
		[intuitionMainnet.id]: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
	},
};
