import { INTUITION_MAINNET_CHAIN_ID } from '@0xintuition/deployments';
import type { Address } from 'viem';
import { base } from 'viem/chains';

export { INTUITION_MAINNET_CHAIN_ID } from '@0xintuition/deployments';

export type MetaBridgeAsset = 'USDC' | 'WETH';
export type BridgeDirection = 'baseToIntuition' | 'intuitionToBase';

export const intuitionPeripheryDeployments: {
	[key: string]: {
		[chainId: number]: Address;
	};
} = {
	TrustSwapAndBridgeRouter: {
		[base.id]: '0xA1EC6f95A88Bfc7A8Fd35f1296b64ebaf91C93fb',
	},
	MetaNativeSpoke: {
		[INTUITION_MAINNET_CHAIN_ID]: '0x375135fe908dD62f3C7939FA4e65bf41Da721AB9',
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
