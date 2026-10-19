import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

/**
 * Account-aware redeem preview, net of this curve's withdrawal fee only — NOT an
 * execution-net payout. MultiVault's protocol and exit fees are not modelled here;
 * never use the result as `minAssets`. The holder-agnostic `previewRedeem` diverges
 * from this in both directions, so a specific-holder preview must call this instead.
 * @param config Contract address and public client.
 * @param inputs Function args: the term, the redeeming account, and the share amount.
 * @returns `[assetsAfterCurveFee, fee]` — gross assets less this curve's withdrawal fee, and the fee itself.
 */
export async function dynamicFeeFlatPriceCurvePreviewRedeemFor(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'view', 'previewRedeemFor'>;
	}
) {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'previewRedeemFor',
		args,
	});
}
