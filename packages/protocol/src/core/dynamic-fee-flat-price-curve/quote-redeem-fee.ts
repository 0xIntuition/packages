import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Reads the on-chain withdrawal-fee quote for a vault. The rate keys on the account's
 * tracked entry tier; an account with no tracked stake falls back to the vault's
 * current tier.
 * @param config Contract address and public client.
 * @param inputs Function args: the term, the redeeming account, and the gross assets to quote.
 * @returns The withdrawal fee for the given gross assets.
 */
export async function dynamicFeeFlatPriceCurveQuoteRedeemFee(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view', 'quoteRedeemFee'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'quoteRedeemFee',
		args,
	});
}
