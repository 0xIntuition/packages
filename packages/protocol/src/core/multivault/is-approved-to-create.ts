import type { ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { MultiVaultAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

/**
 * Reads whether `sender` is approved to act on `creator`'s behalf for the CREATION
 * approval type — the gate `createAtomsFor` / `createTriplesFor` check when
 * `creator !== msg.sender`.
 * @param config Contract address and public client.
 * @param inputs Function args: `[sender, creator]`.
 * @returns Whether `sender` holds CREATION approval from `creator`.
 */
export async function multiVaultIsApprovedToCreate(
	config: ReadConfig,
	inputs: {
		args: ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'isApprovedToCreate'>;
	}
): Promise<MultiVaultIsApprovedToCreateResult> {
	const { address, publicClient } = config;
	const { args } = inputs;

	return await publicClient.readContract({
		address,
		abi: MultiVaultAbi,
		functionName: 'isApprovedToCreate',
		args,
	});
}

export type MultiVaultIsApprovedToCreateResult = ContractFunctionReturnType<
	typeof MultiVaultAbi,
	'view' | 'pure',
	'isApprovedToCreate'
>;
