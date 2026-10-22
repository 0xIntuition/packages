import {
	MetaERC20HubAbi,
	MetaERC20SpokeAbi,
	MetaNativeSpokeAbi,
	TrustAbi,
	TrustBondingAbi,
	TrustSwapAndBridgeRouterAbi,
} from '@0xintuition/deployments';
import { type ContractFunctionArgs, encodeFunctionData, type Hex } from 'viem';

export function metaERC20HubTransferRemoteEncode(
	...args: ContractFunctionArgs<typeof MetaERC20HubAbi, 'payable', 'transferRemote'>
): Hex {
	return encodeFunctionData({
		abi: MetaERC20HubAbi,
		functionName: 'transferRemote',
		args,
	});
}

export function metaERC20SpokeTransferRemoteEncode(
	...args: ContractFunctionArgs<typeof MetaERC20SpokeAbi, 'payable', 'transferRemote'>
): Hex {
	return encodeFunctionData({
		abi: MetaERC20SpokeAbi,
		functionName: 'transferRemote',
		args,
	});
}

export function metaNativeSpokeTransferRemoteEncode(
	...args: ContractFunctionArgs<typeof MetaNativeSpokeAbi, 'payable', 'transferRemote'>
): Hex {
	return encodeFunctionData({
		abi: MetaNativeSpokeAbi,
		functionName: 'transferRemote',
		args,
	});
}

export function trustApproveEncode(
	...args: ContractFunctionArgs<typeof TrustAbi, 'nonpayable', 'approve'>
): Hex {
	return encodeFunctionData({
		abi: TrustAbi,
		functionName: 'approve',
		args,
	});
}

export function trustBondingClaimRewardsEncode(
	...args: ContractFunctionArgs<typeof TrustBondingAbi, 'nonpayable', 'claimRewards'>
): Hex {
	return encodeFunctionData({
		abi: TrustBondingAbi,
		functionName: 'claimRewards',
		args,
	});
}

export function trustSwapAndBridgeRouterBridgeTrustEncode(
	...args: ContractFunctionArgs<typeof TrustSwapAndBridgeRouterAbi, 'payable', 'bridgeTrust'>
): Hex {
	return encodeFunctionData({
		abi: TrustSwapAndBridgeRouterAbi,
		functionName: 'bridgeTrust',
		args,
	});
}
