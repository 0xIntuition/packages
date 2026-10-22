import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { SatelliteEmissionsControllerAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

export async function satelliteEmissionsControllerGetTrustBonding(
	config: ReadConfig
): Promise<SatelliteEmissionsControllerGetTrustBondingResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getTrustBonding',
	});
}

export async function satelliteEmissionsControllerGetBaseEmissionsController(
	config: ReadConfig
): Promise<SatelliteEmissionsControllerGetBaseEmissionsControllerResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getBaseEmissionsController',
	});
}

export async function satelliteEmissionsControllerGetReclaimedEmissions(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof SatelliteEmissionsControllerAbi,
			'view',
			'getReclaimedEmissions'
		>;
	}
): Promise<SatelliteEmissionsControllerGetReclaimedEmissionsResult> {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getReclaimedEmissions',
		args,
	});
}

export async function satelliteEmissionsControllerGetStartTimestamp(
	config: ReadConfig
): Promise<SatelliteEmissionsControllerGetStartTimestampResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getStartTimestamp',
	});
}

export async function satelliteEmissionsControllerGetEpochLength(
	config: ReadConfig
): Promise<SatelliteEmissionsControllerGetEpochLengthResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getEpochLength',
	});
}

export async function satelliteEmissionsControllerGetCurrentEpoch(
	config: ReadConfig
): Promise<SatelliteEmissionsControllerGetCurrentEpochResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getCurrentEpoch',
	});
}

export async function satelliteEmissionsControllerGetEpochAtTimestamp(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof SatelliteEmissionsControllerAbi,
			'view',
			'getEpochAtTimestamp'
		>;
	}
): Promise<SatelliteEmissionsControllerGetEpochAtTimestampResult> {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getEpochAtTimestamp',
		args,
	});
}

export async function satelliteEmissionsControllerGetEpochTimestampStart(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof SatelliteEmissionsControllerAbi,
			'view',
			'getEpochTimestampStart'
		>;
	}
): Promise<SatelliteEmissionsControllerGetEpochTimestampStartResult> {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getEpochTimestampStart',
		args,
	});
}

export async function satelliteEmissionsControllerGetEpochTimestampEnd(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof SatelliteEmissionsControllerAbi,
			'view',
			'getEpochTimestampEnd'
		>;
	}
): Promise<SatelliteEmissionsControllerGetEpochTimestampEndResult> {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getEpochTimestampEnd',
		args,
	});
}

export async function satelliteEmissionsControllerGetCurrentEpochTimestampStart(
	config: ReadConfig
): Promise<SatelliteEmissionsControllerGetCurrentEpochTimestampStartResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getCurrentEpochTimestampStart',
	});
}

export async function satelliteEmissionsControllerGetEmissionsAtEpoch(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof SatelliteEmissionsControllerAbi,
			'view',
			'getEmissionsAtEpoch'
		>;
	}
): Promise<SatelliteEmissionsControllerGetEmissionsAtEpochResult> {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getEmissionsAtEpoch',
		args,
	});
}

export async function satelliteEmissionsControllerGetEmissionsAtTimestamp(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof SatelliteEmissionsControllerAbi,
			'view',
			'getEmissionsAtTimestamp'
		>;
	}
): Promise<SatelliteEmissionsControllerGetEmissionsAtTimestampResult> {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getEmissionsAtTimestamp',
		args,
	});
}

export async function satelliteEmissionsControllerGetCurrentEpochEmissions(
	config: ReadConfig
): Promise<SatelliteEmissionsControllerGetCurrentEpochEmissionsResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getCurrentEpochEmissions',
	});
}

export async function satelliteEmissionsControllerGetFinalityState(
	config: ReadConfig
): Promise<SatelliteEmissionsControllerGetFinalityStateResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getFinalityState',
	});
}

export async function satelliteEmissionsControllerGetMessageGasCost(
	config: ReadConfig
): Promise<SatelliteEmissionsControllerGetMessageGasCostResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getMessageGasCost',
	});
}

export async function satelliteEmissionsControllerGetMetaERC20SpokeOrHub(
	config: ReadConfig
): Promise<SatelliteEmissionsControllerGetMetaERC20SpokeOrHubResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getMetaERC20SpokeOrHub',
	});
}

export async function satelliteEmissionsControllerGetRecipientDomain(
	config: ReadConfig
): Promise<SatelliteEmissionsControllerGetRecipientDomainResult> {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getRecipientDomain',
	});
}

export async function satelliteEmissionsControllerQuoteGasPayment(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<
			typeof SatelliteEmissionsControllerAbi,
			'view' | 'pure',
			'quoteGasPayment'
		>;
	}
): Promise<SatelliteEmissionsControllerQuoteGasPaymentResult> {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'quoteGasPayment',
		args,
	});
}

export type SatelliteEmissionsControllerGetTrustBondingResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getTrustBonding'
>;
export type SatelliteEmissionsControllerGetBaseEmissionsControllerResult =
	ContractFunctionReturnType<
		typeof SatelliteEmissionsControllerAbi,
		'view',
		'getBaseEmissionsController'
	>;
export type SatelliteEmissionsControllerGetReclaimedEmissionsResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getReclaimedEmissions'
>;
export type SatelliteEmissionsControllerGetStartTimestampResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getStartTimestamp'
>;
export type SatelliteEmissionsControllerGetEpochLengthResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getEpochLength'
>;
export type SatelliteEmissionsControllerGetCurrentEpochResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getCurrentEpoch'
>;
export type SatelliteEmissionsControllerGetEpochAtTimestampResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getEpochAtTimestamp'
>;
export type SatelliteEmissionsControllerGetEpochTimestampStartResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getEpochTimestampStart'
>;
export type SatelliteEmissionsControllerGetEpochTimestampEndResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getEpochTimestampEnd'
>;
export type SatelliteEmissionsControllerGetCurrentEpochTimestampStartResult =
	ContractFunctionReturnType<
		typeof SatelliteEmissionsControllerAbi,
		'view',
		'getCurrentEpochTimestampStart'
	>;
export type SatelliteEmissionsControllerGetEmissionsAtEpochResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getEmissionsAtEpoch'
>;
export type SatelliteEmissionsControllerGetEmissionsAtTimestampResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getEmissionsAtTimestamp'
>;
export type SatelliteEmissionsControllerGetCurrentEpochEmissionsResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getCurrentEpochEmissions'
>;
export type SatelliteEmissionsControllerGetFinalityStateResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getFinalityState'
>;
export type SatelliteEmissionsControllerGetMessageGasCostResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getMessageGasCost'
>;
export type SatelliteEmissionsControllerGetMetaERC20SpokeOrHubResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getMetaERC20SpokeOrHub'
>;
export type SatelliteEmissionsControllerGetRecipientDomainResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'getRecipientDomain'
>;
export type SatelliteEmissionsControllerQuoteGasPaymentResult = ContractFunctionReturnType<
	typeof SatelliteEmissionsControllerAbi,
	'view' | 'pure',
	'quoteGasPayment'
>;
