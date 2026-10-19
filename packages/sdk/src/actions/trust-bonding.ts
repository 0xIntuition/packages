import {
	multiVaultDepositEncode,
	multiVaultPreviewDeposit,
	type ReadConfig,
	TrustBondingAbi,
	trustBondingCurrentEpoch,
	trustBondingEpochTimestampEnd,
	trustBondingGetPersonalUtilizationRatio,
	trustBondingGetSystemApy,
	trustBondingGetSystemUtilizationRatio,
	trustBondingGetUserApy,
	trustBondingGetUserCurrentClaimableRewards,
	trustBondingGetUserInfo,
	trustBondingGetUserRewardsForEpoch,
	trustBondingHasClaimedRewardsForEpoch,
	trustBondingLocked,
	trustBondingLockedEnd,
	trustBondingPreviousEpoch,
	trustBondingUserEligibleRewardsForEpoch,
	WrappedTrustAbi,
	type WriteConfig,
} from '@0xintuition/protocol';
import type { Address, Hex } from 'viem';
import { encodeFunctionData, isAddress } from 'viem';

const BPS_DENOMINATOR = 10_000n;
const DEFAULT_SLIPPAGE_BPS = 100n;
const MAX_EPOCH_REWARDS_TIMELINE_RANGE = 100n;

type ApyTuple = readonly [bigint, bigint] & {
	currentApy?: bigint;
	maxApy?: bigint;
};

type UserInfoTuple = readonly [bigint, bigint, bigint, bigint, bigint, bigint] & {
	personalUtilization?: bigint;
	eligibleRewards?: bigint;
	maxRewards?: bigint;
	lockedAmount?: bigint;
	lockEnd?: bigint;
	bondedBalance?: bigint;
};

type LockedTuple = readonly [bigint, bigint] & {
	amount?: bigint;
	end?: bigint;
};

type UserRewardsForEpochTuple = readonly [bigint, bigint] & {
	currentRewards?: bigint;
	maxRewards?: bigint;
};

export type TrustBondingUserInfoSnapshot = {
	personalUtilization: bigint;
	eligibleRewards: bigint;
	maxRewards: bigint;
	lockedAmount: bigint;
	lockEnd: bigint;
	bondedBalance: bigint;
};

export type TrustBondingRewardsDashboard = {
	account: Address;
	currentEpoch: bigint;
	previousEpoch: bigint;
	currentEpochEndTimestamp: bigint;
	userInfo: TrustBondingUserInfoSnapshot;
	currentClaimableRewards: bigint;
	userApy: {
		currentApy: bigint;
		maxApy: bigint;
	};
	systemApy: {
		currentApy: bigint;
		maxApy: bigint;
	};
	hasClaimedPreviousEpochRewards: boolean;
};

export type TrustBondingClaimActionReason =
	| 'can-claim'
	| 'invalid-recipient'
	| 'too-early'
	| 'already-claimed'
	| 'nothing-to-claim'
	| 'inconsistent-state';

export type TrustBondingClaimActionState = {
	account: Address;
	recipient: Address | null;
	currentEpoch: bigint;
	previousEpoch: bigint | null;
	claimableRewards: bigint;
	hasClaimedPreviousEpochRewards: boolean | null;
	canClaim: boolean;
	reason: TrustBondingClaimActionReason;
	ctaLabel: string;
};

export type TrustBondingLockActionKind =
	| 'createLock'
	| 'increaseAmount'
	| 'increaseUnlockTime'
	| 'increaseAmountAndTime'
	| 'withdrawAndCreateLock';

export type TrustBondingLockActionPlan = {
	account: Address;
	action: TrustBondingLockActionKind;
	args: readonly bigint[];
	calldata: Hex;
	lockedAmount: bigint;
	lockEnd: bigint;
	nowTimestamp: bigint;
	isExpired: boolean;
};

