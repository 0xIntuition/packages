# `tmdb` — The Movie Database Identifier

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T2 — community registry; daily ID exports published as open data |
| Scheme typing | polymorphic (movie/tv/person segments span classifications) |
| Authority | The Movie Database (TMDB) |
| Canonical form | `<entity-type>:<digits>`, lowercase |

## What it identifies

A TMDB identifier names one record in The Movie Database. Three entity types are registered in this scheme:

| Type | What it names |
| :-- | :-- |
| `movie` | A film |
| `tv` | A television series |
| `person` | A person — cast or crew |

TMDB's numeric IDs are **per-type namespaces**: `movie/550` and `tv/550` are unrelated records. The canonical value therefore carries the type segment, exactly as [`mbid`](./mbid.md) does.

Despite the type segment, the scheme is ratified **polymorphic** (D30): the `person` segment spans classifications the segment alone does not resolve, so TMDB-anchored atoms floor at profile P1 with `@type` in the payload ([§7.3](../spec/07-representation-profiles.md)). The type segment remains load-bearing for uniqueness even though it does not confer P0 eligibility.

## Value grammar

```regex
^(movie|tv|person):\d+$
```

The canonical value contains a colon. Per [§2.3](../spec/02-grammar.md), an IID parser splits on the first two colons only, so `int:tmdb:movie:27205` parses as scheme `tmdb`, value `movie:27205`. The internal colon is scheme-owned structure.

## Canonicalization

1. Trim leading and trailing whitespace.
2. Lowercase the entire string.
3. Strip a TMDB URL prefix if present: `http://themoviedb.org/`, `https://themoviedb.org/`, `http://www.themoviedb.org/`, `https://www.themoviedb.org/`.
4. Strip a title slug: if the remainder is `<letters>/<digits>-<anything without a slash>`, drop the `-…` tail. TMDB URLs embed a display slug (`movie/27205-inception`); the slug is presentation, not identity. Slug stripping applies only to the slash-separated form.
5. Match `^([a-z]+)[/:](\d+)$` — an entity-type segment, a `/` or `:` separator, and a decimal ID. On no match, **reject**.
6. Reject unless the entity type is one of `movie`, `tv`, `person`.
7. Emit `<entity-type>:<id>`. All rejects return undefined.

## Validation

A conforming validator accepts a value iff it is a registered entity type, a single colon, and one or more decimal digits. The whitelist is closed: TMDB's other addressable kinds (`collection`, `company`, `network`, `keyword`, …) are not registered here and must be rejected.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `https://www.themoviedb.org/movie/27205-inception` | `movie:27205` | URL with slug strips to type-scoped ID |
| `tv/1399` | `tv:1399` | slash separator canonicalizes to colon |
| `person:6193` | `person:6193` | person ID is idempotent |
| `collection:10` | ✗ reject | collection is not a registered TMDB type |

## Notes and limitations

- **The type segment is load-bearing.** TMDB numeric IDs collide across types by construction; a bare number is not an identifier. Any integration that stores "the TMDB ID" as a naked integer has already lost information this scheme refuses to lose.
- **No leading-zero rejection.** The grammar accepts `\d+` as TMDB emits it; TMDB does not zero-pad, so the point is moot in practice, and the canonicalizer does not editorialize beyond what the registry produces.
- **Ladder position.** TMDB publishes daily ID exports under an open attribution model, earning T2 — which places `tmdb` above `imdb` (T3) in every film and TV ladder per [§3.3.1](../spec/03-identity-classes.md), and below `eidr` (T1) where an EIDR ID exists.
- **Seasons and episodes.** TMDB addresses seasons and episodes as sub-paths of a `tv` record (`tv/1399/season/1`); those forms do not canonicalize. Only the series-level `tv` ID is an identifier in this scheme.
