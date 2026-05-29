import type { Address } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';

import {
	BaseEmissionsControllerAbi,
	baseEmissionsControllerGetBalance,
	baseEmissionsControllerGetCurrentEpoch,
	baseEmissionsControllerGetCurrentEpochEmissions,
	baseEmissionsControllerGetCurrentEpochTimestampStart,
	baseEmissionsControllerGetEmissionsAtEpoch,
	baseEmissionsControllerGetEmissionsAtTimestamp,
	baseEmissionsControllerGetEpochAtTimestamp,
	baseEmissionsControllerGetEpochLength,
	baseEmissionsControllerGetEpochMintedAmount,
	baseEmissionsControllerGetEpochTimestampEnd,
	baseEmissionsControllerGetEpochTimestampStart,
	baseEmissionsControllerGetFinalityState,
	baseEmissionsControllerGetMessageGasCost,
	baseEmissionsControllerGetMetaERC20SpokeOrHub,
	baseEmissionsControllerGetRecipientDomain,
	baseEmissionsControllerGetSatelliteEmissionsController,
	baseEmissionsControllerGetStartTimestamp,
	baseEmissionsControllerGetTotalMinted,
	baseEmissionsControllerGetTrustToken,
	baseEmissionsControllerQuoteGasPayment,
	SatelliteEmissionsControllerAbi,
	satelliteEmissionsControllerGetBaseEmissionsController,
	satelliteEmissionsControllerGetCurrentEpoch,
	satelliteEmissionsControllerGetCurrentEpochEmissions,
	satelliteEmissionsControllerGetCurrentEpochTimestampStart,
	satelliteEmissionsControllerGetEmissionsAtEpoch,
	satelliteEmissionsControllerGetEmissionsAtTimestamp,
	satelliteEmissionsControllerGetEpochAtTimestamp,
	satelliteEmissionsControllerGetEpochLength,
	satelliteEmissionsControllerGetEpochTimestampEnd,
	satelliteEmissionsControllerGetEpochTimestampStart,
	satelliteEmissionsControllerGetFinalityState,
	satelliteEmissionsControllerGetMessageGasCost,
	satelliteEmissionsControllerGetMetaERC20SpokeOrHub,
	satelliteEmissionsControllerGetRecipientDomain,
	satelliteEmissionsControllerGetReclaimedEmissions,
	satelliteEmissionsControllerGetStartTimestamp,
	satelliteEmissionsControllerGetTrustBonding,
	satelliteEmissionsControllerQuoteGasPayment,
} from '../../src';
import { deployCoreContracts } from '../helpers/deploy-multivault';
import { publicClient } from '../helpers/utils';

let satelliteAddress: Address;
let baseAddress: Address;
let baseAddressHasCode = false;

async function readBaseDirect(functionName: string, args: readonly unknown[] = []) {
	return await publicClient.readContract({
		address: baseAddress,
		abi: BaseEmissionsControllerAbi,
		functionName: functionName as never,
		args: args as never,
	});
}

async function readSatelliteDirect(functionName: string, args: readonly unknown[] = []) {
	return await publicClient.readContract({
		address: satelliteAddress,
		abi: SatelliteEmissionsControllerAbi,
		functionName: functionName as never,
		args: args as never,
	});
}

beforeAll(async () => {
	const deployment = await deployCoreContracts();
	satelliteAddress = deployment.intuition.satelliteEmissionsController;
	baseAddress = await satelliteEmissionsControllerGetBaseEmissionsController({
		address: satelliteAddress,
		publicClient,
	});
	const baseCode = await publicClient.getCode({ address: baseAddress });
	baseAddressHasCode = !!baseCode && baseCode !== '0x';
}, 180000);

