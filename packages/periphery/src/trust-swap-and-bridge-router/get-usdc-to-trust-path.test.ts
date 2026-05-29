import { describe, expect, it } from 'vitest';

import { trustSwapAndBridgeRouterGetUsdcToTrustPath } from './get-usdc-to-trust-path';

describe('trustSwapAndBridgeRouterGetUsdcToTrustPath', () => {
	it('returns canonical Base USDC->TRUST packed path', () => {
		const path = trustSwapAndBridgeRouterGetUsdcToTrustPath();
		expect(path).toBe(
			'0x833589fcd6edb6e08f4c7c32d4f71b54bda029130000016cd905df2ed214b22e0d48ff17cd4200c1c6d8a3'
		);
	});
});
