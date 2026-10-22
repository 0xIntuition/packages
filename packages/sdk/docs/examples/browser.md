# Browser Example

Target v1 public-surface example for a browser application.

```ts
import { createIntuitionApiClient, getIntuitionApiUrl, multivaultPrepareDepositTx } from '@0xintuition/sdk'
import { getMultiVaultAddressFromChainId, intuitionMainnet } from '@0xintuition/sdk/protocol'
import { createPublicClient, createWalletClient, custom, http } from 'viem'

const api = createIntuitionApiClient({
  baseUrl: getIntuitionApiUrl('mainnet'),
})

const term = await api.atoms.getById({
  termId: '0xabc123...',
})

const triple = await api.triples.getById({
  termId: '0xtriple...',
})

const publicClient = createPublicClient({
  chain: intuitionMainnet,
  transport: http('https://rpc.intuition.systems'),
})

const walletClient = createWalletClient({
  chain: intuitionMainnet,
  transport: custom(window.ethereum),
  account,
})

const config = {
  address: getMultiVaultAddressFromChainId(intuitionMainnet.id),
  publicClient,
  walletClient,
}

const prepared = await multivaultPrepareDepositTx(config, {
  receiver: account.address,
  termId: term.termId,
  curveId: 1n,
  assetsIn: 1_000_000_000_000_000n,
  slippageBps: 100n,
  value: 1_000_000_000_000_000n,
})

console.log(triple?.subject.label, prepared.args, prepared.value)
```

Notes:

- Browser consumers get public API reads plus explicit transaction preparation.
- Triple reads use the same browser-safe `fetch`-based client shape as atom reads.
- No React hooks are required for the base SDK contract.
- Wallet connection and UI state remain application responsibilities.
