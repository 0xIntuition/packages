import { type Address, type Hex, type Log, type PublicClient, parseEventLogs } from 'viem';
import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import { receiptLogs } from '../receipt-logs.js';

/**
 * Waits for a transaction receipt and parses RedeemFeeRerouted events.
 * @param client Public viem client used to fetch the receipt and logs.
 * @param hash Transaction hash to inspect.
 * @returns Parsed RedeemFeeRerouted event logs, one per eligible tier visited when an exiting-tier
 *          slice walks beyond its own tier; several events in one redeem can share the same exit
 *          tier, each carrying the amount that tier took, which is zero when its cohort was
 *          already at its fill.
 * @throws Error if the transaction reverted.
 */
export async function eventParseRedeemFeeRerouted(
	client: PublicClient,
	hash: Hex,
	address: Address | undefined = undefined
) {
	const logs = await receiptLogs(client, hash, address);

	const events = parseEventLogs({
		abi: DynamicFeeFlatPriceCurveAbi,
		logs,
		eventName: 'RedeemFeeRerouted',
	});

	return events;
}

/**
 * Decodes RedeemFeeRerouted events out of logs already in hand.
 *
 * The `eventParse*` counterpart starts from a transaction hash, which only works for a transaction
 * this process just sent. An indexer or a log tail has the logs and no hash to wait on, so it needs
 * the decode step on its own.
 * @param logs Logs to decode; anything that is not this event is ignored.
 * @returns Decoded RedeemFeeRerouted event logs.
 */
export function eventDecodeRedeemFeeRerouted(logs: Log[]) {
	return parseEventLogs({
		abi: DynamicFeeFlatPriceCurveAbi,
		logs,
		eventName: 'RedeemFeeRerouted',
	});
}