export type TrustBondingClaimAndRestakeStep = {
	type:
		| 'claimRewards'
		| 'wrappedTrustDeposit'
		| 'wrappedTrustApprove'
		| 'trustBondingDepositFor'
		| 'multiVaultDeposit';
	to: Address;
	calldata: Hex;
	value?: bigint;
	estimatedAmount: bigint;
};

export type TrustBondingClaimAndRestakePlanResult = {
	account: Address;
	recipient: Address;
	claimableRewards: bigint;
	target: 'trust-bonding' | 'multivault';
	steps: TrustBondingClaimAndRestakeStep[];
	estimatedSharesOut?: bigint;
	minSharesOut?: bigint;
};

export type TrustBondingLockStateSummary = {
	account: Address;
	lockedAmount: bigint;
	lockEnd: bigint;
	nowTimestamp: bigint;
	isExpired: boolean;
	timeRemaining: bigint;
	nextActions: TrustBondingLockActionKind[];
};

export type TrustBondingEpochRewardsPoint = {
	epoch: bigint;
	eligibleRewards: bigint;
	currentRewards: bigint;
	maxRewards: bigint;
	hasClaimed: boolean;
	personalUtilizationRatio: bigint;
	systemUtilizationRatio: bigint;
	statusLabel: 'claimed' | 'claimable' | 'unclaimed' | 'no-rewards';
};

export type TrustBondingEpochRewardsTimeline = {
	account: Address;
	startEpoch: bigint;
	endEpoch: bigint;
	currentEpoch: bigint;
	totalEligibleRewards: bigint;
	totalCurrentRewards: bigint;
	totalMaxRewards: bigint;
	points: TrustBondingEpochRewardsPoint[];
};

type TrustBondingDashboardDeps = {
	currentEpoch: typeof trustBondingCurrentEpoch;
	previousEpoch: typeof trustBondingPreviousEpoch;
	epochTimestampEnd: typeof trustBondingEpochTimestampEnd;
	getUserInfo: typeof trustBondingGetUserInfo;
	getUserCurrentClaimableRewards: typeof trustBondingGetUserCurrentClaimableRewards;
	getUserApy: typeof trustBondingGetUserApy;
	getSystemApy: typeof trustBondingGetSystemApy;
	hasClaimedRewardsForEpoch: typeof trustBondingHasClaimedRewardsForEpoch;
};

type TrustBondingLockDeps = {
	locked: typeof trustBondingLocked;
	lockedEnd: typeof trustBondingLockedEnd;
};

type TrustBondingClaimAndRestakeDeps = {
	getClaimActionState: typeof trustBondingGetClaimActionState;
	previewDeposit: typeof multiVaultPreviewDeposit;
};

type TrustBondingTimelineDeps = {
	currentEpoch: typeof trustBondingCurrentEpoch;
	userEligibleRewardsForEpoch: typeof trustBondingUserEligibleRewardsForEpoch;
	hasClaimedRewardsForEpoch: typeof trustBondingHasClaimedRewardsForEpoch;
	getUserRewardsForEpoch: typeof trustBondingGetUserRewardsForEpoch;
	getPersonalUtilizationRatio: typeof trustBondingGetPersonalUtilizationRatio;
	getSystemUtilizationRatio: typeof trustBondingGetSystemUtilizationRatio;
};

const defaultTrustBondingDeps: TrustBondingDashboardDeps = {
	currentEpoch: trustBondingCurrentEpoch,
	previousEpoch: trustBondingPreviousEpoch,
	epochTimestampEnd: trustBondingEpochTimestampEnd,
	getUserInfo: trustBondingGetUserInfo,
	getUserCurrentClaimableRewards: trustBondingGetUserCurrentClaimableRewards,
	getUserApy: trustBondingGetUserApy,
	getSystemApy: trustBondingGetSystemApy,
	hasClaimedRewardsForEpoch: trustBondingHasClaimedRewardsForEpoch,
};

const defaultTrustBondingLockDeps: TrustBondingLockDeps = {
	locked: trustBondingLocked,
	lockedEnd: trustBondingLockedEnd,
};

