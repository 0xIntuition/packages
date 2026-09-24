import { type Address, decodeFunctionData, isHex } from 'viem';
import { describe, expect, it } from 'vitest';

import { FeeProxyAbi } from '../contracts';
import { feeProxyCreateAtomsWithUrisViaEncode } from './create-atoms-with-uris-via-encode';

describe('feeProxyCreateAtomsWithUrisViaEncode', () => {
	it('encodes createAtomsWithUrisVia calldata', () => {
		const affiliate = '0x1111111111111111111111111111111111111111' as Address;
		const atomDatas = ['0xdead' as const];
		const assets = [10n ** 18n];
		const uris = [['0xbeef' as const]];
		const feeGuard = { maxFeeBps: 500n, maxFixedFee: 0n };

		const encoded = feeProxyCreateAtomsWithUrisViaEncode(
			affiliate,
			atomDatas,
			assets,
			uris,
			feeGuard
		);

		expect(isHex(encoded)).toBe(true);
		expect(encoded.startsWith('0x')).toBe(true);

		const decoded = decodeFunctionData({
			abi: FeeProxyAbi,
			data: encoded,
		});

		expect(decoded.functionName).toBe('createAtomsWithUrisVia');
		expect(decoded.args).toEqual([affiliate, atomDatas, assets, uris, feeGuard]);
	});
});
