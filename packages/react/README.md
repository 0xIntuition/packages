# @0xintuition/react

React hooks for basic Intuition protocol contract interactions.

## Install

```bash
bun add @0xintuition/react@alpha @0xintuition/protocol@alpha @0xintuition/deployments@alpha
```

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
