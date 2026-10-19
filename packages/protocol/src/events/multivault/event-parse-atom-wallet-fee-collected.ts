import { type Address, type Hex, type PublicClient, parseEventLogs } from 'viem';
import { MultiVaultAbi } from '../../contracts/MultiVault-abi.js';
import { receiptLogs } from '../receipt-logs.js';

/**
 * Waits for a transaction receipt and parses AtomWalletDepositFeeCollected events.
 * @param client Public viem client used to fetch the receipt and logs.
 * @param hash Transaction hash to inspect.
 * @param address Expected emitting contract; omit only for receipt-wide discovery.
 * @returns Parsed AtomWalletDepositFeeCollected event logs.
 * @throws Error if the transaction reverted.
 */
export async function eventParseAtomWalletDepositFeeCollected(
	client: PublicClient,
	hash: Hex,
	address: Address | undefined = undefined
) {
	const logs = await receiptLogs(client, hash, address);

	const events = parseEventLogs({
		abi: MultiVaultAbi,
		logs,
		eventName: 'AtomWalletDepositFeeCollected',
	});

	return events;
}
