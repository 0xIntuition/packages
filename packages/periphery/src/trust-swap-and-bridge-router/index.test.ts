import { describe, expect, it } from 'vitest';

import * as trustSwapAndBridgeRouter from './index';

describe('trust-swap-and-bridge-router index exports', () => {
	it('exports route, quote, bridge, swap and encode helpers', () => {
		expect(typeof trustSwapAndBridgeRouter.trustSwapAndBridgeRouterFindBestRoute).toBe('function');
		expect(typeof trustSwapAndBridgeRouter.trustSwapAndBridgeRouterGetUsdcToTrustPath).toBe(
			'function'
		);
		expect(typeof trustSwapAndBridgeRouter.trustSwapAndBridgeRouterQuoteBridgeFee).toBe('function');
		expect(typeof trustSwapAndBridgeRouter.trustSwapAndBridgeRouterQuoteExactInput).toBe(
			'function'
		);
		expect(typeof trustSwapAndBridgeRouter.trustSwapAndBridgeRouterBridgeTrust).toBe('function');
		expect(typeof trustSwapAndBridgeRouter.trustSwapAndBridgeRouterBridgeTrustEncode).toBe(
			'function'
		);
		expect(typeof trustSwapAndBridgeRouter.trustSwapAndBridgeRouterSwapAndBridgeWithETH).toBe(
			'function'
		);
		expect(typeof trustSwapAndBridgeRouter.trustSwapAndBridgeRouterSwapAndBridgeWithETHEncode).toBe(
			'function'
		);
		expect(typeof trustSwapAndBridgeRouter.trustSwapAndBridgeRouterSwapAndBridgeWithERC20).toBe(
			'function'
		);
		expect(
			typeof trustSwapAndBridgeRouter.trustSwapAndBridgeRouterSwapAndBridgeWithERC20Encode
		).toBe('function');
	});
});
