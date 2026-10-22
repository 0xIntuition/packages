# Content URI Workflow

Canonical v1 workflow for using a content URI produced outside the SDK.

## Goal

Read protocol-adjacent metadata from the backend API, then prepare an onchain action using an `ipfs://...` URI that came from an external upload system.

## Steps

1. Upload content outside the SDK.
   - Use an IPFS pinning service such as Pinata.
   - Receive a content URI such as `ipfs://bafybeibexample`.
2. Derive the onchain atom data.
   - Convert the content URI to hex for onchain submission.
   - Derive the term ID with `calculateAtomId(contentUri)`.
3. Read any supporting backend state.
   - Fetch supporting atom metadata through the SDK-owned `@0xintuition/sdk/api` client.
4. Prepare the onchain action.
   - Use `multivaultCreateAndSeedTerm`, `multivaultPrepareDepositTx`, or another SDK action helper.
5. Submit the transaction explicitly from the caller.

## Example

```ts
import {
  calculateAtomId,
  createIntuitionApiClient,
  getMultiVaultAddressFromChainId,
  intuitionTestnet,
  multivaultCreateAndSeedTerm,
} from '@0xintuition/sdk'
import { createPublicClient, createWalletClient, http, toHex } from 'viem'

const contentUri = 'ipfs://bafybeibexample'
const termId = calculateAtomId(contentUri)

const api = createIntuitionApiClient({
  baseUrl: 'https://api.intuition.systems',
  fetch,
})

const existingAtom = await api.atoms.getByData({
  data: contentUri,
})

const seedAssets = 1_000_000_000_000_000n

const publicClient = createPublicClient({
  chain: intuitionTestnet,
  transport: http(),
})

const walletClient = createWalletClient({
  chain: intuitionTestnet,
  transport: http(),
  account,
})

const config = {
  address: getMultiVaultAddressFromChainId(intuitionTestnet.id),
  publicClient,
  walletClient,
}

const plan = await multivaultCreateAndSeedTerm(config, {
  receiver: account.address,
  atomsToCreate: [
    {
      termId,
      data: toHex(contentUri),
      assetsIn: seedAssets,
    },
  ],
  seedDeposits: [],
})
```

## Why This Boundary Matters

- The upload system owns pinning-provider credentials, retries, and provider-specific behavior.
- `@0xintuition/sdk` owns term derivation, protocol reads/actions, and typed planning.
- Consumers can swap upload providers later without redesigning their onchain flow.
