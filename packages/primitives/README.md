# @0xintuition/primitives

High-level atom, claim, predicate, classification, and validation helpers for building with Intuition off-chain data.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/primitives@alpha
```

Peer dependency: `viem ^2.0.0`. Release smoke tests install `viem@2.31.4`.

## Usage

```ts
import { buildEthereumAccount } from '@0xintuition/primitives/atom'
import { buildTripleByName } from '@0xintuition/primitives/triple'

const account = buildEthereumAccount({
  address: '0x0000000000000000000000000000000000000001',
})
if (!account.success) throw new Error(account.errors.join(', '))

const claim = buildTripleByName(account.value.id, 'follow', account.value.id)
if (!claim.success) throw new Error(claim.errors.join(', '))
```

## IID atom anchors

`buildIidAnchor` is the supported high-level path from a classification's field values to canonical, identifier-first atom bytes ([IID spec](https://www.npmjs.com/package/@0xintuition/iid-spec)). It interprets the classification's identity ladder, selects the strongest legal representation profile, serializes deterministic bytes, computes the atom ID, and returns classification/provider hints plus an ordered URI context manifest.

```ts
import { buildIidAnchor } from '@0xintuition/primitives/anchor'

const anchor = buildIidAnchor(
  'music-recording',
  { isrc: 'US-RC1-76-07839' },
  { contextUris: ['https://app.example.com/track/1'] },
)
if (!anchor.success) throw new Error(anchor.errors.join(', '))

anchor.value.iid        // 'int:isrc:USRC17607839' — canonicalized
anchor.value.profile    // 'p0' — bare anchor: atomId is a pure function of the IID
anchor.value.data       // 'int:isrc:USRC17607839' (exact atom bytes)
anchor.value.id         // deterministic atom ID
anchor.value.contextUris  // ordered, deduplicated; NEVER affects the atom ID
anchor.value.providerPlan // ['musicbrainz', 'spotify', 'apple-music']
```

Rules the builder enforces: Class C (`gen1`) and polymorphic-scheme identifiers floor at P1 (their `@type` and recipe fields travel in the payload — requesting `p0` is a structured error, never a silent downgrade); URI context is validated against policy limits offline (pass live `getAtomUriConfig` values via `uriLimits`); equivalent reordered input produces identical bytes. The builder never calls wallets, contracts, or enrichment providers.

Legacy JSON-LD builders (`buildAtom`, `buildPerson`, …) are unchanged and remain the explicit compatibility path for descriptive atom data. `recognizeAtomData` distinguishes canonical IID anchors from JSON payloads without reclassifying arbitrary strings.
