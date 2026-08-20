# `imdb` — Internet Movie Database Identifier

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T3 — proprietary; dataset is closed and cannot be independently verified |
| Scheme typing | polymorphic (prefixes span titles, people, companies, events, characters, news) |
| Authority | IMDb (Amazon) |
| Canonical form | `<prefix><digits>`, lowercase, at least six digits |

## What it identifies

An IMDb identifier names one record in IMDb. The two-letter prefix declares the record's kind:

| Prefix | Kind |
| :-- | :-- |
| `tt` | Title — a film, series, episode, or other titled work |
| `nm` | Name — a person |
| `co` | Company |
| `ev` | Event — an award ceremony or festival |
| `ch` | Character |
| `ni` | News item |

Although the prefix narrows the kind, the value space as a whole spans films, people, companies, and more — and `tt` alone spans movies, series, and episodes, which are distinct classifications. The scheme is therefore **polymorphic**, and IMDb-anchored atoms floor at profile P1 with `@type` in the payload ([§7.3](../spec/07-representation-profiles.md)).

## Value grammar

```regex
^(tt|nm|co|ev|ch|ni)\d{6,}$
```

A registered prefix followed by six or more decimal digits. IMDb zero-pads short numbers (`nm0000138`); the padded digits are part of the identifier and are preserved as-is — no padding is added or removed.

## Canonicalization

1. Trim leading and trailing whitespace.
2. Strip an IMDb URL prefix if present. Accepted prefixes (case-insensitive): `http://imdb.com/`, `https://imdb.com/`, `http://www.imdb.com/`, `https://www.imdb.com/`, each followed by `title/` or `name/`. (Only title and name URL paths strip; `co`/`ev`/`ch`/`ni` values are accepted in bare form only.)
3. Strip everything from the first remaining `/` onward — trailing slashes and any residual path segments.
4. Lowercase the entire remaining string.
5. Match against `^(tt|nm|co|ev|ch|ni)\d{6,}$`. On no match, **reject** (return undefined).

## Validation

A conforming validator accepts a value iff it matches the grammar above, lowercase. Fewer than six digits rejects. No lookup against IMDb is performed — and none is *possible* under an open license, which is precisely what T3 means.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `https://www.imdb.com/title/tt1375666/` | `tt1375666` | title URL strips to ID |
| `TT1375666` | `tt1375666` | uppercase ID lowercases |
| `nm0000138` | `nm0000138` | name ID is idempotent |
| `tt123` | ✗ reject | fewer than 6 digits |

## Notes and limitations

- **The only T3 scheme.** IMDb identifiers are stable, ubiquitous, and accurate — but the dataset behind them is closed and Amazon-owned. Correctness cannot be verified without the vendor's cooperation, so per the ordering rule of [§3.3.1](../spec/03-identity-classes.md), **`imdb` MUST rank below every T1 and T2 scheme in every identity ladder in which it appears**. For film, that means `eidr` (T1), `tmdb` (T2), and `wd` (T2) all outrank it. This is a licensing-and-access judgement, not an accuracy judgement: an `imdb` ID remains valuable corroborating evidence and a strong `sameAs` reference; it is simply never the preferred anchor.
- **Closed data caveat.** IMDb's non-commercial datasets cover a subset of records under restrictive terms; they do not make the registry independently auditable. A tier change would require an actual licensing change ([§3.3.2](../spec/03-identity-classes.md)).
- **Digit count.** Historic IMDb IDs are zero-padded to seven digits; newer titles have exceeded seven. The grammar requires at least six and sets no maximum, matching IMDb's observed practice without betting on its future width.
- **Prefix asymmetry in URL stripping.** Only `/title/` and `/name/` URLs are recognized because those are the URL shapes that circulate; company, event, character, and news IDs must be supplied bare. This is the canonicalizer's actual behavior, frozen at ratification.
