/**
 * The generic curve reads (`IBaseCurve`) and the DynamicFeeFlatPriceCurve reads against the curve
 * deployed from the packaged artifacts and the default linear curve. The registry's own curve-id
 * keyed reads are the reference, since that is the path MultiVault prices through.
 */
import { beforeAll, describe, expect, it } from 'vitest';

import {
	BondingCurveRegistryAbi,
	baseCurveCurrentPrice,
	baseCurveMaxAssets,
	baseCurveMaxShares,
	baseCurvePreviewMint,
	baseCurvePreviewWithdraw,
	bondingCurveRegistryPreviewMint,
	dynamicFeeFlatPriceCurveCurrentPrice,
	dynamicFeeFlatPriceCurveMaxAssets,
	dynamicFeeFlatPriceCurveMaxShares,
	dynamicFeeFlatPriceCurvePreviewMint,
	dynamicFeeFlatPriceCurvePreviewWithdraw,
	type ReadConfig,
} from '../../src';
import { type DynamicFeeContext, loadDynamicFeeContext } from '../helpers/dynamic-fee-harness';
import { publicClient } from '../helpers/utils';

const TRUST = 10n ** 18n;
const LINEAR_CURVE_ID = 1n;
const VAULT_STATES = [
	{ totalShares: 0n, totalAssets: 0n },
	{ totalShares: TRUST, totalAssets: TRUST },
	{ totalShares: 3n * TRUST + 7n, totalAssets: 5n * TRUST + 11n },
] as const;
const AMOUNTS = [1n, TRUST, 123_456_789n] as const;

let ctx: DynamicFeeContext;
let linearCurve: ReadConfig;

beforeAll(async () => {
	ctx = await loadDynamicFeeContext();
	linearCurve = { address: ctx.core.intuition.linearCurve, publicClient };
}, 300_000);

async function registryRead(
	functionName: 'currentPrice' | 'previewWithdraw' | 'getCurveMaxAssets' | 'getCurveMaxShares',
	args: bigint[]
) {
	return (await publicClient.readContract({
		address: ctx.registry.address,
		abi: BondingCurveRegistryAbi,
		functionName,
		args: args as never,
	})) as bigint;
}

describe('curve reads agree with the registry for both deployed curves', () => {
	it('maxAssets / maxShares', async () => {
		for (const [curve, id] of [
			[ctx.curve, ctx.curveId],
			[linearCurve, LINEAR_CURVE_ID],
		] as const) {
			expect(await baseCurveMaxAssets(curve)).toBe(await registryRead('getCurveMaxAssets', [id]));
			expect(await baseCurveMaxShares(curve)).toBe(await registryRead('getCurveMaxShares', [id]));
		}
		expect(await dynamicFeeFlatPriceCurveMaxAssets(ctx.curve)).toBe(
			await baseCurveMaxAssets(ctx.curve)
		);
		expect(await dynamicFeeFlatPriceCurveMaxShares(ctx.curve)).toBe(
			await baseCurveMaxShares(ctx.curve)
		);
	});

	it('currentPrice, previewMint and previewWithdraw at several vault states', async () => {
		for (const { totalShares, totalAssets } of VAULT_STATES) {
			for (const [curve, id] of [
				[ctx.curve, ctx.curveId],
				[linearCurve, LINEAR_CURVE_ID],
			] as const) {
				const price = await baseCurveCurrentPrice(curve, { args: [totalShares, totalAssets] });
				expect(price).toBe(await registryRead('currentPrice', [id, totalShares, totalAssets]));

				for (const amount of AMOUNTS) {
					const minted = await baseCurvePreviewMint(curve, {
						args: [amount, totalShares, totalAssets],
					});
					expect(minted).toBe(
						await bondingCurveRegistryPreviewMint(ctx.registry, {
							args: [amount, totalShares, totalAssets, id],
						})
					);
					if (amount <= totalAssets) {
						const burned = await baseCurvePreviewWithdraw(curve, {
							args: [amount, totalAssets, totalShares],
						});
						expect(burned).toBe(
							await registryRead('previewWithdraw', [amount, totalAssets, totalShares, id])
						);
					}
				}
			}

			expect(
				await dynamicFeeFlatPriceCurveCurrentPrice(ctx.curve, { args: [totalShares, totalAssets] })
			).toBe(await baseCurveCurrentPrice(ctx.curve, { args: [totalShares, totalAssets] }));
			expect(
				await dynamicFeeFlatPriceCurvePreviewMint(ctx.curve, {
					args: [TRUST, totalShares, totalAssets],
				})
			).toBe(await baseCurvePreviewMint(ctx.curve, { args: [TRUST, totalShares, totalAssets] }));
			if (totalAssets > 0n) {
				expect(
					await dynamicFeeFlatPriceCurvePreviewWithdraw(ctx.curve, {
						args: [1n, totalAssets, totalShares],
					})
				).toBe(await baseCurvePreviewWithdraw(ctx.curve, { args: [1n, totalAssets, totalShares] }));
			}
		}
	});
});
