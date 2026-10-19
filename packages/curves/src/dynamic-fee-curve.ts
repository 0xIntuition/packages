/**
 * DynamicFeeFlatPriceCurve — tier math, piecewise deposit-fee quote, and
 * withdrawal-fee rate for the flat-price / dynamic-fee bonding curve.
 *
 * Pricing itself is 1:1 at par (see linear-curve.ts); this module covers only
 * the tier ladder and fee-schedule math layered on top. Mirrors the on-chain
 * `DynamicFeeFlatPriceCurve` internals field-for-field so an off-chain quote
 * matches the on-chain hook exactly.
 */

import { mulDivDown, mulDivUp, WAD } from './math.js';
import type {
	DynamicFeeConfig,
	DynamicFeeTierLadderEntry,
	DynamicFeeTierOverride,
} from './types.js';

/** Basis-points denominator used by every dynamic-fee rate field. */
export const DYNAMIC_FEE_BPS = 10_000n;

// ---------------------------------------------------------------------------
// Internal helper
// ---------------------------------------------------------------------------

/**
 * Fixed-point `(x/scalar)^n * scalar` via exponentiation by squaring with
 * round-half-up at each step. Mirrors Solady's `FixedPointMathLib.rpow` bit
 * for bit (minus the overflow checks, unnecessary for a bigint).
 */
function rpow(x: bigint, n: bigint, scalar: bigint): bigint {
	if (x === 0n) {
		return n === 0n ? scalar : 0n;
	}
	let z = n % 2n === 0n ? scalar : x;
	const half = scalar / 2n;
	let base = x;
	let remaining = n / 2n;
	while (remaining > 0n) {
		base = (base * base + half) / scalar;
		if (remaining % 2n === 1n) {
			z = (z * base + half) / scalar;
		}
		remaining /= 2n;
	}
	return z;
}

// ---------------------------------------------------------------------------
// Tier edges and widths
// ---------------------------------------------------------------------------

/** Cumulative upper edge (in assets) of tier `k`. Mirrors `_tierUpperEdge`. */
export function dynamicFeeTierUpperEdge(k: bigint, config: DynamicFeeConfig): bigint {
	const { width0, growthGBps } = config;
	if (growthGBps === 0n) {
		return width0 * (k + 1n);
	}
	const ratioWad = mulDivDown(DYNAMIC_FEE_BPS + growthGBps, WAD, DYNAMIC_FEE_BPS);
	const powWad = rpow(ratioWad, k + 1n, WAD);
	const gWad = mulDivDown(growthGBps, WAD, DYNAMIC_FEE_BPS);
	return mulDivDown(width0, powWad - WAD, gWad);
}

/** Width of tier `k`: the span between its upper edge and the prior tier's. */
export function dynamicFeeTierWidthAt(k: bigint, config: DynamicFeeConfig): bigint {
	const edge = dynamicFeeTierUpperEdge(k, config);
	if (k === 0n) {
		return edge;
	}
	return edge - dynamicFeeTierUpperEdge(k - 1n, config);
}

/** First tier whose upper edge exceeds `assets`, capped at the top tier. Mirrors `_tierOf`. */
export function dynamicFeeTierOf(assets: bigint, config: DynamicFeeConfig): bigint {
	if (assets === 0n) {
		return 0n;
	}
	for (let k = 0n; k < config.tierCount; k++) {
		if (assets < dynamicFeeTierUpperEdge(k, config)) {
			return k;
		}
	}
	return config.tierCount - 1n;
}

// ---------------------------------------------------------------------------
// Fee rates
// ---------------------------------------------------------------------------

/** The tier's manual override if set, else `min(cap, base + tier*growth)`. Mirrors `_depositFeeBps`. */
export function dynamicFeeDepositFeeBps(
	tier: bigint,
	config: DynamicFeeConfig,
	override?: DynamicFeeTierOverride
): bigint {
	const cap = config.depositCapBps;
	if (override?.isSet) {
		return override.depositFeeBps < cap ? override.depositFeeBps : cap;
	}
	const fee = config.depositBaseBps + tier * config.depositGrowthBps;
	return fee < cap ? fee : cap;
}

