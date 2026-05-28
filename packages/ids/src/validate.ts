import type { Hex } from 'viem';
import { isHex } from 'viem';

import type { AtomId, CounterTripleId, TripleId } from './types';

/**
 * The byte length of a keccak256 hash (32 bytes = 64 hex characters + `0x` prefix = 66 chars).
 */
const KECCAK256_HEX_LENGTH = 66;

/**
 * Check whether a string is a validly formatted atom ID.
 *
 * An atom ID is a 32-byte (66-character) hex string. This validates the format
 * only; it does **not** verify that the ID was correctly derived from any atom data.
 *
 * @param value - The string to validate.
 * @returns `true` if `value` is a 66-character hex string.
 *
 * @example
 * ```ts
 * isValidAtomId('0xa0e157e5fa1b17d3b54ec73622ce3317296920a06502661617613d59f58e947e')
 * // true
 *
 * isValidAtomId('0x1234')
 * // false (too short)
 *
 * isValidAtomId('not-hex')
 * // false
 * ```
 */
export function isValidAtomId(value: string): value is AtomId {
	return isHex(value, { strict: true }) && value.length === KECCAK256_HEX_LENGTH;
}

/**
 * Check whether a string is a validly formatted triple ID.
 *
 * A triple ID has the same byte format as an atom ID (32-byte keccak256 hash).
 * This validates the format only; it does **not** verify derivation correctness.
 *
 * @param value - The string to validate.
 * @returns `true` if `value` is a 66-character hex string.
 *
 * @example
 * ```ts
 * isValidTripleId('0x57946a02776dbd4eec339ecf5cdf6e0005b8de381fb3d9a2bf303da083bf5166')
 * // true
 *
 * isValidTripleId('hello')
 * // false
 * ```
 */
export function isValidTripleId(value: string): value is TripleId {
	return isHex(value, { strict: true }) && value.length === KECCAK256_HEX_LENGTH;
}

/**
 * Check whether a string is a validly formatted counter-triple ID.
 *
 * A counter-triple ID has the same byte format as a triple or atom ID.
 * This validates the format only.
 *
 * @param value - The string to validate.
 * @returns `true` if `value` is a 66-character hex string.
 *
 * @example
 * ```ts
 * isValidCounterTripleId('0x37030799932a0f63d305920571227642a8da3258475a032071109e4031254d23')
 * // true
 * ```
 */
export function isValidCounterTripleId(value: string): value is CounterTripleId {
	return isHex(value, { strict: true }) && value.length === KECCAK256_HEX_LENGTH;
}

/**
 * Assert that a hex string has valid keccak256 format (32 bytes).
 *
 * Throws an error with a descriptive message if validation fails.
 *
 * @param value - The string to check.
 * @param label - An optional label for the error message (e.g. `"atom ID"`, `"triple ID"`).
 * @returns The value cast to {@link Hex} if valid.
 * @throws {Error} If the value is not a valid 32-byte hex string.
 *
 * @example
 * ```ts
 * assertValidHash('0xa0e157...', 'atom ID')
 * // returns '0xa0e157...' as Hex
 *
 * assertValidHash('0x1234', 'atom ID')
 * // throws Error: Invalid atom ID: expected 66-character hex string, got 6 characters
 * ```
 */
export function assertValidHash(value: string, label = 'hash'): Hex {
	if (!isHex(value, { strict: true })) {
		throw new Error(`Invalid ${label}: expected hex string starting with 0x`);
	}
	if (value.length !== KECCAK256_HEX_LENGTH) {
		throw new Error(
			`Invalid ${label}: expected ${KECCAK256_HEX_LENGTH}-character hex string, got ${value.length} characters`
		);
	}
	return value;
}
