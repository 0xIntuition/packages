import type { Address, Hex } from 'viem';
import {
	trustBondingClaimAndRestakePlan as sdkTrustBondingClaimAndRestakePlan,
	trustBondingGetClaimActionState as sdkTrustBondingGetClaimActionState,
	trustBondingPrepareLockAction as sdkTrustBondingPrepareLockAction,
	type TrustBondingClaimAndRestakeStep,
	type TrustBondingLockActionKind,
	type TrustBondingUserInfoSnapshot,
} from '../index';

import { trustBondingClaimRewardsEncode } from './encoders';
import {
	buildPlanEnvelope,
	buildPlanStep,
	requireContext,
	toPureReadConfig,
	toPureWriteConfig,
} from './helpers';
import type { MultiVaultDepositPlanReadContext } from './multivault';

type IntuitionCoreChainId = 1155 | 13579;

type TrustBondingClaimPlanReadContext = {
	currentEpoch?: bigint;
	previousEpoch?: bigint;
	claimableRewards?: bigint;
	hasClaimedPreviousEpochRewards?: boolean;
};

type TrustBondingLockPlanReadContext = {
	lockedAmount?: bigint;
	lockEnd?: bigint;
};

type TrustBondingRestakeTarget =
	| {
			kind: 'trust-bonding';
			wrappedTrustAddress: Address;
			beneficiary?: Address;
	  }
	| {
			kind: 'multivault';
			multiVaultAddress: Address;
			receiver?: Address;
			termId: Hex;
			curveId: bigint;
			slippageBps?: bigint;
			readContext?: Pick<MultiVaultDepositPlanReadContext, 'previewDeposit'>;
	  };

export type BuildTrustBondingClaimPlanInputs = {
	chainId?: IntuitionCoreChainId;
	trustBondingAddress: Address;
	account: Address;
	recipient?: string | null;
	readContext?: TrustBondingClaimPlanReadContext;
};

export type BuildTrustBondingLockPlanInputs = {
	chainId?: IntuitionCoreChainId;
	trustBondingAddress: Address;
	account: Address;
	amountDelta?: bigint;
	unlockTime?: bigint;
	nowTimestamp?: bigint;
	readContext?: TrustBondingLockPlanReadContext;
};

export type BuildTrustBondingClaimAndRestakePlanInputs = {
	chainId?: IntuitionCoreChainId;
	trustBondingAddress: Address;
	account: Address;
	recipient?: Address | null;
	readContext?: TrustBondingClaimPlanReadContext;
	target: TrustBondingRestakeTarget;
};

const EMPTY_USER_INFO: TrustBondingUserInfoSnapshot = {
	personalUtilization: 0n,
	eligibleRewards: 0n,
	maxRewards: 0n,
	lockedAmount: 0n,
	lockEnd: 0n,
	bondedBalance: 0n,
};
const EMPTY_APY = [0n, 0n] as const;

function toPreviewDepositTuple(
	value: NonNullable<Pick<MultiVaultDepositPlanReadContext, 'previewDeposit'>['previewDeposit']>
): readonly [bigint, bigint] {
	if ('sharesOut' in value) {
		return [value.sharesOut, value.assetsAfterFees] as const;
	}

	return [value[0], value[1]] as const;
}

function getClaimStepLabel(step: TrustBondingClaimAndRestakeStep['type']): string {
	switch (step) {
		case 'claimRewards':
			return 'Claim rewards';
		case 'wrappedTrustDeposit':
			return 'Wrap TRUST';
		case 'wrappedTrustApprove':
			return 'Approve wrapped TRUST';
		case 'trustBondingDepositFor':
			return 'Restake into TrustBonding';
		case 'multiVaultDeposit':
			return 'Restake into MultiVault';
	}
}

function getLockActionLabel(action: TrustBondingLockActionKind): { id: string; label: string } {
	switch (action) {
		case 'createLock':
			return { id: 'create-lock', label: 'Create lock' };
		case 'increaseAmount':
			return { id: 'increase-amount', label: 'Increase amount' };
		case 'increaseUnlockTime':
			return { id: 'increase-unlock-time', label: 'Increase unlock time' };
		case 'increaseAmountAndTime':
			return { id: 'increase-amount-and-time', label: 'Increase amount and time' };
		case 'withdrawAndCreateLock':
			return { id: 'withdraw-and-create-lock', label: 'Withdraw and create lock' };
	}
}

