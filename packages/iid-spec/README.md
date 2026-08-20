# The Intuition ID (IID)

**A deterministic, canonical name for a real-world thing.**

Two people who have never met, working from the same facts, describing the same book — should arrive at the same identifier for it, character for character, without coordinating. That is the whole idea. This package is the specification that makes it true.

```text
int:isbn:9780684832722          a specific book edition
int:wd:Q25188                   the film Inception
int:caip10:eip155:1:0xd8da…     an Ethereum account
int:gen1:music-group:r4:8f3c…   a band we could only identify by name
```

---

## Start here

**If you are not an engineer**, read [`explainer.md`](./explainer.md). It explains what an Intuition ID is, why the obvious approaches fail, and why some identifiers are stronger than others — with no code and no cryptography. It takes about ten minutes.

**If you are implementing against this spec**, read the [specification](./spec/00-overview.md) in order. It is normative: it uses MUST/SHOULD/MAY in the RFC 2119 sense and is versioned.

**If you need the exact rules for one identifier type** — how to canonicalize an ISBN, what a valid CAIP-10 value looks like — go straight to the [scheme registry](./schemes/README.md). Each of the 26 schemes has its own file with a grammar, an ordered canonicalization algorithm, validation rules, test vectors, and known limitations.

**If you are testing an implementation**, the [`conformance/`](./conformance/) directory contains the versioned machine-readable test vectors. They are normative and executable:

```ts
import vectors from '@0xintuition/iid-spec/conformance/canonicalization.json'
```

---

## Reading paths

| You want to… | Read |
| :-- | :-- |
| Understand the concept | [`explainer.md`](./explainer.md) |
| Understand why IDs have strength tiers | [`spec/03-identity-classes.md`](./spec/03-identity-classes.md) |
| Parse or compare an IID | [`spec/02-grammar.md`](./spec/02-grammar.md) |
| Normalize a string before hashing | [`spec/04-normalization.md`](./spec/04-normalization.md) |
| Pick which identifier to mint for an entity | [`spec/05-identity-ladders.md`](./spec/05-identity-ladders.md) |
| Derive an ID when no registry covers the thing | [`spec/06-gen1.md`](./spec/06-gen1.md) |
| Decide how much data an atom carries | [`spec/07-representation-profiles.md`](./spec/07-representation-profiles.md) |
| Understand what IIDs deliberately do *not* solve | [`spec/08-equivalence.md`](./spec/08-equivalence.md) |
| Add a new scheme to the registry | [`spec/09-registry-governance.md`](./spec/09-registry-governance.md) |
| Look up one specific scheme | [`schemes/`](./schemes/README.md) |
| Run an implementation against the test corpus | [`conformance/`](./conformance/) |
| Know where the code and the spec currently disagree | [`implementation-notes.md`](./implementation-notes.md) |

## Specification contents

| Document | Contents |
| :-- | :-- |
| [00 — Overview](./spec/00-overview.md) | Purpose, scope, design tenets, and what an IID is not |
| [01 — Conformance](./spec/01-conformance.md) | Terminology, requirement levels, versioning, and stability guarantees |
| [02 — Grammar](./spec/02-grammar.md) | The identifier string: ABNF, parsing rules, comparison rules |
| [03 — Identity classes](./spec/03-identity-classes.md) | Classes A/B/C and openness tiers T1/T2/T3 — how identifier strength is ranked |
| [04 — Normalization (NORM-1)](./spec/04-normalization.md) | The frozen string-normalization algorithm |
| [05 — Identity ladders](./spec/05-identity-ladders.md) | How an entity's identifier is selected from available facts |
| [06 — The `gen1` scheme](./spec/06-gen1.md) | Deriving an identifier when no authority or natural key exists |
| [07 — Representation profiles](./spec/07-representation-profiles.md) | P0 / P1 / P2 — how much data travels with the identifier |
| [08 — Equivalence](./spec/08-equivalence.md) | The layer above IIDs: clustering, canonical election, trust |
| [09 — Registry governance](./spec/09-registry-governance.md) | Admission criteria, the freeze rule, and the change process |