/** The tier's manual override if set, else `min(cap, base + tier*growth)`. Mirrors `_withdrawalFeeBps`. */
export function dynamicFeeWithdrawalFeeBps(
	tier: bigint,
	config: DynamicFeeConfig,
	override?: DynamicFeeTierOverride
): bigint {
	const cap = config.withdrawalCapBps;
	if (override?.isSet) {
		return override.withdrawalFeeBps < cap ? override.withdrawalFeeBps : cap;
	}
	const fee = config.withdrawalBaseBps + tier * config.withdrawalGrowthBps;
	return fee < cap ? fee : cap;
}

// ---------------------------------------------------------------------------
// Quotes
// ---------------------------------------------------------------------------

/**
 * Piecewise deposit fee: walks the tier bands from `startAssets` and charges
 * each portion of `baseAssets` at its own band's rate. Mirrors
 * `_piecewiseDepositFee` exactly, including the net-anchored gross-up per
 * band. A deposit that climbs several tiers pays the blended rate across
 * every traversed band, not the pre-deposit tier's rate on the whole amount.
 */
export function dynamicFeeQuoteDepositFee(
	startAssets: bigint,
	baseAssets: bigint,
	config: DynamicFeeConfig,
	overrides?: Map<bigint, DynamicFeeTierOverride>
): bigint {
	let remaining = baseAssets;
	let cursor = startAssets;
	let tier = dynamicFeeTierOf(startAssets, config);
	const topTier = config.tierCount - 1n;
	let fee = 0n;

	while (remaining > 0n) {
		const rate = dynamicFeeDepositFeeBps(tier, config, overrides?.get(tier));
		let chunk = remaining;
		if (tier < topTier) {
			// `cursor` is strictly below this band's upper edge, so `roomNet` is nonzero. Gross it
			// up by the band's own rate to get the portion whose NET advance fills the band.
			const roomNet = dynamicFeeTierUpperEdge(tier, config) - cursor;
			const roomGross = mulDivUp(roomNet, DYNAMIC_FEE_BPS, DYNAMIC_FEE_BPS - rate);
			if (roomGross < chunk) {
				chunk = roomGross;
			}
		}
		const chunkFee = mulDivUp(chunk, rate, DYNAMIC_FEE_BPS);
		fee += chunkFee;
		remaining -= chunk;
		cursor += chunk - chunkFee;
		tier += 1n;
	}

	return fee;
}

/**
 * Withdrawal fee for `grossAssets` exiting from `tier`. Mirrors the rate math
 * in `quoteRedeemFee` (`grossAssets * withdrawalFeeBps(tier) / BPS`, rounded
 * up). The caller resolves `tier` from the exiting account's tracked entry
 * tier, falling back to the vault's current tier for an account-less quote.
 */
export function dynamicFeeQuoteWithdrawalFee(
	grossAssets: bigint,
	tier: bigint,
	config: DynamicFeeConfig,
	override?: DynamicFeeTierOverride
): bigint {
	const rate = dynamicFeeWithdrawalFeeBps(tier, config, override);
	return mulDivUp(grossAssets, rate, DYNAMIC_FEE_BPS);
}

// ---------------------------------------------------------------------------
// Tier ladder
// ---------------------------------------------------------------------------

/**
 * The full tier ladder: edge, width, and both fee rates for every configured
 * tier. The top tier's `upperEdge`/`width` are `null` — see
 * {@link DynamicFeeTierLadderEntry}.
 */
export function dynamicFeeTierLadder(
	config: DynamicFeeConfig,
	overrides?: Map<bigint, DynamicFeeTierOverride>
): DynamicFeeTierLadderEntry[] {
	const ladder: DynamicFeeTierLadderEntry[] = [];
	const topTier = config.tierCount - 1n;
	for (let k = 0n; k < config.tierCount; k++) {
		const override = overrides?.get(k);
		const isTopTier = k === topTier;
		ladder.push({
			tier: k,
			upperEdge: isTopTier ? null : dynamicFeeTierUpperEdge(k, config),
			width: isTopTier ? null : dynamicFeeTierWidthAt(k, config),
			depositFeeBps: dynamicFeeDepositFeeBps(k, config, override),
			withdrawalFeeBps: dynamicFeeWithdrawalFeeBps(k, config, override),
		});
	}
	return ladder;
}
