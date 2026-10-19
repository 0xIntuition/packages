import {
	type FeeConfig,
	FeeProxyAbi,
	feeProxyAffiliateConfig,
	feeProxyAffiliateStats,
	feeProxyIsAffiliateActive,
	feeProxyMaxFeeBps,
	feeProxyMaxFixedFee,
	feeProxyRegistrationFee,
	type ReadConfig,
} from '@0xintuition/periphery';
import type { Address, ContractFunctionReturnType } from 'viem';

const DEFAULT_MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11' as Address;
const BPS_PER_PERCENT = 100;

export type FeeProxyAffiliateStats = ContractFunctionReturnType<
	typeof FeeProxyAbi,
	'view',
	'affiliateStats'
>;

/** Cap minus configured value per fee field. Negative means the row is over the current cap. */
export type FeeProxyFeeHeadroom = {
	depositBps: bigint;
	creationBps: bigint;
	depositFixedFee: bigint;
	creationFixedFee: bigint;
};

export type FeeProxyAffiliateProfile = {
	affiliate: Address;
	registered: boolean;
	/** Registered and not row-paused: the condition every routing call checks. */
	active: boolean;
	paused: boolean;
	/** Unix seconds; zero when unregistered. */
	registeredAt: bigint;
	feeRecipient: Address;
	fees: FeeConfig;
	/** The bps fields as percentages, for display (`250n` bps is `2.5`). */
	feePercent: { deposit: number; creation: number };
	caps: { maxFeeBps: bigint; maxFixedFee: bigint; maxFeePercent: number };
	headroom: FeeProxyFeeHeadroom;
	/**
	 * Whether each side's row is within the current protocol caps. Routing on a side that is over
	 * the cap reverts until the affiliate lowers its fees.
	 */
	withinCaps: { deposit: boolean; creation: boolean };
	registrationFee: bigint;
	stats: FeeProxyAffiliateStats;
};

type AffiliateProfileReads = {
	config: ContractFunctionReturnType<typeof FeeProxyAbi, 'view', 'affiliateConfig'>;
	active: boolean;
	stats: FeeProxyAffiliateStats;
	maxFeeBps: bigint;
	maxFixedFee: bigint;
	registrationFee: bigint;
};

function bpsToPercent(bps: bigint): number {
	return Number(bps) / BPS_PER_PERCENT;
}

async function readAffiliateProfileBatched(
	config: ReadConfig,
	affiliate: Address
): Promise<AffiliateProfileReads | null> {
	const { address, publicClient } = config;
	const multicallAddress = publicClient.chain?.contracts?.multicall3?.address
		? publicClient.chain.contracts.multicall3.address
		: DEFAULT_MULTICALL3_ADDRESS;
	const feeProxy = { address, abi: FeeProxyAbi } as const;

	const results = await publicClient.multicall({
		multicallAddress,
		contracts: [
			{ ...feeProxy, functionName: 'affiliateConfig', args: [affiliate] },
			{ ...feeProxy, functionName: 'isAffiliateActive', args: [affiliate] },
			{ ...feeProxy, functionName: 'affiliateStats', args: [affiliate] },
			{ ...feeProxy, functionName: 'maxFeeBps' },
			{ ...feeProxy, functionName: 'maxFixedFee' },
			{ ...feeProxy, functionName: 'registrationFee' },
		],
	});
	const [configRead, activeRead, statsRead, maxFeeBpsRead, maxFixedFeeRead, registrationFeeRead] =
		results;

	if (
		configRead.status !== 'success' ||
		activeRead.status !== 'success' ||
		statsRead.status !== 'success' ||
		maxFeeBpsRead.status !== 'success' ||
		maxFixedFeeRead.status !== 'success' ||
		registrationFeeRead.status !== 'success'
	) {
		return null;
	}

	return {
		config: configRead.result,
		active: activeRead.result,
		stats: statsRead.result,
		maxFeeBps: maxFeeBpsRead.result,
		maxFixedFee: maxFixedFeeRead.result,
		registrationFee: registrationFeeRead.result,
	};
}

async function readAffiliateProfileIndividually(
	config: ReadConfig,
	affiliate: Address
): Promise<AffiliateProfileReads> {
	const [row, active, stats, maxFeeBps, maxFixedFee, registrationFee] = await Promise.all([
		feeProxyAffiliateConfig(config, { args: [affiliate] }),
		feeProxyIsAffiliateActive(config, { args: [affiliate] }),
		feeProxyAffiliateStats(config, { args: [affiliate] }),
		feeProxyMaxFeeBps(config),
		feeProxyMaxFixedFee(config),
		feeProxyRegistrationFee(config),
	]);
	return { config: row, active, stats, maxFeeBps, maxFixedFee, registrationFee };
}

/**
 * Reads everything a builder dashboard shows for one affiliate in one batched read: the registry
 * row (fees, fee recipient, registration time, pause flag), whether it is active, its aggregate
 * stats, the protocol caps and the registration fee. Uses the chain's Multicall3 (or the canonical
 * address); when the batch is unavailable or any leg fails it falls back to individual reads.
 * @param config FeeProxy address and public client.
 * @param inputs The affiliate to profile.
 * @returns The normalised profile: raw fees, fees as percentages, and headroom against the caps.
 */
export async function feeProxyGetAffiliateProfile(
	config: ReadConfig,
	inputs: { affiliate: Address }
): Promise<FeeProxyAffiliateProfile> {
	const { affiliate } = inputs;

	let reads: AffiliateProfileReads | null = null;
	try {
		reads = await readAffiliateProfileBatched(config, affiliate);
	} catch {
		reads = null;
	}
	reads ??= await readAffiliateProfileIndividually(config, affiliate);

	const { config: row, active, stats, maxFeeBps, maxFixedFee, registrationFee } = reads;
	const fees: FeeConfig = {
		depositBps: row.fees.depositBps,
		creationBps: row.fees.creationBps,
		depositFixedFee: row.fees.depositFixedFee,
		creationFixedFee: row.fees.creationFixedFee,
	};
	const headroom: FeeProxyFeeHeadroom = {
		depositBps: maxFeeBps - fees.depositBps,
		creationBps: maxFeeBps - fees.creationBps,
		depositFixedFee: maxFixedFee - fees.depositFixedFee,
		creationFixedFee: maxFixedFee - fees.creationFixedFee,
	};

	return {
		affiliate,
		registered: row.registeredAt !== 0n,
		active,
		paused: row.paused,
		registeredAt: row.registeredAt,
		feeRecipient: row.feeRecipient,
		fees,
		feePercent: {
			deposit: bpsToPercent(fees.depositBps),
			creation: bpsToPercent(fees.creationBps),
		},
		caps: {
			maxFeeBps,
			maxFixedFee,
			maxFeePercent: bpsToPercent(maxFeeBps),
		},
		headroom,
		withinCaps: {
			deposit: headroom.depositBps >= 0n && headroom.depositFixedFee >= 0n,
			creation: headroom.creationBps >= 0n && headroom.creationFixedFee >= 0n,
		},
		registrationFee,
		stats,
	};
}
