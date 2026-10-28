import type { ParseEventLogsReturnType } from 'viem';
import { type Address, type Hex, type PublicClient, parseEventLogs } from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import { receiptLogs } from '../receipt-logs.js';

/**
 * Waits for a transaction receipt and parses GeneralConfigUpdated events.
 * @param client Public viem client used to fetch the receipt and logs.
 * @param hash Transaction hash to inspect.
 * @param address Expected emitting contract; omit only for receipt-wide discovery.
 * @returns Parsed GeneralConfigUpdated event logs.
 * @throws Error if the transaction reverted.
 */
export async function eventParseGeneralConfigUpdated(
	client: PublicClient,
	hash: Hex,
	address: Address | undefined = undefined
): Promise<EventParseGeneralConfigUpdatedResult> {
	const logs = await receiptLogs(client, hash, address);

	const events = parseEventLogs({
		abi: MultiVaultAbi,
		logs,
		eventName: 'GeneralConfigUpdated',
	});

	return events;
}

export type EventParseGeneralConfigUpdatedResult = ParseEventLogsReturnType<
	typeof MultiVaultAbi,
	'GeneralConfigUpdated',
	true
>;
