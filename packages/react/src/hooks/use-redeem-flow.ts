'use client';

import { useCallback } from 'react';
import type { Hex, TransactionReceipt } from 'viem';

import type { TransactionFlowStatus } from '../types';
import { useTransactionFlow } from './use-transaction-flow';
import { useRedeem } from './use-vault';

/**
 * Options for {@link useRedeemFlow}.
 */
type UseRedeemFlowOptions = {
	/** Called after the redeem transaction is confirmed on-chain. */
	onConfirmed?: (receipt: TransactionReceipt) => void;
	/** Called on any error (submission or confirmation). */
	onError?: (error: Error) => void;
	/** Number of confirmations to wait for (default: 1). */
	confirmations?: number;
};

/**
 * Parameters for a redeem operation.
 */
type RedeemParams = {
	/** The term ID of the vault. */
	termId: Hex;
	/** The bonding curve ID. */
	curveId: bigint;
	/** Number of shares to redeem. */
	shares: bigint;
	/** Minimum assets to accept (slippage protection). */
	minAssets?: bigint;
	/** Receiver address. Defaults to connected wallet. */
	receiver?: `0x${string}`;
};

/**
 * Return type for {@link useRedeemFlow}.
 */
type UseRedeemFlowReturn = {
	/** Execute a redeem and wait for confirmation. */
	redeem: (params: RedeemParams) => Promise<TransactionReceipt>;
	/** Current status of the transaction flow. */
	status: TransactionFlowStatus;
	/** Transaction hash once submitted. */
	hash: Hex | undefined;
	/** Transaction receipt once confirmed. */
	receipt: TransactionReceipt | undefined;
	/** Error if any step failed. */
	error: Error | undefined;
	/** Reset the flow to idle state. */
	reset: () => void;
};

/**
 * Complete redeem flow: submit -> confirm -> done.
 *
 * Combines `useRedeem` + `useTransactionFlow` to provide a single hook
 * that handles the entire redemption lifecycle.
 *
 * @param options - Configuration for the redeem flow.
 *
 * @example
 * ```tsx
 * const redeemFlow = useRedeemFlow({
 *   onConfirmed: (receipt) => {
 *     toast.success('Withdrawal confirmed!')
 *     queryClient.invalidateQueries({ queryKey: ['position'] })
 *   },
 *   onError: (error) => toast.error(error.message),
 * })
 *
 * async function handleRedeem() {
 *   await redeemFlow.redeem({
 *     termId,
 *     curveId,
 *     shares: maxRedeemShares,
 *   })
 * }
 * ```
 */
export function useRedeemFlow(options?: UseRedeemFlowOptions): UseRedeemFlowReturn {
	const { redeem: rawRedeem } = useRedeem();

	const flow = useTransactionFlow<RedeemParams>({
		mutationFn: (params) =>
			rawRedeem({
				termId: params.termId,
				curveId: params.curveId,
				shares: params.shares,
				minAssets: params.minAssets,
				receiver: params.receiver,
			}),
		onConfirmed: options?.onConfirmed,
		onError: options?.onError,
		confirmations: options?.confirmations,
	});

	const redeem = useCallback(
		(params: RedeemParams): Promise<TransactionReceipt> => {
			return flow.execute(params);
		},
		[flow.execute]
	);

	return {
		redeem,
		status: flow.status,
		hash: flow.hash,
		receipt: flow.receipt,
		error: flow.error,
		reset: flow.reset,
	};
}