function getClaimAndRestakeStepIntent(
	_chainId: IntuitionCoreChainId,
	stepType: TrustBondingClaimAndRestakeStep['type']
): {
	chainId: IntuitionCoreChainId;
	contract: 'multivault' | 'trustbonding' | 'wrapped-trust';
} {
	switch (stepType) {
		case 'claimRewards':
		case 'trustBondingDepositFor':
			return {
				chainId: 1155,
				contract: 'trustbonding',
			};
		case 'wrappedTrustDeposit':
		case 'wrappedTrustApprove':
			return {
				chainId: 1155,
				contract: 'wrapped-trust',
			};
		case 'multiVaultDeposit':
			return {
				chainId: 1155,
				contract: 'multivault',
			};
	}
}

async function resolveClaimActionState(
	trustBondingAddress: Address,
	account: Address,
	recipient: string | null | undefined,
	readContext: TrustBondingClaimPlanReadContext | undefined,
	planName: string
) {
	const deps = {
		currentEpoch: async () =>
			requireContext(readContext?.currentEpoch, planName, 'readContext.currentEpoch'),
		previousEpoch: async () =>
			requireContext(readContext?.previousEpoch, planName, 'readContext.previousEpoch'),
		epochTimestampEnd: async () => 0n,
		getUserInfo: async () => EMPTY_USER_INFO,
		getUserCurrentClaimableRewards: async () =>
			requireContext(readContext?.claimableRewards, planName, 'readContext.claimableRewards'),
		getUserApy: async () => EMPTY_APY,
		getSystemApy: async () => EMPTY_APY,
		hasClaimedRewardsForEpoch: async () =>
			requireContext(
				readContext?.hasClaimedPreviousEpochRewards,
				planName,
				'readContext.hasClaimedPreviousEpochRewards'
			),
	} satisfies NonNullable<Parameters<typeof sdkTrustBondingGetClaimActionState>[2]>;

	return await sdkTrustBondingGetClaimActionState(
		toPureReadConfig(trustBondingAddress),
		{
			account,
			recipient,
		},
		deps
	);
}

export async function trustBondingClaimEnvelope(inputs: BuildTrustBondingClaimPlanInputs) {
	const planName = 'buildTrustBondingClaimPlan';
	const { chainId = 1155, trustBondingAddress, account, recipient, readContext } = inputs;
	const state = await resolveClaimActionState(
		trustBondingAddress,
		account,
		recipient,
		readContext,
		planName
	);

	if (!state.canClaim || state.recipient === null) {
		throw new Error(`Rewards are not claimable in the current state (${state.reason}).`);
	}

	return buildPlanEnvelope({
		action: 'trustbonding.claim',
		module: 'plans/trust-bonding',
		method: planName,
		label: 'TrustBonding claim',
		description: 'Claims previous-epoch TrustBonding rewards.',
		tags: ['trustbonding', 'claim'],
		context: {
			trustBondingAddress,
			account,
			recipient: state.recipient,
		},
		steps: [
			buildPlanStep({
				id: 'claim-rewards',
				intent: {
					chainId,
					contract: 'trustbonding',
				},
				data: trustBondingClaimRewardsEncode(state.recipient),
				label: 'Claim rewards',
			}),
		],
		estimates: {
			currentEpoch: state.currentEpoch,
			previousEpoch: state.previousEpoch ?? null,
			claimableRewards: state.claimableRewards,
			reason: state.reason,
		},
	});
}

