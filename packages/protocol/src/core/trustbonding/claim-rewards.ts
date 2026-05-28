import type { ContractFunctionArgs } from 'viem';

import { TrustBondingAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type TrustBondingClaimRewardsInputs = {
	args: ContractFunctionArgs<typeof TrustBondingAbi, 'nonpayable', 'claimRewards'>;
};

/**
 * Simulates and submits a TrustBonding `claimRewards` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args for claiming rewards.
 * @returns Transaction hash from the wallet client.
 */
export async function trustBondingClaimRewards(
	config: WriteConfig,
	inputs: TrustBondingClaimRewardsInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: TrustBondingAbi,
		functionName: 'claimRewards',
		args,
	});

	return await walletClient.writeContract(request);
}
