# @0xintuition/iid

**The Intuition ID (IID) reference implementation.**

An IID is a deterministic, canonicalized identifier string for a real-world entity — `int:<scheme>:<value>` — computed from facts rather than requested from a registry. Two independent actors with the same facts derive byte-identical identifiers without coordinating. The normative rules live in [`@0xintuition/iid-spec`](https://www.npmjs.com/package/@0xintuition/iid-spec); this package implements them: parsing, validation, all 26 scheme canonicalizers, NORM-1, `gen1` derivation, and the declarative identity-ladder engine.

Pure and offline by contract: no network I/O, no clock, no locale, no configuration. Every function is a pure function of its input, and the full conformance corpus from the specification runs against this package on Node and Bun.

## Install

```sh
npm install @0xintuition/iid viem
```

`viem` is a peer dependency (keccak-256).

## Parse and validate

```ts
import {
  parseIntuitionId,
  validateIntuitionId,
  inspectIntuitionId,
  isAnchorEligible,
} from '@0xintuition/iid'

parseIntuitionId('int:caip10:eip155:1:0xd8da6bf26964af9d7eed9e03e53415d37aa96045')
// { scheme: 'caip10', value: 'eip155:1:0xd8da…' } — splits on the FIRST TWO colons only

validateIntuitionId('int:isbn:9780684832722') // true — canonical
validateIntuitionId('int:isbn:0-684-83272-0') // false — well-formed but not canonical
```

`inspectIntuitionId` is the typed result API — one call that distinguishes every failure mode a caller can act on:

```ts
inspectIntuitionId('int:isbn:0-684-83272-0')
// { valid: false, reason: 'noncanonical', scheme: 'isbn',
//   value: '0-684-83272-0', canonical: 'int:isbn:9780684832722' }
//   ^ resolvable as a historical spelling; never a valid new anchor

inspectIntuitionId('int:wd:Q42')
// { valid: true, class: 'A', typing: 'polymorphic',
//   anchorEligible: false, anchorIneligibilityReason: 'polymorphic-scheme' }

inspectIntuitionId('int:src:anything')
// { valid: false, reason: 'unknown-scheme', … } — the registry is closed
```

`isAnchorEligible` answers the P0 question (spec §7.2): valid + Class A/B + unambiguously typed scheme. Class C (`gen1`) and polymorphic schemes floor at P1.

## Canonicalize

```ts
import { SCHEMES, getScheme } from '@0xintuition/iid'

SCHEMES.isbn.canonicalize('0-684-83272-0') // '9780684832722' (ISBN-10 → ISBN-13)
SCHEMES.isrc.canonicalize('US-RC1-76-07839') // 'USRC17607839'
SCHEMES.url.canonicalize('http://www.Example.com/path/?utm_source=x&b=2&a=1#f')
// 'https://example.com/path?a=1&b=2'
SCHEMES.isbn.canonicalize('9780684832723') // undefined — check digit fails, never repaired
```

## Derive from an identity ladder

Ladders are **declarative data** — serializable rung descriptions, not callbacks. The engine walks the ladder strongest-first and mints from the first rung whose declared inputs resolve (spec §5.2):

```ts
import { deriveIntuitionId, type IdentityLadder } from '@0xintuition/iid'

const bookLadder: IdentityLadder = {
  slug: 'book',
  identifies: 'the work',
  rungs: [
    { kind: 'scheme', scheme: 'isbn', source: { kind: 'field', key: 'isbn' } },
    { kind: 'scheme', scheme: 'wd', source: { kind: 'same-as' } },
    { kind: 'gen1', tag: 3, recipe: [{ key: 'name', from: 'field' }] },
  ],
}

deriveIntuitionId(bookLadder, { isbn: '0-684-83272-0', name: 'The Sovereign Individual' })
// { iid: 'int:isbn:9780684832722', scheme: 'isbn', class: 'A' }

deriveIntuitionId(bookLadder, { name: 'The Sovereign Individual' })
// { iid: 'int:gen1:book:r3:59a02a73…', scheme: 'gen1', class: 'C', tag: 3 }
```

Value sources: `field`, `same-as` (order-independent — the lexicographically smallest canonical value wins), `url-origin`, `geohash`, `podcast-guid`, and the frozen named derivations (`acct-strong`, `acct-weak`, `appid-bundle`, `rss-item`, `termset-term`, `caip10-eoa`, `caip10-contract`, `caip19-erc20`). Recipe fields: `field`, `year`, `text-hash`, `geohash`. The exact field keys each derivation reads are documented on the engine and frozen with it.

`gen1` rungs are all-or-nothing: if any recipe field is missing, the rung is skipped — data completeness must never leak into identity.

## Build gen1 values directly

```ts
import { buildGen1Iid, norm1, keccak16 } from '@0xintuition/iid'

buildGen1Iid('movie', 4, { name: 'Inception', yearPublished: '2010' })
// 'int:gen1:movie:r4:fb681afe7d438cad73ae90a70f1cc55a' — spec §6.5 worked example
```

Plus the derivation utilities the spec's schemes need: `norm1` (NORM-1), `keccak16`, `geohashEncode`, `uuidv5` / `derivePodcastGuid`.

## What this package is not

- **No classification lookup, no provider routing.** Scheme-to-classification mapping lives in `@0xintuition/iid-registry`; ladder declarations for Intuition's entity types live in `@0xintuition/classifications`.
- **No network I/O, wallets, or contract calls.** Atom building is `@0xintuition/primitives`; transactions are `@0xintuition/protocol`.
- **No JSON-LD building.** This package owns grammar and derivation only.

## Conformance

The versioned conformance corpus ships in [`@0xintuition/iid-spec`](https://www.npmjs.com/package/@0xintuition/iid-spec) (`conformance/*.json`) and runs in this package's test suite. Canonicalization rules are frozen (spec §9.3): a rule change ships as a new scheme, never an in-place edit.

## License

MIT.
