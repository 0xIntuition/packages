import {
	getBaseBridgeAssetAddress,
	getMetaERC20HubAddressFromChainId,
	getMetaERC20SpokeAddressFromChainId,
	getMetaNativeSpokeAddressFromChainId,
	getTrustSwapAndBridgeRouterAddressFromChainId,
	INTUITION_MAINNET_CHAIN_ID,
	intuitionPeripheryBridgeRecipientDomainsByDirection,
	type MetaBridgeAsset,
	metaBridgeRecipientToBytes32,
} from '@0xintuition/periphery';
import { getTrustAddressFromChainId } from '@0xintuition/protocol';
import type { Address } from 'viem';
import { base } from 'viem/chains';

import {
	metaERC20HubTransferRemoteEncode,
	metaERC20SpokeTransferRemoteEncode,
	metaNativeSpokeTransferRemoteEncode,
	trustApproveEncode,
	trustSwapAndBridgeRouterBridgeTrustEncode,
} from '../encoders';
import { buildPlanEnvelope, buildPlanStep, requireContext } from './helpers';

export type BridgeFeeReadContext = {
	bridgeFee?: bigint;
};

export type ApprovalBridgePlanReadContext = BridgeFeeReadContext & {
	currentAllowance?: bigint;
};

export type BaseTrustBridgePlanReadContext = ApprovalBridgePlanReadContext;

export type BuildBaseTrustBridgeToIntuitionPlanInputs = {
	owner: Address;
	recipient: Address;
	trustAmount: bigint;
	trustAddress?: Address;
	readContext?: BaseTrustBridgePlanReadContext;
};

export type BuildIntuitionTrustBridgeToBasePlanInputs = {
	owner: Address;
	recipient: Address;
	trustAmount: bigint;
	metaNativeSpokeAddress?: Address;
	readContext?: BridgeFeeReadContext;
};

export type BuildBaseERC20BridgeToIntuitionPlanInputs = {
	owner: Address;
	recipient: Address;
	asset: MetaBridgeAsset;
	amount: bigint;
	assetAddress?: Address;
	metaERC20HubAddress?: Address;
	readContext?: ApprovalBridgePlanReadContext;
};

export type BuildIntuitionERC20BridgeToBasePlanInputs = {
	owner: Address;
	recipient: Address;
	asset: MetaBridgeAsset;
	amount: bigint;
	metaERC20SpokeAddress?: Address;
	readContext?: BridgeFeeReadContext;
};

function requirePositiveAmount(value: bigint, label: string): void {
	if (value <= 0n) {
		throw new Error(`${label} must be greater than 0.`);
	}
}

function getAssetSlug(asset: MetaBridgeAsset): string {
	return asset.toLowerCase();
}

export async function buildBaseTrustBridgeToIntuitionPlan(
	inputs: BuildBaseTrustBridgeToIntuitionPlanInputs
) {
	const planName = 'buildBaseTrustBridgeToIntuitionPlan';
	const {
		owner,
		recipient,
		trustAmount,
		readContext,
		trustAddress = getTrustAddressFromChainId(base.id),
	} = inputs;

	requirePositiveAmount(trustAmount, 'trustAmount');

	const currentAllowance = requireContext(
		readContext?.currentAllowance,
		planName,
		'readContext.currentAllowance'
	);
	const bridgeFee = requireContext(readContext?.bridgeFee, planName, 'readContext.bridgeFee');
	// Throws until the redeployed router's address is published.
	const routerAddress = getTrustSwapAndBridgeRouterAddressFromChainId(base.id);
	const approvalNeeded = currentAllowance < trustAmount;
	const steps = [];

	if (approvalNeeded) {
		steps.push(
			buildPlanStep({
				id: 'trust-approve',
				intent: {
					chainId: base.id,
					contract: 'trust',
				},
				data: trustApproveEncode(routerAddress, trustAmount),
				label: 'Approve TRUST',
				description: 'Approve the bridge router to spend Base TRUST.',
			})
		);
	}

	steps.push(
		buildPlanStep({
			id: 'bridge-trust',
			intent: {
				chainId: base.id,
				contract: 'trust-swap-and-bridge-router',
			},
			data: trustSwapAndBridgeRouterBridgeTrustEncode(trustAmount, recipient),
			value: bridgeFee,
			label: 'Bridge TRUST',
			description: 'Bridge TRUST from Base to Intuition.',
			context: {
				bridgeDirection: 'baseToIntuition',
				recipientDomain: intuitionPeripheryBridgeRecipientDomainsByDirection.baseToIntuition,
			},
		})
	);

	return buildPlanEnvelope({
		action: 'base.trust.bridgeToIntuition',
		module: 'plans/base',
		method: planName,
		label: 'Base TRUST bridge',
		description: 'Bridges Base TRUST into the Intuition network.',
		tags: ['base', 'trust', 'bridge'],
		context: {
			chainId: base.id,
			owner,
			recipient,
			trustAddress,
			routerAddress,
		},
		steps,
		estimates: {
			trustAmount,
			currentAllowance,
			bridgeFee,
			approvalNeeded,
		},
	});
}

