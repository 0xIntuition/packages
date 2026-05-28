'use client';

import {
	MultiVaultAbi,
	multiVaultResolveDefaultCurveId,
	multiVaultResolveVaultTotals,
} from '@0xintuition/protocol';
import type { Hex } from 'viem';

type AtomData = {
	termId: Hex;
	curveId: bigint;
	isAtom: boolean;
	atomData: Hex;
	totalAssets: bigint;
	totalShares: bigint;
	sharePrice: bigint;
};

type AtomQueryResult = {
	data: AtomData | undefined;
	isLoading: boolean;
	isPending: boolean;
	isError: boolean;
	error: Error | null;
	refetch: () => unknown;
};

type CreateAtomInput = {
	data: Hex[];
	assets: bigint[];
};

type CreateAtomResult = {
	createAtom: (inputs: CreateAtomInput) => Promise<Hex>;
	isPending: boolean;
	isError: boolean;
	error: Error | null;
	data: Hex | undefined;
	reset: () => void;
};

import { useReadContract, useReadContracts, useWriteContract } from 'wagmi';

import { useChainConfig } from '../provider';

/**
 * Fetches on-chain atom data, vault state, and current share price for a given atom term ID.
 *
 * This hook performs a batched multicall to read atom existence, vault totals,
 * the share price, and the bonding curve config in a single RPC round-trip.
 *
 * @param termId - The term ID (bytes32 hash) of the atom.
 * @param options - Optional settings.
 * @param options.curveId - Override the bonding curve ID. Defaults to the contract's default curve.
 * @param options.chainId - Override the chain to read from. Defaults to the provider's chain.
 * @param options.enabled - Whether the query is enabled. Defaults to `true`.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useAtom('0xabcd...')
 * if (data) {
 *   console.log(data.isAtom, data.totalAssets, data.sharePrice)
 * }
 *
 * // Read from a different chain:
 * const { data } = useAtom('0xabcd...', { chainId: 1155 })
 * ```
 */
export function useAtom(
	termId: Hex,
	options?: {
		curveId?: bigint;
		chainId?: number;
		enabled?: boolean;
	}
): AtomQueryResult {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const enabled = options?.enabled !== false;

	// First, read the bonding curve config to get the default curve ID
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
						functionName: 'isAtom',
						args: [termId],
						chainId,
					},
					{
						address: multivaultAddress,
						abi: MultiVaultAbi,
						functionName: 'getAtom',
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
				const isAtom = results.data[0].result as boolean;
				const atomData = results.data[1].result as Hex;
				const vaultTotals = multiVaultResolveVaultTotals(results.data[2].result);
				const sharePrice = results.data[3].result as bigint;

				return {
					termId,
					curveId: curveId as bigint,
					isAtom,
					atomData,
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
 * Returns a mutation function to create one or more atoms on-chain.
 *
 * The caller is responsible for providing the atom data as hex bytes
 * and a corresponding array of asset amounts (in wei) to fund each atom.
 * Writes use the connected wallet's chain by default.
 *
 * @example
 * ```tsx
 * const { createAtom, isPending, error } = useCreateAtom()
 *
 * async function handleCreate() {
 *   const hash = await createAtom({
 *     data: [stringToHex('my-atom-data')],
 *     assets: [parseEther('0.001')],
 *   })
 * }
 * ```
 */
export function useCreateAtom(): CreateAtomResult {
	const { multivaultAddress, chainId } = useChainConfig();
	const { writeContractAsync, isPending, isError, error, data, reset } = useWriteContract();

	const createAtom = async (inputs: CreateAtomInput): Promise<Hex> => {
		if (inputs.data.length !== inputs.assets.length) {
			throw new Error('data and assets arrays must have the same length.');
		}

		const totalValue = inputs.assets.reduce((sum, v) => sum + v, 0n);

		return writeContractAsync({
			address: multivaultAddress,
			abi: MultiVaultAbi,
			functionName: 'createAtoms',
			args: [inputs.data, inputs.assets],
			value: totalValue,
			chainId,
		}) as Promise<Hex>;
	};

	return {
		createAtom,
		isPending,
		isError,
		error,
		data,
		reset,
	};
}
