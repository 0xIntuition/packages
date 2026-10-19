/**
 * Reverts raised inside the registry or a curve bubble up through MultiVault undeclared. The
 * MultiVault helpers decode them by name through `MultiVaultWithRevertsAbi`.
 */
import { BaseError, ContractFunctionRevertedError } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';

import { multiVaultPreviewDeposit, multiVaultPreviewRedeem } from '../../src';
import {
	createAtom,
	type DynamicFeeContext,
	loadDynamicFeeContext,
} from '../helpers/dynamic-fee-harness';

const UNREGISTERED_CURVE_ID = 99n;
const LINEAR_CURVE_ID = 1n;

let ctx: DynamicFeeContext;

beforeAll(async () => {
	ctx = await loadDynamicFeeContext();
}, 300_000);

async function revertName(call: Promise<unknown>): Promise<string | undefined> {
	try {
		await call;
	} catch (error) {
		const reverted =
			error instanceof BaseError
				? error.walk((cause) => cause instanceof ContractFunctionRevertedError)
				: undefined;
		return reverted instanceof ContractFunctionRevertedError ? reverted.data?.errorName : undefined;
	}
	throw new Error('expected the call to revert');
}

describe('MultiVault helpers decode bubbled reverts', () => {
	it('names the registry error for an unregistered curve id', async () => {
		const termId = await createAtom(ctx, 'bubbled-registry-revert');

		await expect(
			revertName(
				multiVaultPreviewDeposit(ctx.multiVault, {
					args: [termId, UNREGISTERED_CURVE_ID, 10n ** 18n],
				})
			)
		).resolves.toBe('BondingCurveRegistry_InvalidCurveId');
	});

	it('names the curve error for a redeem above the vault supply', async () => {
		const termId = await createAtom(ctx, 'bubbled-curve-revert');

		await expect(
			revertName(
				multiVaultPreviewRedeem(ctx.multiVault, {
					args: [termId, LINEAR_CURVE_ID, 10n ** 40n],
				})
			)
		).resolves.toBe('BaseCurve_SharesExceedTotalShares');
	});
});
