import type { Address } from 'viem';
import { describe, expect, it } from 'vitest';
import {
	BASE_CHAIN_ID,
	BASE_SEPOLIA_CHAIN_ID,
	getContractAddressFromChainId,
	getMultiVaultAddressFromChainId,
	getTrustAddressFromChainId,
	INTUITION_MAINNET_CHAIN_ID,
	INTUITION_TESTNET_CHAIN_ID,
	type IntuitionDeploymentName,
	intuitionDeployments,
} from './index.js';

// Literal fixture from .port-source/v2-protocol/deployments.ts, source 52056c5ce.
const REFERENCE_DEPLOYMENTS = {
	Trust: {
		8453: '0x6cd905dF2Ed214b22e0d48FF17CD4200C1C6d8A3',
		84532: '0xA54b4E6e356b963Ee00d1C947f478d9194a1a210',
	},
	BaseEmissionsController: {
		8453: '0x7745bDEe668501E5eeF7e9605C746f9cDfb60667',
		84532: '0xEA4bB93907b35C09244f069c35A7E60EbeCA0f72',
	},
	WrappedTrust: {
		13579: '0xDE80b6EE63f7D809427CA350e30093F436A0fe35',
		1155: '0x81cFb09cb44f7184Ad934C09F82000701A4bF672',
	},
	MultiVault: {
		13579: '0xF76d6976DeBFbB012ebc53e925BC4AEFCaA7C6c6',
		1155: '0x6E35cF57A41fA15eA0EaE9C33e751b01A784Fe7e',
	},
	TrustBonding: {
		13579: '0xfa1bF01055239C674845aAEe5A5416f98f801BE3',
		1155: '0x635bBD1367B66E7B16a21D6E5A63C812fFC00617',
	},
	SatelliteEmissionsController: {
		13579: '0x67bacf20FF9EE3092F71E5a48270f20F1DAb8309',
		1155: '0x73B8819f9b157BE42172E3866fB0Ba0d5fA0A5c6',
	},
	BondingCurveRegistry: {
		13579: '0xbFE8068d5C5117c57d37464e33c937bC08317F88',
		1155: '0xd0E488Fb32130232527eedEB72f8cE2BFC0F9930',
	},
	LinearCurve: {
		13579: '0x9f272DAEfa66e031081430Ec138FD34190d6f671',
		1155: '0xc3eFD5471dc63d74639725f381f9686e3F264366',
	},
	OffsetProgressiveCurve: {
		13579: '0xd50CB061b1CE0560108fc3D58685d4eDb7594f20',
		1155: '0x23afF95153aa88D28B9B97Ba97629E05D5fD335d',
	},
	AtomWalletFactory: {
		13579: '0xdbaDd9a5f5B75A32ae403B7D44F5510Ac16939CA',
		1155: '0x33827373a7D1c7C78a01094071C2f6CE74253B9B',
	},
	AtomWalletBeacon: {
		13579: '0x8497Eb80fB9742265AeFE711856b2ecACABF1Cb0',
		1155: '0xC23cD55CF924b3FE4b97deAA0EAF222a5082A1FF',
	},
	AtomWarden: {
		13579: '0x1f2622D57D09B5E21738a8e0acE24ed9d4a2E32F',
		1155: '0x98C9BCecf318d0D1409Bf81Ea3551b629fAEC165',
	},
	EntryPoint: {
		13579: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
		1155: '0x4337084D9E255Ff0702461CF8895CE9E3b5Ff108',
	},
} as const satisfies Record<IntuitionDeploymentName, Record<number, Address>>;

const CHAIN_IDS = [
	BASE_CHAIN_ID,
	BASE_SEPOLIA_CHAIN_ID,
	INTUITION_MAINNET_CHAIN_ID,
	INTUITION_TESTNET_CHAIN_ID,
];

describe('reference deployment parity', () => {
	it('matches every reference name and address, with no extra entries', () => {
		expect(intuitionDeployments).toEqual(REFERENCE_DEPLOYMENTS);
	});
	for (const name of Object.keys(REFERENCE_DEPLOYMENTS) as IntuitionDeploymentName[]) {
		for (const chainId of CHAIN_IDS) {
			it(`${name} on ${chainId} preserves both generic call orders`, () => {
				const expected = (REFERENCE_DEPLOYMENTS[name] as Record<number, Address>)[chainId];
				if (expected) {
					expect(getContractAddressFromChainId(name, chainId)).toBe(expected);
					expect(getContractAddressFromChainId(chainId, name)).toBe(expected);
				} else {
					const message = `Contract ${name} not found for chain ID ${chainId}`;
					expect(() => getContractAddressFromChainId(name, chainId)).toThrow(message);
					expect(() => getContractAddressFromChainId(chainId, name)).toThrow(message);
				}
			});
		}
	}
	it('preserves the one-argument shortcuts on every supported chain', () => {
		for (const chainId of CHAIN_IDS) {
			for (const [name, helper] of [
				['Trust', getTrustAddressFromChainId],
				['MultiVault', getMultiVaultAddressFromChainId],
			] as const) {
				const expected = (REFERENCE_DEPLOYMENTS[name] as Record<number, Address>)[chainId];
				if (expected) expect(helper(chainId)).toBe(expected);
				else
					expect(() => helper(chainId)).toThrow(
						`Contract ${name} not found for chain ID ${chainId}`
					);
			}
		}
	});
});
