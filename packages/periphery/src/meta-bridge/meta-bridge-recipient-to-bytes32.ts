import { type Address, type Hex, toHex } from 'viem';

/**
 * Converts an EVM address into a zero-padded bytes32 recipient payload.
 */
export function metaBridgeRecipientToBytes32(recipient: Address): Hex {
	return toHex(BigInt(recipient), { size: 32 });
}
