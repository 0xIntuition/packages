import { type Address, decodeFunctionData, isHex } from 'viem';
import { describe, expect, it } from 'vitest';

import { TrustSwapAndBridgeRouterAbi } from '../contracts';
import { trustSwapAndBridgeRouterBridgeTrustEncode } from './bridge-trust-encode';

describe('trustSwapAndBridgeRouterBridgeTrustEncode', () => {
	it('encodes bridgeTrust calldata with trustAmount and recipient', () => {
		const trustAmount = 10n ** 18n;
		const recipient = '0x1111111111111111111111111111111111111111' as Address;

		const encoded = trustSwapAndBridgeRouterBridgeTrustEncode(trustAmount, recipient);

		expect(isHex(encoded)).toBe(true);
		expect(encoded.startsWith('0x')).toBe(true);

		const decoded = decodeFunctionData({
			abi: TrustSwapAndBridgeRouterAbi,
			data: encoded,
		});

		expect(decoded.functionName).toBe('bridgeTrust');
		expect(decoded.args).toEqual([trustAmount, recipient]);
	});
});
