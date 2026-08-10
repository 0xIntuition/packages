# @0xintuition/iid-registry

**The semantic bridge for Intuition Identifiers: scheme → classification, scheme → providers.**

[`@0xintuition/iid`](https://www.npmjs.com/package/@0xintuition/iid) owns the identifier grammar and says nothing about what an identifier *means*. [`@0xintuition/classifications`](https://www.npmjs.com/package/@0xintuition/classifications) declares entity types and their identity ladders, and says nothing about resolving foreign identifiers. This package is the one place the two meet: given an IID (or just a scheme), it answers **what kind of thing is this** and **which enrichment capabilities can look it up** — as a pure, offline, deterministic function.

It is deliberately not a resolver. No HTTP, no credentials, no caching, no provider client code. Provider slugs are *capability identifiers*; the enrichment engine that owns actual provider implementations intersects this package's plan with what is registered and gated on its side.

## Install

```sh
npm install @0xintuition/iid-registry viem
```

## Classify

```ts
import {
  classificationForIid,
  classificationForScheme,
  listUnambiguousSchemeClassifications,
} from '@0xintuition/iid-registry'

classificationForIid('int:isrc:USUM71703861')
// { slug: 'music-recording', schemaType: 'MusicRecording',
//   displayName: 'Music Recording', category: 'Media' }

classificationForIid('int:mbid:label:83eca2b3-5ae1-43f5-a732-56fa9a8591b1')
// { slug: 'company', … } — the type segment in the value decides

classificationForIid('int:wd:Q42')
// undefined — polymorphic scheme: valid IID, no inferred classification.
//             Classify Unknown/Thing and still enrich on the identifier.

classificationForIid('int:iswc:T0345246801')
// undefined — ratified unambiguous but explicitly unmapped:
//             no music-composition classification exists yet.

classificationForScheme('isbn') // { slug: 'book', … } — scheme alone decides
```

Classification is total over the unambiguous schemes: every one is mapped directly, resolved from its value's type segment (`mbid`, `olid`, `caip19`, `gen1`), or *explicitly* declared unmapped with a reason. Adding a new unambiguous scheme to `@0xintuition/iid` fails this package's totality tests until it is placed.

Value-aware narrowing is honest about coverage: `caip19` classifies only canonical `eip155/erc20` values as `ethereum-erc20` — a Solana SPL asset is a valid IID with no classification rather than a mislabeled one.

Non-canonical but canonicalizable IIDs (historical spellings) classify through their canonical form — they resolve as cluster members, but they are never valid new anchors.

## Provider plans

```ts
import { providersForIid, providersForScheme, PROVIDER_SLUGS } from '@0xintuition/iid-registry'

providersForScheme('isrc') // ['musicbrainz', 'spotify', 'apple-music'] — open/no-key first
providersForIid('int:acct:github:583231') // ['github'] — the value narrows the plan
providersForIid('int:acct:x:295218901')   // ['x-profile']
providersForIid('int:caip10:cosmos:cosmoshub-4:cosmos1…') // [] — valid, no lookup capability yet
```

Ordering is deterministic and prefers open/keyless capability. An empty plan means "no identifier-driven providers", not "invalid identifier".

## Identifier hints

```ts
import { identifierHintsForIid } from '@0xintuition/iid-registry'

identifierHintsForIid('int:caip19:eip155:1/erc20:0xa0b8…')
// { caip19: 'eip155:1/erc20:0xa0b8…', chainId: '1', address: '0xa0b8…' }

identifierHintsForIid('int:mbid:artist:056e4f3e-…')
// { mbid: '056e4f3e-…', musicbrainz: '056e4f3e-…', mbidType: 'artist' }
```

The hint map is self-describing (the scheme-named key always appears) plus the alias keys provider capability gates actually read. Key names are a frozen consumer contract.

## Boundaries

- No `AtomCategory` or application label policy — runtime categories belong in application adapters.
- No network I/O, ever.
- No ladder declarations — those live in `@0xintuition/classifications`; this package is their read-side inverse, and coherence between the two is tested.

## License

MIT.
