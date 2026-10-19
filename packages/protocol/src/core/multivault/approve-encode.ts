import { encodeFunctionData } from 'viem';

import { MultiVaultAbi } from '../../contracts';
import type { ApprovalTypes } from '../../types';

/**
 * Encodes calldata for the MultiVault `approve` function.
 * @param sender The address to grant or revoke approval for.
 * @param approvalType The bit-flag union of DEPOSIT (0b001), REDEMPTION (0b010), and CREATION (0b100).
 * @returns Hex-encoded calldata for `approve`.
 */
export function multiVaultApproveEncode(sender: `0x${string}`, approvalType: ApprovalTypes) {
	return encodeFunctionData({
		abi: MultiVaultAbi,
		functionName: 'approve',
		args: [sender, approvalType],
	});
}
