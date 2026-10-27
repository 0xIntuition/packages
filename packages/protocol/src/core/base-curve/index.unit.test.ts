import {
	type Abi,
	type Address,
	decodeFunctionData,
	encodeFunctionData,
	type PublicClient,
} from 'viem';
import { describe, expect, it } from 'vitest';

import { DynamicFeeFlatPriceCurveAbi, IBaseCurveAbi } from '../../contracts/abis';
import type { ReadConfig } from '../../types';
import * as dynamicFeeCurve from '../dynamic-fee-flat-price-curve';
import * as baseCurve from './index';

const CURVE = '0x4444444444444444444444444444444444444444' as Address;

type ReadCall = { address: Address; abi: Abi; functionName: string; args?: readonly unknown[] };

/** A read config whose client records the call and returns the calldata viem would send. */
function recordingConfig(): { config: ReadConfig; calls: ReadCall[]; calldata: `0x${string}`[] } {
	const calls: ReadCall[] = [];
	const calldata: `0x${string}`[] = [];
	const publicClient = {
		readContract: async (call: ReadCall) => {
			calls.push(call);
			calldata.push(
				encodeFunctionData({
					abi: call.abi,
					functionName: call.functionName,
					args: call.args,
				} as never)
			);
			return 7n;
		},
	} as unknown as PublicClient;
	return { config: { address: CURVE, publicClient }, calls, calldata };
}

const cases = [
	{ fn: 'currentPrice', args: [10n ** 18n, 2n * 10n ** 18n] },
	{ fn: 'maxAssets', args: undefined },
	{ fn: 'maxShares', args: undefined },
	{ fn: 'previewMint', args: [5n, 10n ** 18n, 2n * 10n ** 18n] },
	{ fn: 'previewWithdraw', args: [5n, 2n * 10n ** 18n, 10n ** 18n] },
] as const;

const wrappers = {
	baseCurve: {
		abi: IBaseCurveAbi as Abi,
		currentPrice: baseCurve.baseCurveCurrentPrice,
		maxAssets: baseCurve.baseCurveMaxAssets,
		maxShares: baseCurve.baseCurveMaxShares,
		previewMint: baseCurve.baseCurvePreviewMint,
		previewWithdraw: baseCurve.baseCurvePreviewWithdraw,
	},
	dynamicFeeFlatPriceCurve: {
		abi: DynamicFeeFlatPriceCurveAbi as Abi,
		currentPrice: dynamicFeeCurve.dynamicFeeFlatPriceCurveCurrentPrice,
		maxAssets: dynamicFeeCurve.dynamicFeeFlatPriceCurveMaxAssets,
		maxShares: dynamicFeeCurve.dynamicFeeFlatPriceCurveMaxShares,
		previewMint: dynamicFeeCurve.dynamicFeeFlatPriceCurvePreviewMint,
		previewWithdraw: dynamicFeeCurve.dynamicFeeFlatPriceCurvePreviewWithdraw,
	},
} as const;

describe('curve reads: currentPrice, maxAssets, maxShares, previewMint, previewWithdraw', () => {
	for (const [surface, set] of Object.entries(wrappers)) {
		for (const { fn, args } of cases) {
			it(`${surface} ${fn} reads the curve with the expected calldata`, async () => {
				const { config, calls, calldata } = recordingConfig();
				const wrapper = set[fn] as (
					config: ReadConfig,
					inputs?: { args: readonly bigint[] }
				) => Promise<bigint>;
				const result = args ? await wrapper(config, { args }) : await wrapper(config);

				expect(result).toBe(7n);
				expect(calls).toHaveLength(1);
				expect(calls[0]?.address).toBe(CURVE);
				expect(calls[0]?.functionName).toBe(fn);
				const decoded = decodeFunctionData({ abi: set.abi, data: calldata[0]! });
				expect(decoded.functionName).toBe(fn);
				expect(decoded.args ?? []).toEqual(args ?? []);
			});
		}
	}

	it('both surfaces encode the same selector, so either reads any curve', () => {
		for (const { fn, args } of cases) {
			const viaBase = encodeFunctionData({ abi: IBaseCurveAbi, functionName: fn, args } as never);
			const viaCurve = encodeFunctionData({
				abi: DynamicFeeFlatPriceCurveAbi,
				functionName: fn,
				args,
			} as never);
			expect(viaBase).toBe(viaCurve);
		}
	});
});
