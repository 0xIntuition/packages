import type { ContractFunctionArgs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type DynamicFeeFlatPriceCurveClaimInputs = {
	args: ContractFunctionArgs<typeof DynamicFeeFlatPriceCurveAbi, 'nonpayable', 'claim'>;
};

/**
 * Simulates and submits a DynamicFeeFlatPriceCurve `claim` transaction — pulls all
 * earned fees (native TRUST) for the caller, settling the supplied vaults first.
 * @param config Contract address and viem clients.
 * @param inputs Function args: the caller's dynamic-fee vaults to settle before payout.
 * @returns Transaction hash from the wallet client.
 */
export async function dynamicFeeFlatPriceCurveClaim(
	config: WriteConfig,
	inputs: DynamicFeeFlatPriceCurveClaimInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: DynamicFeeFlatPriceCurveAbi,
		functionName: 'claim',
		args,
	});

	return await walletClient.writeContract(request);
}
