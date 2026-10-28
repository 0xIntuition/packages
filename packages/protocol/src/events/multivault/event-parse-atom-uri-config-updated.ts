import type { ParseEventLogsReturnType } from 'viem';
import { type Address, type Hex, type PublicClient, parseEventLogs } from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import { receiptLogs } from '../receipt-logs.js';

/** Waits for a receipt and parses atom URI configuration updates. */
export async function eventParseAtomUriConfigUpdated(
	client: PublicClient,
	hash: Hex,
	address: Address | undefined = undefined
): Promise<EventParseAtomUriConfigUpdatedResult> {
	const logs = await receiptLogs(client, hash, address);
	return parseEventLogs({ abi: MultiVaultAbi, logs, eventName: 'AtomUriConfigUpdated' });
}

export type EventParseAtomUriConfigUpdatedResult = ParseEventLogsReturnType<
	typeof MultiVaultAbi,
	'AtomUriConfigUpdated',
	true
>;
