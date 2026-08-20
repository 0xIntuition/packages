# `termset` — Term Within a Term Set

| | |
| :-- | :-- |
| Identity class | B — intrinsic natural key |
| Openness tier | — (Class B) |
| Scheme typing | unambiguous (a term within a term set) |
| Natural key | A digest of the term set + the term's code within it |
| Canonical form | `<32-hex-set-hash>:<term-code>`, entirely lowercase |

## What it identifies

A `termset` value names one defined term inside one term set — a controlled-vocabulary entry such as the predicate `follow` within a social-verbs vocabulary. Defined terms are the schema.org `DefinedTerm` / `DefinedTermSet` pattern: the set gives the term its meaning, and the term code is unique only within its set.

This is a **scoped identifier**, and it passes the litmus test of [§5.5.1](../spec/05-identity-ladders.md): a term code like `follow` has no identity independent of its vocabulary — the same code in two different sets means two different things, and outside any set it means nothing at all. The scope therefore belongs in the identifier: a fixed-length digest of the set, then the code.

## Value grammar

```regex
^[0-9a-f]{32}:[a-z0-9][a-z0-9-]*$
```

Two colon-separated parts: 32 lowercase hex characters (a 16-byte digest identifying the term set) and a term code — lowercase letters, digits, and hyphens, starting with an alphanumeric. Per [§2.3](../spec/02-grammar.md) the internal colon is part of the value, not IID structure.

## Canonicalization

1. Trim leading and trailing whitespace.
2. Lowercase the entire string.
3. Match `^([0-9a-f]{32}):([a-z0-9][a-z0-9-]*)$`. On no match, **reject**.
4. Reassemble as `<set-hash>:<term-code>`.

Lowercasing before the match means term-code case folds (`Follow` → `follow`) while anything outside the code alphabet — underscores, dots, a leading hyphen — rejects rather than being repaired. A leading hyphen is rejected because slugs beginning with a separator are almost always truncation artifacts, and repairing one would silently mint an identifier for a code the vocabulary never defined.

## Validation

A conforming validator accepts a value iff it is entirely lowercase, the first segment is exactly 32 hex characters, and the second matches `[a-z0-9][a-z0-9-]*`. Fully offline; the vocabulary itself is never consulted.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D:follow` | `1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d:follow` | set hash lowercases, term code preserved |
| `1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d:Follow` | `1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d:follow` | term code case folds |
| `1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d:-follow` | ✗ reject | term code must start alphanumeric |

## Notes and limitations

- **Why the set is a hash, not a name.** Term-set names are natural language — "Social Interaction Verbs" — and natural-language text is barred from appearing raw in an IID ([§2.2](../spec/02-grammar.md), requirement 5). The reference deriver computes the set digest as the first 16 bytes of keccak-256 over the `NORM-1`-normalized set name, and slugifies the term code from its `NORM-1` form (non-alphanumerics collapsed to hyphens, edges trimmed). The canonicalizer accepts any 32-hex digest; the derivation rule lives with the `defined-term` ladder in the classifications package.
- **Class B despite containing a hash.** As with [`rssitem`](./rssitem.md), the hash encodes a scoping key rather than compositing descriptive attributes. The pair (set, code) is the term's actual natural key — a controlled vocabulary exists precisely to guarantee code uniqueness within itself — so this is not a `gen1`-style probabilistic identity.
- **The set digest inherits the set name's stability.** Two sources that spell the vocabulary's name differently will derive different set hashes and therefore different term IIDs. This is the standard trade-off of hashing normalized text, kept honest by `NORM-1`'s refusal to guess ([§4.4](../spec/04-normalization.md)); divergent spellings of one vocabulary are merged by the equivalence layer ([§8](../spec/08-equivalence.md)).
- **Unambiguous typing.** Every `termset` value is a defined term, so the scheme is P0-eligible ([§7.2](../spec/07-representation-profiles.md)) — useful, since predicates are exactly the atoms one wants cheap, deduplicated anchors for.
