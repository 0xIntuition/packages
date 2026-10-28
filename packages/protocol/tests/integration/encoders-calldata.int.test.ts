/**
 * Calldata produced by the `@0xintuition/protocol` encoders, sent RAW from a funded account with the
 * value the call needs, against the final contracts on anvil. Each check asserts the transaction
 * succeeds and the state moves the way the call promises; the value-handling checks also assert the
 * contract rejects the wrong value.
 */
import { type Address, BaseError, decodeErrorResult, type Hex, toHex, zeroAddress } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';

import {
	ApprovalTypes,
	dynamicFeeFlatPriceCurveClaimEncode,
	multiVaultApproveEncode,
	multiVaultCalculateAtomId,
	multiVaultCalculateTripleId,
	multiVaultCreateAtomsEncode,
	multiVaultCreateAtomsForEncode,
	multiVaultCreateAtomsWithUrisEncode,
	multiVaultCreateTriplesEncode,
	multiVaultCreateTriplesForEncode,
	multiVaultDepositBatchEncode,
	multiVaultDepositEncode,
	multiVaultGetAtomCost,
	multiVaultGetShares,
	multiVaultGetTripleCost,
	multiVaultIsApprovedToCreate,
	multiVaultIsApprovedToDeposit,
	multiVaultIsTermCreated,
	multiVaultIsTriple,
	multiVaultMulticallEncode,
	multiVaultPreviewAtomCreate,
	multiVaultPreviewDeposit,
	multiVaultPreviewRedeem,
	multiVaultRedeemBatchEncode,
	multiVaultRedeemEncode,
	type ReadConfig,
} from '../../src';
import { DynamicFeeFlatPriceCurveAbi, MultiVaultAbi } from '../../src/contracts';
import {
	type Actor,
	createAtom,
	type DynamicFeeContext,
	fundedActor,
	gasCost,
	loadDynamicFeeContext,
	readAccount,
	runDeposit,
	waitForSuccess,
} from '../helpers/dynamic-fee-harness';
import { publicClient } from '../helpers/utils';

const TRUST = 10n ** 18n;
const LINEAR_CURVE_ID = 1n;

let ctx: DynamicFeeContext;
let mv: ReadConfig;
let alice: Actor;
let bob: Actor;
let atomCost: bigint;
let tripleCost: bigint;

beforeAll(async () => {
	ctx = await loadDynamicFeeContext();
	mv = ctx.multiVault;
	alice = await fundedActor(0, 1_000_000n * TRUST);
	bob = await fundedActor(1, 1_000_000n * TRUST);
	[atomCost, tripleCost] = await Promise.all([
		multiVaultGetAtomCost(mv),
		multiVaultGetTripleCost(mv),
	]);
}, 300_000);

async function send(actor: Actor, to: Address, data: Hex, value = 0n) {
	const hash = await actor.wallet.sendTransaction({
		account: actor.address,
		chain: actor.wallet.chain,
		to,
		data,
		value,
	});
	return waitForSuccess(hash);
}

/**
 * Simulates the raw call and returns the decoded custom-error name it reverts with, or `undefined`
 * if it would succeed. A raw `eth_call` carries no ABI, so the revert data is decoded here.
 */
async function revertOf(actor: Actor, to: Address, data: Hex, value = 0n) {
	try {
		await publicClient.call({ account: actor.address, to, data, value });
		return undefined;
	} catch (error) {
		const withData =
			error instanceof BaseError
				? (error.walk((inner) => typeof (inner as { data?: unknown }).data === 'string') as {
						data?: Hex;
					} | null)
				: null;
		if (!withData?.data) return String((error as Error).message);
		try {
			return decodeErrorResult({
				abi: [...MultiVaultAbi, ...DynamicFeeFlatPriceCurveAbi],
				data: withData.data,
			}).errorName;
		} catch {
			return withData.data;
		}
	}
}

function uniqueData(label: string): Hex {
	return toHex(`${label} ${Math.random()}`);
}

