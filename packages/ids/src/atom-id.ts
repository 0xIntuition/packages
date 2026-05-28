import type { Hex } from 'viem';
import { isHex, keccak256, toHex } from 'viem';

import { ATOM_SALT, hashPacked } from './hash';
import type { AtomId } from './types';

/**
 * Compute a deterministic atom ID from raw atom data.
 *
 * The algorithm mirrors the on-chain derivation:
 * 1. Convert `atomData` to hex if it is a plain string.
 * 2. Hash the hex data with keccak256.
 * 3. Pack `[ATOM_SALT, keccak256(data)]` and hash again.
 *
 * The result is deterministic: identical atom data always produces
 * the same ID regardless of caller or timestamp.
 *
 * @param atomData - Raw atom data as a hex string or a UTF-8 string.
 * @returns A branded {@link AtomId} (keccak256 hash).
 *
 * @example
 * ```ts
 * calculateAtomId('hello')
 * // 0xa0e157e5fa1b17d3b54ec73622ce3317296920a06502661617613d59f58e947e
 *
 * calculateAtomId('0xdeadbeef')
 * // 0x444dc47f4010ae803416db4686d7b543a905ff9818e1236ed43b41f314fa42d2
 * ```
 */
export function calculateAtomId(atomData: Hex | string): AtomId {
	const data: Hex = isHex(atomData) ? atomData : toHex(atomData);
	return hashPacked(['bytes32', 'bytes'], [ATOM_SALT, keccak256(data)]) as AtomId;
}
