import type { Hex } from 'viem';

// Base mainnet canonical USDC -> TRUST Slipstream path (USDC | tickSpacing=1 | TRUST).
const BASE_USDC_TO_TRUST_PATH: Hex =
	'0x833589fcd6edb6e08f4c7c32d4f71b54bda029130000016cd905df2ed214b22e0d48ff17cd4200c1c6d8a3';

/**
 * Returns the hardcoded USDC -> TRUST path for Base.
 * @returns Packed Slipstream path bytes.
 */
export function trustSwapAndBridgeRouterGetUsdcToTrustPath(): Hex {
	return BASE_USDC_TO_TRUST_PATH;
}
