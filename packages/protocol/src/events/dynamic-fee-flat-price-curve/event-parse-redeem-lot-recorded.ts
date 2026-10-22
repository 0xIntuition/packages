import { type Address, type Hex, type Log, type PublicClient, parseEventLogs } from 'viem';
import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import { receiptLogs } from '../receipt-logs.js';

/**
 * Decodes RedeemLotRecorded events out of logs already in hand.
 *
 * The `eventParse*` counterpart starts from a transaction hash, which only works for a transaction
 * this process just sent. An indexer or a log tail has the logs and no hash to wait on, so it needs
 * the decode step on its own.
 * @param logs Logs to decode; anything that is not this event is ignored.
 * @returns Decoded RedeemLotRecorded event logs, one per lot a redeem drew from, highest tier first.
 */
export function eventDecodeRedeemLotRecorded(logs: Log[]) {
	return parseEventLogs({
		abi: DynamicFeeFlatPriceCurveAbi,
		logs,
		eventName: 'RedeemLotRecorded',
	});
}

/**
 * Waits for a transaction receipt and parses RedeemLotRecorded events.
 * @param client Public viem client used to fetch the receipt and logs.
 * @param hash Transaction hash to inspect.
 * @returns Parsed RedeemLotRecorded event logs, one per lot a redeem drew from, highest tier first.
 * @throws Error if the transaction reverted.
 */
export async function eventParseRedeemLotRecorded(
	client: PublicClient,
	hash: Hex,
	address: Address | undefined = undefined
) {
	const logs = await receiptLogs(client, hash, address);

	const events = parseEventLogs({
		abi: DynamicFeeFlatPriceCurveAbi,
		logs,
		eventName: 'RedeemLotRecorded',
	});

	return events;
}
