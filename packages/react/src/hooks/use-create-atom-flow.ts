'use client';

import { MultiVaultAbi } from '@0xintuition/protocol';
import { useCallback } from 'react';
import type { Hex, TransactionReceipt } from 'viem';
import { parseEventLogs } from 'viem';

import type { TransactionFlowStatus } from '../types';
import { useCreateAtom } from './use-atom';
import { useAtomCost } from './use-protocol';
import { useTransactionFlow } from './use-transaction-flow';

/**
 * Options for {@link useCreateAtomFlow}.
 */
type UseCreateAtomFlowOptions = {
	/** Called after the atom creation transaction is confirmed on-chain. */
	onConfirmed?: (receipt: TransactionReceipt, termId: Hex) => void;
	/** Called on any error (submission or confirmation). */
	onError?: (error: Error) => void;
	/** Number of confirmations to wait for (default: 1). */
	confirmations?: number;
};

/**
 * Parameters for an atom creation operation.
 */
type CreateAtomParams = {
	/** Atom data as hex bytes. */
	data: Hex[];
	/** Asset amounts (wei) for each atom. Includes atom cost. */
	assets: bigint[];
};

/**
 * Return type for {@link useCreateAtomFlow}.
 */
type UseCreateAtomFlowReturn = {
	/** Execute atom creation and wait for confirmation. */
	createAtom: (params: CreateAtomParams) => Promise<{
		receipt: TransactionReceipt;
		termIds: Hex[];
	}>;
	/** The base cost to create an atom (from the contract). */
	atomCost: bigint | undefined;
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
 * Extracts term IDs from AtomCreated events in a transaction receipt.
 *
 * @param receipt - The transaction receipt containing AtomCreated event logs.
 * @returns Array of term IDs extracted from the events.
 */
function extractAtomTermIds(receipt: TransactionReceipt): Hex[] {
	const events = parseEventLogs({
		abi: MultiVaultAbi,
		logs: receipt.logs,
		eventName: 'AtomCreated',
	});

	return events.map((event) => event.args.termId);
}

/**
 * Complete atom creation flow: submit -> confirm -> extract termId -> done.
 *
 * Combines `useCreateAtom` + `useAtomCost` + `useTransactionFlow` to provide
 * a single hook that handles the entire atom creation lifecycle. After
 * confirmation, it parses the `AtomCreated` event logs to extract the
 * resulting term IDs.
 *
 * @param options - Configuration for the atom creation flow.
 *
 * @example
 * ```tsx
 * const createAtomFlow = useCreateAtomFlow({
 *   onConfirmed: (receipt, termId) => {
 *     toast.success(`Atom created: ${termId}`)
 *     router.push(`/atoms/${termId}`)
 *   },
 *   onError: (error) => toast.error(error.message),
 * })
 *
 * async function handleCreate() {
 *   const atomHex = stringToHex('my-atom-data')
 *   const cost = createAtomFlow.atomCost ?? 0n
 *   const { receipt, termIds } = await createAtomFlow.createAtom({
 *     data: [atomHex],
 *     assets: [cost + parseEther('0.001')],
 *   })
 * }
 * ```
 */
export function useCreateAtomFlow(options?: UseCreateAtomFlowOptions): UseCreateAtomFlowReturn {
	const { createAtom: rawCreateAtom } = useCreateAtom();
	const { data: atomCost } = useAtomCost();

	const flow = useTransactionFlow<CreateAtomParams>({
		mutationFn: (params) =>
			rawCreateAtom({
				data: params.data,
				assets: params.assets,
			}),
		onConfirmed: (receipt) => {
			const termIds = extractAtomTermIds(receipt);
			const firstTermId = termIds[0];
			if (firstTermId && options?.onConfirmed) {
				options.onConfirmed(receipt, firstTermId);
			}
		},
		onError: options?.onError,
		confirmations: options?.confirmations,
	});

	const createAtom = useCallback(
		async (params: CreateAtomParams): Promise<{ receipt: TransactionReceipt; termIds: Hex[] }> => {
			const receipt = await flow.execute(params);
			const termIds = extractAtomTermIds(receipt);
			return { receipt, termIds };
		},
		[flow.execute]
	);

	return {
		createAtom,
		atomCost,
		status: flow.status,
		hash: flow.hash,
		receipt: flow.receipt,
		error: flow.error,
		reset: flow.reset,
	};
}
