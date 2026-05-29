import type { Hex } from 'viem';

import { COUNTER_SALT, hashPacked, TRIPLE_SALT } from './hash';
import type { CounterTripleId, TripleId } from './types';

/**
 * Compute a deterministic triple ID from subject, predicate, and object atom IDs.
 *
 * The algorithm mirrors the on-chain derivation:
 * `keccak256(encodePacked(TRIPLE_SALT, subjectId, predicateId, objectId))`
 *
 * @param subjectId - The subject atom ID (bytes32).
 * @param predicateId - The predicate atom ID (bytes32).
 * @param objectId - The object atom ID (bytes32).
 * @returns A branded {@link TripleId} (keccak256 hash).
 *
 * @example
 * ```ts
 * const tripleId = calculateTripleId(
 *   '0x05bb6d28ed5ca3c5206f33f5818da27b3b0bbf6401cd40f082e8db7fcf481787', // Alice
 *   '0xdb3dc8c92d6141c4e0c9b453b00fc1f237624ef8373b6ae9972d09557d8aaa8d', // follow
 *   '0x39afce29ac0e4be2400fa0421b537f63ad2d78d7f8b4be4ff839a162ff3e5ffc', // Bob
 * )
 * // 0x57946a02776dbd4eec339ecf5cdf6e0005b8de381fb3d9a2bf303da083bf5166
 * ```
 */
export function calculateTripleId(subjectId: Hex, predicateId: Hex, objectId: Hex): TripleId {
	return hashPacked(
		['bytes32', 'bytes32', 'bytes32', 'bytes32'],
		[TRIPLE_SALT, subjectId, predicateId, objectId]
	) as TripleId;
}

/**
 * Compute a deterministic counter-triple ID from a triple ID.
 *
 * The counter-triple is the logical negation of a triple. Its ID is derived as:
 * `keccak256(encodePacked(COUNTER_SALT, tripleId))`
 *
 * @param tripleId - The triple ID to derive the counter from (bytes32).
 * @returns A branded {@link CounterTripleId} (keccak256 hash).
 *
 * @example
 * ```ts
 * const counterTripleId = calculateCounterTripleId(
 *   '0x57946a02776dbd4eec339ecf5cdf6e0005b8de381fb3d9a2bf303da083bf5166',
 * )
 * // 0x37030799932a0f63d305920571227642a8da3258475a032071109e4031254d23
 * ```
 */
export function calculateCounterTripleId(tripleId: Hex): CounterTripleId {
	return hashPacked(['bytes32', 'bytes32'], [COUNTER_SALT, tripleId]) as CounterTripleId;
}
