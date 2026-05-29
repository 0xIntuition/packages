'use client';

import {
	MultiVaultAbi,
	multiVaultResolveDefaultCurveId,
	multiVaultResolveVaultTotals,
} from '@0xintuition/protocol';
import type { Hex } from 'viem';

type TripleData = {
	termId: Hex;
	curveId: bigint;
	isTriple: boolean;
	subjectId: Hex;
	predicateId: Hex;
	objectId: Hex;
	totalAssets: bigint;
	totalShares: bigint;
	sharePrice: bigint;
};

type TripleQueryResult = {
	data: TripleData | undefined;
	isLoading: boolean;
	isPending: boolean;
	isError: boolean;
	error: Error | null;
	refetch: () => unknown;
};

type CreateTripleInput = {
	subjectIds: Hex[];
	predicateIds: Hex[];
	objectIds: Hex[];
	assets: bigint[];
};

type CreateTripleResult = {
	createTriple: (inputs: CreateTripleInput) => Promise<Hex>;
	isPending: boolean;
	isError: boolean;
	error: Error | null;
	data: Hex | undefined;
	reset: () => void;
};

import { useReadContract, useReadContracts, useWriteContract } from 'wagmi';

import { useChainConfig } from '../provider';

/**
 * Fetches on-chain triple data including its subject, predicate, and object atom IDs,
 * vault state, and current share price.
 *
 * @param termId - The term ID (bytes32 hash) of the triple.
 * @param options - Optional settings.
 * @param options.curveId - Override the bonding curve ID. Defaults to the contract's default curve.
 * @param options.chainId - Override the chain to read from. Defaults to the provider's chain.
 * @param options.enabled - Whether the query is enabled. Defaults to `true`.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTriple('0x1234...')
 * if (data) {
 *   console.log(data.subjectId, data.predicateId, data.objectId)
 *   console.log(data.totalAssets, data.sharePrice)
 * }
 * ```
 */
export function useTriple(
	termId: Hex,
	options?: {
		curveId?: bigint;
		chainId?: number;
		enabled?: boolean;
	}
): TripleQueryResult {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const enabled = options?.enabled !== false;

	const bondingCurveConfig = useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'getBondingCurveConfig',
		chainId,
		query: { enabled },
	});

	const curveId =
		options?.curveId ??
		(bondingCurveConfig.data
			? multiVaultResolveDefaultCurveId(bondingCurveConfig.data)
			: undefined);

	const contracts =
		curveId !== undefined
			? ([
					{
						address: multivaultAddress,
						abi: MultiVaultAbi,
						functionName: 'isTriple',
						args: [termId],
						chainId,
					},
					{
						address: multivaultAddress,
						abi: MultiVaultAbi,
						functionName: 'getTriple',
						args: [termId],
						chainId,
					},
					{
						address: multivaultAddress,
						abi: MultiVaultAbi,
						functionName: 'getVault',
						args: [termId, curveId],
						chainId,
					},
					{
						address: multivaultAddress,
						abi: MultiVaultAbi,
						functionName: 'currentSharePrice',
						args: [termId, curveId],
						chainId,
					},
				] as const)
			: undefined;

	const results = useReadContracts({
		contracts,
		query: {
			enabled: enabled && curveId !== undefined && contracts !== undefined,
		},
	});

	const data = results.data?.every((r) => r.status === 'success')
		? (() => {
				const isTriple = results.data[0].result as boolean;
				const tripleData = results.data[1].result as readonly [Hex, Hex, Hex];
				const vaultTotals = multiVaultResolveVaultTotals(results.data[2].result);
				const sharePrice = results.data[3].result as bigint;

				return {
					termId,
					curveId: curveId as bigint,
					isTriple,
					subjectId: tripleData[0],
					predicateId: tripleData[1],
					objectId: tripleData[2],
					totalAssets: vaultTotals.totalAssets,
					totalShares: vaultTotals.totalShares,
					sharePrice,
				};
			})()
		: undefined;

	return {
		data,
		isLoading: bondingCurveConfig.isLoading || results.isLoading,
		isPending: bondingCurveConfig.isPending || results.isPending,
		isError: bondingCurveConfig.isError || results.isError,
		error: bondingCurveConfig.error ?? results.error,
		refetch: results.refetch,
	};
}

/**
 * Returns a mutation function to create one or more triples on-chain.
 *
 * Each triple links a subject atom, predicate atom, and object atom.
 * All input arrays must have the same length.
 *
 * @example
 * ```tsx
 * const { createTriple, isPending } = useCreateTriple()
 *
 * async function handleCreate() {
 *   const hash = await createTriple({
 *     subjectIds: [subjectTermId],
 *     predicateIds: [predicateTermId],
 *     objectIds: [objectTermId],
 *     assets: [parseEther('0.001')],
 *   })
 * }
 * ```
 */
export function useCreateTriple(): CreateTripleResult {
	const { multivaultAddress, chainId } = useChainConfig();
	const { writeContractAsync, isPending, isError, error, data, reset } = useWriteContract();

	const createTriple = async (inputs: CreateTripleInput): Promise<Hex> => {
		const { subjectIds, predicateIds, objectIds, assets } = inputs;

		if (
			subjectIds.length !== predicateIds.length ||
			subjectIds.length !== objectIds.length ||
			subjectIds.length !== assets.length
		) {
			throw new Error('All input arrays must have the same length.');
		}

		const totalValue = assets.reduce((sum, v) => sum + v, 0n);

		return writeContractAsync({
			address: multivaultAddress,
			abi: MultiVaultAbi,
			functionName: 'createTriples',
			args: [subjectIds, predicateIds, objectIds, assets],
			value: totalValue,
			chainId,
		}) as Promise<Hex>;
	};

	return {
		createTriple,
		isPending,
		isError,
		error,
		data,
		reset,
	};
}
