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
	/** Reset to idle and reject a pending execute; does not cancel an on-chain transaction. */
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

	// Allocate one attempt before asking the wallet. Reset/unmount invalidates
	// this object so a late wallet response cannot revive an abandoned flow.
	type PendingTransaction = {
		resolve: (receipt: TransactionReceipt) => void;
		reject: (error: Error) => void;
	};
	const pendingRef = useRef<PendingTransaction | null>(null);

	const onConfirmedRef = useRef(options.onConfirmed);
	onConfirmedRef.current = options.onConfirmed;
	const onErrorRef = useRef(options.onError);
	onErrorRef.current = options.onError;

	const receiptQuery = useWaitForTransactionReceipt({
		hash,
		confirmations: options.confirmations ?? 1,
		query: { enabled: hash !== undefined && status === 'confirming' },
	});

	useEffect(() => {
		const pending = pendingRef.current;
		if (!pending || status !== 'confirming') return;
		const confirmedReceipt = receiptQuery.data;
		const receiptError =
			confirmedReceipt?.status === 'reverted'
				? new Error('Transaction reverted.')
				: receiptQuery.error;
		if (receiptError) {
			const failure =
				receiptError instanceof Error
					? receiptError
					: new Error('Transaction confirmation failed.');
			pendingRef.current = null;
			setError(failure);
			setStatus('error');
			pending.reject(failure);
			onErrorRef.current?.(failure);
		} else if (confirmedReceipt) {
			pendingRef.current = null;
			setReceipt(confirmedReceipt);
			setStatus('confirmed');
			// Settle before application callbacks, which may throw or start another flow.
			pending.resolve(confirmedReceipt);
			onConfirmedRef.current?.(confirmedReceipt);
		}
	}, [receiptQuery.data, receiptQuery.error, status]);

	useEffect(
		() => () => {
			const pending = pendingRef.current;
			pendingRef.current = null;
			pending?.reject(new Error('Transaction flow unmounted.'));
		},
		[]
	);

	const execute = useCallback(
		(args: TArgs): Promise<TransactionReceipt> => {
			if (pendingRef.current)
				return Promise.reject(new Error('A transaction is already in progress.'));
			let pending!: PendingTransaction;
			const completion = new Promise<TransactionReceipt>((resolve, reject) => {
				pending = { resolve, reject };
			});
			pendingRef.current = pending;
			setStatus('submitting');
			setHash(undefined);
			setReceipt(undefined);
			setError(undefined);

			void (async () => {
				try {
					const txHash = await options.mutationFn(args);
					if (pendingRef.current !== pending) return;
					setHash(txHash);
					setStatus('confirming');
				} catch (submitError) {
					if (pendingRef.current !== pending) return;
					const failure =
						submitError instanceof Error
							? submitError
							: new Error('Transaction submission failed.');
					pendingRef.current = null;
					setError(failure);
					setStatus('error');
					pending.reject(failure);
					onErrorRef.current?.(failure);
				}
			})().catch(pending.reject);
			return completion;
		},
		[options.mutationFn]
	);

	const reset = useCallback(() => {
		const pending = pendingRef.current;
		pendingRef.current = null;
		pending?.reject(new Error('Transaction flow reset.'));
		setStatus('idle');
		setHash(undefined);
		setReceipt(undefined);
		setError(undefined);
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
