import type { Address } from 'viem';
import { base } from 'viem/chains';

import { INTUITION_MAINNET_CHAIN_ID, INTUITION_TESTNET_CHAIN_ID } from './deployments';

export type MetaBridgeAsset = 'USDC' | 'WETH';
export type BridgeDirection = 'baseToIntuition' | 'intuitionToBase';

export const intuitionPeripheryDeployments: {
	[key: string]: {
		[chainId: number]: Address;
	};
} = {
	// No address — the router deployed on Base predates the `deadline` parameter this package's
	// ABI and bytecode carry, so calls built from them revert there. A redeploy is pending; populate
	// this once the new deployment exists.
	TrustSwapAndBridgeRouter: {},
	MetaNativeSpoke: {
		[INTUITION_MAINNET_CHAIN_ID]: '0x375135fe908dD62f3C7939FA4e65bf41Da721AB9',
	},
	// Testnet routes to the canonical 13579 MultiVault. Mainnet deploys after the v1.1.0 upgrade;
	// add its address then.
	FeeProxy: {
		[INTUITION_TESTNET_CHAIN_ID]: '0x847801465DcB17811089107c0051c49E0135F6B8',
	},
};

export const intuitionPeripheryMetaERC20HubDeployments: Record<
	MetaBridgeAsset,
	Record<number, Address>
> = {
	USDC: {
		[base.id]: '0x7e41962bE9B2640e653BfA8c8713A905659FE157',
	},
	WETH: {
		[base.id]: '0xFB4BAa05BF339AD6074047176F90757A6C87f944',
	},
};

export const intuitionPeripheryMetaERC20SpokeDeployments: Record<
	MetaBridgeAsset,
	Record<number, Address>
> = {
	USDC: {
		[INTUITION_MAINNET_CHAIN_ID]: '0x7e41962bE9B2640e653BfA8c8713A905659FE157',
	},
	WETH: {
		[INTUITION_MAINNET_CHAIN_ID]: '0xFB4BAa05BF339AD6074047176F90757A6C87f944',
	},
};

export const intuitionPeripheryBaseBridgeAssetDeployments: Record<MetaBridgeAsset, Address> = {
	USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
	WETH: '0x4200000000000000000000000000000000000006',
};

export const intuitionPeripheryBridgeRecipientDomainsByDirection: Record<BridgeDirection, number> =
	{
		baseToIntuition: INTUITION_MAINNET_CHAIN_ID,
		intuitionToBase: base.id,
	};