describe('protocol encoders: creation', () => {
	it('createAtoms: value == sum(assets) succeeds and mints the previewed shares; value - 1 reverts', async () => {
		const data = [uniqueData('enc atom a'), uniqueData('enc atom b')];
		const assets = [atomCost + 3n * TRUST, atomCost];
		const total = assets[0]! + assets[1]!;
		const calldata = multiVaultCreateAtomsEncode(data, assets);
		const ids = await Promise.all(data.map((d) => multiVaultCalculateAtomId(mv, { args: [d] })));
		const [previewShares] = await multiVaultPreviewAtomCreate(mv, { args: [ids[0]!, assets[0]!] });

		expect(await revertOf(alice, mv.address, calldata, total - 1n)).toMatch(/InsufficientBalance/);
		await send(alice, mv.address, calldata, total);

		for (const id of ids) {
			expect(await multiVaultIsTermCreated(mv, { args: [id] })).toBe(true);
		}
		expect(await multiVaultGetShares(mv, { args: [alice.address, ids[0]!, LINEAR_CURVE_ID] })).toBe(
			previewShares
		);
	});

	it('createAtomsWithUris: creates the atom and emits its context URIs', async () => {
		const data = uniqueData('enc atom with uri');
		const uri = toHex('ipfs://bafy-encoder-check');
		const calldata = multiVaultCreateAtomsWithUrisEncode(
			alice.address,
			[data],
			[atomCost],
			[[uri]]
		);
		const receipt = await send(alice, mv.address, calldata, atomCost);
		const id = await multiVaultCalculateAtomId(mv, { args: [data] });
		expect(await multiVaultIsTermCreated(mv, { args: [id] })).toBe(true);
		expect(receipt.logs.length).toBeGreaterThan(0);
	});

	it('createTriples: value == sum(assets) creates the triple; value + 1 reverts', async () => {
		const atoms = [
			await createAtom(ctx, 'enc triple s'),
			await createAtom(ctx, 'enc triple p'),
			await createAtom(ctx, 'enc triple o'),
		] as const;
		const assets = tripleCost + TRUST;
		const calldata = multiVaultCreateTriplesEncode([atoms[0]], [atoms[1]], [atoms[2]], [assets]);
		expect(await revertOf(alice, mv.address, calldata, assets + 1n)).toMatch(/InsufficientBalance/);
		await send(alice, mv.address, calldata, assets);
		const tripleId = await multiVaultCalculateTripleId(mv, { args: [...atoms] });
		expect(await multiVaultIsTriple(mv, { args: [tripleId] })).toBe(true);
	});

	it('approve + createAtomsFor / createTriplesFor: the caller pays, the creator owns the position', async () => {
		const approve = multiVaultApproveEncode(alice.address, ApprovalTypes.CREATION);
		// approve is payable only for multicall; a direct call with value must revert.
		expect(await revertOf(bob, mv.address, approve, 1n)).toMatch(/UnexpectedValue/);
		await send(bob, mv.address, approve);
		expect(await multiVaultIsApprovedToCreate(mv, { args: [alice.address, bob.address] })).toBe(
			true
		);

		const data = uniqueData('enc atom for');
		const assets = atomCost + TRUST;
		await send(
			alice,
			mv.address,
			multiVaultCreateAtomsForEncode(bob.address, [data], [assets]),
			assets
		);
		const atomId = await multiVaultCalculateAtomId(mv, { args: [data] });
		const creator = await publicClient.readContract({
			address: mv.address,
			abi: MultiVaultAbi,
			functionName: 'getAtomCreator',
			args: [atomId],
		});
		expect(creator.toLowerCase()).toBe(bob.address.toLowerCase());
		expect(
			await multiVaultGetShares(mv, { args: [bob.address, atomId, LINEAR_CURVE_ID] })
		).toBeGreaterThan(0n);
		expect(await multiVaultGetShares(mv, { args: [alice.address, atomId, LINEAR_CURVE_ID] })).toBe(
			0n
		);

		const others = [
			await createAtom(ctx, 'enc for p'),
			await createAtom(ctx, 'enc for o'),
		] as const;
		const tripleAssets = tripleCost + TRUST;
		await send(
			alice,
			mv.address,
			multiVaultCreateTriplesForEncode(
				bob.address,
				[atomId],
				[others[0]],
				[others[1]],
				[tripleAssets]
			),
			tripleAssets
		);
		const tripleId = await multiVaultCalculateTripleId(mv, {
			args: [atomId, others[0], others[1]],
		});
		expect(
			await multiVaultGetShares(mv, { args: [bob.address, tripleId, LINEAR_CURVE_ID] })
		).toBeGreaterThan(0n);

		await send(bob, mv.address, multiVaultApproveEncode(alice.address, ApprovalTypes.NONE));
		expect(await multiVaultIsApprovedToCreate(mv, { args: [alice.address, bob.address] })).toBe(
			false
		);
	});
});

