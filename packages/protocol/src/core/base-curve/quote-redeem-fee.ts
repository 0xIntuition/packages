import type { ContractFunctionArgs } from 'viem';

import { IBaseCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Quotes any curve's redeem-hook fee for a SPECIFIC account, without knowing which curve it is.
 *
 * The account matters: a curve whose withdrawal rate keys on where the holder entered charges a
 * different fee per holder for the same shares. Passing the zero address is what MultiVault's own
 * `previewRedeem` does, and it is what makes that preview holder-agnostic.
 * @param config Curve address and public client.
 * @param inputs Function args for the quote.
 * @returns The curve-level withdrawal fee for those gross assets.
 */
export async function baseCurveQuoteRedeemFee(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof IBaseCurveAbi, 'view', 'quoteRedeemFee'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: IBaseCurveAbi,
		functionName: 'quoteRedeemFee',
		args,
	});
}
