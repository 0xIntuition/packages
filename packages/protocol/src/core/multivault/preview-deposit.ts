import type { Account, Address, ContractFunctionArgs, ContractFunctionReturnType } from 'viem';

import { type MultiVaultAbi, MultiVaultWithRevertsAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';

export type PreviewDepositCurveInputs = {
	args: ContractFunctionArgs<typeof MultiVaultAbi, 'view' | 'pure', 'previewDeposit'>;
	/**
	 * Optional `from` for the call. MultiVault's preview path does not read `msg.sender`, so this
	 * changes nothing on chain; it exists only for nodes or middleware that key on a caller.
	 */
	account?: Account | Address;
};

/**
 * Previews the result of a deposit using the MultiVault `previewDeposit` view.
 *
 * Takes a `ReadConfig`. It previously took a `WriteConfig` and reached into `walletClient.account`
 * to fill the call's `from`, which made a pure read impossible to perform without a connected
 * wallet — not merely awkward to type: the property access itself threw before any request was
 * sent. Callers that need a specific `from` pass `account` instead.
 * @param config Contract address and public client.
 * @param inputs Function args, and an optional account to attribute the call to.
 * @returns Previewed shares and net assets as returned by the contract.
 */
export async function multiVaultPreviewDeposit(
	config: ReadConfig,
	inputs: PreviewDepositCurveInputs
): Promise<MultiVaultPreviewDepositResult> {
	const { address, publicClient } = config;
	const { args, account } = inputs;

	return await publicClient.readContract({
		account,
		address,
		abi: MultiVaultWithRevertsAbi,
		functionName: 'previewDeposit',
		args,
	});
}

export type MultiVaultPreviewDepositResult = ContractFunctionReturnType<
	typeof MultiVaultWithRevertsAbi,
	'view' | 'pure',
	'previewDeposit'
>;
