'use client';

import { useCallback } from 'react';
import type { Hex, TransactionReceipt } from 'viem';

import type { TransactionFlowStatus } from '../types';
import { useTransactionFlow } from './use-transaction-flow';
import { useDeposit } from './use-vault';

/**
 * Options for {@link useDepositFlow}.
 */
type UseDepositFlowOptions = {
	/** Called after the deposit transaction is confirmed on-chain. */
	onConfirmed?: (receipt: TransactionReceipt) => void;
	/** Called on any error (submission or confirmation). */
	onError?: (error: Error) => void;
	/** Number of confirmations to wait for (default: 1). */
	confirmations?: number;
	/** Chain ID for deposit preview reads. */
	chainId?: number;
};

/**
 * Parameters for a deposit operation.
 */
type DepositParams = {
	/** The term ID of the vault. */
	termId: Hex;
	/** The bonding curve ID. */
	curveId: bigint;
	/** The deposit amount in wei (sent as msg.value). */
	amount: bigint;
	/** Minimum shares to accept (slippage protection). */
	minShares?: bigint;
	/** Receiver address. Defaults to connected wallet. */
	receiver?: `0x${string}`;
};

/**
 * Return type for {@link useDepositFlow}.
 */
type UseDepositFlowReturn = {
	/** Execute a deposit and wait for confirmation. */
	deposit: (params: DepositParams) => Promise<TransactionReceipt>;
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
 * Complete deposit flow: submit -> confirm -> done.
 *
 * Combines `useDeposit` + `useTransactionFlow` to provide a single hook
 * that handles the entire deposit lifecycle, including waiting for
 * transaction confirmation and calling `onConfirmed` when done.
 *
 * @param options - Configuration for the deposit flow.
 *
 * @example
 * ```tsx
 * const depositFlow = useDepositFlow({
 *   onConfirmed: (receipt) => {
 *     toast.success('Deposit confirmed!')
 *     queryClient.invalidateQueries({ queryKey: ['position'] })
 *   },
 *   onError: (error) => toast.error(error.message),
 * })
 *
 * async function handleDeposit() {
 *   await depositFlow.deposit({
 *     termId,
 *     curveId,
 *     amount: parseEther('1'),
 *   })
 * }
 *
 * // In your UI:
 * <Button disabled={depositFlow.status !== 'idle'}>
 *   {depositFlow.status === 'submitting' ? 'Confirm in wallet...' :
 *    depositFlow.status === 'confirming' ? 'Confirming...' : 'Deposit'}
 * </Button>
 * ```
 */
export function useDepositFlow(options?: UseDepositFlowOptions): UseDepositFlowReturn {
	const { deposit: rawDeposit } = useDeposit();

	const flow = useTransactionFlow<DepositParams>({
		mutationFn: (params) =>
			rawDeposit({
				termId: params.termId,
				curveId: params.curveId,
				amount: params.amount,
				minShares: params.minShares,
				receiver: params.receiver,
			}),
		onConfirmed: options?.onConfirmed,
		onError: options?.onError,
		confirmations: options?.confirmations,
	});

	const deposit = useCallback(
		(params: DepositParams): Promise<TransactionReceipt> => {
			return flow.execute(params);
		},
		[flow.execute]
	);

	return {
		deposit,
		status: flow.status,
		hash: flow.hash,
		receipt: flow.receipt,
		error: flow.error,
		reset: flow.reset,
	};
}
