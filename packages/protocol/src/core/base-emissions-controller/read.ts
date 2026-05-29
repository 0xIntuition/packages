import type { ContractFunctionArgs } from 'viem';

import { BaseEmissionsControllerAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

export async function baseEmissionsControllerGetBalance(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getBalance',
	});
}

export async function baseEmissionsControllerGetTrustToken(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getTrustToken',
	});
}

export async function baseEmissionsControllerGetSatelliteEmissionsController(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getSatelliteEmissionsController',
	});
}

export async function baseEmissionsControllerGetTotalMinted(config: ReadConfig) {
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
		args: ContractFunctionArgs<typeof BaseEmissionsControllerAbi, 'view', 'getEpochMintedAmount'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getEpochMintedAmount',
		args,
	});
}

export async function baseEmissionsControllerGetStartTimestamp(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getStartTimestamp',
	});
}

export async function baseEmissionsControllerGetEpochLength(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getEpochLength',
	});
}

export async function baseEmissionsControllerGetCurrentEpoch(config: ReadConfig) {
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
		args: ContractFunctionArgs<typeof BaseEmissionsControllerAbi, 'view', 'getEpochAtTimestamp'>;
	}
) {
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
		args: ContractFunctionArgs<typeof BaseEmissionsControllerAbi, 'view', 'getEpochTimestampStart'>;
	}
) {
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
		args: ContractFunctionArgs<typeof BaseEmissionsControllerAbi, 'view', 'getEpochTimestampEnd'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getEpochTimestampEnd',
		args,
	});
}

export async function baseEmissionsControllerGetCurrentEpochTimestampStart(config: ReadConfig) {
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
		args: ContractFunctionArgs<typeof BaseEmissionsControllerAbi, 'view', 'getEmissionsAtEpoch'>;
	}
) {
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
) {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getEmissionsAtTimestamp',
		args,
	});
}

export async function baseEmissionsControllerGetCurrentEpochEmissions(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getCurrentEpochEmissions',
	});
}

export async function baseEmissionsControllerGetFinalityState(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getFinalityState',
	});
}

export async function baseEmissionsControllerGetMessageGasCost(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getMessageGasCost',
	});
}

export async function baseEmissionsControllerGetMetaERC20SpokeOrHub(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'getMetaERC20SpokeOrHub',
	});
}

export async function baseEmissionsControllerGetRecipientDomain(config: ReadConfig) {
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
		args: ContractFunctionArgs<typeof BaseEmissionsControllerAbi, 'view', 'quoteGasPayment'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: BaseEmissionsControllerAbi,
		functionName: 'quoteGasPayment',
		args,
	});
}
