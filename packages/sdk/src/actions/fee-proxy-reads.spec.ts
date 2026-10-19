import { FeeProxyAbi } from '@0xintuition/periphery';
import { type Address, decodeFunctionData, type PublicClient, zeroAddress } from 'viem';
import { describe, expect, it, vi } from 'vitest';
import { feeProxyGetAffiliateProfile } from './fee-proxy-affiliate-profile';
import { feeProxyClaimRefundIfAny } from './fee-proxy-claim-refund-if-any';

const FEE_PROXY = '0x2222222222222222222222222222222222222222' as Address;
const AFFILIATE = '0x1111111111111111111111111111111111111111' as Address;
const RECIPIENT = '0x4444444444444444444444444444444444444444' as Address;
const USER = '0x3333333333333333333333333333333333333333' as Address;

const ROW = {
	fees: { depositBps: 100n, creationBps: 1_200n, depositFixedFee: 0n, creationFixedFee: 5n },
	feeRecipient: RECIPIENT,
	registeredAt: 1_700_000_000n,
	paused: false,
};
const STATS = {
	txCount: 3n,
	uniqueUsers: 2n,
	totalGrossAssets: 300n,
	totalFees: 4n,
	totalForwardedAssets: 296n,
	depositCount: 2n,
	depositGrossAssets: 200n,
	depositFees: 2n,
	depositForwardedAssets: 198n,
	creationCount: 1n,
	creationGrossAssets: 100n,
	creationFees: 2n,
	creationForwardedAssets: 98n,
};

const READS: Record<string, unknown> = {
	affiliateConfig: ROW,
	isAffiliateActive: true,
	affiliateStats: STATS,
	maxFeeBps: 1_000n,
	maxFixedFee: 10n,
	registrationFee: 10n ** 19n,
};

describe('feeProxyGetAffiliateProfile', () => {
	it('reads everything in one multicall and normalises fees, caps and headroom', async () => {
		const multicall = vi.fn(async ({ contracts }: { contracts: { functionName: string }[] }) =>
			contracts.map((contract) => ({ status: 'success', result: READS[contract.functionName] }))
		);
		const readContract = vi.fn();
		const publicClient = { multicall, readContract } as unknown as PublicClient;

		const profile = await feeProxyGetAffiliateProfile(
			{ address: FEE_PROXY, publicClient },
			{ affiliate: AFFILIATE }
		);

		expect(multicall).toHaveBeenCalledTimes(1);
		expect(readContract).not.toHaveBeenCalled();
		const contracts = multicall.mock.calls[0]?.[0].contracts ?? [];
		expect(contracts.map((contract) => contract.functionName)).toEqual([
			'affiliateConfig',
			'isAffiliateActive',
			'affiliateStats',
			'maxFeeBps',
			'maxFixedFee',
			'registrationFee',
		]);

		expect(profile.registered).toBe(true);
		expect(profile.active).toBe(true);
		expect(profile.paused).toBe(false);
		expect(profile.registeredAt).toBe(ROW.registeredAt);
		expect(profile.feeRecipient).toBe(RECIPIENT);
		expect(profile.fees).toEqual(ROW.fees);
		expect(profile.feePercent).toEqual({ deposit: 1, creation: 12 });
		expect(profile.caps).toEqual({ maxFeeBps: 1_000n, maxFixedFee: 10n, maxFeePercent: 10 });
		// Creation bps sits 200 bps over a lowered cap: routing creations reverts until it is fixed.
		expect(profile.headroom).toEqual({
			depositBps: 900n,
			creationBps: -200n,
			depositFixedFee: 10n,
			creationFixedFee: 5n,
		});
		expect(profile.withinCaps).toEqual({ deposit: true, creation: false });
		expect(profile.registrationFee).toBe(10n ** 19n);
		expect(profile.stats).toEqual(STATS);
	});

	it('falls back to individual reads when the multicall is unavailable', async () => {
		const multicall = vi.fn().mockRejectedValue(new Error('no multicall3 on this chain'));
		const readContract = vi.fn(
			async ({ functionName }: { functionName: string }) => READS[functionName]
		);
		const publicClient = { multicall, readContract } as unknown as PublicClient;

		const profile = await feeProxyGetAffiliateProfile(
			{ address: FEE_PROXY, publicClient },
			{ affiliate: AFFILIATE }
		);

		expect(readContract).toHaveBeenCalledTimes(6);
		expect(profile.withinCaps).toEqual({ deposit: true, creation: false });
		expect(profile.stats).toEqual(STATS);
	});

	it('an unregistered affiliate profiles as unregistered, inactive and zero-feed', async () => {
		const reads: Record<string, unknown> = {
			...READS,
			affiliateConfig: {
				fees: { depositBps: 0n, creationBps: 0n, depositFixedFee: 0n, creationFixedFee: 0n },
				feeRecipient: zeroAddress,
				registeredAt: 0n,
				paused: false,
			},
			isAffiliateActive: false,
		};
		const multicall = vi.fn(async ({ contracts }: { contracts: { functionName: string }[] }) =>
			contracts.map((contract) =>
				contract.functionName === 'affiliateStats'
					? { status: 'failure', error: new Error('reverted') }
					: { status: 'success', result: reads[contract.functionName] }
			)
		);
		const readContract = vi.fn(async ({ functionName }: { functionName: string }) =>
			functionName === 'affiliateStats' ? STATS : reads[functionName]
		);
		const publicClient = { multicall, readContract } as unknown as PublicClient;

		const profile = await feeProxyGetAffiliateProfile(
			{ address: FEE_PROXY, publicClient },
			{ affiliate: AFFILIATE }
		);

		// One failed leg sends the whole profile through the individual reads.
		expect(readContract).toHaveBeenCalledTimes(6);
		expect(profile.registered).toBe(false);
		expect(profile.active).toBe(false);
		expect(profile.feePercent).toEqual({ deposit: 0, creation: 0 });
	});
});

