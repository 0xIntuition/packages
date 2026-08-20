import { type Hex, type PublicClient, parseEventLogs } from 'viem';

import { MultiVaultAbi } from '../../contracts/MultiVault-abi.js';

/** Waits for a receipt and parses ordered opaque atom context events. */
export async function eventParseAtomContextRegistered(client: PublicClient, hash: Hex) {
	const { logs, status } = await client.waitForTransactionReceipt({ hash });
	if (status === 'reverted') {
		throw new Error('Transaction reverted');
	}
	return parseEventLogs({ abi: MultiVaultAbi, logs, eventName: 'AtomContextRegistered' });
}
