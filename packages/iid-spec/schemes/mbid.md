# `mbid` — MusicBrainz Identifier

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T2 — community registry; full database published as open-licensed dumps |
| Scheme typing | unambiguous (entity type carried inside the value) |
| Authority | MusicBrainz |
| Canonical form | `<entity-type>:<uuid>`, lowercase |

## What it identifies

A MusicBrainz identifier names one entity in the MusicBrainz music database. Six entity types are registered in this scheme, and each names a different abstraction level:

| Type | What it names |
| :-- | :-- |
| `artist` | A performer — a person, group, orchestra, or character credited on recordings |
| `recording` | A distinct recorded performance (the audio itself, not its packaging) |
| `release` | A specific issued product — one edition of an album, with its barcode and label |
| `release-group` | The abstract album across all its releases and reissues |
| `work` | The composition — the written musical work underlying recordings |
| `label` | An imprint that issues releases |

MusicBrainz assigns UUIDs per entity type, so the bare UUID is ambiguous — the same UUID space is reused across types. The canonical value therefore carries the type as a prefix segment, which is what makes this scheme **unambiguously typed** and P0-eligible ([§7.3](../spec/07-representation-profiles.md)).

## Value grammar

```regex
^(artist|recording|release|release-group|work|label):[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
```

The canonical value contains a colon. Per [§2.3](../spec/02-grammar.md), an IID parser splits on the first two colons only, so `int:mbid:artist:056e4f3e-…` parses as scheme `mbid`, value `artist:056e4f3e-…`. The internal colon is scheme-owned structure, meaningful only to code that knows the `mbid` scheme.

## Canonicalization

1. Trim leading and trailing whitespace.
2. Lowercase the entire string.
3. Match `^(?:https?:\/\/musicbrainz\.org\/)?([a-z-]+)[/:]([0-9a-f-]{36})$` — an optional URL prefix (`http://musicbrainz.org/` or `https://musicbrainz.org/`; a `www.` host is **not** accepted), an entity-type segment, a `/` or `:` separator, and a 36-character UUID-shaped tail. On no match, **reject**.
4. Reject unless the entity type is one of `artist`, `recording`, `release`, `release-group`, `work`, `label`.
5. Reject unless the tail matches the UUID pattern `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`.
6. Emit `<entity-type>:<uuid>`. All rejects return undefined.

## Validation

A conforming validator accepts a value iff it is a registered entity type, a single colon, and a lowercase hyphenated UUID, per the grammar above. The entity-type whitelist is closed: MusicBrainz has further entity types (`area`, `place`, `event`, `series`, …) that are **not** registered here and must be rejected.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `https://musicbrainz.org/artist/056e4f3e-d505-4dad-8ec1-d04f521cbb56` | `artist:056e4f3e-d505-4dad-8ec1-d04f521cbb56` | URL form strips to type-scoped UUID |
| `recording:B1A9C0E9-D987-4042-AE91-78D6A3267D69` | `recording:b1a9c0e9-d987-4042-ae91-78d6a3267d69` | uppercase UUID lowercases |
| `label:83eca2b3-5ae1-43f5-a732-56fa9a8591b1` | `label:83eca2b3-5ae1-43f5-a732-56fa9a8591b1` | label entity type is registered |
| `work:39fb6ed0-a0d1-3a3d-9f77-4e0fcdadfa5e` | `work:39fb6ed0-a0d1-3a3d-9f77-4e0fcdadfa5e` | work entity type is registered |
| `venue:056e4f3e-d505-4dad-8ec1-d04f521cbb56` | ✗ reject | venue is not a registered MBID entity type |
| `artist:056e4f3e` | ✗ reject | not a UUID |

## Notes and limitations

- **Why the type prefix.** A bare MBID UUID is only unique within its entity type's table. Folding the type into the value makes the identifier self-typing (P0-eligible) and collision-free across types, at the cost of a value that bare-UUID tooling will not recognize without transformation.
- **Closed whitelist by design.** Adding an entity type changes what values are canonical, and canonicalization is frozen once ratified — an expanded type set would ship as a new scheme name, not an edit to this one.
- **Ladder position.** For a sound recording, `isrc` names the recording itself and ranks above `mbid` per rule 3 of [§3.5](../spec/03-identity-classes.md); `mbid` remains the stronger anchor for artists, release groups, works, and labels, where no T1 scheme applies as directly.
- **MBID redirects.** MusicBrainz merges duplicates and redirects the losing MBID. Both canonicalize here; record the merge in the equivalence layer ([§8](../spec/08-equivalence.md)).
