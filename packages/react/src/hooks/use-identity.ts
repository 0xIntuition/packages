'use client';

import { calculateAtomId, calculateTripleId } from '@0xintuition/ids';
import { MultiVaultAbi } from '@0xintuition/protocol';
import { useMemo } from 'react';
import type { Hex } from 'viem';
import { useReadContract } from 'wagmi';

import { useChainConfig } from '../provider';

/**
 * Computes a deterministic atom ID from raw atom data, entirely client-side.
 *
 * Uses the same keccak256-based algorithm as the on-chain `calculateAtomId`
 * function, so the result matches what the MultiVault contract would return.
 *
 * @param atomData - The atom data as a hex string or plain UTF-8 string.
 *                   Pass `undefined` or empty string to get `undefined` back.
 *
 * @example
 * ```tsx
 * const atomId = useAtomId('hello-world')
 * // atomId is a Hex string like '0xabcd...'
 *
 * const atomIdFromHex = useAtomId('0x68656c6c6f')
 * ```
 */
export function useAtomId(atomData: Hex | string | undefined): Hex | undefined {
	return useMemo(() => {
		if (!atomData) {
			return undefined;
		}
		return calculateAtomId(atomData);
	}, [atomData]);
}

/**
 * Computes a deterministic triple ID from subject, predicate, and object atom IDs,
 * entirely client-side.
 *
 * All three parameters must be atom IDs (bytes32 hex strings), not raw atom data.
 * Use {@link useAtomId} first if you need to derive atom IDs from raw data.
 *
 * @param subjectId - The subject atom ID (bytes32 hex).
 * @param predicateId - The predicate atom ID (bytes32 hex).
 * @param objectId - The object atom ID (bytes32 hex).
 *
 * @example
 * ```tsx
 * const subjectId = useAtomId('Alice')
 * const predicateId = useAtomId('follows')
 * const objectId = useAtomId('Bob')
 * const tripleId = useTripleId(subjectId, predicateId, objectId)
 * ```
 */
export function useTripleId(
	subjectId: Hex | undefined,
	predicateId: Hex | undefined,
	objectId: Hex | undefined
): Hex | undefined {
	return useMemo(() => {
		if (!subjectId || !predicateId || !objectId) {
			return undefined;
		}
		return calculateTripleId(subjectId, predicateId, objectId);
	}, [subjectId, predicateId, objectId]);
}

/**
 * Computes a deterministic atom ID on-chain by calling the MultiVault contract's
 * `calculateAtomId` pure function.
 *
 * This is useful for verification purposes. In most cases, prefer the pure
 * client-side {@link useAtomId} hook, which avoids a network call and produces
 * the same result.
 *
 * @param atomData - The atom data as a hex string.
 * @param options - Optional settings.
 * @param options.enabled - Whether the query is enabled.
 *
 * @example
 * ```tsx
 * const { data: onchainId } = useAtomIdOnchain('0x68656c6c6f')
 * ```
 */
export function useAtomIdOnchain(
	atomData: Hex | undefined,
	options?: { chainId?: number; enabled?: boolean }
) {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const enabled = options?.enabled !== false && atomData !== undefined;

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'calculateAtomId',
		args: atomData ? [atomData] : undefined,
		chainId,
		query: { enabled },
	});
}

/**
 * Computes a deterministic triple ID on-chain by calling the MultiVault contract's
 * `calculateTripleId` pure function.
 *
 * In most cases, prefer the pure client-side {@link useTripleId} hook.
 *
 * @param subjectId - The subject atom ID (bytes32 hex).
 * @param predicateId - The predicate atom ID (bytes32 hex).
 * @param objectId - The object atom ID (bytes32 hex).
 * @param options - Optional settings.
 * @param options.enabled - Whether the query is enabled.
 *
 * @example
 * ```tsx
 * const { data: onchainTripleId } = useTripleIdOnchain(subjectId, predicateId, objectId)
 * ```
 */
export function useTripleIdOnchain(
	subjectId: Hex | undefined,
	predicateId: Hex | undefined,
	objectId: Hex | undefined,
	options?: { chainId?: number; enabled?: boolean }
) {
	const { multivaultAddress, chainId } = useChainConfig(options?.chainId);
	const enabled =
		options?.enabled !== false &&
		subjectId !== undefined &&
		predicateId !== undefined &&
		objectId !== undefined;

	return useReadContract({
		address: multivaultAddress,
		abi: MultiVaultAbi,
		functionName: 'calculateTripleId',
		args: subjectId && predicateId && objectId ? [subjectId, predicateId, objectId] : undefined,
		chainId,
		query: { enabled },
	});
}
