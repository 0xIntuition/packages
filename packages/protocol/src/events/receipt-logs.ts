import type { Address, Hex, PublicClient } from 'viem';

/** Match the emitter, not the transaction recipient (which may be a router). */
export async function receiptLogs(client: PublicClient, hash: Hex, address?: Address) {
	const { logs, status } = await client.waitForTransactionReceipt({ hash });
	if (status === 'reverted') throw new Error('Transaction reverted');
	return address ? logs.filter((log) => log.address.toLowerCase() === address.toLowerCase()) : logs;
}
