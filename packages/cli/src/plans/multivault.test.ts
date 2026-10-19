import { ApprovalTypes, multiVaultApproveEncode } from '@0xintuition/protocol';
import type { Address, Hex } from 'viem';
import { describe, expect, it } from 'vitest';

import { resolveAgentActionTarget } from '../schema';
import {
	buildMultiVaultCreateAndSeedPlan,
	buildMultiVaultDepositPlan,
	buildMultiVaultMulticallPlan,
	buildMultiVaultOnBehalfOfCreationPlan,
	buildMultiVaultRedeemPlan,
} from './multivault';

const ACCOUNT = '0x1111111111111111111111111111111111111111' as Address;
const MULTIVAULT = '0x2222222222222222222222222222222222222222' as Address;
const TERM_ID = `0x${'ab'.repeat(32)}` as Hex;
const SUBJECT_ID = `0x${'cd'.repeat(32)}` as Hex;
const PREDICATE_ID = `0x${'ef'.repeat(32)}` as Hex;
const OBJECT_ID = `0x${'34'.repeat(32)}` as Hex;

describe('multivault plans', () => {
	it('builds a deposit envelope from injected quote context', async () => {
		const multiVaultTarget = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'multivault',
		});
		const envelope = await buildMultiVaultDepositPlan({
			multiVaultAddress: MULTIVAULT,
			receiver: ACCOUNT,
			termId: TERM_ID,
			curveId: 1n,
			assetsIn: 1_000n,
			slippageBps: 100n,
			readContext: {
				previewDeposit: [500n, 970n] as const,
				entryFeeAmount: 10n,
				protocolFeeAmount: 5n,
				currentSharePrice: 2_000_000_000_000_000_000n,
			},
		});

		expect(envelope.action).toBe('multivault.deposit');
		expect(envelope.steps).toHaveLength(1);
		expect(envelope.steps[0]?.to).toBe(multiVaultTarget.address);
		expect(envelope.steps[0]?.target).toEqual(multiVaultTarget);
		expect(envelope.steps[0]?.value).toBe('1000');
		expect(envelope.estimates).toMatchObject({
			value: '1000',
			quote: {
				assetsIn: '1000',
				sharesOut: '500',
				minSharesOut: '495',
			},
		});
	});

	it('builds a redeem envelope from injected quote context', async () => {
		const multiVaultTarget = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'multivault',
		});
		const envelope = await buildMultiVaultRedeemPlan({
			multiVaultAddress: MULTIVAULT,
			receiver: ACCOUNT,
			termId: TERM_ID,
			curveId: 7n,
			account: ACCOUNT,
			sharesIn: 500n,
			slippageBps: 100n,
			readContext: {
				convertToAssets: 812n,
				exitFeeAmount: 8n,
				protocolFeeAmount: 4n,
				currentSharePrice: 1_500_000_000_000_000_000n,
			},
		});

		expect(envelope.action).toBe('multivault.redeem');
		expect(envelope.steps).toHaveLength(1);
		expect(envelope.steps[0]?.to).toBe(multiVaultTarget.address);
		expect(envelope.steps[0]?.target).toEqual(multiVaultTarget);
		expect(envelope.estimates).toMatchObject({
			quote: {
				assetsOut: '800',
				minAssetsOut: '792',
				sharesUsed: '500',
			},
		});
	});

	it('builds a create-and-seed envelope with batched payable steps', async () => {
		const multiVaultTarget = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'multivault',
		});
		const envelope = await buildMultiVaultCreateAndSeedPlan({
			multiVaultAddress: MULTIVAULT,
			receiver: ACCOUNT,
			atomsToCreate: [
				{
					termId: TERM_ID,
					data: '0x1234',
					assetsIn: 100n,
					readContext: {
						previewCreate: [50n, 99n, 98n] as const,
					},
				},
			],
			seedDeposits: [
				{
					termId: TERM_ID,
					curveId: 1n,
					assetsIn: 500n,
					slippageBps: 100n,
					readContext: {
						previewDeposit: [250n, 495n] as const,
						entryFeeAmount: 0n,
						protocolFeeAmount: 0n,
						currentSharePrice: 1n,
					},
				},
			],
		});

		expect(envelope.action).toBe('multivault.createAndSeed');
		expect(envelope.steps.map((step) => step.id)).toEqual(['create-atoms-1', 'deposit-batch-2']);
		expect(envelope.steps.every((step) => step.to === multiVaultTarget.address)).toBe(true);
		expect(envelope.steps.every((step) => step.target.contract === 'multivault')).toBe(true);
		expect(envelope.steps[0]?.value).toBe('100');
		expect(envelope.steps[1]?.value).toBe('500');
		expect(envelope.estimates).toMatchObject({
			totalValue: '600',
			seedDepositQuotes: [{ minSharesOut: '247' }],
		});
	});

	it('rejects zero deposit amount before quote reads', async () => {
		await expect(
			buildMultiVaultDepositPlan({
				multiVaultAddress: MULTIVAULT,
				receiver: ACCOUNT,
				termId: TERM_ID,
				curveId: 1n,
				assetsIn: 0n,
			})
		).rejects.toThrow('assetsIn must be greater than 0.');
	});

	it('rejects invalid slippage before quote reads', async () => {
		await expect(
			buildMultiVaultDepositPlan({
				multiVaultAddress: MULTIVAULT,
				receiver: ACCOUNT,
				termId: TERM_ID,
				curveId: 1n,
				assetsIn: 1_000n,
				slippageBps: 10_000n,
			})
		).rejects.toThrow('slippageBps must be between 0 and 9999');
	});

	it('rejects missing read context for quote-dependent deposit plans', async () => {
		await expect(
			buildMultiVaultDepositPlan({
				multiVaultAddress: MULTIVAULT,
				receiver: ACCOUNT,
				termId: TERM_ID,
				curveId: 1n,
				assetsIn: 1_000n,
			})
		).rejects.toThrow('buildMultiVaultDepositPlan requires readContext.previewDeposit.');
	});

	it('supports object-style preview reads for deposit plans with explicit value overrides', async () => {
		const envelope = await buildMultiVaultDepositPlan({
			multiVaultAddress: MULTIVAULT,
			receiver: ACCOUNT,
			termId: TERM_ID,
			curveId: 2n,
			assetsIn: 900n,
			value: 950n,
			readContext: {
				previewDeposit: {
					sharesOut: 450n,
					assetsAfterFees: 890n,
				},
				entryFeeAmount: 10n,
				protocolFeeAmount: 2n,
				currentSharePrice: 2_500_000_000_000_000_000n,
			},
		});

		expect(envelope.steps[0]?.value).toBe('950');
		expect(envelope.estimates).toMatchObject({
			value: '950',
			quote: {
				assetsIn: '900',
				sharesOut: '450',
			},
		});
	});

	it('supports Intuition testnet targets for deposit plans', async () => {
		const multiVaultTarget = resolveAgentActionTarget({
			chainId: 13579,
			contract: 'multivault',
		});
		const envelope = await buildMultiVaultDepositPlan({
			chainId: 13579,
			multiVaultAddress: MULTIVAULT,
			receiver: ACCOUNT,
			termId: TERM_ID,
			curveId: 3n,
			assetsIn: 750n,
			readContext: {
				previewDeposit: {
					sharesOut: 375n,
					assetsAfterFees: 742n,
				},
				entryFeeAmount: 4n,
				protocolFeeAmount: 4n,
				currentSharePrice: 2_000_000_000_000_000_000n,
			},
		});

		expect(envelope.steps[0]?.target).toEqual(multiVaultTarget);
		expect(envelope.steps[0]?.target.chainId).toBe(13579);
	});

	it('builds create-and-seed plans for triple creation and repeated seed quote lookups', async () => {
		const envelope = await buildMultiVaultCreateAndSeedPlan({
			multiVaultAddress: MULTIVAULT,
			receiver: ACCOUNT,
			atomsToCreate: [
				{
					termId: TERM_ID,
					data: '0x1234',
					assetsIn: 100n,
					readContext: {
						previewCreate: {
							sharesOut: 50n,
							feeBaseAssets: 99n,
							assetsAfterFees: 98n,
						},
					},
				},
			],
			triplesToCreate: [
				{
					termId: TERM_ID,
					subjectId: SUBJECT_ID,
					predicateId: PREDICATE_ID,
					objectId: OBJECT_ID,
					assetsIn: 100n,
					readContext: {
						previewCreate: {
							sharesOut: 40n,
							feeBaseAssets: 97n,
							assetsAfterFees: 96n,
						},
					},
				},
			],
			seedDeposits: [
				{
					termId: TERM_ID,
					curveId: 1n,
					assetsIn: 500n,
					slippageBps: 100n,
					readContext: {
						previewDeposit: {
							sharesOut: 250n,
							assetsAfterFees: 495n,
						},
						entryFeeAmount: 0n,
						protocolFeeAmount: 0n,
						currentSharePrice: 1n,
					},
				},
				{
					termId: TERM_ID,
					curveId: 1n,
					assetsIn: 500n,
					slippageBps: 50n,
					readContext: {
						previewDeposit: {
							sharesOut: 240n,
							assetsAfterFees: 490n,
						},
						entryFeeAmount: 1n,
						protocolFeeAmount: 1n,
						currentSharePrice: 1n,
					},
				},
			],
		});

		expect(envelope.steps.map((step) => step.id)).toEqual([
			'create-atoms-1',
			'create-triples-2',
			'deposit-batch-3',
		]);
		expect(envelope.estimates).toMatchObject({
			createTriplePreviews: [
				{
					assetsIn: '100',
					sharesOut: '40',
				},
			],
			seedDepositQuotes: [{ sharesOut: '250' }, { sharesOut: '240' }],
			totalValue: '1200',
		});
	});

	it('rejects missing triple preview context for create-and-seed plans', async () => {
		await expect(
			buildMultiVaultCreateAndSeedPlan({
				multiVaultAddress: MULTIVAULT,
				receiver: ACCOUNT,
				triplesToCreate: [
					{
						termId: TERM_ID,
						subjectId: SUBJECT_ID,
						predicateId: PREDICATE_ID,
						objectId: OBJECT_ID,
						assetsIn: 100n,
					},
				],
			})
		).rejects.toThrow(
			'buildMultiVaultCreateAndSeedPlan requires triplesToCreate[].readContext.previewCreate.'
		);
	});

	it('prepends an approval step when CREATION approval is not yet granted', async () => {
		const CALLER = '0x5555555555555555555555555555555555555555' as Address;
		const envelope = await buildMultiVaultOnBehalfOfCreationPlan({
			multiVaultAddress: MULTIVAULT,
			creator: ACCOUNT,
			caller: CALLER,
			atoms: [{ data: '0x1234', assets: 100n }],
			approvalAlreadyGranted: false,
			hasDepositApproval: false,
			hasRedemptionApproval: false,
		});

		expect(envelope.action).toBe('multivault.onBehalfOfCreation');
		expect(envelope.steps.map((step) => step.id)).toEqual(['approve-1', 'create-atoms-for-2']);
		expect(envelope.steps[0]?.metadata?.context?.signer).toBe('creator');
		expect(envelope.steps[1]?.metadata?.context?.signer).toBe('caller');
		expect(envelope.steps[1]?.value).toBe('100');
	});

	it('skips the approval step when CREATION approval is already granted', async () => {
		const CALLER = '0x5555555555555555555555555555555555555555' as Address;
		const envelope = await buildMultiVaultOnBehalfOfCreationPlan({
			multiVaultAddress: MULTIVAULT,
			creator: ACCOUNT,
			caller: CALLER,
			triples: [
				{ subjectId: SUBJECT_ID, predicateId: PREDICATE_ID, objectId: OBJECT_ID, assets: 50n },
			],
			approvalAlreadyGranted: true,
			hasDepositApproval: false,
			hasRedemptionApproval: false,
		});

		expect(envelope.steps.map((step) => step.id)).toEqual(['create-triples-for-1']);
	});

	it('preserves an existing DEPOSIT/REDEMPTION approval in the approve step instead of clobbering it', async () => {
		const CALLER = '0x5555555555555555555555555555555555555555' as Address;
		const envelope = await buildMultiVaultOnBehalfOfCreationPlan({
			multiVaultAddress: MULTIVAULT,
			creator: ACCOUNT,
			caller: CALLER,
			atoms: [{ data: '0x1234', assets: 100n }],
			approvalAlreadyGranted: false,
			hasDepositApproval: true,
			hasRedemptionApproval: true,
		});

		const approveStep = envelope.steps.find((step) => step.id === 'approve-1');
		expect(approveStep?.data).toBe(multiVaultApproveEncode(CALLER, ApprovalTypes.ALL));
	});

	it('assembles a multicall batch envelope with aligned data/value arrays', () => {
		const multiVaultTarget = resolveAgentActionTarget({ chainId: 1155, contract: 'multivault' });
		const envelope = buildMultiVaultMulticallPlan({
			subCalls: [
				{ calldata: '0xaaaa', value: 100n },
				{ calldata: '0xbbbb', value: 0n },
			],
		});

		expect(envelope.action).toBe('multivault.multicall');
		expect(envelope.steps).toHaveLength(1);
		expect(envelope.steps[0]?.to).toBe(multiVaultTarget.address);
		expect(envelope.steps[0]?.value).toBe('100');
		expect(envelope.estimates).toMatchObject({ subCallCount: 2, totalValue: '100' });
	});
});
