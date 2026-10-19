import { type ReadConfig, wrappedTrustAllowance } from '@0xintuition/protocol';
import type { Address, Hex } from 'viem';
import {
	type MultiVaultUserPositionSnapshot,
	multivaultGetUserPositionSnapshot,
} from './multivault';
import {
	type TrustBondingClaimActionState,
	type TrustBondingLockStateSummary,
	type TrustBondingRewardsDashboard,
	trustBondingGetClaimActionState,
	trustBondingGetLockStateSummary,
	trustBondingGetRewardsDashboard,
} from './trust-bonding';

export type PortfolioPositionInput = {
	termId: Hex;
	curveId: bigint;
};

export type PortfolioIntuitionPositionsSnapshot = {
	account: Address;
	positions: MultiVaultUserPositionSnapshot[];
	trustBonding: {
		dashboard: TrustBondingRewardsDashboard;
		lockState: TrustBondingLockStateSummary;
	};
	totals: {
		totalShares: bigint;
		totalEstimatedAssets: bigint;
		totalEstimatedRedeemableAssets: bigint;
	};
};

export type PortfolioActionableState = {
	account: Address;
	claim: TrustBondingClaimActionState;
	lock: TrustBondingLockStateSummary;
	redeemablePositions: Array<{
		termId: Hex;
		curveId: bigint;
		maxRedeemShares: bigint;
		estimatedAssetsForMaxRedeem: bigint;
		canRedeem: boolean;
	}>;
	approval: {
		checked: boolean;
		currentAllowance: bigint | null;
		requiredAllowance: bigint;
		required: boolean;
	};
	prioritizedCtas: string[];
};

type PortfolioDeps = {
	getUserPositionSnapshot: typeof multivaultGetUserPositionSnapshot;
	getRewardsDashboard: typeof trustBondingGetRewardsDashboard;
	getLockStateSummary: typeof trustBondingGetLockStateSummary;
	getClaimActionState: typeof trustBondingGetClaimActionState;
	getWrappedTrustAllowance: typeof wrappedTrustAllowance;
};

const defaultPortfolioDeps: PortfolioDeps = {
	getUserPositionSnapshot: multivaultGetUserPositionSnapshot,
	getRewardsDashboard: trustBondingGetRewardsDashboard,
	getLockStateSummary: trustBondingGetLockStateSummary,
	getClaimActionState: trustBondingGetClaimActionState,
	getWrappedTrustAllowance: wrappedTrustAllowance,
};

function sumBigints(values: bigint[]): bigint {
	let total = 0n;
	for (const value of values) {
		total += value;
	}
	return total;
}

export async function portfolioGetIntuitionPositionsSnapshot(
	configs: {
		multiVault: ReadConfig;
		trustBonding: ReadConfig;
	},
	inputs: {
		account: Address;
		positions: PortfolioPositionInput[];
		includeUtilization?: boolean;
		nowTimestamp?: bigint;
	},
	deps: PortfolioDeps = defaultPortfolioDeps
): Promise<PortfolioIntuitionPositionsSnapshot> {
	const { account, positions, includeUtilization = false, nowTimestamp } = inputs;

	const [positionSnapshots, rewardsDashboard, lockState] = await Promise.all([
		Promise.all(
			positions.map((position) =>
				deps.getUserPositionSnapshot(configs.multiVault, {
					account,
					termId: position.termId,
					curveId: position.curveId,
					includeUtilization,
				})
			)
		),
		deps.getRewardsDashboard(configs.trustBonding, { account }),
		deps.getLockStateSummary(configs.trustBonding, { account, nowTimestamp }),
	]);

	return {
		account,
		positions: positionSnapshots,
		trustBonding: {
			dashboard: rewardsDashboard,
			lockState,
		},
		totals: {
			totalShares: sumBigints(positionSnapshots.map((snapshot) => snapshot.shares)),
			totalEstimatedAssets: sumBigints(
				positionSnapshots.map((snapshot) => snapshot.estimatedAssetsForCurrentShares)
			),
			totalEstimatedRedeemableAssets: sumBigints(
				positionSnapshots.map((snapshot) => snapshot.estimatedAssetsForMaxRedeem)
			),
		},
	};
}

export async function portfolioGetActionableState(
	configs: {
		multiVault: ReadConfig;
		trustBonding: ReadConfig;
		wrappedTrust?: ReadConfig;
	},
	inputs: {
		account: Address;
		positions: PortfolioPositionInput[];
		nowTimestamp?: bigint;
		recipient?: string | null;
		expectedWrappedTrustSpend?: bigint;
	},
	deps: PortfolioDeps = defaultPortfolioDeps
): Promise<PortfolioActionableState> {
	const { account, positions, nowTimestamp, recipient, expectedWrappedTrustSpend = 0n } = inputs;
	if (expectedWrappedTrustSpend < 0n) {
		throw new Error('expectedWrappedTrustSpend must be greater than or equal to 0.');
	}

	const [claimState, lockState, positionSnapshots] = await Promise.all([
		deps.getClaimActionState(configs.trustBonding, { account, recipient }),
		deps.getLockStateSummary(configs.trustBonding, { account, nowTimestamp }),
		Promise.all(
			positions.map((position) =>
				deps.getUserPositionSnapshot(configs.multiVault, {
					account,
					termId: position.termId,
					curveId: position.curveId,
				})
			)
		),
	]);

	const redeemablePositions = positionSnapshots.map((position) => ({
		termId: position.termId,
		curveId: position.curveId,
		maxRedeemShares: position.maxRedeemShares,
		estimatedAssetsForMaxRedeem: position.estimatedAssetsForMaxRedeem,
		canRedeem: position.maxRedeemShares > 0n,
	}));

	const hasRedeemablePositions = redeemablePositions.some((position) => position.canRedeem);

	let currentAllowance: bigint | null = null;
	let approvalChecked = false;
	if (configs.wrappedTrust && expectedWrappedTrustSpend > 0n) {
		approvalChecked = true;
		currentAllowance = await deps.getWrappedTrustAllowance(configs.wrappedTrust, {
			args: [account, configs.trustBonding.address],
		});
	}

	const approvalRequired =
		approvalChecked && currentAllowance !== null && currentAllowance < expectedWrappedTrustSpend;

	const prioritizedCtas: string[] = [];
	if (claimState.canClaim) {
		prioritizedCtas.push('claim-rewards');
	}
	if (approvalRequired) {
		prioritizedCtas.push('approve-wrapped-trust');
	}
	if (hasRedeemablePositions) {
		prioritizedCtas.push('redeem-position');
	}
	if (lockState.nextActions.includes('createLock')) {
		prioritizedCtas.push('create-lock');
	} else if (lockState.nextActions.includes('withdrawAndCreateLock')) {
		prioritizedCtas.push('withdraw-and-relock');
	}
	if (prioritizedCtas.length === 0) {
		prioritizedCtas.push('no-action');
	}

	return {
		account,
		claim: claimState,
		lock: lockState,
		redeemablePositions,
		approval: {
			checked: approvalChecked,
			currentAllowance,
			requiredAllowance: expectedWrappedTrustSpend,
			required: approvalRequired,
		},
		prioritizedCtas,
	};
}
