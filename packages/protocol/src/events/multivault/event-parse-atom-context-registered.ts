import { type Address, type Hex, type PublicClient, parseEventLogs } from 'viem';
import { MultiVaultAbi } from '../../contracts';
import { receiptLogs } from '../receipt-logs.js';

/** Waits for a receipt and parses ordered opaque atom context events. */
export async function eventParseAtomContextRegistered(
	client: PublicClient,
	hash: Hex,
	address: Address | undefined = undefined
) {
	const logs = await receiptLogs(client, hash, address);
	return parseEventLogs({ abi: MultiVaultAbi, logs, eventName: 'AtomContextRegistered' });
}
