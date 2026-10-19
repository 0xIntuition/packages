import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads an account's lot bitmap in a vault: bit `tier` is set iff the account holds a non-empty lot
 * at that tier. The position's index — its set bits are the lots `userLots` walks, and its highest
 * bit is the top lot.
 * @param config Contract address and public client.
 * @param inputs Function args for the term/account lookup.
 * @returns The account's lot mask.
 */
export async function dynamicFeeFlatPriceCurveLotMask(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view', 'lotMask'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'lotMask',
		args,
	});
}
