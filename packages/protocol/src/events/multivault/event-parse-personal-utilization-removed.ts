import type { ParseEventLogsReturnType } from 'viem';
import { type Address, type Hex, type PublicClient, parseEventLogs } from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import { receiptLogs } from '../receipt-logs.js';

/**
 * Waits for a transaction receipt and parses PersonalUtilizationRemoved events.
 * @param client Public viem client used to fetch the receipt and logs.
 * @param hash Transaction hash to inspect.
 * @param address Expected emitting contract; omit only for receipt-wide discovery.
 * @returns Parsed PersonalUtilizationRemoved event logs.
 * @throws Error if the transaction reverted.
 */
export async function eventParsePersonalUtilizationRemoved(
	client: PublicClient,
	hash: Hex,
	address: Address | undefined = undefined
): Promise<EventParsePersonalUtilizationRemovedResult> {
	const logs = await receiptLogs(client, hash, address);

	const events = parseEventLogs({
		abi: MultiVaultAbi,
		logs,
		eventName: 'PersonalUtilizationRemoved',
	});

	return events;
}

export type EventParsePersonalUtilizationRemovedResult = ParseEventLogsReturnType<
	typeof MultiVaultAbi,
	'PersonalUtilizationRemoved',
	true
>;
