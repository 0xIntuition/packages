import type { ContractFunctionArgs } from 'viem';

import { TrustBondingAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type TrustBondingCreateLockInputs = {
	args: ContractFunctionArgs<typeof TrustBondingAbi, 'nonpayable', 'create_lock'>;
};

/**
 * Simulates and submits `create_lock` on TrustBonding.
 * @param config Contract address and viem clients.
 * @param inputs Function args for lock creation.
 * @returns Transaction hash from the wallet client.
 */
export async function trustBondingCreateLock(
	config: WriteConfig,
	inputs: TrustBondingCreateLockInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: TrustBondingAbi,
		functionName: 'create_lock',
		args,
	});

	return await walletClient.writeContract(request);
}
