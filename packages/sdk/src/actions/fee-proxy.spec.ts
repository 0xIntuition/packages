import type { ReadConfig } from '@0xintuition/protocol';
import type { Address, Hex } from 'viem';
import { describe, expect, it } from 'vitest';
import { feeProxyPrepareCreateAtomsWithUrisTx } from './fee-proxy';

const AFFILIATE = '0x1111111111111111111111111111111111111111' as Address;
const FEE_PROXY = '0x2222222222222222222222222222222222222222' as Address;
const MULTIVAULT = '0x3333333333333333333333333333333333333333' as Address;

const feeProxy = { address: FEE_PROXY } as ReadConfig;
const multiVault = { address: MULTIVAULT } as ReadConfig;
const feeGuard = { maxFeeBps: 500n, maxFixedFee: 0n };

describe('feeProxyPrepareCreateAtomsWithUrisTx', () => {
	it('quotes the affiliate fee and returns createAtomsWithUrisVia calldata', async () => {
		const prepared = await feeProxyPrepareCreateAtomsWithUrisTx(
			{ feeProxy, multiVault },
			{
				affiliate: AFFILIATE,
				atomDatas: ['0xdead' as Hex],
				assets: [1_000n],
				uris: [['0xbeef' as Hex]],
				feeGuard,
			},
			{
				previewCreationFee: async () => [10n, 990n],
				getAtomUriConfig: async () => [5, 700],
			}
		);

		expect(prepared.value).toBe(1_000n);
		expect(prepared.quote.previewedFee).toBe(10n);
		expect(prepared.quote.previewedForwarded).toBe(990n);
		expect(prepared.quote.maxUriCount).toBe(5);
		expect(prepared.quote.maxUriLength).toBe(700);
		expect(prepared.calldata.startsWith('0x')).toBe(true);
	});

	it('rejects mismatched atomDatas/assets/uris lengths', async () => {
		await expect(
			feeProxyPrepareCreateAtomsWithUrisTx(
				{ feeProxy, multiVault },
				{
					affiliate: AFFILIATE,
					atomDatas: ['0xdead' as Hex],
					assets: [1_000n, 2_000n],
					uris: [['0xbeef' as Hex]],
					feeGuard,
				},
				{
					previewCreationFee: async () => [0n, 0n],
					getAtomUriConfig: async () => [5, 700],
				}
			)
		).rejects.toThrow('same non-zero length');
	});

	it('rejects a URI count exceeding the live bound', async () => {
		await expect(
			feeProxyPrepareCreateAtomsWithUrisTx(
				{ feeProxy, multiVault },
				{
					affiliate: AFFILIATE,
					atomDatas: ['0xdead' as Hex],
					assets: [1_000n],
					uris: [['0x01' as Hex, '0x02' as Hex, '0x03' as Hex]],
					feeGuard,
				},
				{
					previewCreationFee: async () => [0n, 0n],
					getAtomUriConfig: async () => [2, 700],
				}
			)
		).rejects.toThrow('exceeding the max of 2');
	});

	it('rejects a URI exceeding the live byte-length bound', async () => {
		const longUri = `0x${'ab'.repeat(10)}` as Hex;
		await expect(
			feeProxyPrepareCreateAtomsWithUrisTx(
				{ feeProxy, multiVault },
				{
					affiliate: AFFILIATE,
					atomDatas: ['0xdead' as Hex],
					assets: [1_000n],
					uris: [[longUri]],
					feeGuard,
				},
				{
					previewCreationFee: async () => [0n, 0n],
					getAtomUriConfig: async () => [5, 5],
				}
			)
		).rejects.toThrow('exceeding the max of 5');
	});
});
