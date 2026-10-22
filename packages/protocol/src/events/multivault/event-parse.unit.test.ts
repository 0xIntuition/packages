import type { Hex, PublicClient } from 'viem';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
	eventParse,
	eventParseAtomConfigUpdate,
	eventParseAtomContextRegistered,
	eventParseAtomCreated,
	eventParseAtomUriConfigUpdated,
	eventParseAtomWalletDepositFeeCollected,
	eventParseAtomWalletDepositFeesClaimed,
	eventParseBondingCurveConfigUpdated,
	eventParseDeposited,
	eventParseGeneralConfigUpdated,
	eventParsePersonalUtilizationAdded,
	eventParsePersonalUtilizationRemoved,
	eventParseProtocolFeeAccrued,
	eventParseRedeemed,
	eventParseSharePriceChanged,
	eventParseTotalUtilizationAdded,
	eventParseTotalUtilizationRemoved,
	eventParseTripleCreated,
	eventParseVaultFeesUpdated,
	eventParseWalletConfigUpdated,
} from './index';

type ParserFn = (client: PublicClient, hash: Hex) => Promise<unknown[]>;

const hash = '0x0000000000000000000000000000000000000000000000000000000000000001' as Hex;

function createClient(status: 'success' | 'reverted') {
	const waitForTransactionReceipt = vi.fn().mockResolvedValue({
		logs: [],
		status,
	});

	return {
		client: {
			waitForTransactionReceipt,
		} as unknown as PublicClient,
		waitForTransactionReceipt,
	};
}

const parserCases: Array<{ name: string; fn: ParserFn }> = [
	{ name: 'eventParseAtomConfigUpdate', fn: eventParseAtomConfigUpdate },
	{ name: 'eventParseAtomContextRegistered', fn: eventParseAtomContextRegistered },
	{ name: 'eventParseAtomCreated', fn: eventParseAtomCreated },
	{
		name: 'eventParseAtomWalletDepositFeeCollected',
		fn: eventParseAtomWalletDepositFeeCollected,
	},
	{
		name: 'eventParseAtomWalletDepositFeesClaimed',
		fn: eventParseAtomWalletDepositFeesClaimed,
	},
	{ name: 'eventParseAtomUriConfigUpdated', fn: eventParseAtomUriConfigUpdated },
	{
		name: 'eventParseBondingCurveConfigUpdated',
		fn: eventParseBondingCurveConfigUpdated,
	},
	{ name: 'eventParseDeposited', fn: eventParseDeposited },
	{ name: 'eventParseGeneralConfigUpdated', fn: eventParseGeneralConfigUpdated },
	{ name: 'eventParsePersonalUtilizationAdded', fn: eventParsePersonalUtilizationAdded },
	{
		name: 'eventParsePersonalUtilizationRemoved',
		fn: eventParsePersonalUtilizationRemoved,
	},
	{ name: 'eventParseProtocolFeeAccrued', fn: eventParseProtocolFeeAccrued },
	{ name: 'eventParseRedeemed', fn: eventParseRedeemed },
	{ name: 'eventParseSharePriceChanged', fn: eventParseSharePriceChanged },
	{ name: 'eventParseTotalUtilizationAdded', fn: eventParseTotalUtilizationAdded },
	{
		name: 'eventParseTotalUtilizationRemoved',
		fn: eventParseTotalUtilizationRemoved,
	},
	{ name: 'eventParseTripleCreated', fn: eventParseTripleCreated },
	{ name: 'eventParseVaultFeesUpdated', fn: eventParseVaultFeesUpdated },
	{ name: 'eventParseWalletConfigUpdated', fn: eventParseWalletConfigUpdated },
];

beforeEach(() => {
	vi.clearAllMocks();
});

describe('MultiVault event parser wrappers', () => {
	it('exports parser helpers from index', () => {
		expect(typeof eventParse).toBe('function');
		expect(typeof eventParseAtomCreated).toBe('function');
		expect(typeof eventParseDeposited).toBe('function');
		expect(typeof eventParseRedeemed).toBe('function');
		expect(typeof eventParseTripleCreated).toBe('function');
	});

	it.each(parserCases)('$name returns parsed logs on successful receipt', async ({ fn }) => {
		const { client, waitForTransactionReceipt } = createClient('success');
		const events = await fn(client, hash);

		expect(events).toEqual([]);
		expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash });
	});

	it.each(parserCases)('$name throws when receipt status is reverted', async ({ fn }) => {
		const { client, waitForTransactionReceipt } = createClient('reverted');

		await expect(fn(client, hash)).rejects.toThrow('Transaction reverted');
		expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash });
	});

	it('eventParse supports dynamic event names', async () => {
		const { client, waitForTransactionReceipt } = createClient('success');
		const events = await eventParse(client, hash, 'AtomCreated');

		expect(events).toEqual([]);
		expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash });
	});

	it('eventParse throws when receipt status is reverted', async () => {
		const { client, waitForTransactionReceipt } = createClient('reverted');

		await expect(eventParse(client, hash, 'AtomCreated')).rejects.toThrow('Transaction reverted');
		expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash });
	});
});
