import { type Address, decodeFunctionData, type Hex, isHex } from 'viem';
import { describe, expect, it } from 'vitest';

import { TrustSwapAndBridgeRouterAbi } from '../contracts';
import { trustSwapAndBridgeRouterSwapAndBridgeWithERC20Encode } from './swap-and-bridge-with-erc20-encode';

describe('trustSwapAndBridgeRouterSwapAndBridgeWithERC20Encode', () => {
	it('encodes swapAndBridgeWithERC20 calldata', () => {
		const tokenIn = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913' as Address;
		const amountIn = 1_000_000n;
		const path =
			'0x833589fcd6edb6e08f4c7c32d4f71b54bda029130000016cd905df2ed214b22e0d48ff17cd4200c1c6d8a3' as Hex;
		const minTrustOut = 123n;
		const recipient = '0x1111111111111111111111111111111111111111' as Address;

		const encoded = trustSwapAndBridgeRouterSwapAndBridgeWithERC20Encode(
			tokenIn,
			amountIn,
			path,
			minTrustOut,
			recipient
		);

		expect(isHex(encoded)).toBe(true);
		const decoded = decodeFunctionData({
			abi: TrustSwapAndBridgeRouterAbi,
			data: encoded,
		});

		expect(decoded.functionName).toBe('swapAndBridgeWithERC20');
		const decodedTokenIn = decoded.args?.[0] as Address;
		expect(decodedTokenIn.toLowerCase()).toBe(tokenIn.toLowerCase());
		expect(decoded.args?.[1]).toBe(amountIn);
		expect(decoded.args?.[2]).toBe(path);
		expect(decoded.args?.[3]).toBe(minTrustOut);
		expect(decoded.args?.[4]).toBe(recipient);
	});
});
