# @0xintuition/react

React hooks for Intuition protocol reads, writes, and transaction lifecycle state.
ESM-only; use `import`.

## Install

```bash
npm install @0xintuition/react@alpha @0xintuition/deployments@alpha @0xintuition/protocol@alpha react@">=18" @tanstack/react-query@^5 wagmi@^2 viem@^2
```

The package declares React 18+ support. Release checks currently exercise React
19, wagmi 2, TanStack Query 5, and viem 2. Install the protocol and deployments peers from this release train; the untagged
protocol package may be on an older major line.

TypeScript consumer checks use `strict: true` and `skipLibCheck: true`, as in
this repository. The tested wagmi declaration graph has upstream errors with
`skipLibCheck: false`; that configuration is not verified for this release.
Core/IID tarball declarations are checked separately without skipping libraries.

## Providers

Hooks require all three providers. In an existing wagmi application, add
`IntuitionProvider` inside your existing wagmi and Query providers.

```tsx
'use client';

import { intuitionTestnet } from '@0xintuition/deployments';
import { IntuitionProvider, useAtomCost } from '@0xintuition/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { createConfig, http, WagmiProvider } from 'wagmi';

const config = createConfig({
  chains: [intuitionTestnet],
  transports: { [intuitionTestnet.id]: http() },
});

function AtomCost() {
  const { data, isLoading, error } = useAtomCost();
  if (isLoading) return <p>Loading atom cost…</p>;
  if (error) return <p>{error.message}</p>;
  return <p>Atom creation cost: {data?.toString()} wei</p>;
}

export function App() {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <IntuitionProvider network="testnet">
          <AtomCost />
        </IntuitionProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

This read-only setup does not configure wallet connectors. Writes require your
application's connected wallet configuration. Use `config` on IntuitionProvider
for custom chain and deployment addresses.

## Transactions

`useTransactionFlow` composes a write mutation with receipt confirmation and
status (`idle`, `submitting`, `confirming`, `confirmed`, `error`). Its `execute`
promise resolves for a successful receipt and rejects on submission failure,
confirmation failure, or a reverted receipt. Only one execution can be active.

`reset()` and unmount reject a pending execution; a late wallet response cannot
revive it. Resetting UI state does not cancel a wallet request or an on-chain
transaction. Always handle the returned promise's rejection.

`useCreateAtomFlow` extracts atom IDs only from the configured MultiVault's
logs. Existing `useCreateAtom` and `useCreateAtomFlow` use `createAtoms`; for URI
context creation, compose `multiVaultCreateAtomsWithUris` from
`@0xintuition/protocol` with `useTransactionFlow`. A dedicated URI-aware React
hook is not included in this candidate.

## Peers

React 18+, wagmi 2+, TanStack Query 5+, and viem 2 are required. The release
suite tests React 19 with wagmi 2 and TanStack Query 5. `react-dom` is the host
application's renderer and is not imported or declared as a peer by this library.
Use the renderer version appropriate for your React application.

Protocol and deployments are peers so the application selects one shared copy
of contract metadata and wrappers. Install the versions from this release train
shown in `package.json`; dev dependencies provide those peers for workspace tests.

## Hook API

All hooks below are named root exports. Read hooks accept chain overrides where
applicable; write hooks expose transaction state, and flow hooks coordinate the
transaction lifecycle.

| Group | Hooks | Purpose |
| --- | --- | --- |
| Atom | `useAtom`, `useCreateAtom`, `useAtomState` | Read atom state and create atoms. |
| Triple | `useTriple`, `useCreateTriple`, `useTripleState` | Read triple state and create triples. |
| Vault | `useVaultState`, `useDepositPreview`, `useRedeemPreview`, `useDeposit`, `useRedeem`, `useDepositBatch`, `useRedeemBatch`, `useConvertToAssets`, `useConvertToShares` | Read vault totals, preview deposits/redemptions, convert amounts, and submit individual or batch writes. |
| Position | `usePosition`, `usePositions` | Read one or multiple account positions. |
| Protocol | `useProtocolConfig`, `useProtocolFees`, `useAtomCost`, `useTripleCost`, `useGeneralConfig`, `useBondingCurveConfig`, `useAtomConfig`, `useTripleConfig`, `useWalletConfig`, `useIsTermCreated`, `useCounterTripleId`, `usePreviewAtomCreate`, `usePreviewTripleCreate` | Read protocol configuration, fees, costs, term existence, counter IDs, and creation previews. |
| Identity | `useAtomId`, `useTripleId`, `useAtomIdOnchain`, `useTripleIdOnchain` | Derive atom/triple IDs locally or read them onchain. |
| Flow | `useTransactionFlow`, `useCreateAtomFlow`, `useDepositFlow`, `useRedeemFlow` | Coordinate transaction submission and receipt state for common workflows. |
| Provider | `IntuitionProvider`, `useIntuitionConfig`, `useChainConfig` | Configure networks and resolve chain-specific contract addresses. |
