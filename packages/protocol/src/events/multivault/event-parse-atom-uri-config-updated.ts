import { type Address, type Hex, type PublicClient, parseEventLogs } from 'viem';
import { MultiVaultAbi } from '../../contracts/MultiVault-abi.js';
import { receiptLogs } from '../receipt-logs.js';

/** Waits for a receipt and parses atom URI configuration updates. */
export async function eventParseAtomUriConfigUpdated(
	client: PublicClient,
	hash: Hex,
	address: Address | undefined = undefined
) {
	const logs = await receiptLogs(client, hash, address);
	return parseEventLogs({ abi: MultiVaultAbi, logs, eventName: 'AtomUriConfigUpdated' });
}
