import { type Address, decodeFunctionData, type Hex, isHex } from 'viem';
import { describe, expect, it } from 'vitest';

import { TrustSwapAndBridgeRouterAbi } from '../contracts';
import { trustSwapAndBridgeRouterSwapAndBridgeWithETHEncode } from './swap-and-bridge-with-eth-encode';

describe('trustSwapAndBridgeRouterSwapAndBridgeWithETHEncode', () => {
	it('encodes swapAndBridgeWithETH calldata', () => {
		const path =
			'0x4200000000000000000000000000000000000006000032833589fcd6edb6e08f4c7c32d4f71b54bda029130000016cd905df2ed214b22e0d48ff17cd4200c1c6d8a3' as Hex;
		const minTrustOut = 123n;
		const recipient = '0x1111111111111111111111111111111111111111' as Address;

		const encoded = trustSwapAndBridgeRouterSwapAndBridgeWithETHEncode(
			path,
			minTrustOut,
			recipient
		);

		expect(isHex(encoded)).toBe(true);
		const decoded = decodeFunctionData({
			abi: TrustSwapAndBridgeRouterAbi,
			data: encoded,
		});

		expect(decoded.functionName).toBe('swapAndBridgeWithETH');
		expect(decoded.args).toEqual([path, minTrustOut, recipient]);
	});
});
