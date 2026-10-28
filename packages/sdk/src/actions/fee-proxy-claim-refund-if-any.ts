import {
	feeProxyClaimRefundToEncode,
	feeProxyPendingRefund,
	type ReadConfig,
} from '@0xintuition/periphery';
import { type Address, type Hex, isAddressEqual, zeroAddress } from 'viem';

/** A ready-to-send `claimRefundTo` transaction and the amount it will move. */
export type FeeProxyRefundClaim = {
	amount: bigint;
	tx: {
		/** The ledger owner. Only this account can claim its refund. */
		from: Address;
		to: Address;
		data: Hex;
		value: bigint;
	};
};

/**
 * Checks the pull-fallback refund ledger and builds a `claimRefundTo` transaction only when the
 * user is owed something. FeeProxy pushes excess `msg.value` back first and only credits the
 * ledger when that push fails, so for most callers this returns `null`; it never builds a claim
 * that would revert `FeeProxy_NoRefundOwed`.
 * @param config FeeProxy address and public client.
 * @param inputs The ledger owner, and where to send the refund (defaults to the owner). Pass a
 * different recipient when the owner is a contract whose `receive` reverts.
 * @returns The claim transaction and amount, or `null` when nothing is owed.
 */
export async function feeProxyClaimRefundIfAny(
	config: ReadConfig,
	inputs: { user: Address; recipient?: Address }
): Promise<FeeProxyRefundClaim | null> {
	const { user, recipient = user } = inputs;

	if (isAddressEqual(recipient, zeroAddress)) {
		throw new Error('recipient must not be the zero address (FeeProxy_ZeroAddress).');
	}
	if (isAddressEqual(recipient, config.address)) {
		throw new Error('recipient must not be FeeProxy itself (FeeProxy_RefundRecipientIsProxy).');
	}

	const amount = await feeProxyPendingRefund(config, { args: [user] });
	if (amount === 0n) {
		return null;
	}

	return {
		amount,
		tx: {
			from: user,
			to: config.address,
			data: feeProxyClaimRefundToEncode(recipient),
			value: 0n,
		},
	};
}