const defaultTrustBondingClaimAndRestakeDeps: TrustBondingClaimAndRestakeDeps = {
	getClaimActionState: trustBondingGetClaimActionState,
	previewDeposit: multiVaultPreviewDeposit,
};

const defaultTrustBondingTimelineDeps: TrustBondingTimelineDeps = {
	currentEpoch: trustBondingCurrentEpoch,
	userEligibleRewardsForEpoch: trustBondingUserEligibleRewardsForEpoch,
	hasClaimedRewardsForEpoch: trustBondingHasClaimedRewardsForEpoch,
	getUserRewardsForEpoch: trustBondingGetUserRewardsForEpoch,
	getPersonalUtilizationRatio: trustBondingGetPersonalUtilizationRatio,
	getSystemUtilizationRatio: trustBondingGetSystemUtilizationRatio,
};

function getTupleValue(tuple: readonly unknown[], index: number): bigint {
	const value = tuple[index];
	if (typeof value !== 'bigint') {
		throw new Error(`Expected bigint at tuple index ${index}.`);
	}
	return value;
}

function normalizeApy(result: ApyTuple): { currentApy: bigint; maxApy: bigint } {
	return {
		currentApy: result.currentApy ?? getTupleValue(result, 0),
		maxApy: result.maxApy ?? getTupleValue(result, 1),
	};
}

function normalizeUserInfo(result: UserInfoTuple): TrustBondingUserInfoSnapshot {
	return {
		personalUtilization: result.personalUtilization ?? getTupleValue(result, 0),
		eligibleRewards: result.eligibleRewards ?? getTupleValue(result, 1),
		maxRewards: result.maxRewards ?? getTupleValue(result, 2),
		lockedAmount: result.lockedAmount ?? getTupleValue(result, 3),
		lockEnd: result.lockEnd ?? getTupleValue(result, 4),
		bondedBalance: result.bondedBalance ?? getTupleValue(result, 5),
	};
}

function normalizeLockedResult(result: LockedTuple): { amount: bigint; end: bigint } {
	return {
		amount: result.amount ?? getTupleValue(result, 0),
		end: result.end ?? getTupleValue(result, 1),
	};
}

function normalizeUserRewardsForEpoch(result: UserRewardsForEpochTuple): {
	currentRewards: bigint;
	maxRewards: bigint;
} {
	return {
		currentRewards: result.currentRewards ?? getTupleValue(result, 0),
		maxRewards: result.maxRewards ?? getTupleValue(result, 1),
	};
}

function getCurrentTimestampSeconds(): bigint {
	return BigInt(Math.floor(Date.now() / 1000));
}

function validateSlippageBps(slippageBps: bigint): void {
	if (slippageBps < 0n || slippageBps >= BPS_DENOMINATOR) {
		throw new Error('slippageBps must be between 0 and 9999 (basis points).');
	}
}

function applySlippageFloor(amount: bigint, slippageBps: bigint): bigint {
	validateSlippageBps(slippageBps);
	return (amount * (BPS_DENOMINATOR - slippageBps)) / BPS_DENOMINATOR;
}

function sumBigints(values: bigint[]): bigint {
	let total = 0n;
	for (const value of values) {
		total += value;
	}
	return total;
}

function getEpochsInRange(startEpoch: bigint, endEpoch: bigint): bigint[] {
	const epochs: bigint[] = [];
	for (let epoch = startEpoch; epoch <= endEpoch; epoch += 1n) {
		epochs.push(epoch);
	}
	return epochs;
}

