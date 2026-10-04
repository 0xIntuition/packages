# `wd` — Wikidata

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T2 — community registry; full dataset published under CC0 |
| Scheme typing | polymorphic (bare) · unambiguous (typed, active binding) |
| Authority | Wikidata |
| Canonical form | `Q` followed by a positive integer with no leading zeros, optionally prefixed by `<slug>:` |

## What it identifies

A Wikidata QID names an item in Wikidata: a person, a creative work, a place, an organization, a concept — anything with an item page. Wikidata is the broadest registry in the scheme table and frequently the best cross-reference hub, since items carry external-identifier statements linking to most other registries in this specification.

Because a QID can name literally any kind of entity, bare `wd` is **polymorphic**: `int:wd:Q42` alone does not say whether Q42 is a person, a book, or a concept. Atoms carrying bare `wd` values therefore floor at profile P1, where `@type` lives in the payload ([§7.3](../spec/07-representation-profiles.md)).

## Value grammar

```regex
^(?:<slug>:)?Q[1-9]\d*$
```

`<slug>` is one of the registered EntitySchema binding slugs in the closed table below, in lowercase ASCII. The QID is an uppercase `Q` followed by a positive decimal integer. Leading zeros are prohibited — `Q42` and `Q042` must not both exist as byte-distinct identifiers for the same item ([§2.4](../spec/02-grammar.md)).

## Canonicalization

1. Trim leading and trailing whitespace. The ratified canonicalizer uses host `trim` semantics (Unicode `White_Space` plus U+FEFF), and that acceptance is frozen under [§9.3](../spec/09-registry-governance.md); the typed form inherits it.
2. Strip a Wikidata URL prefix if present. Accepted prefixes (case-insensitive): `http://wikidata.org/wiki/`, `https://wikidata.org/wiki/`, `http://www.wikidata.org/wiki/`, `https://www.wikidata.org/wiki/`, and the same four hosts with `/entity/` in place of `/wiki/`. Uppercase the remainder and require `^Q[1-9]\d*$`; return that bare QID or **reject**. URLs never infer a slug and cannot contain a typed value after the prefix.
3. For a `<slug>:<qid>` value, require the QID to match `Q[1-9]\d*` case-insensitively. Reject a non-ASCII slug before case folding; lowercase the slug and require membership in the binding table (active or dormant). Uppercase the QID and return `<slug>:<qid>`; reject unknown slugs.
4. Otherwise, uppercase the remaining string and require `^Q[1-9]\d*$`. Return the bare QID or **reject** (return undefined).

## Validation

A conforming validator accepts a value iff it is byte-identical to its canonicalization and matches the value grammar with a registered slug, when present. Full IIDs also satisfy the 220-character value limit ([§2.2](../spec/02-grammar.md)). Only item identifiers qualify: properties (`P31`), lexemes (`L…`), and MediaWiki entity forms are rejected — they identify parts of Wikidata's data model, not entities in the world. No lookup against Wikidata is performed; whether the QID exists, conforms to an EntitySchema, or has been merged into another item is a resolution concern.

## Scheme typing

`wd` is a **value-typed scheme** ([§7.3](../spec/07-representation-profiles.md)): bare `Q…` values are polymorphic and floor at P1; `<slug>:Q…` values carry the entity type. An active binding is unambiguous and P0-eligible. A dormant binding is unambiguous and valid for parsing and validation, but is parse-only and MUST NOT be minted. The active set is `film`, `television-series`, and `human`.

## EntitySchema bindings

The table is closed and ordered by binding precedence. Additions and activation changes require review under the process in [§9.4](../spec/09-registry-governance.md); existing identifiers remain stable. Each binding pins its EntitySchema, anchor QID, classification, and revision. The E-number does not determine the anchor QID.

