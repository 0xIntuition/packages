# @0xintuition/ids

Deterministic content-addressable ID utilities for Intuition atoms, triples, counter-triples, OAuth atoms, and canonical predicate atom data.

Alpha status: published under the alpha dist-tag. OAuth atom helpers use the identity-sensitive schema context at https://schema.intuition.systems/v1/oauth-atom.jsonld.

Runtime: ESM-only. This package does not publish CommonJS `require` entrypoints.

## Install

```bash
bun add @0xintuition/ids@alpha viem
```

Peer dependency: `viem ^2.0.0`. Release smoke tests install `viem@2.31.4`.

## Example

```ts
import { calculateAtomId, calculatePredicateId, createPredicateAtomData } from '@0xintuition/ids'

const atomId = calculateAtomId('hello intuition')

const followAtomData = createPredicateAtomData(
	'follow',
	'Directional subscription or tracking of the object entity'
)

const followPredicateId = calculatePredicateId(
	'follow',
	'Directional subscription or tracking of the object entity'
)
```

## Auth-user atom

Build deterministic public identity metadata from an auth user ID. The helpers trim and lowercase the ID, then hash it with the `auth-user:` prefix. The serialized data contains the hash, not the original user ID.

```ts
import {
	authUserAtomDataHex,
	calculateAuthUserAtomId,
	createAuthUserAtomData,
	serializeAuthUserAtomData,
} from '@0xintuition/ids'

const input = { userId: '018f8f2d-7d7b-7c2d-9a07-5f5f1adbd201' }
const data = createAuthUserAtomData(input)
const serialized = serializeAuthUserAtomData(input)
const dataHex = authUserAtomDataHex(input)
const atomId = calculateAuthUserAtomId(input)
```

`AuthUserAtomInput` and `AuthUserAtomData` describe the input and metadata. `authUserIdHash` exposes the normalized ID hash. Empty or whitespace-only IDs are rejected.

The identity constants are `AUTH_USER_ATOM_TYPE = 'IntuitionAuthUser'`, `AUTH_USER_ATOM_CONTEXT = 'https://schema.0xintuition.com/v1/metadata.jsonld'`, and `AUTH_USER_ATOM_DERIVATION_VERSION = 'auth-user-default-wallet-v1'`. Their exact values and the serialized key order determine the atom ID. OAuth helpers retain their existing context.

## `I` subject

The shared first-person subject is the exact UTF-8 byte `I`. `I_SUBJECT` aliases `I_SUBJECT_DATA`; `I_SUBJECT_ID` is `calculateAtomId('I')`. Use it as the subject of action triples such as `I -> follow -> (account)`. It is not an IID and must not be wrapped in one.

```ts
import { I_SUBJECT, I_SUBJECT_DATA, I_SUBJECT_ID } from '@0xintuition/ids'

// I_SUBJECT === I_SUBJECT_DATA === 'I'
// I_SUBJECT_ID === '0x7ab197b346d386cd5926dbfeeb85dade42f113c7ed99ff2046a5123bb5cd016b'
```