export async function trustBondingGetRewardsDashboard(
	config: ReadConfig,
	inputs: {
		account: Address;
	},
	deps: TrustBondingDashboardDeps = defaultTrustBondingDeps
): Promise<TrustBondingRewardsDashboard> {
	const { account } = inputs;
	const currentEpoch = await deps.currentEpoch(config);
	const previousEpoch = await deps.previousEpoch(config);

	const [
		currentEpochEndTimestamp,
		userInfoRaw,
		currentClaimableRewards,
		userApyRaw,
		systemApyRaw,
		hasClaimedPreviousEpochRewards,
	] = await Promise.all([
		deps.epochTimestampEnd(config, { args: [currentEpoch] }),
		deps.getUserInfo(config, { args: [account] }),
		deps.getUserCurrentClaimableRewards(config, { args: [account] }),
		deps.getUserApy(config, { args: [account] }),
		deps.getSystemApy(config),
		deps.hasClaimedRewardsForEpoch(config, { args: [account, previousEpoch] }),
	]);

	return {
		account,
		currentEpoch,
		previousEpoch,
		currentEpochEndTimestamp,
		userInfo: normalizeUserInfo(userInfoRaw as UserInfoTuple),
		currentClaimableRewards,
		userApy: normalizeApy(userApyRaw as ApyTuple),
		systemApy: normalizeApy(systemApyRaw as ApyTuple),
		hasClaimedPreviousEpochRewards,
	};
}

export async function trustBondingGetClaimActionState(
	config: ReadConfig,
	inputs: {
		account: Address;
		recipient?: string | null;
	},
	deps: TrustBondingDashboardDeps = defaultTrustBondingDeps
): Promise<TrustBondingClaimActionState> {
	const { account, recipient } = inputs;
	const recipientAddress =
		recipient == null || recipient.trim() === ''
			? account
			: isAddress(recipient)
				? recipient
				: null;

	const currentEpoch = await deps.currentEpoch(config);
	const firstClaimableEpoch = 1n;

	if (recipientAddress === null) {
		return {
			account,
			recipient: null,
			currentEpoch,
			previousEpoch: currentEpoch > 0n ? currentEpoch - 1n : null,
			claimableRewards: 0n,
			hasClaimedPreviousEpochRewards: null,
			canClaim: false,
			reason: 'invalid-recipient',
			ctaLabel: 'Enter valid recipient',
		};
	}

	if (currentEpoch < firstClaimableEpoch) {
		return {
			account,
			recipient: recipientAddress,
			currentEpoch,
			previousEpoch: null,
			claimableRewards: 0n,
			hasClaimedPreviousEpochRewards: null,
			canClaim: false,
			reason: 'too-early',
			ctaLabel: 'Claim unavailable',
		};
	}

	const previousEpoch = await deps.previousEpoch(config);
	const [claimableRewards, hasClaimedPreviousEpochRewards] = await Promise.all([
		deps.getUserCurrentClaimableRewards(config, { args: [account] }),
		deps.hasClaimedRewardsForEpoch(config, { args: [account, previousEpoch] }),
	]);

	if (claimableRewards > 0n && !hasClaimedPreviousEpochRewards) {
		return {
			account,
			recipient: recipientAddress,
			currentEpoch,
			previousEpoch,
			claimableRewards,
			hasClaimedPreviousEpochRewards,
			canClaim: true,
			reason: 'can-claim',
			ctaLabel: 'Claim rewards',
		};
	}

	if (claimableRewards > 0n && hasClaimedPreviousEpochRewards) {
		return {
			account,
			recipient: recipientAddress,
			currentEpoch,
			previousEpoch,
			claimableRewards,
			hasClaimedPreviousEpochRewards,
			canClaim: false,
			reason: 'inconsistent-state',
			ctaLabel: 'Refresh state',
		};
	}

	if (hasClaimedPreviousEpochRewards) {
		return {
			account,
			recipient: recipientAddress,
			currentEpoch,
			previousEpoch,
			claimableRewards,
			hasClaimedPreviousEpochRewards,
			canClaim: false,
			reason: 'already-claimed',
			ctaLabel: 'Already claimed',
		};
	}

	return {
		account,
		recipient: recipientAddress,
		currentEpoch,
		previousEpoch,
		claimableRewards,
		hasClaimedPreviousEpochRewards,
		canClaim: false,
		reason: 'nothing-to-claim',
		ctaLabel: 'No rewards to claim',
	};
}

