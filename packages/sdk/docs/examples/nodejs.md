# Node.js Example

Target v1 public-surface example for a backend script.

```ts
import { createIntuitionApiClient, getIntuitionApiUrl, multivaultCreateAndSeedTerm } from '@0xintuition/sdk'
import { getMultiVaultAddressFromChainId, intuitionTestnet } from '@0xintuition/sdk/protocol'
import { createPublicClient, createWalletClient, http, toHex } from 'viem'

const api = createIntuitionApiClient({
  baseUrl: getIntuitionApiUrl('mainnet'),
  auth: {
    kind: 'bearer',
    token: process.env.INTUITION_API_TOKEN!,
  },
})

const atom = await api.atoms.getByLabel({ label: 'introspection' })
const triple = await api.triples.getById({ termId: '0xtriple...' })

const publicClient = createPublicClient({
  chain: intuitionTestnet,
  transport: http(process.env.INTUITION_RPC_URL),
})

const walletClient = createWalletClient({
  chain: intuitionTestnet,
  transport: http(process.env.INTUITION_RPC_URL),
  account,
})

const config = {
  address: getMultiVaultAddressFromChainId(intuitionTestnet.id),
  publicClient,
  walletClient,
}

const contentUri = 'ipfs://bafybeibexample'
const plan = await multivaultCreateAndSeedTerm(config, {
  receiver: account.address,
  atomsToCreate: [
    {
      termId: atom?.termId ?? '0xabc123...',
      data: toHex(contentUri),
      assetsIn: 1_000_000_000_000_000n,
    },
  ],
  seedDeposits: [],
})

console.log(triple?.predicate.label)
console.log(plan.steps)
```

Notes:

- This example uses the SDK API client implemented in this package.
- The backend read surface can hydrate either atom or triple metadata before planning chain actions.
- Upload is assumed to have happened before this script ran.
- The SDK prepares the onchain plan; transaction submission remains explicit and caller-owned.
