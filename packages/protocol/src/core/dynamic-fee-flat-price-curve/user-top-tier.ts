import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads the highest tier at which an account holds a lot in a vault: the lot a redeem draws from
 * first, and so the rate the next share out is charged at. `NO_LOT` when the account holds no lot.
 * @param config Contract address and public client.
 * @param inputs Function args for the term/account lookup.
 * @returns The account's top lot tier, or `NO_LOT`.
 */
export async function dynamicFeeFlatPriceCurveUserTopTier(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view' | 'pure', 'userTopTier'>;
	}
): Promise<DynamicFeeFlatPriceCurveUserTopTierResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'userTopTier',
		args,
	});
}

export type DynamicFeeFlatPriceCurveUserTopTierResult = ContractFunctionReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'view' | 'pure',
	'userTopTier'
>;
