import type { ParseEventLogsReturnType } from 'viem';
import { type Address, type Hex, type PublicClient, parseEventLogs } from 'viem';
import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/abis';
import { receiptLogs } from '../receipt-logs.js';

/**
 * Waits for a transaction receipt and parses DepositBandRecorded events.
 * @param client Public viem client used to fetch the receipt and logs.
 * @param hash Transaction hash to inspect.
 * @param address Expected emitting contract; omit only for receipt-wide discovery.
 * @returns Parsed DepositBandRecorded event logs, one per band a deposit traversed.
 * @throws Error if the transaction reverted.
 */
export async function eventParseDepositBandRecorded(
	client: PublicClient,
	hash: Hex,
	address: Address | undefined = undefined
): Promise<EventParseDepositBandRecordedResult> {
	const logs = await receiptLogs(client, hash, address);

	const events = parseEventLogs({
		abi: DynamicFeeFlatPriceCurveAbi,
		logs,
		eventName: 'DepositBandRecorded',
	});

	return events;
}

export type EventParseDepositBandRecordedResult = ParseEventLogsReturnType<
	typeof DynamicFeeFlatPriceCurveAbi,
	'DepositBandRecorded',
	true
>;
