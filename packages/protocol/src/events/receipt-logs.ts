import type { Address, Hex, PublicClient, TransactionReceipt } from 'viem';

/** Match the emitter, not the transaction recipient (which may be a router). */
export async function receiptLogs(
	client: PublicClient,
	hash: Hex,
	address?: Address
): Promise<TransactionReceipt['logs']> {
	const { logs, status } = await client.waitForTransactionReceipt({ hash });
	if (status === 'reverted') throw new Error('Transaction reverted');
	return address ? logs.filter((log) => log.address.toLowerCase() === address.toLowerCase()) : logs;
}