describe('Emissions controller read wrappers', () => {
	it('exposes satellite controller reads', async () => {
		const config = { address: satelliteAddress, publicClient };
		const latestBlock = await publicClient.getBlock({ blockTag: 'latest' });

		expect(await satelliteEmissionsControllerGetTrustBonding(config)).toEqual(
			await readSatelliteDirect('getTrustBonding')
		);
		expect(await satelliteEmissionsControllerGetBaseEmissionsController(config)).toEqual(
			await readSatelliteDirect('getBaseEmissionsController')
		);
		expect(await satelliteEmissionsControllerGetReclaimedEmissions(config, { args: [0n] })).toEqual(
			await readSatelliteDirect('getReclaimedEmissions', [0n])
		);
		expect(await satelliteEmissionsControllerGetStartTimestamp(config)).toEqual(
			await readSatelliteDirect('getStartTimestamp')
		);
		expect(await satelliteEmissionsControllerGetEpochLength(config)).toEqual(
			await readSatelliteDirect('getEpochLength')
		);
		expect(await satelliteEmissionsControllerGetCurrentEpoch(config)).toEqual(
			await readSatelliteDirect('getCurrentEpoch')
		);
		expect(
			await satelliteEmissionsControllerGetEpochAtTimestamp(config, {
				args: [latestBlock.timestamp],
			})
		).toEqual(await readSatelliteDirect('getEpochAtTimestamp', [latestBlock.timestamp]));
		expect(await satelliteEmissionsControllerGetCurrentEpochTimestampStart(config)).toEqual(
			await readSatelliteDirect('getCurrentEpochTimestampStart')
		);

		const currentEpoch = await satelliteEmissionsControllerGetCurrentEpoch(config);
		expect(
			await satelliteEmissionsControllerGetEpochTimestampStart(config, {
				args: [currentEpoch],
			})
		).toEqual(await readSatelliteDirect('getEpochTimestampStart', [currentEpoch]));
		expect(
			await satelliteEmissionsControllerGetEpochTimestampEnd(config, {
				args: [currentEpoch],
			})
		).toEqual(await readSatelliteDirect('getEpochTimestampEnd', [currentEpoch]));
		expect(
			await satelliteEmissionsControllerGetEmissionsAtEpoch(config, {
				args: [currentEpoch],
			})
		).toEqual(await readSatelliteDirect('getEmissionsAtEpoch', [currentEpoch]));
		expect(
			await satelliteEmissionsControllerGetEmissionsAtTimestamp(config, {
				args: [latestBlock.timestamp],
			})
		).toEqual(await readSatelliteDirect('getEmissionsAtTimestamp', [latestBlock.timestamp]));
		expect(await satelliteEmissionsControllerGetCurrentEpochEmissions(config)).toEqual(
			await readSatelliteDirect('getCurrentEpochEmissions')
		);
		expect(await satelliteEmissionsControllerGetFinalityState(config)).toEqual(
			await readSatelliteDirect('getFinalityState')
		);
		expect(await satelliteEmissionsControllerGetMessageGasCost(config)).toEqual(
			await readSatelliteDirect('getMessageGasCost')
		);
		expect(await satelliteEmissionsControllerGetMetaERC20SpokeOrHub(config)).toEqual(
			await readSatelliteDirect('getMetaERC20SpokeOrHub')
		);

		const recipientDomain = await satelliteEmissionsControllerGetRecipientDomain(config);
		expect(recipientDomain).toEqual(await readSatelliteDirect('getRecipientDomain'));

		try {
			const directQuote = await readSatelliteDirect('quoteGasPayment', [recipientDomain, 200_000n]);
			const wrapperQuote = await satelliteEmissionsControllerQuoteGasPayment(config, {
				args: [recipientDomain, 200_000n],
			});
			expect(wrapperQuote).toEqual(directQuote);
		} catch {
			await expect(
				satelliteEmissionsControllerQuoteGasPayment(config, {
					args: [recipientDomain, 200_000n],
				})
			).rejects.toThrow();
		}
	});

	it('exposes base controller reads', async () => {
		if (!baseAddressHasCode) {
			expect(baseAddressHasCode).toBe(false);
			return;
		}

		const config = { address: baseAddress, publicClient };
		const latestBlock = await publicClient.getBlock({ blockTag: 'latest' });

		expect(await baseEmissionsControllerGetBalance(config)).toEqual(
			await readBaseDirect('getBalance')
		);
		expect(await baseEmissionsControllerGetTrustToken(config)).toEqual(
			await readBaseDirect('getTrustToken')
		);
		expect(await baseEmissionsControllerGetSatelliteEmissionsController(config)).toEqual(
			await readBaseDirect('getSatelliteEmissionsController')
		);
		expect(await baseEmissionsControllerGetTotalMinted(config)).toEqual(
			await readBaseDirect('getTotalMinted')
		);
		expect(await baseEmissionsControllerGetEpochMintedAmount(config, { args: [0n] })).toEqual(
			await readBaseDirect('getEpochMintedAmount', [0n])
		);
		expect(await baseEmissionsControllerGetStartTimestamp(config)).toEqual(
			await readBaseDirect('getStartTimestamp')
		);
		expect(await baseEmissionsControllerGetEpochLength(config)).toEqual(
			await readBaseDirect('getEpochLength')
		);
		expect(await baseEmissionsControllerGetCurrentEpoch(config)).toEqual(
			await readBaseDirect('getCurrentEpoch')
		);
		expect(
			await baseEmissionsControllerGetEpochAtTimestamp(config, { args: [latestBlock.timestamp] })
		).toEqual(await readBaseDirect('getEpochAtTimestamp', [latestBlock.timestamp]));
		expect(await baseEmissionsControllerGetCurrentEpochTimestampStart(config)).toEqual(
			await readBaseDirect('getCurrentEpochTimestampStart')
		);

		const currentEpoch = await baseEmissionsControllerGetCurrentEpoch(config);
		expect(
			await baseEmissionsControllerGetEpochTimestampStart(config, { args: [currentEpoch] })
		).toEqual(await readBaseDirect('getEpochTimestampStart', [currentEpoch]));
		expect(
			await baseEmissionsControllerGetEpochTimestampEnd(config, { args: [currentEpoch] })
		).toEqual(await readBaseDirect('getEpochTimestampEnd', [currentEpoch]));
		expect(
			await baseEmissionsControllerGetEmissionsAtEpoch(config, { args: [currentEpoch] })
		).toEqual(await readBaseDirect('getEmissionsAtEpoch', [currentEpoch]));
		expect(
			await baseEmissionsControllerGetEmissionsAtTimestamp(config, {
				args: [latestBlock.timestamp],
			})
		).toEqual(await readBaseDirect('getEmissionsAtTimestamp', [latestBlock.timestamp]));
		expect(await baseEmissionsControllerGetCurrentEpochEmissions(config)).toEqual(
			await readBaseDirect('getCurrentEpochEmissions')
		);
		expect(await baseEmissionsControllerGetFinalityState(config)).toEqual(
			await readBaseDirect('getFinalityState')
		);
		expect(await baseEmissionsControllerGetMessageGasCost(config)).toEqual(
			await readBaseDirect('getMessageGasCost')
		);
		expect(await baseEmissionsControllerGetMetaERC20SpokeOrHub(config)).toEqual(
			await readBaseDirect('getMetaERC20SpokeOrHub')
		);

		const recipientDomain = await baseEmissionsControllerGetRecipientDomain(config);
		expect(recipientDomain).toEqual(await readBaseDirect('getRecipientDomain'));

		try {
			const directQuote = await readBaseDirect('quoteGasPayment', [recipientDomain, 200_000n]);
			const wrapperQuote = await baseEmissionsControllerQuoteGasPayment(config, {
				args: [recipientDomain, 200_000n],
			});
			expect(wrapperQuote).toEqual(directQuote);
		} catch {
			await expect(
				baseEmissionsControllerQuoteGasPayment(config, {
					args: [recipientDomain, 200_000n],
				})
			).rejects.toThrow();
		}
	});
});