## The 26 schemes

**Class A — registered authorities** (an external registry guarantees uniqueness)
[`isbn`](./schemes/isbn.md) · [`isrc`](./schemes/isrc.md) · [`iswc`](./schemes/iswc.md) · [`isni`](./schemes/isni.md) · [`orcid`](./schemes/orcid.md) · [`lei`](./schemes/lei.md) · [`gtin`](./schemes/gtin.md) · [`doi`](./schemes/doi.md) · [`eidr`](./schemes/eidr.md) · [`wd`](./schemes/wd.md) · [`mbid`](./schemes/mbid.md) · [`olid`](./schemes/olid.md) · [`imdb`](./schemes/imdb.md) · [`tmdb`](./schemes/tmdb.md) · [`podcastguid`](./schemes/podcastguid.md)

**Class B — intrinsic natural keys** (the thing carries its own identity)
[`url`](./schemes/url.md) · [`caip10`](./schemes/caip10.md) · [`caip19`](./schemes/caip19.md) · [`hash`](./schemes/hash.md) · [`appid`](./schemes/appid.md) · [`purl`](./schemes/purl.md) · [`geo`](./schemes/geo.md) · [`acct`](./schemes/acct.md) · [`rssitem`](./schemes/rssitem.md) · [`termset`](./schemes/termset.md)

**Class C — derived** (a hash of the few facts we actually have)
[`gen1`](./schemes/gen1.md)

## The conformance corpus

The [`conformance/`](./conformance/) directory is the machine-readable half of this specification. Every vector is normative, generated from the reference implementation, and cross-checked against the golden values stated in the specification prose.

| File | Contents |
| :-- | :-- |
| `schema.json` | JSON Schema every fixture file conforms to |
| `canonicalization.json` | Per-scheme raw → canonical (or reject) vectors — every scheme has positive and negative cases |
| `norm1.json` | NORM-1 input → output vectors |
| `gen1.json` | Full `gen1` derivations: recipe fields, exact preimage, and resulting IID |
| `parse.json` | Grammar/parsing vectors, including colon-bearing values and rejections |
| `validation.json` | Full-IID validity and P0 anchor-eligibility vectors |
| `schemes.json` | The registry snapshot: identity class and scheme typing per scheme |

Fixture files are versioned (`specVersion`, `fixtureVersion`) and append-only: changing an existing vector's expected output is an identity-impacting change and follows the governance process in [§9](./spec/09-registry-governance.md).

## Relationship to the code

| Package | Role |
| :-- | :-- |
| `@0xintuition/iid-spec` (this package) | The normative specification. The source of truth for *what is correct*. |
| [`@0xintuition/iid`](https://www.npmjs.com/package/@0xintuition/iid) | The reference implementation: canonicalizers, NORM-1, `gen1` derivation, parsing. |
| [`@0xintuition/classifications`](https://www.npmjs.com/package/@0xintuition/classifications) | Declares each entity type's identity ladder. |
| [`@0xintuition/iid-registry`](https://www.npmjs.com/package/@0xintuition/iid-registry) | Maps schemes to classifications and resolution providers. |

Every test vector in this specification is executable against the reference implementation. Where the two currently disagree, the disagreement is recorded in [`implementation-notes.md`](./implementation-notes.md) rather than hidden — the spec states the intended rule, the note states what today's code does.

## Status

**Version 0.1.0 — Draft.** The grammar, the class system, NORM-1, and the `gen1` algorithm are stable and in production use. Scheme canonicalization rules are frozen under the [freeze rule](./spec/09-registry-governance.md): once ratified, a scheme's rules never change in place — a change ships as a new scheme name or version.

This specification is published for review and adoption. It is not yet submitted to any standards body.

## License

MIT.
