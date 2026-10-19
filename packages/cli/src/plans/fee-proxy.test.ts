import type { Address, Hex } from 'viem';
import { describe, expect, it } from 'vitest';

import { resolveAgentActionTarget } from '../schema';
import { buildFeeProxyCreateAtomsWithUrisPlan } from './fee-proxy';

const AFFILIATE = '0x1111111111111111111111111111111111111111' as Address;
const FEE_PROXY = '0x2222222222222222222222222222222222222222' as Address;
const MULTIVAULT = '0x3333333333333333333333333333333333333333' as Address;

describe('fee-proxy plans', () => {
	it('builds a createAtomsWithUris envelope from injected quote context', async () => {
		const feeProxyTarget = resolveAgentActionTarget({
			chainId: 1155,
			contract: 'fee-proxy',
			address: FEE_PROXY,
		});
		const envelope = await buildFeeProxyCreateAtomsWithUrisPlan({
			feeProxyAddress: FEE_PROXY,
			multiVaultAddress: MULTIVAULT,
			affiliate: AFFILIATE,
			atomDatas: ['0xdead' as Hex],
			assets: [1_000n],
			uris: [['0xbeef' as Hex]],
			feeGuard: { maxFeeBps: 500n, maxFixedFee: 0n },
			readContext: {
				previewCreationFee: [10n, 990n] as const,
				atomUriConfig: [5, 700] as const,
			},
		});

		expect(envelope.action).toBe('feeProxy.createAtomsWithUris');
		expect(envelope.steps).toHaveLength(1);
		expect(envelope.steps[0]?.to).toBe(feeProxyTarget.address);
		expect(envelope.steps[0]?.value).toBe('1000');
		expect(envelope.estimates).toMatchObject({
			quote: {
				previewedFee: '10',
				previewedForwarded: '990',
				maxUriCount: 5,
				maxUriLength: 700,
			},
		});
	});

	it('rejects a URI count exceeding the live bound', async () => {
		await expect(
			buildFeeProxyCreateAtomsWithUrisPlan({
				feeProxyAddress: FEE_PROXY,
				multiVaultAddress: MULTIVAULT,
				affiliate: AFFILIATE,
				atomDatas: ['0xdead' as Hex],
				assets: [1_000n],
				uris: [['0x01' as Hex, '0x02' as Hex, '0x03' as Hex]],
				feeGuard: { maxFeeBps: 500n, maxFixedFee: 0n },
				readContext: {
					previewCreationFee: [0n, 0n] as const,
					atomUriConfig: [2, 700] as const,
				},
			})
		).rejects.toThrow('exceeding the max of 2');
	});
});
