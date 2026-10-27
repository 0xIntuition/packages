import type { ParseEventLogsReturnType } from 'viem';
import { type Address, type Hex, type PublicClient, parseEventLogs } from 'viem';
import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import { receiptLogs } from '../receipt-logs.js';

/**
 * Waits for a transaction receipt and parses Claimed events.
 * @param client Public viem client used to fetch the receipt and logs.
 * @param hash Transaction hash to inspect.
 * @param address Expected emitting contract; omit only for receipt-wide discovery.
 * @returns Parsed Claimed event logs.
 * @throws Error if the transaction reverted.
 */
export async function eventParseClaimed(
	client: PublicClient,
	hash: Hex,
	address: Address | undefined = undefined
): Promise<EventParseClaimedResult> {
	const logs = await receiptLogs(client, hash, address);

	const events = parseEventLogs({
		abi: DynamicFeeFlatPriceCurveAbi,
		logs,
		eventName: 'Claimed',
	});

	return events;
}

export type EventParseClaimedResult = ParseEventLogsReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'Claimed',
	true
>;
