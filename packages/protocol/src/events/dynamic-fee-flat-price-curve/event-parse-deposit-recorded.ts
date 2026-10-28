import type { ParseEventLogsReturnType } from 'viem';
import { type Address, type Hex, type PublicClient, parseEventLogs } from 'viem';
import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import { receiptLogs } from '../receipt-logs.js';

/**
 * Waits for a transaction receipt and parses DepositRecorded events.
 * @param client Public viem client used to fetch the receipt and logs.
 * @param hash Transaction hash to inspect.
 * @param address Expected emitting contract; omit only for receipt-wide discovery.
 * @returns Parsed DepositRecorded event logs.
 * @throws Error if the transaction reverted.
 */
export async function eventParseDepositRecorded(
	client: PublicClient,
	hash: Hex,
	address: Address | undefined = undefined
): Promise<EventParseDepositRecordedResult> {
	const logs = await receiptLogs(client, hash, address);

	const events = parseEventLogs({
		abi: DynamicFeeFlatPriceCurveAbi,
		logs,
		eventName: 'DepositRecorded',
	});

	return events;
}

export type EventParseDepositRecordedResult = ParseEventLogsReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'DepositRecorded',
	true
>;