describe('protocol encoders: deposit and redeem', () => {
	let linearAtom: Hex;
	let dynamicAtom: Hex;

	beforeAll(async () => {
		linearAtom = await createAtom(ctx, 'enc linear atom');
		dynamicAtom = await createAtom(ctx, 'enc dynamic atom');
		// Open the dynamic vault so later deposits are not the bootstrapping one.
		await runDeposit(ctx, bob, dynamicAtom, 500n * TRUST);
	}, 300_000);

	it('deposit: value is the deposit, the floor is met exactly, on the linear and the dynamic curve', async () => {
		for (const [termId, curveId] of [
			[linearAtom, LINEAR_CURVE_ID],
			[dynamicAtom, ctx.curveId],
		] as const) {
			const assets = 250n * TRUST;
			const [shares] = await multiVaultPreviewDeposit(mv, { args: [termId, curveId, assets] });
			const before = await multiVaultGetShares(mv, { args: [alice.address, termId, curveId] });
			await send(
				alice,
				mv.address,
				multiVaultDepositEncode(alice.address, termId, curveId, shares),
				assets
			);
			const after = await multiVaultGetShares(mv, { args: [alice.address, termId, curveId] });
			expect(after - before).toBe(shares);
		}
	});

	it('deposit for another receiver needs DEPOSIT approval from that receiver', async () => {
		const calldata = multiVaultDepositEncode(bob.address, linearAtom, LINEAR_CURVE_ID, 0n);
		expect(await revertOf(alice, mv.address, calldata, TRUST)).toMatch(/SenderNotApproved/);
		await send(bob, mv.address, multiVaultApproveEncode(alice.address, ApprovalTypes.DEPOSIT));
		expect(await multiVaultIsApprovedToDeposit(mv, { args: [alice.address, bob.address] })).toBe(
			true
		);
		const before = await multiVaultGetShares(mv, {
			args: [bob.address, linearAtom, LINEAR_CURVE_ID],
		});
		await send(alice, mv.address, calldata, TRUST);
		expect(
			await multiVaultGetShares(mv, { args: [bob.address, linearAtom, LINEAR_CURVE_ID] })
		).toBeGreaterThan(before);
		await send(bob, mv.address, multiVaultApproveEncode(alice.address, ApprovalTypes.NONE));
	});

	it('depositBatch: value == sum(assets) across both curves; a short value reverts', async () => {
		const termIds = [linearAtom, dynamicAtom];
		const curveIds = [LINEAR_CURVE_ID, ctx.curveId];
		const assets = [40n * TRUST, 60n * TRUST];
		const previews = await Promise.all(
			termIds.map((termId, i) =>
				multiVaultPreviewDeposit(mv, { args: [termId, curveIds[i]!, assets[i]!] })
			)
		);
		const minShares = previews.map(([shares]) => shares);
		const calldata = multiVaultDepositBatchEncode(
			alice.address,
			termIds,
			curveIds,
			assets,
			minShares
		);
		expect(await revertOf(alice, mv.address, calldata, 100n * TRUST - 1n)).toMatch(
			/InsufficientBalance/
		);
		const before = await Promise.all(
			termIds.map((termId, i) =>
				multiVaultGetShares(mv, { args: [alice.address, termId, curveIds[i]!] })
			)
		);
		await send(alice, mv.address, calldata, 100n * TRUST);
		for (const [i, termId] of termIds.entries()) {
			const after = await multiVaultGetShares(mv, { args: [alice.address, termId, curveIds[i]!] });
			expect(after - before[i]!).toBe(minShares[i]);
		}
	});

	it('redeem: zero value pays the preview on the linear curve; any value reverts UnexpectedValue', async () => {
		const shares = 10n * TRUST;
		const [assetsOut] = await multiVaultPreviewRedeem(mv, {
			args: [linearAtom, LINEAR_CURVE_ID, shares],
		});
		const calldata = multiVaultRedeemEncode(
			alice.address,
			linearAtom,
			LINEAR_CURVE_ID,
			shares,
			assetsOut
		);
		expect(await revertOf(alice, mv.address, calldata, 1n)).toMatch(/UnexpectedValue/);
		const balanceBefore = await publicClient.getBalance({ address: alice.address });
		const receipt = await send(alice, mv.address, calldata);
		const balanceAfter = await publicClient.getBalance({ address: alice.address });
		expect(balanceAfter - balanceBefore + gasCost(receipt)).toBe(assetsOut);
	});

	it('redeemBatch: both curves in one call, zero value; payout equals the per-leg quotes', async () => {
		const termIds = [linearAtom, dynamicAtom];
		const curveIds = [LINEAR_CURVE_ID, ctx.curveId];
		const shares = [5n * TRUST, 7n * TRUST];
		const [linearOut] = await multiVaultPreviewRedeem(mv, {
			args: [linearAtom, LINEAR_CURVE_ID, shares[0]!],
		});
		// The dynamic leg is priced on the holder's lots: MultiVault's preview is account-less.
		const dynamicHolder = await readAccount(ctx, dynamicAtom, alice.address);
		expect(dynamicHolder.lots.size).toBeGreaterThan(0);
		const [dynamicAgnosticOut] = await multiVaultPreviewRedeem(mv, {
			args: [dynamicAtom, ctx.curveId, shares[1]!],
		});
		const [accountFee, accountlessFee] = await Promise.all([
			publicClient.readContract({
				address: ctx.curveAddress,
				abi: DynamicFeeFlatPriceCurveAbi,
				functionName: 'quoteRedeemFee',
				args: [dynamicAtom, alice.address, shares[1]!],
			}),
			publicClient.readContract({
				address: ctx.curveAddress,
				abi: DynamicFeeFlatPriceCurveAbi,
				functionName: 'quoteRedeemFee',
				args: [dynamicAtom, zeroAddress, shares[1]!],
			}),
		]);
		const dynamicOut = dynamicAgnosticOut + accountlessFee - accountFee;
		const calldata = multiVaultRedeemBatchEncode(alice.address, termIds, curveIds, shares, [
			linearOut,
			dynamicOut,
		]);
		expect(await revertOf(alice, mv.address, calldata, 1n)).toMatch(/UnexpectedValue/);
		const balanceBefore = await publicClient.getBalance({ address: alice.address });
		const receipt = await send(alice, mv.address, calldata);
		const balanceAfter = await publicClient.getBalance({ address: alice.address });
		expect(balanceAfter - balanceBefore + gasCost(receipt)).toBe(linearOut + dynamicOut);
	});

	it('multicall: per-leg values must sum to msg.value; deposit + deposit + redeem lands atomically', async () => {
		const depositLinear = multiVaultDepositEncode(alice.address, linearAtom, LINEAR_CURVE_ID, 0n);
		const depositDynamic = multiVaultDepositEncode(alice.address, dynamicAtom, ctx.curveId, 0n);
		const redeemLinear = multiVaultRedeemEncode(
			alice.address,
			linearAtom,
			LINEAR_CURVE_ID,
			TRUST,
			0n
		);
		const data = [depositLinear, depositDynamic, redeemLinear];
		const values = [3n * TRUST, 4n * TRUST, 0n];
		const calldata = multiVaultMulticallEncode(data, values);

		expect(await revertOf(alice, mv.address, calldata, 7n * TRUST + 1n)).toMatch(
			/MulticallValueMismatch/
		);
		// A non-zero allocation to the redeem leg is rejected by the leg itself.
		expect(
			await revertOf(
				alice,
				mv.address,
				multiVaultMulticallEncode(data, [3n * TRUST, 3n * TRUST, TRUST]),
				7n * TRUST
			)
		).toMatch(/UnexpectedValue/);

		const [linearShares] = await multiVaultPreviewDeposit(mv, {
			args: [linearAtom, LINEAR_CURVE_ID, 3n * TRUST],
		});
		const [dynamicShares] = await multiVaultPreviewDeposit(mv, {
			args: [dynamicAtom, ctx.curveId, 4n * TRUST],
		});
		const linearBefore = await multiVaultGetShares(mv, {
			args: [alice.address, linearAtom, LINEAR_CURVE_ID],
		});
		const dynamicBefore = await multiVaultGetShares(mv, {
			args: [alice.address, dynamicAtom, ctx.curveId],
		});
		await send(alice, mv.address, calldata, 7n * TRUST);
		const linearAfter = await multiVaultGetShares(mv, {
			args: [alice.address, linearAtom, LINEAR_CURVE_ID],
		});
		const dynamicAfter = await multiVaultGetShares(mv, {
			args: [alice.address, dynamicAtom, ctx.curveId],
		});
		expect(linearAfter - linearBefore).toBe(linearShares - TRUST);
		expect(dynamicAfter - dynamicBefore).toBe(dynamicShares);
	});
});

describe('protocol encoders: dynamic-fee curve claim', () => {
	it('claim calldata sent raw to the curve pays the claimable balance', async () => {
		const termId = await createAtom(ctx, 'enc claim');
		const earner = await fundedActor(3, 1_000_000n * TRUST);
		const payer = await fundedActor(4, 1_000_000n * TRUST);
		await runDeposit(ctx, earner, termId, 1_000n * TRUST);
		await runDeposit(ctx, payer, termId, 5_000n * TRUST);
		const claimable = await publicClient.readContract({
			address: ctx.curveAddress,
			abi: DynamicFeeFlatPriceCurveAbi,
			functionName: 'claimableAcross',
			args: [earner.address, [termId]],
		});
		expect(claimable).toBeGreaterThan(0n);
		const balanceBefore = await publicClient.getBalance({ address: earner.address });
		const receipt = await send(
			earner,
			ctx.curveAddress,
			dynamicFeeFlatPriceCurveClaimEncode([termId])
		);
		const balanceAfter = await publicClient.getBalance({ address: earner.address });
		expect(balanceAfter - balanceBefore + gasCost(receipt)).toBe(claimable);
	});
});