export async function trustBondingPrepareLockAction(
	config: ReadConfig,
	inputs: {
		account: Address;
		amountDelta?: bigint;
		unlockTime?: bigint;
		nowTimestamp?: bigint;
	},
	deps: TrustBondingLockDeps = defaultTrustBondingLockDeps
): Promise<TrustBondingLockActionPlan> {
	const {
		account,
		amountDelta = 0n,
		unlockTime,
		nowTimestamp = getCurrentTimestampSeconds(),
	} = inputs;

	if (amountDelta < 0n) {
		throw new Error('amountDelta must be greater than or equal to 0.');
	}

	const [lockedRaw, lockEnd] = await Promise.all([
		deps.locked(config, { args: [account] }),
		deps.lockedEnd(config, { args: [account] }),
	]);
	const normalizedLocked = normalizeLockedResult(lockedRaw as LockedTuple);
	const lockedAmount = normalizedLocked.amount > 0n ? normalizedLocked.amount : 0n;
	const isExpired = lockEnd <= nowTimestamp;
	const hasUnlockIncrease = unlockTime != null && unlockTime > lockEnd;
	const hasAmountIncrease = amountDelta > 0n;

	if (unlockTime != null && unlockTime <= nowTimestamp) {
		throw new Error('unlockTime must be in the future.');
	}

	let action: TrustBondingLockActionKind;
	let args: readonly bigint[];

	if (lockedAmount === 0n) {
		if (!hasAmountIncrease || unlockTime == null) {
			throw new Error('createLock requires amountDelta > 0 and unlockTime.');
		}
		action = 'createLock';
		args = [amountDelta, unlockTime] as const;
	} else if (isExpired) {
		if (!hasAmountIncrease || unlockTime == null) {
			throw new Error('withdrawAndCreateLock requires amountDelta > 0 and unlockTime.');
		}
		action = 'withdrawAndCreateLock';
		args = [amountDelta, unlockTime] as const;
	} else if (hasAmountIncrease && hasUnlockIncrease && unlockTime != null) {
		action = 'increaseAmountAndTime';
		args = [amountDelta, unlockTime] as const;
	} else if (hasAmountIncrease) {
		action = 'increaseAmount';
		args = [amountDelta] as const;
	} else if (hasUnlockIncrease && unlockTime != null) {
		action = 'increaseUnlockTime';
		args = [unlockTime] as const;
	} else {
		throw new Error('No valid lock action for the provided inputs.');
	}

	let calldata: Hex;
	switch (action) {
		case 'createLock':
			calldata = encodeFunctionData({
				abi: TrustBondingAbi,
				functionName: 'create_lock',
				args: args as readonly [bigint, bigint],
			});
			break;
		case 'increaseAmount':
			calldata = encodeFunctionData({
				abi: TrustBondingAbi,
				functionName: 'increase_amount',
				args: args as readonly [bigint],
			});
			break;
		case 'increaseUnlockTime':
			calldata = encodeFunctionData({
				abi: TrustBondingAbi,
				functionName: 'increase_unlock_time',
				args: args as readonly [bigint],
			});
			break;
		case 'increaseAmountAndTime':
			calldata = encodeFunctionData({
				abi: TrustBondingAbi,
				functionName: 'increase_amount_and_time',
				args: args as readonly [bigint, bigint],
			});
			break;
		case 'withdrawAndCreateLock':
			calldata = encodeFunctionData({
				abi: TrustBondingAbi,
				functionName: 'withdraw_and_create_lock',
				args: args as readonly [bigint, bigint],
			});
			break;
	}

	return {
		account,
		action,
		args,
		calldata,
		lockedAmount,
		lockEnd,
		nowTimestamp,
		isExpired,
	};
}

