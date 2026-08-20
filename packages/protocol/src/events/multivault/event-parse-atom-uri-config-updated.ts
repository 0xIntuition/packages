import { type Hex, type PublicClient, parseEventLogs } from 'viem';

import { MultiVaultAbi } from '../../contracts/MultiVault-abi.js';

/** Waits for a receipt and parses atom URI configuration updates. */
export async function eventParseAtomUriConfigUpdated(client: PublicClient, hash: Hex) {
	const { logs, status } = await client.waitForTransactionReceipt({ hash });
	if (status === 'reverted') {
		throw new Error('Transaction reverted');
	}
	return parseEventLogs({ abi: MultiVaultAbi, logs, eventName: 'AtomUriConfigUpdated' });
}
