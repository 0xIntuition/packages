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
		[base.id]: '0xE485D9a5Dc39774b7A80864B625969Cf9d93E5D7',
	},
	MetaNativeSpoke: {
		[INTUITION_MAINNET_CHAIN_ID]: '0x375135fe908dD62f3C7939FA4e65bf41Da721AB9',
	},
	// No addresses yet — FeeProxyDeploy.s.sol reads its deployment address from env vars
	// at deploy time and nothing has been deployed. Populate once a real deployment exists.
	FeeProxy: {},
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