export async function trustBondingLockEnvelope(inputs: BuildTrustBondingLockPlanInputs) {
	const planName = 'buildTrustBondingLockPlan';
	const {
		chainId = 1155,
		trustBondingAddress,
		account,
		amountDelta,
		unlockTime,
		nowTimestamp,
		readContext,
	} = inputs;

	const deps = {
		locked: async () =>
			[
				requireContext(readContext?.lockedAmount, planName, 'readContext.lockedAmount'),
				requireContext(readContext?.lockEnd, planName, 'readContext.lockEnd'),
			] as const,
		lockedEnd: async () => requireContext(readContext?.lockEnd, planName, 'readContext.lockEnd'),
	} satisfies NonNullable<Parameters<typeof sdkTrustBondingPrepareLockAction>[2]>;

	const plan = await sdkTrustBondingPrepareLockAction(
		toPureReadConfig(trustBondingAddress),
		{
			account,
			amountDelta,
			unlockTime,
			nowTimestamp,
		},
		deps
	);
	const lockAction = getLockActionLabel(plan.action);

	return buildPlanEnvelope({
		action: 'trustbonding.lockAction',
		module: 'plans/trust-bonding',
		method: planName,
		label: 'TrustBonding lock action',
		description: 'Creates, extends, or recreates a TrustBonding lock.',
		tags: ['trustbonding', 'lock'],
		context: {
			trustBondingAddress,
			account,
		},
		steps: [
			buildPlanStep({
				id: lockAction.id,
				intent: {
					chainId,
					contract: 'trustbonding',
				},
				data: plan.calldata,
				label: lockAction.label,
				context: {
					action: plan.action,
				},
			}),
		],
		estimates: {
			action: plan.action,
			args: [...plan.args],
			lockedAmount: plan.lockedAmount,
			lockEnd: plan.lockEnd,
			nowTimestamp: plan.nowTimestamp,
			isExpired: plan.isExpired,
		},
	});
}

export async function trustBondingClaimAndRestakeEnvelope(
	inputs: BuildTrustBondingClaimAndRestakePlanInputs
) {
	const planName = 'buildTrustBondingClaimAndRestakePlan';
	const { chainId = 1155, trustBondingAddress, account, recipient, readContext, target } = inputs;

	const deps = {
		getClaimActionState: async (_config, claimInputs) =>
			await resolveClaimActionState(
				trustBondingAddress,
				claimInputs.account,
				claimInputs.recipient,
				readContext,
				planName
			),
		previewDeposit: async () =>
			toPreviewDepositTuple(
				requireContext(
					target.kind === 'multivault' ? target.readContext?.previewDeposit : undefined,
					planName,
					'target.readContext.previewDeposit'
				)
			),
	} satisfies NonNullable<Parameters<typeof sdkTrustBondingClaimAndRestakePlan>[2]>;

	const plan = await sdkTrustBondingClaimAndRestakePlan(
		toPureReadConfig(trustBondingAddress),
		{
			account,
			recipient: recipient ?? undefined,
			target:
				target.kind === 'trust-bonding'
					? {
							kind: 'trust-bonding',
							wrappedTrustAddress: target.wrappedTrustAddress,
							beneficiary: target.beneficiary,
						}
					: {
							kind: 'multivault',
							receiver: target.receiver,
							termId: target.termId,
							curveId: target.curveId,
							multiVaultConfig: toPureWriteConfig(target.multiVaultAddress),
							slippageBps: target.slippageBps,
						},
		},
		deps
	);

	return buildPlanEnvelope({
		action: 'trustbonding.claimAndRestake',
		module: 'plans/trust-bonding',
		method: planName,
		label: 'TrustBonding claim and restake',
		description: 'Claims rewards and restakes them into TrustBonding or MultiVault.',
		tags: ['trustbonding', 'claim', 'restake'],
		context: {
			trustBondingAddress,
			account,
			target: plan.target,
		},
		steps: plan.steps.map((step, index) =>
			buildPlanStep({
				id: `${step.type}-${index + 1}`,
				intent: getClaimAndRestakeStepIntent(chainId, step.type),
				data: step.calldata,
				value: step.value,
				label: getClaimStepLabel(step.type),
				context: {
					type: step.type,
					estimatedAmount: step.estimatedAmount,
				},
			})
		),
		estimates: {
			claimableRewards: plan.claimableRewards,
			target: plan.target,
			estimatedSharesOut: plan.estimatedSharesOut ?? null,
			minSharesOut: plan.minSharesOut ?? null,
		},
	});
}
