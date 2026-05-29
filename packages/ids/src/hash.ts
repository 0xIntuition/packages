import type { Hex } from 'viem';
import { encodePacked, keccak256, toHex } from 'viem';

/**
 * Protocol-defined salt for atom ID derivation.
 *
 * Computed as `keccak256(toHex('ATOM_SALT'))`.
 *
 * @example
 * ```ts
 * ATOM_SALT // 0xc50959b2b0264fed58f3489f13cdf8345df0911245cc2b741070787ee7aceaa2
 * ```
 */
export const ATOM_SALT: Hex = keccak256(toHex('ATOM_SALT'));

/**
 * Protocol-defined salt for triple ID derivation.
 *
 * Computed as `keccak256(toHex('TRIPLE_SALT'))`.
 *
 * @example
 * ```ts
 * TRIPLE_SALT // 0x23ad11f0a1505378b82984192ad0461e6a012820fc5bf2e4ba16513f8e430552
 * ```
 */
export const TRIPLE_SALT: Hex = keccak256(toHex('TRIPLE_SALT'));

/**
 * Protocol-defined salt for counter-triple ID derivation.
 *
 * Computed as `keccak256(toHex('COUNTER_SALT'))`.
 *
 * @example
 * ```ts
 * COUNTER_SALT // 0xe7cbc1eb0e9b3f8688b0bc91a8278f7d2867f14f2a10dc3f0d9fcfdc32dada12
 * ```
 */
export const COUNTER_SALT: Hex = keccak256(toHex('COUNTER_SALT'));

/**
 * Compute keccak256 of packed ABI-encoded values.
 *
 * Thin wrapper around viem's `keccak256(encodePacked(...))` for readability.
 *
 * @param types - Solidity ABI types for packing.
 * @param values - Values to pack and hash.
 * @returns The keccak256 hash of the packed encoding.
 *
 * @example
 * ```ts
 * hashPacked(['bytes32', 'bytes32'], [salt, data])
 * // 0x...
 * ```
 */
export function hashPacked(
	types: Parameters<typeof encodePacked>[0],
	values: Parameters<typeof encodePacked>[1]
): Hex {
	return keccak256(encodePacked(types, values));
}

/**
 * Compute keccak256 of a raw hex value.
 *
 * @param data - Hex-encoded data to hash.
 * @returns The keccak256 hash.
 *
 * @example
 * ```ts
 * hashHex('0xdeadbeef')
 * // 0x...
 * ```
 */
export function hashHex(data: Hex): Hex {
	return keccak256(data);
}
