import {
	type Address,
	type ContractEventName,
	type Hex,
	type PublicClient,
	parseEventLogs,
} from 'viem';
import { MultiVaultAbi } from '../../contracts/abis';
import { receiptLogs } from '../receipt-logs.js';

/**
 * Waits for a transaction receipt and parses a specific MultiVault event.
 * @param client Public viem client used to fetch the receipt and logs.
 * @param hash Transaction hash to inspect.
 * @param eventName Event name to filter for in the receipt logs.
 * @param address Expected emitting contract; omit only for receipt-wide discovery.
 * @returns Parsed event logs for the requested event name.
 * @throws Error if the transaction reverted.
 */
export async function eventParse(
	client: PublicClient,
	hash: Hex,
	eventName: ContractEventName<typeof MultiVaultAbi>,
	address: Address | undefined = undefined
) {
	const logs = await receiptLogs(client, hash, address);

	const events = parseEventLogs({
		abi: MultiVaultAbi,
		logs,
		eventName,
	});

	return events;
}
