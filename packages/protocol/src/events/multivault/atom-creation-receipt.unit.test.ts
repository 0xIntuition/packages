import {
	type AbiEvent,
	type Address,
	encodeAbiParameters,
	encodeEventTopics,
	type Hex,
	type Log,
	type PublicClient,
} from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { MultiVaultAbi } from '../../contracts/MultiVault-abi.js';
import { associateAtomCreationContext } from './atom-creation-context.js';
import { eventParseAtomContextRegistered } from './event-parse-atom-context-registered.js';
import { eventParseAtomCreated } from './event-parse-atom-created.js';
import { eventParseAtomUriConfigUpdated } from './event-parse-atom-uri-config-updated.js';

const vault = '0x1111111111111111111111111111111111111111' as Address;
const foreign = '0x2222222222222222222222222222222222222222' as Address;
const registrant = '0x3333333333333333333333333333333333333333' as Address;
const termA = `0x${'aa'.repeat(32)}` as Hex;
const termB = `0x${'bb'.repeat(32)}` as Hex;
const termC = `0x${'cc'.repeat(32)}` as Hex;
const orphan = `0x${'dd'.repeat(32)}` as Hex;
const hash = `0x${'11'.repeat(32)}` as Hex;

function event(name: string): AbiEvent {
	const item = MultiVaultAbi.find((item) => item.type === 'event' && item.name === name);
	if (!item || item.type !== 'event') throw new Error(`Missing event ${name}`);
	return item;
}

function log(item: AbiEvent, args: Record<string, unknown>, address = vault): Log {
	return {
		address,
		topics: encodeEventTopics({ abi: [item], eventName: item.name, args }) as Log['topics'],
		data: encodeAbiParameters(
			item.inputs.filter((input) => !input.indexed),
			item.inputs.filter((input) => !input.indexed).map((input) => args[input.name!])
		),
		blockHash: hash,
		blockNumber: 1n,
		transactionHash: hash,
		transactionIndex: 0,
		logIndex: 0,
		removed: false,
	};
}

function atom(termId: Hex) {
	return log(event('AtomCreated'), {
		creator: registrant,
		termId,
		atomData: '0x00ff80',
		atomWallet: registrant,
	});
}
function context(termId: Hex, uris: Hex[], address = vault) {
	return log(event('AtomContextRegistered'), { termId, registrant, uris }, address);
}
function receiptClient(logs: Log[]) {
	const waitForTransactionReceipt = vi.fn().mockResolvedValue({
		status: 'success',
		logs: logs.map((log, logIndex) => ({ ...log, logIndex })),
	});
	return {
		client: { waitForTransactionReceipt } as unknown as PublicClient,
		waitForTransactionReceipt,
	};
}
function interleavedLogs() {
	return [
		atom(termA),
		log(event('Deposited'), {
			sender: registrant,
			receiver: registrant,
			termId: termA,
			curveId: 1n,
			assets: 10n,
			assetsAfterFees: 9n,
			shares: 8n,
			totalShares: 8n,
			vaultType: 0,
		}),
		atom(termB),
		context(termB, ['0x02']),
		log(event('SharePriceChanged'), {
			termId: termB,
			curveId: 1n,
			sharePrice: 2n,
			totalAssets: 10n,
			totalShares: 5n,
			vaultType: 0,
		}),
		context(termA, ['0x01', '0x0102']),
	];
}

describe('URI-aware receipt linkage', () => {
	it('parses real ABI logs and joins interleaved contexts by termId', async () => {
		const logs = [...interleavedLogs(), context(orphan, ['0x09']), atom(termC)];
		expect(logs.every((log) => log.address === vault)).toBe(true);
		const { client, waitForTransactionReceipt } = receiptClient(logs);
		const atoms = await eventParseAtomCreated(client, hash);
		const contexts = await eventParseAtomContextRegistered(client, hash);
		expect(atoms.map((atom) => atom.args.termId)).toEqual([termA, termB, termC]);
		expect(contexts.map((context) => context.args.termId)).toEqual([termB, termA, orphan]);
		const linked = associateAtomCreationContext(atoms, contexts);
		expect(linked.map(({ contexts }) => contexts.map((context) => context.args.uris))).toEqual([
			[['0x01', '0x0102']],
			[['0x02']],
			[],
		]);
		expect(
			linked.flatMap(({ contexts }) => contexts).some((context) => context.args.termId === orphan)
		).toBe(false);
		expect(linked[2]?.contexts).toEqual([]);
		expect(waitForTransactionReceipt).toHaveBeenCalledWith({ hash });
	});

	it('filters identical foreign events and rejects incompatible layouts', async () => {
		const original = event('AtomContextRegistered');
		const differentLayout = {
			...original,
			inputs: original.inputs.map((input) =>
				input.name === 'registrant' ? { ...input, indexed: false } : input
			),
		};
		const foreignLog = log(differentLayout, { termId: termA, registrant, uris: ['0x99'] }, foreign);
		expect(foreignLog.topics[0]).toBe(context(termA, ['0x01']).topics[0]);
		expect(foreignLog.topics).toHaveLength(2);
		// Discovery remains receipt-wide for compatibility; explicit filtering
		// checks the emitter even when the foreign event has the same ABI.
		const { client } = receiptClient([
			...interleavedLogs(),
			foreignLog,
			context(termA, ['0x88'], foreign),
		]);
		const contexts = await eventParseAtomContextRegistered(client, hash);
		expect(contexts.map((context) => context.args.uris)).toEqual([
			['0x02'],
			['0x01', '0x0102'],
			['0x88'],
		]);
		expect(contexts[2]?.address).toBe(foreign);
		const linked = associateAtomCreationContext(
			await eventParseAtomCreated(client, hash),
			contexts
		);
		expect(linked[0]?.contexts.map((context) => context.args.uris)).toEqual([['0x01', '0x0102']]);
		const scoped = await eventParseAtomContextRegistered(client, hash, vault);
		expect(scoped.map((event) => event.args.uris)).toEqual([['0x02'], ['0x01', '0x0102']]);
	});

	it('parses the shipped URI configuration event', async () => {
		const { client } = receiptClient([
			log(event('AtomUriConfigUpdated'), { maxUriCount: 3, maxUriLength: 128 }),
		]);
		const parsed = await eventParseAtomUriConfigUpdated(client, hash);
		expect(parsed[0]?.args).toEqual({ maxUriCount: 3, maxUriLength: 128 });
	});
});
