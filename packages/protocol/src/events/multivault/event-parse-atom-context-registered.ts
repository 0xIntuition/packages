import type { ParseEventLogsReturnType } from 'viem';
import { type Address, type Hex, type PublicClient, parseEventLogs } from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import { receiptLogs } from '../receipt-logs.js';

/** Waits for a receipt and parses ordered opaque atom context events. */
export async function eventParseAtomContextRegistered(
	client: PublicClient,
	hash: Hex,
	address: Address | undefined = undefined
): Promise<EventParseAtomContextRegisteredResult> {
	const logs = await receiptLogs(client, hash, address);
	return parseEventLogs({ abi: MultiVaultAbi, logs, eventName: 'AtomContextRegistered' });
}

export type EventParseAtomContextRegisteredResult = ParseEventLogsReturnType<
	typeof MultiVaultAbi,
	'AtomContextRegistered',
	true
>;
