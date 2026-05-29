'use client';

import { calculateAtomId } from '@0xintuition/ids';
import {
	MultiVaultAbi,
	multiVaultResolveDefaultCurveId,
	multiVaultResolveVaultTotals,
} from '@0xintuition/protocol';
import { useMemo } from 'react';
import type { Address, Hex } from 'viem';
import { isHex, stringToHex } from 'viem';
import { useReadContract, useReadContracts } from 'wagmi';

import { useChainConfig } from '../provider';
import type { VaultState } from '../types';

/**
 * Options for {@link useAtomState}.
 */
type UseAtomStateOptions = {
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
 * Return type for {@link useAtomState}.
 */
type UseAtomStateReturn = {
	/** The computed term ID for the atom data. */
	termId: Hex | undefined;
	/** Whether the atom exists on-chain. */
	isAtom: boolean | undefined;
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
 * Normalizes raw atom data string to a hex representation.
 * If the string is already hex, returns it as-is.
 * Otherwise, encodes it as UTF-8 hex.
 */
function atomDataToHex(atomData: string): Hex {
	const trimmed = atomData.trim();
	if (isHex(trimmed)) {
		return trimmed;
	}
	return stringToHex(trimmed);
}

/**
 * All-in-one hook: raw atom data string -> full on-chain state.
 *
 * Given a raw atom data string, this hook:
 * 1. Computes the term ID deterministically (client-side)
 * 2. Checks if the atom exists on-chain
 * 3. Reads vault state (totalAssets, totalShares, sharePrice)
 * 4. Optionally reads the user's position (shares, maxRedeem, estimatedAssets)
 *
 * This replaces the ~180-line `useAtomOnchainState` pattern in the web app
 * with a single composable hook.
 *
 * @param atomData - Raw atom data as a string (UTF-8 or hex). Pass empty string
 *                   or undefined to disable queries.
 * @param options - Optional settings for account, curveId, chainId, enabled.
 *
 * @example
 * ```tsx
 * import { useAtomState } from '@0xintuition/react'
 *
 * function AtomInfo({ atomData }: { atomData: string }) {
 *   const { termId, isAtom, vault, position, isPending } = useAtomState(atomData, {
 *     account: connectedAddress,
 *   })
 *
 *   if (isPending) return <Spinner />
 *   if (!isAtom) return <p>Atom not created yet (termId: {termId})</p>
 *
 *   return (
 *     <div>
 *       <p>Total staked: {formatEther(vault.totalAssets)}</p>
 *       <p>Your shares: {position?.shares.toString()}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useAtomState(
	atomData: string | undefined,
	options?: UseAtomStateOptions
): UseAtomStateReturn {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const enabled = options?.enabled !== false && !!atomData?.trim();

	// Step 1: Compute term ID client-side
	const termId = useMemo(() => {
		if (!atomData?.trim()) {
			return undefined;
		}
		return calculateAtomId(atomData.trim());
	}, [atomData]);

	// Step 2: Read bonding curve config to resolve default curve ID
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

	// Step 3: Batch read atom existence, vault totals, and share price
	const coreContracts =
		termId && curveId !== undefined
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

	const coreResults = useReadContracts({
		contracts: coreContracts,
		query: {
			enabled: enabled && termId !== undefined && curveId !== undefined,
		},
	});

	// Step 4: Read user position if account is provided
	const account = options?.account;
	const positionContracts =
		termId && curveId !== undefined && account
			? ([
					{
						address: multivaultAddress,
						abi: MultiVaultAbi,
						functionName: 'getShares',
						args: [account, termId, curveId],
						chainId,
					},
					{
						address: multivaultAddress,
						abi: MultiVaultAbi,
						functionName: 'maxRedeem',
						args: [account, termId, curveId],
						chainId,
					},
				] as const)
			: undefined;

	const positionResults = useReadContracts({
		contracts: positionContracts,
		query: {
			enabled: enabled && termId !== undefined && curveId !== undefined && !!account,
		},
	});

	// For estimated assets, we need the user's shares first
	const userShares =
		positionResults.data?.[0]?.status === 'success'
			? (positionResults.data[0].result as bigint)
			: undefined;

	const assetConversion = useReadContracts({
		contracts:
			termId && curveId !== undefined && userShares !== undefined && userShares > 0n
				? [
						{
							address: multivaultAddress,
							abi: MultiVaultAbi,
							functionName: 'convertToAssets',
							args: [termId, curveId, userShares],
							chainId,
						},
					]
				: undefined,
		query: {
			enabled:
				enabled &&
				termId !== undefined &&
				curveId !== undefined &&
				userShares !== undefined &&
				userShares > 0n,
		},
	});

	// Parse results
	const isAtom =
		coreResults.data?.[0]?.status === 'success'
			? (coreResults.data[0].result as boolean)
			: undefined;

	const vault =
		coreResults.data &&
		coreResults.data[1]?.status === 'success' &&
		coreResults.data[2]?.status === 'success'
			? (() => {
					const vaultTotals = multiVaultResolveVaultTotals(coreResults.data[1].result);
					const sharePrice = coreResults.data[2].result as bigint;
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
		termId,
		isAtom,
		vault,
		position,
		isPending,
		error,
	};
}
