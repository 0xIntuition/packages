import { base } from 'viem/chains';
import { describe, expect, it } from 'vitest';

import {
	INTUITION_MAINNET_CHAIN_ID,
	intuitionPeripheryBaseBridgeAssetDeployments,
	intuitionPeripheryBridgeRecipientDomainsByDirection,
	intuitionPeripheryDeployments,
	intuitionPeripheryMetaERC20HubDeployments,
	intuitionPeripheryMetaERC20SpokeDeployments,
} from './deployments';

describe('intuitionPeripheryDeployments', () => {
	it('includes TrustSwapAndBridgeRouter on Base', () => {
		expect(intuitionPeripheryDeployments.TrustSwapAndBridgeRouter?.[base.id]).toBe(
			'0xA1EC6f95A88Bfc7A8Fd35f1296b64ebaf91C93fb'
		);
	});

	it('includes direct bridge deployments for MetaHub/MetaSpoke/MetaNativeSpoke', () => {
		expect(intuitionPeripheryBaseBridgeAssetDeployments.USDC).toBe(
			'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
		);
		expect(intuitionPeripheryBaseBridgeAssetDeployments.WETH).toBe(
			'0x4200000000000000000000000000000000000006'
		);
		expect(intuitionPeripheryMetaERC20HubDeployments.USDC[base.id]).toBe(
			'0x7e41962bE9B2640e653BfA8c8713A905659FE157'
		);
		expect(intuitionPeripheryMetaERC20HubDeployments.WETH[base.id]).toBe(
			'0xFB4BAa05BF339AD6074047176F90757A6C87f944'
		);
		expect(intuitionPeripheryMetaERC20SpokeDeployments.USDC[INTUITION_MAINNET_CHAIN_ID]).toBe(
			'0x7e41962bE9B2640e653BfA8c8713A905659FE157'
		);
		expect(intuitionPeripheryMetaERC20SpokeDeployments.WETH[INTUITION_MAINNET_CHAIN_ID]).toBe(
			'0xFB4BAa05BF339AD6074047176F90757A6C87f944'
		);
		expect(intuitionPeripheryDeployments.MetaNativeSpoke?.[INTUITION_MAINNET_CHAIN_ID]).toBe(
			'0x375135fe908dD62f3C7939FA4e65bf41Da721AB9'
		);
	});

	it('does not claim ownership of WrappedTrust deployments', () => {
		expect(intuitionPeripheryDeployments.WrappedTrust).toBeUndefined();
	});

	it('maps recipient domains by direction', () => {
		expect(intuitionPeripheryBridgeRecipientDomainsByDirection.baseToIntuition).toBe(
			INTUITION_MAINNET_CHAIN_ID
		);
		expect(intuitionPeripheryBridgeRecipientDomainsByDirection.intuitionToBase).toBe(base.id);
	});
});
