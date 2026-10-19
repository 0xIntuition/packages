import {
	type Abi,
	type Address,
	decodeFunctionData,
	encodeFunctionData,
	type Hex,
	type PublicClient,
	type WalletClient,
} from 'viem';
import { describe, expect, it, vi } from 'vitest';

import { FeeProxyAbi } from '../contracts';
import { feeProxyAffiliateStats } from './affiliate-stats';
import { feeProxyAffiliateUserStats } from './affiliate-user-stats';
import { feeProxyClaimRefundTo } from './claim-refund-to';
import { feeProxyClaimRefundToEncode } from './claim-refund-to-encode';
import { feeProxyCreateAtomsVia } from './create-atoms-via';
import { feeProxyCreateAtomsViaEncode } from './create-atoms-via-encode';
import { feeProxyCreateTriplesVia } from './create-triples-via';
import { feeProxyCreateTriplesViaEncode } from './create-triples-via-encode';
import { feeProxyDepositBatchVia } from './deposit-batch-via';
import { feeProxyDepositBatchViaEncode } from './deposit-batch-via-encode';
import { feeProxyDepositVia } from './deposit-via';
import { feeProxyDepositViaEncode } from './deposit-via-encode';
import { feeProxyIsAffiliateRegistered } from './is-affiliate-registered';
import { feeProxyMaxFeeBps } from './max-fee-bps';
import { feeProxyMaxFixedFee } from './max-fixed-fee';
import { feeProxyMultiVault } from './multi-vault';
import { feeProxyPaused } from './paused';
import { feeProxyPreviewDepositFee } from './preview-deposit-fee';
import { feeProxyRegistrationFee } from './registration-fee';
import { feeProxyTreasury } from './treasury';
import { feeProxyUpdateAffiliateFees } from './update-affiliate-fees';
import { feeProxyUpdateAffiliateFeesEncode } from './update-affiliate-fees-encode';
import { feeProxyUpdateFeeRecipient } from './update-fee-recipient';
import { feeProxyUpdateFeeRecipientEncode } from './update-fee-recipient-encode';

const FEE_PROXY = '0x2222222222222222222222222222222222222222' as Address;
const AFFILIATE = '0x1111111111111111111111111111111111111111' as Address;
const USER = '0x3333333333333333333333333333333333333333' as Address;
const TERM_A = `0x${'aa'.repeat(32)}` as Hex;
const TERM_B = `0x${'bb'.repeat(32)}` as Hex;
const TERM_C = `0x${'cc'.repeat(32)}` as Hex;
const GUARD = { maxFeeBps: 250n, maxFixedFee: 10n ** 16n };
const FEES = { depositBps: 100n, creationBps: 250n, depositFixedFee: 0n, creationFixedFee: 7n };

type Call = { functionName: string; args?: readonly unknown[]; value?: bigint };

/** Turns what a wrapper handed to viem back into calldata, then decodes it against the ABI. */
function decodeCall(call: Call) {
	const data = encodeFunctionData({
		abi: FeeProxyAbi as Abi,
		functionName: call.functionName,
		args: call.args,
	} as never);
	return decodeFunctionData({ abi: FeeProxyAbi, data });
}

function readConfig() {
	const readContract = vi.fn().mockResolvedValue(42n);
	return {
		config: { address: FEE_PROXY, publicClient: { readContract } as unknown as PublicClient },
		readContract,
	};
}

function writeConfig() {
	const account = { address: USER } as WalletClient['account'];
	const request = { to: FEE_PROXY, data: '0x1234' as Hex };
	const simulateContract = vi.fn().mockResolvedValue({ request });
	const writeContract = vi.fn().mockResolvedValue(`0x${'ee'.repeat(32)}`);
	return {
		config: {
			address: FEE_PROXY,
			publicClient: { simulateContract } as unknown as PublicClient,
			walletClient: { account, writeContract } as unknown as WalletClient,
		},
		simulateContract,
		writeContract,
		request,
		account,
	};
}

describe('FeeProxy read wrappers', () => {
	const cases = [
		{
			name: 'previewDepositFee',
			run: (config: ReturnType<typeof readConfig>['config']) =>
				feeProxyPreviewDepositFee(config, { args: [AFFILIATE, 10n ** 18n] }),
			args: [AFFILIATE, 10n ** 18n],
		},
		{
			name: 'isAffiliateRegistered',
			run: (config: ReturnType<typeof readConfig>['config']) =>
				feeProxyIsAffiliateRegistered(config, { args: [AFFILIATE] }),
			args: [AFFILIATE],
		},
		{
			name: 'affiliateStats',
			run: (config: ReturnType<typeof readConfig>['config']) =>
				feeProxyAffiliateStats(config, { args: [AFFILIATE] }),
			args: [AFFILIATE],
		},
		{
			name: 'affiliateUserStats',
			run: (config: ReturnType<typeof readConfig>['config']) =>
				feeProxyAffiliateUserStats(config, { args: [AFFILIATE, USER] }),
			args: [AFFILIATE, USER],
		},
		{ name: 'maxFeeBps', run: feeProxyMaxFeeBps, args: [] },
		{ name: 'maxFixedFee', run: feeProxyMaxFixedFee, args: [] },
		{ name: 'registrationFee', run: feeProxyRegistrationFee, args: [] },
		{ name: 'treasury', run: feeProxyTreasury, args: [] },
		{ name: 'paused', run: feeProxyPaused, args: [] },
		{ name: 'multiVault', run: feeProxyMultiVault, args: [] },
	] as const;

	for (const testCase of cases) {
		it(`${testCase.name} reads FeeProxy with the expected calldata`, async () => {
			const { config, readContract } = readConfig();
			await expect(testCase.run(config)).resolves.toBe(42n);

			expect(readContract).toHaveBeenCalledTimes(1);
			const call = readContract.mock.calls[0]?.[0] as Call & { address: Address };
			expect(call.address).toBe(FEE_PROXY);
			const decoded = decodeCall(call);
			expect(decoded.functionName).toBe(testCase.name);
			expect(decoded.args ?? []).toEqual(testCase.args);
		});
	}
});

