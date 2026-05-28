import type { Hex } from 'viem';

/**
 * A branded hex string representing a deterministic atom ID.
 *
 * Atom IDs are derived by hashing atom data with a protocol-defined salt
 * using `keccak256(encodePacked(ATOM_SALT, keccak256(data)))`.
 *
 * @example
 * ```ts
 * const id = calculateAtomId('hello') // AtomId (0xa0e157...)
 * ```
 */
export type AtomId = Hex & { readonly __brand: 'AtomId' };

/**
 * A branded hex string representing a deterministic triple ID.
 *
 * Triple IDs are derived by hashing subject, predicate, and object atom IDs
 * with a protocol-defined salt using
 * `keccak256(encodePacked(TRIPLE_SALT, subjectId, predicateId, objectId))`.
 *
 * @example
 * ```ts
 * const id = calculateTripleId(subjectId, predicateId, objectId) // TripleId (0x5794...)
 * ```
 */
export type TripleId = Hex & { readonly __brand: 'TripleId' };

/**
 * A branded hex string representing a deterministic counter-triple ID.
 *
 * Counter-triple IDs are derived by hashing a triple ID with a protocol-defined salt
 * using `keccak256(encodePacked(COUNTER_SALT, tripleId))`.
 *
 * @example
 * ```ts
 * const id = calculateCounterTripleId(tripleId) // CounterTripleId (0x3703...)
 * ```
 */
export type CounterTripleId = Hex & { readonly __brand: 'CounterTripleId' };
