# @0xintuition/curves

Mathematical helpers for Intuition bonding curve previews.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/curves@alpha
```

## Usage

```ts
import { createLinearCurve, linearPreviewDeposit } from '@0xintuition/curves'

const curve = createLinearCurve()
const preview = linearPreviewDeposit(curve, 100n)
```

## Dynamic-fee curve

Preview tier boundaries and deposit or withdrawal fees for the flat-price dynamic-fee curve. Deposits pay each traversed tier's rate; manual overrides remain capped by the configured maximum. The tier ladder reports `null` for the top tier's edge and width because that tier is unbounded. Supply the curve's current configuration when quoting.

```ts
import { dynamicFeeQuoteDepositFee, WAD } from '@0xintuition/curves'

const config = {
  width0: 1_000n * WAD,
  tierCount: 4n,
  growthGBps: 0n,
  depositBaseBps: 100n,
  depositGrowthBps: 50n,
  depositCapBps: 500n,
  fulcrumAlpha: 10_000n,
  kernelSpread: 4n * WAD,
  withdrawalBaseBps: 80n,
  withdrawalGrowthBps: 40n,
  withdrawalCapBps: 400n,
  withdrawalToFulcrumTiersBps: 0n,
  depositToPriorTierBps: 0n,
  minEligibleTierStake: 0n,
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