| Slug | EntitySchema id | Anchor QID | Classification | Status | Pinned revision |
| :-- | :-- | :-- | :-- | :-- | --: |
| `film` | `E11424` | `Q11424` | `Movie` | active | 2403158147 |
| `television-series` | `E17` | `Q5398426` | `TVSeries` | active | 2525771900 |
| `television-series-season` | `E18` | `Q3464665` | `TVSeason` | dormant | 2525772131 |
| `television-series-episode` | `E19` | `Q21191270` | `TVEpisode` | dormant | 2279362550 |
| `written-work` | `E35` | `Q47461344` | `Book` | dormant | 2525775487 |
| `human` | `E10` | `Q5` | `Person` | active | 2499173058 |
| `podcast` | `E418` | `Q24634210` | `PodcastSeries` | dormant | 2052853948 |
| `podcast-episode` | `E420` | `Q61855877` | `PodcastEpisode` | dormant | 2212603393 |
| `video-game` | `E272` | `Q7889` | `VideoGame` | dormant | 2363080401 |
| `album` | `E248` | `Q482994` | `MusicAlbum` | dormant | 2226920960 |
| `organization` | `E98` | `Q43229` | `Organization` | dormant | 2392901167 |

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `https://www.wikidata.org/wiki/Q42` | `Q42` | wiki URL form strips to QID |
| `q42` | `Q42` | lowercase QID uppercases |
| `Q42` | `Q42` | canonical QID is idempotent |
| `Q042` | ✗ reject | leading zero not canonical |
| `P31` | ✗ reject | properties are not entities |
| `film:q42` | `film:Q42` | active binding; QID uppercases |
| ` \tfilm:q42\r\n` | `film:Q42` | ASCII edge whitespace trims |
| `HUMAN:q42` | `human:Q42` | ASCII slug lowercases |
| `television-series:Q137400033` | `television-series:Q137400033` | active binding is idempotent |
| `written-work:Q47461344` | `written-work:Q47461344` | dormant binding remains valid |
| `https://www.wikidata.org/wiki/Q188035` | `Q188035` | URL never infers `film` |
| `bogus:Q1` | ✗ reject | unknown binding |
| `written-worK:Q42` | ✗ reject | non-ASCII slug rejects before case folding |
| `\uFEFFfilm:Q42\uFEFF` | `film:Q42` | edge whitespace, including U+FEFF, trims |
| `film:Q042` | ✗ reject | leading-zero QID |

## Notes and limitations

- **Ladder rungs.** A `wd` rung mints a typed value only when it declares an active binding slug; a rung without a slug mints bare values only, and a typed value reaching it is skipped ([§5](../spec/05-identity-ladders.md)).
- **Legacy bare values.** Existing bare `int:wd:Q…` identifiers remain valid and byte-identical, never P0-eligible. Bare and typed forms for the same entity are joined through [§8 equivalence](../spec/08-equivalence.md), without rewriting either identifier.

- **Why leading zeros reject.** Wikidata itself never issues zero-padded QIDs, but padded forms appear in the wild via spreadsheet formatting and hand transcription. Accepting them would create two byte-distinct IIDs for one item, which byte-exact comparison can never repair. Rejection forces the error to surface at canonicalization time.
- **Properties are not entities.** `P31` (*instance of*) names a relationship vocabulary term, not a thing. If a term set is the entity being identified, the [`termset`](./termset.md) scheme exists for that purpose.
- **Merges and redirects.** Wikidata merges duplicate items, leaving the losing QID as a redirect. Both QIDs remain resolvable and both canonicalize here; the equivalence layer ([§8](../spec/08-equivalence.md)) is the right place to record that they name the same entity. Canonicalization is offline and does not chase redirects.
- **Position in ladders.** As a CC0, T2, cross-referencing registry, `wd` frequently ranks high in identity ladders ([§5](../spec/05-identity-ladders.md)) — above `imdb` (T3) always, per [§3.3.1](../spec/03-identity-classes.md), and above other T2 registries when it cross-references them. Bare `wd` can identify anything but never anchors at P0; active typed bindings can.
