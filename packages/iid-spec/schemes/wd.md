# `wd` — Wikidata

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T2 — community registry; full dataset published under CC0 |
| Scheme typing | polymorphic (Wikidata covers every kind of thing) |
| Authority | Wikidata |
| Canonical form | `Q` followed by a positive integer with no leading zeros |

## What it identifies

A Wikidata QID names an item in Wikidata: a person, a creative work, a place, an organization, a concept — anything with an item page. Wikidata is the broadest registry in the scheme table and frequently the best cross-reference hub, since items carry external-identifier statements linking to most other registries in this specification.

Because a QID can name literally any kind of entity, the scheme is maximally **polymorphic**: `int:wd:Q42` alone does not say whether Q42 is a person, a book, or a concept. Wikidata-anchored atoms therefore floor at profile P1, where `@type` lives in the payload ([§7.3](../spec/07-representation-profiles.md)).

## Value grammar

```regex
^Q[1-9]\d*$
```

An uppercase `Q` followed by a positive decimal integer. Leading zeros are prohibited — `Q42` and `Q042` must not both exist as byte-distinct identifiers for the same item ([§2.4](../spec/02-grammar.md)).

## Canonicalization

1. Trim leading and trailing whitespace.
2. Strip a Wikidata URL prefix if present. Accepted prefixes (case-insensitive): `http://wikidata.org/wiki/`, `https://wikidata.org/wiki/`, `http://www.wikidata.org/wiki/`, `https://www.wikidata.org/wiki/`, and the same four hosts with `/entity/` in place of `/wiki/`.
3. Uppercase the entire remaining string.
4. Match against `^Q[1-9]\d*$`. On no match, **reject** (return undefined).

## Validation

A conforming validator accepts a value iff it matches `^Q[1-9]\d*$`. Only item identifiers qualify: properties (`P31`), lexemes (`L…`), and MediaWiki entity forms are rejected — they identify parts of Wikidata's data model, not entities in the world. No lookup against Wikidata is performed; whether the QID exists, or has been merged into another item, is a resolution concern.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `https://www.wikidata.org/wiki/Q42` | `Q42` | wiki URL form strips to QID |
| `q42` | `Q42` | lowercase QID uppercases |
| `Q42` | `Q42` | canonical QID is idempotent |
| `Q042` | ✗ reject | leading zero not canonical |
| `P31` | ✗ reject | properties are not entities |

## Notes and limitations

- **Why leading zeros reject.** Wikidata itself never issues zero-padded QIDs, but padded forms appear in the wild via spreadsheet formatting and hand transcription. Accepting them would create two byte-distinct IIDs for one item, which byte-exact comparison can never repair. Rejection forces the error to surface at canonicalization time.
- **Properties are not entities.** `P31` (*instance of*) names a relationship vocabulary term, not a thing. If a term set is the entity being identified, the [`termset`](./termset.md) scheme exists for that purpose.
- **Merges and redirects.** Wikidata merges duplicate items, leaving the losing QID as a redirect. Both QIDs remain resolvable and both canonicalize here; the equivalence layer ([§8](../spec/08-equivalence.md)) is the right place to record that they name the same entity. Canonicalization is offline and does not chase redirects.
- **Position in ladders.** As a CC0, T2, cross-referencing registry, `wd` frequently ranks high in identity ladders ([§5](../spec/05-identity-ladders.md)) — above `imdb` (T3) always, per [§3.3.1](../spec/03-identity-classes.md), and above other T2 registries when it cross-references them. Its polymorphism is the trade-off: it can anchor anything, but never at P0.
