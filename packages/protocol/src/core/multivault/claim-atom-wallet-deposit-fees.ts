import type { ContractFunctionArgs } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { WriteConfig } from '../../types';

export type MultiVaultClaimAtomWalletDepositFeesInputs = {
	args: ContractFunctionArgs<typeof MultiVaultAbi, 'nonpayable', 'claimAtomWalletDepositFees'>;
};

/**
 * Simulates and submits a MultiVault `claimAtomWalletDepositFees` transaction.
 * @param config Contract address and viem clients.
 * @param inputs Function args for atom wallet fee claim.
 * @returns Transaction hash from the wallet client.
 */
export async function multiVaultClaimAtomWalletDepositFees(
	config: WriteConfig,
	inputs: MultiVaultClaimAtomWalletDepositFeesInputs
) {
	const { address, walletClient, publicClient } = config;
	const { args } = inputs;

	const { request } = await publicClient.simulateContract({
		account: walletClient.account,
		address,
		abi: MultiVaultAbi,
		functionName: 'claimAtomWalletDepositFees',
		args,
	});

	return await walletClient.writeContract(request);
}