export async function trustBondingClaimAndRestakePlan(
	config: ReadConfig,
	inputs: {
		account: Address;
		recipient?: Address;
		target:
			| {
					kind: 'trust-bonding';
					wrappedTrustAddress: Address;
					beneficiary?: Address;
			  }
			| {
					kind: 'multivault';
					receiver?: Address;
					termId: Hex;
					curveId: bigint;
					multiVaultConfig: WriteConfig;
					slippageBps?: bigint;
			  };
	},
	deps: TrustBondingClaimAndRestakeDeps = defaultTrustBondingClaimAndRestakeDeps
): Promise<TrustBondingClaimAndRestakePlanResult> {
	const { account, recipient, target } = inputs;
	const claimState = await deps.getClaimActionState(config, {
		account,
		recipient,
	});

	if (!claimState.canClaim || claimState.recipient == null) {
		throw new Error(`Rewards are not claimable in the current state (${claimState.reason}).`);
	}

	const claimableRewards = claimState.claimableRewards;
	const resolvedRecipient = claimState.recipient;
	if (resolvedRecipient.toLowerCase() !== account.toLowerCase()) {
		throw new Error('Claim recipient must match account for claim-and-restake plans.');
	}

	const steps: TrustBondingClaimAndRestakeStep[] = [
		{
			type: 'claimRewards',
			to: config.address,
			calldata: encodeFunctionData({
				abi: TrustBondingAbi,
				functionName: 'claimRewards',
				args: [resolvedRecipient],
			}),
			estimatedAmount: claimableRewards,
		},
	];

	if (target.kind === 'trust-bonding') {
		const beneficiary = target.beneficiary ?? account;
		steps.push(
			{
				type: 'wrappedTrustDeposit',
				to: target.wrappedTrustAddress,
				calldata: encodeFunctionData({
					abi: WrappedTrustAbi,
					functionName: 'deposit',
					args: [],
				}),
				value: claimableRewards,
				estimatedAmount: claimableRewards,
			},
			{
				type: 'wrappedTrustApprove',
				to: target.wrappedTrustAddress,
				calldata: encodeFunctionData({
					abi: WrappedTrustAbi,
					functionName: 'approve',
					args: [config.address, claimableRewards],
				}),
				estimatedAmount: claimableRewards,
			},
			{
				type: 'trustBondingDepositFor',
				to: config.address,
				calldata: encodeFunctionData({
					abi: TrustBondingAbi,
					functionName: 'deposit_for',
					args: [beneficiary, claimableRewards],
				}),
				estimatedAmount: claimableRewards,
			}
		);

		return {
			account,
			recipient: resolvedRecipient,
			claimableRewards,
			target: 'trust-bonding',
			steps,
		};
	}

	const slippageBps = target.slippageBps ?? DEFAULT_SLIPPAGE_BPS;
	validateSlippageBps(slippageBps);

	const previewDeposit = await deps.previewDeposit(target.multiVaultConfig, {
		args: [target.termId, target.curveId, claimableRewards],
	});
	const sharesOut = getTupleValue(previewDeposit as readonly unknown[], 0);
	const minSharesOut = applySlippageFloor(sharesOut, slippageBps);
	const receiver = target.receiver ?? account;

	steps.push({
		type: 'multiVaultDeposit',
		to: target.multiVaultConfig.address,
		calldata: multiVaultDepositEncode(receiver, target.termId, target.curveId, minSharesOut),
		value: claimableRewards,
		estimatedAmount: claimableRewards,
	});

	return {
		account,
		recipient: resolvedRecipient,
		claimableRewards,
		target: 'multivault',
		steps,
		estimatedSharesOut: sharesOut,
		minSharesOut,
	};
}

