import type { ContractFunctionArgs } from 'viem';

import { SatelliteEmissionsControllerAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

export async function satelliteEmissionsControllerGetTrustBonding(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getTrustBonding',
	});
}

export async function satelliteEmissionsControllerGetBaseEmissionsController(config: ReadConfig) {
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
) {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getReclaimedEmissions',
		args,
	});
}

export async function satelliteEmissionsControllerGetStartTimestamp(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getStartTimestamp',
	});
}

export async function satelliteEmissionsControllerGetEpochLength(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getEpochLength',
	});
}

export async function satelliteEmissionsControllerGetCurrentEpoch(config: ReadConfig) {
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
) {
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
) {
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
) {
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
) {
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
) {
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
) {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getEmissionsAtTimestamp',
		args,
	});
}

export async function satelliteEmissionsControllerGetCurrentEpochEmissions(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getCurrentEpochEmissions',
	});
}

export async function satelliteEmissionsControllerGetFinalityState(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getFinalityState',
	});
}

export async function satelliteEmissionsControllerGetMessageGasCost(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getMessageGasCost',
	});
}

export async function satelliteEmissionsControllerGetMetaERC20SpokeOrHub(config: ReadConfig) {
	const { address, publicClient } = config;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'getMetaERC20SpokeOrHub',
	});
}

export async function satelliteEmissionsControllerGetRecipientDomain(config: ReadConfig) {
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
		args: ContractFunctionArgs<typeof SatelliteEmissionsControllerAbi, 'view', 'quoteGasPayment'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;
	return await publicClient.readContract({
		address,
		abi: SatelliteEmissionsControllerAbi,
		functionName: 'quoteGasPayment',
		args,
	});
}