export async function buildIntuitionTrustBridgeToBasePlan(
	inputs: BuildIntuitionTrustBridgeToBasePlanInputs
) {
	const planName = 'buildIntuitionTrustBridgeToBasePlan';
	const {
		owner,
		recipient,
		trustAmount,
		readContext,
		metaNativeSpokeAddress = getMetaNativeSpokeAddressFromChainId(INTUITION_MAINNET_CHAIN_ID),
	} = inputs;

	requirePositiveAmount(trustAmount, 'trustAmount');

	const bridgeFee = requireContext(readContext?.bridgeFee, planName, 'readContext.bridgeFee');
	const recipientDomain = intuitionPeripheryBridgeRecipientDomainsByDirection.intuitionToBase;
	const recipientBytes32 = metaBridgeRecipientToBytes32(recipient);

	return buildPlanEnvelope({
		action: 'intuition.trust.bridgeToBase',
		module: 'plans/base',
		method: planName,
		label: 'Intuition TRUST bridge',
		description: 'Bridges TRUST from Intuition back to Base.',
		tags: ['intuition', 'trust', 'bridge'],
		context: {
			chainId: INTUITION_MAINNET_CHAIN_ID,
			owner,
			recipient,
			metaNativeSpokeAddress,
			recipientDomain,
		},
		steps: [
			buildPlanStep({
				id: 'bridge-trust',
				intent: {
					chainId: INTUITION_MAINNET_CHAIN_ID,
					flow: 'meta-bridge',
					contract: 'meta-native-spoke',
				},
				data: metaNativeSpokeTransferRemoteEncode(recipientDomain, recipientBytes32, trustAmount),
				value: trustAmount + bridgeFee,
				label: 'Bridge TRUST',
				description: 'Bridge TRUST from Intuition back to Base.',
				context: {
					bridgeDirection: 'intuitionToBase',
					recipientDomain,
				},
			}),
		],
		estimates: {
			trustAmount,
			bridgeFee,
			totalValue: trustAmount + bridgeFee,
		},
	});
}