describe('feeProxyClaimRefundIfAny', () => {
	const config = (owed: bigint) => {
		const readContract = vi.fn().mockResolvedValue(owed);
		return {
			config: { address: FEE_PROXY, publicClient: { readContract } as unknown as PublicClient },
			readContract,
		};
	};

	it('returns null and builds nothing when nothing is owed', async () => {
		const { config: zero, readContract } = config(0n);
		await expect(feeProxyClaimRefundIfAny(zero, { user: USER })).resolves.toBeNull();
		expect(readContract).toHaveBeenCalledWith(
			expect.objectContaining({ functionName: 'pendingRefund', args: [USER] })
		);
	});

	it('builds a claimRefundTo tx from the ledger owner when a refund is owed', async () => {
		const { config: owed } = config(123n);
		const claim = await feeProxyClaimRefundIfAny(owed, { user: USER, recipient: RECIPIENT });

		expect(claim?.amount).toBe(123n);
		expect(claim?.tx.from).toBe(USER);
		expect(claim?.tx.to).toBe(FEE_PROXY);
		expect(claim?.tx.value).toBe(0n);
		const decoded = decodeFunctionData({ abi: FeeProxyAbi, data: claim?.tx.data ?? '0x' });
		expect(decoded.functionName).toBe('claimRefundTo');
		expect(decoded.args).toEqual([RECIPIENT]);
	});

	it('defaults the recipient to the user', async () => {
		const { config: owed } = config(1n);
		const claim = await feeProxyClaimRefundIfAny(owed, { user: USER });
		const decoded = decodeFunctionData({ abi: FeeProxyAbi, data: claim?.tx.data ?? '0x' });
		expect(decoded.args).toEqual([USER]);
	});

	it('rejects the recipients claimRefundTo itself rejects', async () => {
		const { config: owed } = config(1n);
		await expect(
			feeProxyClaimRefundIfAny(owed, { user: USER, recipient: zeroAddress })
		).rejects.toThrow(/ZeroAddress/);
		await expect(
			feeProxyClaimRefundIfAny(owed, { user: USER, recipient: FEE_PROXY })
		).rejects.toThrow(/RefundRecipientIsProxy/);
	});
});
