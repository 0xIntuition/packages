'use client';

import {
	MultiVaultAbi,
	multiVaultResolveDefaultCurveId,
	multiVaultResolveVaultTotals,
} from '@0xintuition/protocol';
import type { Address, Hex } from 'viem';
import { useReadContract, useReadContracts } from 'wagmi';

import { useChainConfig } from '../provider';
import type { VaultState } from '../types';

/**
 * Options for {@link useTripleState}.
 */
type UseTripleStateOptions = {
	/** If provided, also fetches the user's position in the vault. */
	account?: Address;
	/** Override the bonding curve ID. Defaults to the contract's default curve. */
	curveId?: bigint;
	/** Override the chain to read from. Defaults to the provider's chain. */
	chainId?: number;
	/** Whether the query is enabled. Defaults to `true`. */
	enabled?: boolean;
};

/**
 * Return type for {@link useTripleState}.
 */
type UseTripleStateReturn = {
	/** The triple's term ID (passed as input). */
	termId: Hex;
	/** Whether the triple exists on-chain. */
	isTriple: boolean | undefined;
	/** The subject atom ID of the triple. */
	subjectId: Hex | undefined;
	/** The predicate atom ID of the triple. */
	predicateId: Hex | undefined;
	/** The object atom ID of the triple. */
	objectId: Hex | undefined;
	/** Vault state: totalAssets, totalShares, sharePrice. */
	vault: VaultState | undefined;
	/** User's position (only if `account` was provided). */
	position:
		| {
				shares: bigint;
				maxRedeem: bigint;
				estimatedAssets: bigint;
		  }
		| undefined;
	/** Whether any query is still loading. */
	isPending: boolean;
	/** Combined error from any query. */
	error: Error | null;
};

/**
 * All-in-one hook for triple on-chain state.
 *
 * Given a triple term ID, this hook:
 * 1. Checks if the triple exists on-chain
 * 2. Reads the subject, predicate, and object atom IDs
 * 3. Reads vault state (totalAssets, totalShares, sharePrice)
 * 4. Optionally reads the user's position (shares, maxRedeem, estimatedAssets)
 *
 * @param tripleTermId - The term ID (bytes32 hex) of the triple.
 * @param options - Optional settings for account, curveId, chainId, enabled.
 *
 * @example
 * ```tsx
 * import { useTripleState } from '@0xintuition/react'
 *
 * function TripleInfo({ tripleId }: { tripleId: Hex }) {
 *   const { isTriple, subjectId, predicateId, objectId, vault, position, isPending } =
 *     useTripleState(tripleId, { account: connectedAddress })
 *
 *   if (isPending) return <Spinner />
 *   if (!isTriple) return <p>Triple not found</p>
 *
 *   return (
 *     <div>
 *       <p>Subject: {subjectId}</p>
 *       <p>Predicate: {predicateId}</p>
 *       <p>Object: {objectId}</p>
 *       <p>Total staked: {formatEther(vault.totalAssets)}</p>
 *       <p>Your shares: {position?.shares.toString()}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTripleState(
	tripleTermId: Hex,
	options?: UseTripleStateOptions
): UseTripleStateReturn {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const enabled = options?.enabled !== false;

	// Read bonding curve config to resolve default curve ID
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

	// Batch read: isTriple, getTriple, getVault, currentSharePrice
	const coreContracts =
		curveId !== undefined
			? ([
					{
						address: multivaultAddress,
						abi: MultiVaultAbi,
						functionName: 'isTriple',
						args: [tripleTermId],
						chainId,
					},
					{
						address: multivaultAddress,
						abi: MultiVaultAbi,
						functionName: 'getTriple',
						args: [tripleTermId],
						chainId,
					},
					{
						address: multivaultAddress,
						abi: MultiVaultAbi,
						functionName: 'getVault',
						args: [tripleTermId, curveId],
						chainId,
					},
					{
						address: multivaultAddress,
						abi: MultiVaultAbi,
						functionName: 'currentSharePrice',
						args: [tripleTermId, curveId],
						chainId,
					},
				] as const)
			: undefined;

	const coreResults = useReadContracts({
		contracts: coreContracts,
		query: {
			enabled: enabled && curveId !== undefined,
		},
	});

	// Read user position if account is provided
	const account = options?.account;
	const positionContracts =
		curveId !== undefined && account
			? ([
					{
						address: multivaultAddress,
						abi: MultiVaultAbi,
						functionName: 'getShares',
						args: [account, tripleTermId, curveId],
						chainId,
					},
					{
						address: multivaultAddress,
						abi: MultiVaultAbi,
						functionName: 'maxRedeem',
						args: [account, tripleTermId, curveId],
						chainId,
					},
				] as const)
			: undefined;

	const positionResults = useReadContracts({
		contracts: positionContracts,
		query: {
			enabled: enabled && curveId !== undefined && !!account,
		},
	});

	// For estimated assets, we need the user's shares first
	const userShares =
		positionResults.data?.[0]?.status === 'success'
			? (positionResults.data[0].result as bigint)
			: undefined;

	const assetConversion = useReadContracts({
		contracts:
			curveId !== undefined && userShares !== undefined && userShares > 0n
				? [
						{
							address: multivaultAddress,
							abi: MultiVaultAbi,
							functionName: 'convertToAssets',
							args: [tripleTermId, curveId, userShares],
							chainId,
						},
					]
				: undefined,
		query: {
			enabled: enabled && curveId !== undefined && userShares !== undefined && userShares > 0n,
		},
	});

	// Parse core results
	const isTriple =
		coreResults.data?.[0]?.status === 'success'
			? (coreResults.data[0].result as boolean)
			: undefined;

	const tripleData =
		coreResults.data?.[1]?.status === 'success'
			? (coreResults.data[1].result as readonly [Hex, Hex, Hex])
			: undefined;

	const vault =
		coreResults.data &&
		coreResults.data[2]?.status === 'success' &&
		coreResults.data[3]?.status === 'success'
			? (() => {
					const vaultTotals = multiVaultResolveVaultTotals(coreResults.data[2].result);
					const sharePrice = coreResults.data[3].result as bigint;
					return {
						totalAssets: vaultTotals.totalAssets,
						totalShares: vaultTotals.totalShares,
						sharePrice,
					} satisfies VaultState;
				})()
			: undefined;

	const position =
		account &&
		positionResults.data &&
		positionResults.data[0]?.status === 'success' &&
		positionResults.data[1]?.status === 'success'
			? {
					shares: positionResults.data[0].result as bigint,
					maxRedeem: positionResults.data[1].result as bigint,
					estimatedAssets:
						userShares && userShares > 0n && assetConversion.data?.[0]?.status === 'success'
							? (assetConversion.data[0].result as bigint)
							: 0n,
				}
			: undefined;

	const isPending =
		bondingCurveConfig.isPending ||
		coreResults.isPending ||
		(account ? positionResults.isPending || assetConversion.isPending : false);

	const error =
		bondingCurveConfig.error ??
		coreResults.error ??
		positionResults.error ??
		assetConversion.error ??
		null;

	return {
		termId: tripleTermId,
		isTriple,
		subjectId: tripleData?.[0],
		predicateId: tripleData?.[1],
		objectId: tripleData?.[2],
		vault,
		position,
		isPending,
		error,
	};
}
