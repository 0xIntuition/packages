# @0xintuition/curves

Mathematical helpers for Intuition bonding curve previews.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/curves@alpha
```

## Usage

```ts
import { createLinearCurve } from '@0xintuition/curves'

const curve = createLinearCurve()
const preview = curve.previewDeposit(100n, { totalAssets: 0n, totalShares: 0n })
// 100n shares
```

## Dynamic-fee curve

This candidate targets `@0xintuition/contracts-v2@1.1.0-alpha.1`. Its
net-anchored deposit bands differ from the older `1.1.0-alpha.0` contract revision.
Exact contract parity, including uint256 overflow/revert behavior, remains a
release gate. See the [contract artifact provenance](https://github.com/0xIntuition/packages/blob/main/docs/contract-artifacts.md).

## Gross-up quotes

Use `grossUpAtomDeposit`, `grossUpTripleDeposit`, `grossUpAtomCreate`, or `grossUpTripleCreate` to solve the wallet debit for an exact net deposit after percentage fees. Deposit helpers take explicit fee-applicability flags and an optional first-vault minimum-share cost; create helpers take the fixed creation cost and omit entry fees. The returned `GrossDepositQuote` includes `grossAssets`, `feeBase`, `assetsAfterFees`, and `fixupIterations`. Invalid inputs throw. The solver uses a bounded logarithmic search, including near-total fee schedules. `fixupIterations` counts search steps. The quote achieves the exact net amount but does not guarantee the smallest gross amount when independently rounded fees produce multiple solutions.

```ts
import { grossUpAtomDeposit, WAD } from '@0xintuition/curves'

const fees = { denominator: 10_000n, protocolFee: 125n, entryFee: 50n, exitFee: 0n }
const quote = grossUpAtomDeposit(WAD, fees, { atomWalletDepositFee: 50n }, true)
// quote.assetsAfterFees === WAD; quote.grossAssets is the wallet debit.
```

## Dynamic-fee curve

Preview tier boundaries and deposit or redeem fees for the flat-price dynamic-fee curve. Deposits pay each traversed tier's rate; manual overrides remain capped by the configured maximum. The tier ladder reports `null` for the top tier's edge and width because that tier is unbounded. Supply the curve's current configuration when quoting.

```ts
import { dynamicFeeQuoteDepositFee, WAD } from '@0xintuition/curves'

const config = {
  width0: 1_000n * WAD,
  tierCount: 4n,
  tierWidthGrowthBps: 0n,
  depositBaseBps: 100n,
  depositGrowthBps: 50n,
  depositCapBps: 500n,
  depositFulcrumAlphaBps: 10_000n,
  depositKernelSpread: 4n * WAD,
  redeemFulcrumAlphaBps: 10_000n,
  redeemKernelSpread: 4n * WAD,
  redeemBaseBps: 80n,
  redeemGrowthBps: 40n,
  redeemCapBps: 400n,
  redeemToFulcrumTiersBps: 0n,
  depositToPriorTierBps: 0n,
  minEligibleTierStakeBps: 0n,
}
const depositFee = dynamicFeeQuoteDepositFee(0n, 10n * WAD, config)
// 100_000_000_000_000_000n
```

## Gross-up quotes

Use `grossUpAtomDeposit`, `grossUpTripleDeposit`, `grossUpAtomCreate`, or `grossUpTripleCreate` to solve the wallet debit for an exact net deposit after percentage fees. Deposit helpers take explicit fee-applicability flags and an optional first-vault minimum-share cost; create helpers take the fixed creation cost and omit entry fees. The returned `GrossDepositQuote` includes `grossAssets`, `feeBase`, `assetsAfterFees`, and `fixupIterations`. Invalid inputs or a quote exceeding the fixup limit throw.

```ts
import { grossUpAtomDeposit, WAD } from '@0xintuition/curves'

const fees = { denominator: 10_000n, protocolFee: 125n, entryFee: 50n, exitFee: 0n }
const quote = grossUpAtomDeposit(WAD, fees, { atomWalletDepositFee: 50n }, true)
// quote.assetsAfterFees === WAD; quote.grossAssets is the wallet debit.
```
