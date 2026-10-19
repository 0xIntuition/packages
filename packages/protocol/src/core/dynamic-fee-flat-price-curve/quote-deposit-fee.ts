import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads the on-chain piecewise deposit-fee quote for a vault. Piecewise across the
 * tier bands the deposit traverses — a deposit that climbs several tiers is charged
 * the blended rate across every traversed band, not the pre-deposit tier's rate on the
 * whole amount.
 * @param config Contract address and public client.
 * @param inputs Function args: the term and the base asset amount to quote.
 * @returns The total deposit fee for the given base assets.
 */
export async function dynamicFeeFlatPriceCurveQuoteDepositFee(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view', 'quoteDepositFee'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'quoteDepositFee',
		args,
	});
}
