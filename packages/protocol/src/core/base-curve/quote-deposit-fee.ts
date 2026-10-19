import type { ContractFunctionArgs } from 'viem';

import { IBaseCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Quotes any curve's deposit-hook fee for a vault, without knowing which curve it is.
 *
 * `baseAssets` is the deposit base MultiVault will actually quote on — gross assets less the
 * min-share bootstrap cost on a vault's first deposit, before MultiVault's own fees.
 * @param config Curve address and public client.
 * @param inputs Function args for the quote.
 * @returns The curve-level deposit fee for those base assets.
 */
export async function baseCurveQuoteDepositFee(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof IBaseCurveAbi, 'view', 'quoteDepositFee'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: IBaseCurveAbi,
		functionName: 'quoteDepositFee',
		args,
	});
}
