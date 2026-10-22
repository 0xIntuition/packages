import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { BaseEmissionsControllerAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

export async function baseEmissionsControllerGetBalance(
	config: ReadConfig
): Promise<BaseEmissionsControllerGetBalanceResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getBalance',
	});
}

export async function baseEmissionsControllerGetTrustToken(
	config: ReadConfig
): Promise<BaseEmissionsControllerGetTrustTokenResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getTrustToken',
	});
}

export async function baseEmissionsControllerGetSatelliteEmissionsController(
	config: ReadConfig
): Promise<BaseEmissionsControllerGetSatelliteEmissionsControllerResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getSatelliteEmissionsController',
	});
}

export async function baseEmissionsControllerGetTotalMinted(
	config: ReadConfig
): Promise<BaseEmissionsControllerGetTotalMintedResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getTotalMinted',
	});
}

export async function baseEmissionsControllerGetEpochMintedAmount(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof BaseEmissionsControllerAbi,
			'view' | 'pure',
			'getEpochMintedAmount'
		>;
	}
): Promise<BaseEmissionsControllerGetEpochMintedAmountResult> {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getEpochMintedAmount',
		args,
	});
}

export async function baseEmissionsControllerGetStartTimestamp(
	config: ReadConfig
): Promise<BaseEmissionsControllerGetStartTimestampResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getStartTimestamp',
	});
}

export async function baseEmissionsControllerGetEpochLength(
	config: ReadConfig
): Promise<BaseEmissionsControllerGetEpochLengthResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getEpochLength',
	});
}

export async function baseEmissionsControllerGetCurrentEpoch(
	config: ReadConfig
): Promise<BaseEmissionsControllerGetCurrentEpochResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getCurrentEpoch',
	});
}

export async function baseEmissionsControllerGetEpochAtTimestamp(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof BaseEmissionsControllerAbi,
			'view' | 'pure',
			'getEpochAtTimestamp'
		>;
	}
): Promise<BaseEmissionsControllerGetEpochAtTimestampResult> {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getEpochAtTimestamp',
		args,
	});
}

export async function baseEmissionsControllerGetEpochTimestampStart(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof BaseEmissionsControllerAbi,
			'view' | 'pure',
			'getEpochTimestampStart'
		>;
	}
): Promise<BaseEmissionsControllerGetEpochTimestampStartResult> {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getEpochTimestampStart',
		args,
	});
}

export async function baseEmissionsControllerGetEpochTimestampEnd(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof BaseEmissionsControllerAbi,
			'view' | 'pure',
			'getEpochTimestampEnd'
		>;
	}
): Promise<BaseEmissionsControllerGetEpochTimestampEndResult> {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getEpochTimestampEnd',
		args,
	});
}

export async function baseEmissionsControllerGetCurrentEpochTimestampStart(
	config: ReadConfig
): Promise<BaseEmissionsControllerGetCurrentEpochTimestampStartResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getCurrentEpochTimestampStart',
	});
}

export async function baseEmissionsControllerGetEmissionsAtEpoch(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof BaseEmissionsControllerAbi,
			'view' | 'pure',
			'getEmissionsAtEpoch'
		>;
	}
): Promise<BaseEmissionsControllerGetEmissionsAtEpochResult> {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getEmissionsAtEpoch',
		args,
	});
}

export async function baseEmissionsControllerGetEmissionsAtTimestamp(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof BaseEmissionsControllerAbi,
			'view',
			'getEmissionsAtTimestamp'
		>;
	}
): Promise<BaseEmissionsControllerGetEmissionsAtTimestampResult> {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getEmissionsAtTimestamp',
		args,
	});
}

export async function baseEmissionsControllerGetCurrentEpochEmissions(
	config: ReadConfig
): Promise<BaseEmissionsControllerGetCurrentEpochEmissionsResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getCurrentEpochEmissions',
	});
}

export async function baseEmissionsControllerGetFinalityState(
	config: ReadConfig
): Promise<BaseEmissionsControllerGetFinalityStateResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getFinalityState',
	});
}

export async function baseEmissionsControllerGetMessageGasCost(
	config: ReadConfig
): Promise<BaseEmissionsControllerGetMessageGasCostResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getMessageGasCost',
	});
}

export async function baseEmissionsControllerGetMetaERC20SpokeOrHub(
	config: ReadConfig
): Promise<BaseEmissionsControllerGetMetaERC20SpokeOrHubResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getMetaERC20SpokeOrHub',
	});
}

export async function baseEmissionsControllerGetRecipientDomain(
	config: ReadConfig
): Promise<BaseEmissionsControllerGetRecipientDomainResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getRecipientDomain',
	});
}

export async function baseEmissionsControllerQuoteGasPayment(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof BaseEmissionsControllerAbi,
			'view' | 'pure',
			'quoteGasPayment'
		>;
	}
): Promise<BaseEmissionsControllerQuoteGasPaymentResult> {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'quoteGasPayment',
		args,
	});
}

export type BaseEmissionsControllerGetBalanceResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getBalance'
>;
export type BaseEmissionsControllerGetTrustTokenResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getTrustToken'
>;
export type BaseEmissionsControllerGetSatelliteEmissionsControllerResult =
	ContractFunctionReturnType<
		typeof BaseEmissionsControllerAbi,
		'view',
		'getSatelliteEmissionsController'
	>;
export type BaseEmissionsControllerGetTotalMintedResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getTotalMinted'
>;
export type BaseEmissionsControllerGetEpochMintedAmountResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getEpochMintedAmount'
>;
export type BaseEmissionsControllerGetStartTimestampResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getStartTimestamp'
>;
export type BaseEmissionsControllerGetEpochLengthResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getEpochLength'
>;
export type BaseEmissionsControllerGetCurrentEpochResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getCurrentEpoch'
>;
export type BaseEmissionsControllerGetEpochAtTimestampResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getEpochAtTimestamp'
>;
export type BaseEmissionsControllerGetEpochTimestampStartResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getEpochTimestampStart'
>;
export type BaseEmissionsControllerGetEpochTimestampEndResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getEpochTimestampEnd'
>;
export type BaseEmissionsControllerGetCurrentEpochTimestampStartResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getCurrentEpochTimestampStart'
>;
export type BaseEmissionsControllerGetEmissionsAtEpochResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getEmissionsAtEpoch'
>;
export type BaseEmissionsControllerGetEmissionsAtTimestampResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getEmissionsAtTimestamp'
>;
export type BaseEmissionsControllerGetCurrentEpochEmissionsResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getCurrentEpochEmissions'
>;
export type BaseEmissionsControllerGetFinalityStateResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getFinalityState'
>;
export type BaseEmissionsControllerGetMessageGasCostResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getMessageGasCost'
>;
export type BaseEmissionsControllerGetMetaERC20SpokeOrHubResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getMetaERC20SpokeOrHub'
>;
export type BaseEmissionsControllerGetRecipientDomainResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'getRecipientDomain'
>;
export type BaseEmissionsControllerQuoteGasPaymentResult = ContractFunctionReturnType<
	typeof BaseEmissionsControllerAbi,
	'view' | 'pure',
	'quoteGasPayment'
>;