export async function trustBondingGetLockStateSummary(
	config: ReadConfig,
	inputs: {
		account: Address;
		nowTimestamp?: bigint;
	},
	deps: TrustBondingLockDeps = defaultTrustBondingLockDeps
): Promise<TrustBondingLockStateSummary> {
	const { account, nowTimestamp = getCurrentTimestampSeconds() } = inputs;
	const [lockedRaw, lockEnd] = await Promise.all([
		deps.locked(config, { args: [account] }),
		deps.lockedEnd(config, { args: [account] }),
	]);
	const normalizedLocked = normalizeLockedResult(lockedRaw as LockedTuple);
	const lockedAmount = normalizedLocked.amount > 0n ? normalizedLocked.amount : 0n;
	const isExpired = lockEnd <= nowTimestamp;
	const timeRemaining = isExpired ? 0n : lockEnd - nowTimestamp;

	const nextActions: TrustBondingLockActionKind[] =
		lockedAmount === 0n
			? ['createLock']
			: isExpired
				? ['withdrawAndCreateLock']
				: ['increaseAmount', 'increaseUnlockTime', 'increaseAmountAndTime'];

	return {
		account,
		lockedAmount,
		lockEnd,
		nowTimestamp,
		isExpired,
		timeRemaining,
		nextActions,
	};
}

export async function trustBondingGetEpochRewardsTimeline(
	config: ReadConfig,
	inputs: {
		account: Address;
		startEpoch: bigint;
		endEpoch: bigint;
	},
	deps: TrustBondingTimelineDeps = defaultTrustBondingTimelineDeps
): Promise<TrustBondingEpochRewardsTimeline> {
	const { account, startEpoch, endEpoch } = inputs;

	if (startEpoch > endEpoch) {
		throw new Error('startEpoch cannot be greater than endEpoch.');
	}

	const currentEpoch = await deps.currentEpoch(config);
	if (endEpoch > currentEpoch) {
		throw new Error('endEpoch cannot be in the future.');
	}
	const rangeSize = endEpoch - startEpoch + 1n;
	if (rangeSize > MAX_EPOCH_REWARDS_TIMELINE_RANGE) {
		throw new Error(
			`Requested epoch range is too large. Max supported range is ${MAX_EPOCH_REWARDS_TIMELINE_RANGE.toString()} epochs.`
		);
	}

	const epochs = getEpochsInRange(startEpoch, endEpoch);
	const previousEpoch = currentEpoch > 0n ? currentEpoch - 1n : null;

	const points = await Promise.all(
		epochs.map(async (epoch) => {
			const [
				eligibleRewards,
				hasClaimed,
				userRewardsRaw,
				personalUtilizationRatio,
				systemUtilizationRatio,
			] = await Promise.all([
				deps.userEligibleRewardsForEpoch(config, { args: [account, epoch] }),
				deps.hasClaimedRewardsForEpoch(config, { args: [account, epoch] }),
				deps.getUserRewardsForEpoch(config, { args: [account, epoch] }),
				deps.getPersonalUtilizationRatio(config, { args: [account, epoch] }),
				deps.getSystemUtilizationRatio(config, { args: [epoch] }),
			]);

			const normalizedRewards = normalizeUserRewardsForEpoch(
				userRewardsRaw as UserRewardsForEpochTuple
			);

			const statusLabel: TrustBondingEpochRewardsPoint['statusLabel'] = hasClaimed
				? 'claimed'
				: normalizedRewards.currentRewards > 0n && previousEpoch != null && epoch === previousEpoch
					? 'claimable'
					: normalizedRewards.currentRewards > 0n
						? 'unclaimed'
						: 'no-rewards';

			return {
				epoch,
				eligibleRewards,
				currentRewards: normalizedRewards.currentRewards,
				maxRewards: normalizedRewards.maxRewards,
				hasClaimed,
				personalUtilizationRatio,
				systemUtilizationRatio,
				statusLabel,
			} satisfies TrustBondingEpochRewardsPoint;
		})
	);

	return {
		account,
		startEpoch,
		endEpoch,
		currentEpoch,
		totalEligibleRewards: sumBigints(points.map((point) => point.eligibleRewards)),
		totalCurrentRewards: sumBigints(points.map((point) => point.currentRewards)),
		totalMaxRewards: sumBigints(points.map((point) => point.maxRewards)),
		points,
	};
}
