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
