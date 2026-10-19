import type { Account, Address, ContractFunctionArgs } from 'viem';

import { type MultiVaultAbi, MultiVaultWithRevertsAbi } from '../../contracts';
import type { ReadConfig } from '../../types';

export type PreviewRedeemCurveInputs = {
	args: ContractFunctionArgs<typeof MultiVaultAbi, 'view', 'previewRedeem'>;
	/**
	 * Optional `from` for the call. MultiVault's preview path does not read `msg.sender`, so this
	 * changes nothing on chain; it exists only for nodes or middleware that key on a caller.
	 */
	account?: Account | Address;
};

/**
 * Previews the result of a redeem using the MultiVault `previewRedeem` view.
 *
 * Holder-agnostic: MultiVault quotes any curve redeem hook with `address(0)` as the account, so on a
 * curve whose withdrawal fee keys on the holder this is NOT that holder's payout. Use the curve's own
 * account-aware preview for a specific account.
 *
 * Takes a `ReadConfig`. It previously took a `WriteConfig` and reached into `walletClient.account`
 * to fill the call's `from`, which made a pure read impossible to perform without a connected
 * wallet — not merely awkward to type: the property access itself threw before any request was
 * sent. Callers that need a specific `from` pass `account` instead.
 * @param config Contract address and public client.
 * @param inputs Function args, and an optional account to attribute the call to.
 * @returns Previewed assets and shares as returned by the contract.
 */
export async function multiVaultPreviewRedeem(
	config: ReadConfig,
	inputs: PreviewRedeemCurveInputs
) {
	const { address, publicClient } = config;
	const { args, account } = inputs;

	return await publicClient.readContract({
		account,
		address,
		abi: MultiVaultWithRevertsAbi,
		functionName: 'previewRedeem',
		args,
	});
}