export async function buildBaseERC20BridgeToIntuitionPlan(
	inputs: BuildBaseERC20BridgeToIntuitionPlanInputs
) {
	const planName = 'buildBaseERC20BridgeToIntuitionPlan';
	const {
		owner,
		recipient,
		asset,
		amount,
		readContext,
		assetAddress = getBaseBridgeAssetAddress(asset),
		metaERC20HubAddress = getMetaERC20HubAddressFromChainId(base.id, asset),
	} = inputs;

	requirePositiveAmount(amount, 'amount');

	const currentAllowance = requireContext(
		readContext?.currentAllowance,
		planName,
		'readContext.currentAllowance'
	);
	const bridgeFee = requireContext(readContext?.bridgeFee, planName, 'readContext.bridgeFee');
	const approvalNeeded = currentAllowance < amount;
	const recipientDomain = intuitionPeripheryBridgeRecipientDomainsByDirection.baseToIntuition;
	const recipientBytes32 = metaBridgeRecipientToBytes32(recipient);
	const assetSlug = getAssetSlug(asset);
	const steps: Array<ReturnType<typeof buildPlanStep>> = [];

	if (approvalNeeded) {
		steps.push(
			buildPlanStep({
				id: `${assetSlug}-approve`,
				intent: {
					chainId: base.id,
					flow: 'bridge-asset',
					contract: 'base-bridge-asset',
					asset,
				},
				data: trustApproveEncode(metaERC20HubAddress, amount),
				label: `Approve ${asset}`,
				description: `Approve the ${asset} hub bridge contract to spend Base ${asset}.`,
				context: {
					asset,
					spender: metaERC20HubAddress,
				},
			})
		);
	}

	steps.push(
		buildPlanStep({
			id: `bridge-${assetSlug}`,
			intent: {
				chainId: base.id,
				flow: 'meta-bridge',
				contract: 'meta-erc20-hub',
				asset,
			},
			data: metaERC20HubTransferRemoteEncode(recipientDomain, recipientBytes32, amount),
			value: bridgeFee,
			label: `Bridge ${asset}`,
			description: `Bridge ${asset} from Base to Intuition.`,
			context: {
				asset,
				bridgeDirection: 'baseToIntuition',
				recipientDomain,
			},
		})
	);

	return buildPlanEnvelope({
		action: `base.${assetSlug}.bridgeToIntuition`,
		module: 'plans/base',
		method: planName,
		label: `Base ${asset} bridge`,
		description: `Bridges Base ${asset} into the Intuition network.`,
		tags: ['base', assetSlug, 'bridge'],
		context: {
			chainId: base.id,
			owner,
			recipient,
			asset,
			assetAddress,
			metaERC20HubAddress,
		},
		steps,
		estimates: {
			asset,
			amount,
			currentAllowance,
			bridgeFee,
			approvalNeeded,
		},
	});
}

export async function buildIntuitionERC20BridgeToBasePlan(
	inputs: BuildIntuitionERC20BridgeToBasePlanInputs
) {
	const planName = 'buildIntuitionERC20BridgeToBasePlan';
	const {
		owner,
		recipient,
		asset,
		amount,
		readContext,
		metaERC20SpokeAddress = getMetaERC20SpokeAddressFromChainId(INTUITION_MAINNET_CHAIN_ID, asset),
	} = inputs;

	requirePositiveAmount(amount, 'amount');

	const bridgeFee = requireContext(readContext?.bridgeFee, planName, 'readContext.bridgeFee');
	const recipientDomain = intuitionPeripheryBridgeRecipientDomainsByDirection.intuitionToBase;
	const recipientBytes32 = metaBridgeRecipientToBytes32(recipient);
	const assetSlug = getAssetSlug(asset);

	return buildPlanEnvelope({
		action: `intuition.${assetSlug}.bridgeToBase`,
		module: 'plans/base',
		method: planName,
		label: `Intuition ${asset} bridge`,
		description: `Bridges ${asset} from Intuition back to Base.`,
		tags: ['intuition', assetSlug, 'bridge'],
		context: {
			chainId: INTUITION_MAINNET_CHAIN_ID,
			owner,
			recipient,
			asset,
			metaERC20SpokeAddress,
		},
		steps: [
			buildPlanStep({
				id: `bridge-${assetSlug}`,
				intent: {
					chainId: INTUITION_MAINNET_CHAIN_ID,
					flow: 'meta-bridge',
					contract: 'meta-erc20-spoke',
					asset,
				},
				data: metaERC20SpokeTransferRemoteEncode(recipientDomain, recipientBytes32, amount),
				value: bridgeFee,
				label: `Bridge ${asset}`,
				description: `Bridge ${asset} from Intuition back to Base.`,
				context: {
					asset,
					bridgeDirection: 'intuitionToBase',
					recipientDomain,
				},
			}),
		],
		estimates: {
			asset,
			amount,
			bridgeFee,
		},
	});
}
