/**
 * DynamicFeeFlatPriceCurve — tier math, piecewise deposit-fee quote, and
 * withdrawal-fee rate for the flat-price / dynamic-fee bonding curve.
 *
 * Pricing itself is 1:1 at par (see linear-curve.ts); this module covers only
 * the tier ladder and fee-schedule math layered on top. Mirrors the on-chain
 * `DynamicFeeFlatPriceCurve` internals field-for-field so an off-chain quote
 * matches the on-chain hook exactly.
 */

import { mulDivDown, mulDivUp, WAD } from './math';
import type {
	DynamicFeeConfig,
	DynamicFeeDepositBand,
	DynamicFeeLots,
	DynamicFeeRedeemLotCharge,
	DynamicFeeTierLadderEntry,
	DynamicFeeTierOverride,
} from './types';

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
	const { width0, tierWidthGrowthBps } = config;
	if (tierWidthGrowthBps === 0n) {
		return width0 * (k + 1n);
	}
	const ratioWad = mulDivDown(DYNAMIC_FEE_BPS + tierWidthGrowthBps, WAD, DYNAMIC_FEE_BPS);
	const powWad = rpow(ratioWad, k + 1n, WAD);
	const gWad = mulDivDown(tierWidthGrowthBps, WAD, DYNAMIC_FEE_BPS);
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

/** The tier's manual override if set, else `min(cap, base + tier*growth)`. Mirrors `_redeemFeeBps`. */
export function dynamicFeeRedeemFeeBps(
	tier: bigint,
	config: DynamicFeeConfig,
	override?: DynamicFeeTierOverride
): bigint {
	const cap = config.redeemCapBps;
	if (override?.isSet) {
		return override.redeemFeeBps < cap ? override.redeemFeeBps : cap;
	}
	const fee = config.redeemBaseBps + tier * config.redeemGrowthBps;
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
	let fee = 0n;
	for (const band of dynamicFeeQuoteDepositBands(startAssets, baseAssets, config, overrides)) {
		fee += band.fee;
	}
	return fee;
}

/**
 * The same walk, reporting each band it crossed rather than only the total.
 *
 * `dynamicFeeQuoteDepositFee` and the on-chain `quoteDepositFee` both compute
 * this split internally and discard it, which leaves a caller unable to say
 * which tiers a deposit traverses or what each band costs — the one thing a
 * piecewise quote exists to explain. The contract emits the same breakdown as
 * `DepositBandRecorded`, so this is what makes it available BEFORE the trade
 * rather than only after it.
 *
 * Bands come back in traversal order, starting at the tier `startAssets` sits
 * in. `assets` is the gross portion charged in that band and `fee` is what it
 * pays; `assets - fee` is what advances the vault into the next band.
 */
export function dynamicFeeQuoteDepositBands(
	startAssets: bigint,
	baseAssets: bigint,
	config: DynamicFeeConfig,
	overrides?: Map<bigint, DynamicFeeTierOverride>
): DynamicFeeDepositBand[] {
	const bands: DynamicFeeDepositBand[] = [];
	let remaining = baseAssets;
	let cursor = startAssets;
	let tier = dynamicFeeTierOf(startAssets, config);
	const topTier = config.tierCount - 1n;

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
		bands.push({ tier, feeBps: rate, assets: chunk, fee: chunkFee });
		remaining -= chunk;
		cursor += chunk - chunkFee;
		tier += 1n;
	}

	return bands;
}

/**
 * Withdrawal fee for `grossAssets` exiting from a single `tier`: `grossAssets *
 * redeemFeeBps(tier) / BPS`, rounded up — the rate math one lot is charged at.
 * A holder redeeming across several lots pays
 * {@link dynamicFeeQuoteRedeemFeeForLots}; this is the primitive behind it and
 * the whole answer for an account-less quote, which prices at the vault's tier.
 */
export function dynamicFeeQuoteRedeemFee(
	grossAssets: bigint,
	tier: bigint,
	config: DynamicFeeConfig,
	override?: DynamicFeeTierOverride
): bigint {
	const rate = dynamicFeeRedeemFeeBps(tier, config, override);
	return mulDivUp(grossAssets, rate, DYNAMIC_FEE_BPS);
}

/**
 * Withdrawal fee for `shares` taken from a holder's lots, highest tier first,
 * each portion at its own lot's rate and rounded up. Mirrors the contract's
 * `quoteRedeemFee` / `_lotRedeemFee` walk: flat 1:1 pricing makes `shares` the
 * amount the unwind consumes, and anything beyond the recorded lots — an
 * account holding none, such as the account-less preview — is priced at
 * `vaultTier`, the vault's current tier.
 *
 * `shares` beyond what the lots hold is priced rather than rejected, because
 * the contract prices it: the quote is a view, and the oversized redeem it
 * describes reverts at execution when the unwind debits `userStake`. Rejecting
 * here would make the replica disagree with the chain.
 */
export function dynamicFeeQuoteRedeemFeeForLots(
	shares: bigint,
	lots: DynamicFeeLots,
	vaultTier: bigint,
	config: DynamicFeeConfig,
	overrides?: Map<bigint, DynamicFeeTierOverride>
): bigint {
	let fee = 0n;
	for (const charge of dynamicFeeQuoteRedeemFeeLots(shares, lots, vaultTier, config, overrides)) {
		fee += charge.fee;
	}
	return fee;
}

/**
 * The same walk, reporting each lot it drew from rather than only the total.
 *
 * Rounding up per lot means the total is not recoverable from the shares alone — only the per-lot
 * split explains it — and the contract emits that split as `RedeemLotRecorded`. This is what makes
 * it available BEFORE the trade rather than only after it, and it is the single walk
 * {@link dynamicFeeQuoteRedeemFeeForLots} now sums, so the two cannot disagree.
 *
 * Entries come back highest tier first, the order the unwind consumes them. A trailing entry at
 * `vaultTier` carries whatever ran past the recorded lots. `shares` of zero yields no entries.
 */
export function dynamicFeeQuoteRedeemFeeLots(
	shares: bigint,
	lots: DynamicFeeLots,
	vaultTier: bigint,
	config: DynamicFeeConfig,
	overrides?: Map<bigint, DynamicFeeTierOverride>
): DynamicFeeRedeemLotCharge[] {
	const charges: DynamicFeeRedeemLotCharge[] = [];
	let remaining = shares;
	const tiers = [...lots.keys()].sort((a, b) => (a > b ? -1 : 1));
	for (const tier of tiers) {
		if (remaining === 0n) {
			break;
		}
		const lot = lots.get(tier)?.stake ?? 0n;
		const take = lot < remaining ? lot : remaining;
		const rateBps = dynamicFeeRedeemFeeBps(tier, config, overrides?.get(tier));
		charges.push({
			tier,
			shares: take,
			rateBps,
			fee: mulDivUp(take, rateBps, DYNAMIC_FEE_BPS),
		});
		remaining -= take;
	}
	if (remaining > 0n) {
		const rateBps = dynamicFeeRedeemFeeBps(vaultTier, config, overrides?.get(vaultTier));
		charges.push({
			tier: vaultTier,
			shares: remaining,
			rateBps,
			fee: mulDivUp(remaining, rateBps, DYNAMIC_FEE_BPS),
		});
	}
	return charges;
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
			redeemFeeBps: dynamicFeeRedeemFeeBps(k, config, override),
		});
	}
	return ladder;
}
