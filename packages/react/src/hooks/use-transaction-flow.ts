'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Hex, TransactionReceipt } from 'viem';
import { useWaitForTransactionReceipt } from 'wagmi';

import type { TransactionFlowStatus } from '../types';

/**
 * Options for {@link useTransactionFlow}.
 */
type UseTransactionFlowOptions<TArgs> = {
	/** The write mutation function (from useDeposit, useCreateAtom, etc.) */
	mutationFn: (args: TArgs) => Promise<Hex>;
	/** Called after the transaction is confirmed on-chain. */
	onConfirmed?: (receipt: TransactionReceipt) => void;
	/** Called on any error (submission or confirmation). */
	onError?: (error: Error) => void;
	/** Number of confirmations to wait for (default: 1). */
	confirmations?: number;
};

/**
 * Return type for {@link useTransactionFlow}.
 */
type UseTransactionFlowReturn<TArgs> = {
	/** Execute the transaction and wait for confirmation. */
	execute: (args: TArgs) => Promise<TransactionReceipt>;
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
 * Composable hook that wraps a write mutation with full transaction lifecycle.
 *
 * Handles the complete flow: submit transaction -> wait for receipt -> call
 * onConfirmed callback -> track status. Uses wagmi's `useWaitForTransactionReceipt`
 * internally for receipt polling.
 *
 * Status transitions:
 * - `idle` -> `submitting` (tx sent to wallet)
 * - `submitting` -> `confirming` (tx hash received, waiting for block)
 * - `confirming` -> `confirmed` (receipt received)
 * - Any failure -> `error`
 *
 * @param options - Configuration for the transaction flow.
 *
 * @example
 * ```tsx
 * const { deposit } = useDeposit()
 * const flow = useTransactionFlow({
 *   mutationFn: (args) => deposit(args),
 *   onConfirmed: (receipt) => {
 *     toast.success('Deposit confirmed!')
 *     refetchPosition()
 *   },
 *   onError: (error) => toast.error(error.message),
 * })
 *
 * // In your handler:
 * const receipt = await flow.execute({ termId, curveId, amount })
 *
 * // In your UI:
 * <Button disabled={flow.status !== 'idle'}>
 *   {flow.status === 'submitting' ? 'Confirm in wallet...' :
 *    flow.status === 'confirming' ? 'Confirming...' : 'Deposit'}
 * </Button>
 * ```
 */
export function useTransactionFlow<TArgs>(
	options: UseTransactionFlowOptions<TArgs>
): UseTransactionFlowReturn<TArgs> {
	const [status, setStatus] = useState<TransactionFlowStatus>('idle');
	const [hash, setHash] = useState<Hex | undefined>(undefined);
	const [receipt, setReceipt] = useState<TransactionReceipt | undefined>(undefined);
	const [error, setError] = useState<Error | undefined>(undefined);

	// Ref to hold the promise resolver for the imperative execute() API
	const resolverRef = useRef<{
		resolve: (receipt: TransactionReceipt) => void;
		reject: (error: Error) => void;
	} | null>(null);

	// Keep callbacks in refs to avoid stale closures
	const onConfirmedRef = useRef(options.onConfirmed);
	onConfirmedRef.current = options.onConfirmed;
	const onErrorRef = useRef(options.onError);
	onErrorRef.current = options.onError;

	const receiptQuery = useWaitForTransactionReceipt({
		hash,
		confirmations: options.confirmations ?? 1,
		query: {
			enabled: hash !== undefined && status === 'confirming',
		},
	});

	// Sync receipt query results into our state via useEffect
	useEffect(() => {
		if (receiptQuery.data && status === 'confirming') {
			setReceipt(receiptQuery.data);
			setStatus('confirmed');
			onConfirmedRef.current?.(receiptQuery.data);
			resolverRef.current?.resolve(receiptQuery.data);
			resolverRef.current = null;
		}
	}, [receiptQuery.data, status]);

	useEffect(() => {
		if (receiptQuery.error && status === 'confirming') {
			const receiptError =
				receiptQuery.error instanceof Error
					? receiptQuery.error
					: new Error('Transaction confirmation failed.');
			setError(receiptError);
			setStatus('error');
			onErrorRef.current?.(receiptError);
			resolverRef.current?.reject(receiptError);
			resolverRef.current = null;
		}
	}, [receiptQuery.error, status]);

	const execute = useCallback(
		async (args: TArgs): Promise<TransactionReceipt> => {
			setStatus('submitting');
			setHash(undefined);
			setReceipt(undefined);
			setError(undefined);

			try {
				const txHash = await options.mutationFn(args);
				setHash(txHash);
				setStatus('confirming');

				// Return a promise that resolves when the receipt arrives
				// via the useEffect sync above.
				return new Promise<TransactionReceipt>((resolve, reject) => {
					resolverRef.current = { resolve, reject };
				});
			} catch (submitError) {
				const err =
					submitError instanceof Error ? submitError : new Error('Transaction submission failed.');
				setError(err);
				setStatus('error');
				onErrorRef.current?.(err);
				throw err;
			}
		},
		[options.mutationFn]
	);

	const reset = useCallback(() => {
		setStatus('idle');
		setHash(undefined);
		setReceipt(undefined);
		setError(undefined);
		resolverRef.current = null;
	}, []);

	return {
		execute,
		status,
		hash,
		receipt,
		error,
		reset,
	};
}