describe('FeeProxy write wrappers and encoders', () => {
	const cases = [
		{
			name: 'depositVia',
			args: [AFFILIATE, USER, TERM_A, 1n, 10n ** 18n, 9n, GUARD],
			value: 10n ** 18n,
			write: (config: ReturnType<typeof writeConfig>['config']) =>
				feeProxyDepositVia(config, {
					args: [AFFILIATE, USER, TERM_A, 1n, 10n ** 18n, 9n, GUARD],
					value: 10n ** 18n,
				}),
			encode: () => feeProxyDepositViaEncode(AFFILIATE, USER, TERM_A, 1n, 10n ** 18n, 9n, GUARD),
		},
		{
			name: 'depositBatchVia',
			args: [AFFILIATE, USER, [TERM_A, TERM_B], [1n, 2n], [5n, 6n], [1n, 1n], GUARD],
			value: 11n,
			write: (config: ReturnType<typeof writeConfig>['config']) =>
				feeProxyDepositBatchVia(config, {
					args: [AFFILIATE, USER, [TERM_A, TERM_B], [1n, 2n], [5n, 6n], [1n, 1n], GUARD],
					value: 11n,
				}),
			encode: () =>
				feeProxyDepositBatchViaEncode(
					AFFILIATE,
					USER,
					[TERM_A, TERM_B],
					[1n, 2n],
					[5n, 6n],
					[1n, 1n],
					GUARD
				),
		},
		{
			name: 'createAtomsVia',
			args: [AFFILIATE, ['0xdead', '0xbeef'], [3n, 4n], GUARD],
			value: 7n,
			write: (config: ReturnType<typeof writeConfig>['config']) =>
				feeProxyCreateAtomsVia(config, {
					args: [AFFILIATE, ['0xdead', '0xbeef'], [3n, 4n], GUARD],
					value: 7n,
				}),
			encode: () => feeProxyCreateAtomsViaEncode(AFFILIATE, ['0xdead', '0xbeef'], [3n, 4n], GUARD),
		},
		{
			name: 'createTriplesVia',
			args: [AFFILIATE, [TERM_A], [TERM_B], [TERM_C], [8n], GUARD],
			value: 8n,
			write: (config: ReturnType<typeof writeConfig>['config']) =>
				feeProxyCreateTriplesVia(config, {
					args: [AFFILIATE, [TERM_A], [TERM_B], [TERM_C], [8n], GUARD],
					value: 8n,
				}),
			encode: () =>
				feeProxyCreateTriplesViaEncode(AFFILIATE, [TERM_A], [TERM_B], [TERM_C], [8n], GUARD),
		},
		{
			name: 'claimRefundTo',
			args: [USER],
			value: undefined,
			write: (config: ReturnType<typeof writeConfig>['config']) =>
				feeProxyClaimRefundTo(config, { args: [USER] }),
			encode: () => feeProxyClaimRefundToEncode(USER),
		},
		{
			name: 'updateFeeRecipient',
			args: [USER],
			value: undefined,
			write: (config: ReturnType<typeof writeConfig>['config']) =>
				feeProxyUpdateFeeRecipient(config, { args: [USER] }),
			encode: () => feeProxyUpdateFeeRecipientEncode(USER),
		},
		{
			name: 'updateAffiliateFees',
			args: [FEES],
			value: undefined,
			write: (config: ReturnType<typeof writeConfig>['config']) =>
				feeProxyUpdateAffiliateFees(config, { args: [FEES] }),
			encode: () => feeProxyUpdateAffiliateFeesEncode(FEES),
		},
	] as const;

	for (const testCase of cases) {
		it(`${testCase.name}: the write wrapper simulates the expected call and submits it`, async () => {
			const { config, simulateContract, writeContract, request, account } = writeConfig();
			await testCase.write(config);

			expect(simulateContract).toHaveBeenCalledTimes(1);
			const call = simulateContract.mock.calls[0]?.[0] as Call & {
				address: Address;
				account: unknown;
			};
			expect(call.address).toBe(FEE_PROXY);
			expect(call.account).toBe(account);
			expect(call.value).toBe(testCase.value);
			const decoded = decodeCall(call);
			expect(decoded.functionName).toBe(testCase.name);
			expect(decoded.args).toEqual(testCase.args);
			expect(writeContract).toHaveBeenCalledWith(request);
		});

		it(`${testCase.name}: the encoder produces calldata that decodes to the same call`, () => {
			const decoded = decodeFunctionData({ abi: FeeProxyAbi, data: testCase.encode() });
			expect(decoded.functionName).toBe(testCase.name);
			expect(decoded.args).toEqual(testCase.args);
		});
	}
});
