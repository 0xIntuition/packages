import { type Hex, type PublicClient, parseEventLogs } from 'viem';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts/DynamicFeeFlatPriceCurve-abi';

/**
 * Waits for a transaction receipt and parses Claimed events.
 * @param client Public viem client used to fetch the receipt and logs.
 * @param hash Transaction hash to inspect.
 * @returns Parsed Claimed event logs.
 * @throws Error if the transaction reverted.
 */
export async function eventParseClaimed(client: PublicClient, hash: Hex) {
	const { logs, status } = await client.waitForTransactionReceipt({ hash });

	if (status === 'reverted') {
		throw new Error('Transaction reverted');
	}

	const events = parseEventLogs({
		abi: DynamicFeeFlatPriceCurveAbi,
		logs,
		eventName: 'Claimed',
	});

	return events;
}
