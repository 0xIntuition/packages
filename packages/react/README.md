# @0xintuition/react

React hooks for basic Intuition protocol contract interactions.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/react@alpha @0xintuition/protocol@alpha @0xintuition/deployments@alpha
```

Peer dependencies: `react >=18`, `@tanstack/react-query >=5`, `wagmi >=2`, and `viem ^2.0.0`. Release smoke tests install `viem@2.31.4`.

## Usage

```tsx
import { IntuitionProvider, useAtomState } from '@0xintuition/react'

function App() {
  return (
    <IntuitionProvider network="mainnet">
      <Content />
    </IntuitionProvider>
  )
}
```

This alpha package intentionally excludes the deferred SDK dependency.
