import { keccak256 } from 'viem';

const encoder = new TextEncoder();

/**
 * First 16 bytes of keccak256 over the UTF-8 encoding of `input`, as
 * lowercase hex without a 0x prefix (spec §5: 128 bits, matching the
 * existing `@0xintuition/ids` toolchain).
 */
export function keccak16(input: string): string {
	return keccak256(encoder.encode(input)).slice(2, 34);
}
