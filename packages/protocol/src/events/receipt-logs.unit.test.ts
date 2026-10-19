import type { Address, Hex, Log, PublicClient } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import { receiptLogs } from './receipt-logs.js';

const address = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Address;
const other = '0x1111111111111111111111111111111111111111' as Address;
const hash = `0x${'aa'.repeat(32)}` as Hex;

describe('receipt emitter filtering', () => {
	it('keeps order and compares addresses case-insensitively, even through a router', async () => {
		const logs = [{ address: other }, { address: address.toUpperCase() }, { address }] as Log[];
		const waitForTransactionReceipt = vi
			.fn()
			.mockResolvedValue({ status: 'success', to: other, logs });
		const client = { waitForTransactionReceipt } as unknown as PublicClient;
		expect(await receiptLogs(client, hash, address)).toEqual(logs.slice(1));
		expect(await receiptLogs(client, hash)).toEqual(logs);
		expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash });
	});
	it('returns no logs for an unmatched emitter', async () => {
		const client = {
			waitForTransactionReceipt: async () => ({ status: 'success', logs: [{ address: other }] }),
		} as unknown as PublicClient;
		expect(await receiptLogs(client, hash, address)).toEqual([]);
	});
	it('rejects a reverted receipt before considering logs', async () => {
		const client = {
			waitForTransactionReceipt: async () => ({ status: 'reverted', logs: [{ address }] }),
		} as unknown as PublicClient;
		await expect(receiptLogs(client, hash, address)).rejects.toThrow('Transaction reverted');
	});
});
