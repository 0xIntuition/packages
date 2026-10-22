import { type Address, encodeAbiParameters, encodeEventTopics, type Hex, type Log } from 'viem';
import { describe, expect, it } from 'vitest';

import { DynamicFeeFlatPriceCurveAbi } from '../../contracts';
import {
	eventDecodeProtocolAccruedIncreased,
	eventDecodeRedeemFeeRerouted,
	eventDecodeRedeemLotRecorded,
} from './index';

const curve = '0x00000000000000000000000000000000000000c0' as Address;
const termId = '0x00000000000000000000000000000000000000000000000000000000000000aa' as Hex;
// viem returns indexed address args checksummed, so the expectation is spelled that way.
const account = '0x000000000000000000000000000000000000000A' as Address;

/** A log as a node would hand it back from `eth_getLogs`: address, topics, data, position. */
function buildLog(topics: readonly unknown[], data: Hex, logIndex: number): Log {
	return {
		address: curve,
		topics,
		data,
		blockHash: '0x00000000000000000000000000000000000000000000000000000000000000b1' as Hex,
		blockNumber: 1n,
		logIndex,
		removed: false,
		transactionHash: '0x00000000000000000000000000000000000000000000000000000000000000c1' as Hex,
		transactionIndex: 0,
	} as Log;
}

function redeemLotRecordedLog(
	lotTier: bigint,
	lotShares: bigint,
	lotFee: bigint,
	logIndex: number
): Log {
	const topics = encodeEventTopics({
		abi: DynamicFeeFlatPriceCurveAbi,
		eventName: 'RedeemLotRecorded',
		args: { termId, account },
	});
	const data = encodeAbiParameters(
		[{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }],
		[lotTier, lotShares, lotFee]
	);
	return buildLog(topics, data, logIndex);
}

function redeemFeeReroutedLog(
	exitTier: bigint,
	recipientTier: bigint,
	amount: bigint,
	logIndex: number
): Log {
	const topics = encodeEventTopics({
		abi: DynamicFeeFlatPriceCurveAbi,
		eventName: 'RedeemFeeRerouted',
		args: { termId },
	});
	const data = encodeAbiParameters(
		[{ type: 'uint256' }, { type: 'uint256' }, { type: 'uint256' }],
		[exitTier, recipientTier, amount]
	);
	return buildLog(topics, data, logIndex);
}

function protocolAccruedIncreasedLog(amount: bigint, logIndex: number): Log {
	const topics = encodeEventTopics({
		abi: DynamicFeeFlatPriceCurveAbi,
		eventName: 'ProtocolAccruedIncreased',
	});
	const data = encodeAbiParameters([{ type: 'uint256' }], [amount]);
	return buildLog(topics, data, logIndex);
}

describe('dynamic-fee-flat-price-curve log decoders', () => {
	it('decodes RedeemLotRecorded, preserving log order', () => {
		const events = eventDecodeRedeemLotRecorded([
			redeemLotRecordedLog(3n, 100n, 2n, 0),
			redeemLotRecordedLog(1n, 150n, 2n, 1),
		]);

		expect(events).toHaveLength(2);
		expect(events[0]?.eventName).toBe('RedeemLotRecorded');
		expect(events[0]?.args).toMatchObject({
			termId,
			account,
			lotTier: 3n,
			lotShares: 100n,
			lotFee: 2n,
		});
		expect(events[1]?.args).toMatchObject({ lotTier: 1n, lotShares: 150n, lotFee: 2n });
	});

	it('decodes RedeemFeeRerouted', () => {
		const events = eventDecodeRedeemFeeRerouted([redeemFeeReroutedLog(2n, 0n, 7n, 0)]);

		expect(events).toHaveLength(1);
		expect(events[0]?.args).toMatchObject({
			termId,
			exitTier: 2n,
			recipientTier: 0n,
			amount: 7n,
		});
	});

	it('decodes ProtocolAccruedIncreased', () => {
		const events = eventDecodeProtocolAccruedIncreased([protocolAccruedIncreasedLog(42n, 0)]);

		expect(events).toHaveLength(1);
		expect(events[0]?.args).toMatchObject({ amount: 42n });
	});

	it('ignores logs of other events in the same tail', () => {
		const tail = [
			redeemLotRecordedLog(3n, 100n, 2n, 0),
			redeemFeeReroutedLog(2n, 0n, 7n, 1),
			protocolAccruedIncreasedLog(42n, 2),
		];

		expect(eventDecodeRedeemLotRecorded(tail)).toHaveLength(1);
		expect(eventDecodeRedeemFeeRerouted(tail)).toHaveLength(1);
		expect(eventDecodeProtocolAccruedIncreased(tail)).toHaveLength(1);
	});

	it('returns nothing for an empty tail', () => {
		expect(eventDecodeRedeemLotRecorded([])).toEqual([]);
		expect(eventDecodeRedeemFeeRerouted([])).toEqual([]);
		expect(eventDecodeProtocolAccruedIncreased([])).toEqual([]);
	});
});
