# `olid` — Open Library Identifier

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T2 — community registry; full dataset published as open bulk dumps |
| Scheme typing | unambiguous (entity type carried by the value's suffix letter) |
| Authority | OpenLibrary (Internet Archive) |
| Canonical form | `OL<digits><W|M|A>`, uppercase |

## What it identifies

An Open Library identifier names one record in OpenLibrary, and its final letter declares which of three entity types it is:

| Suffix | Type | Abstraction level |
| :-- | :-- | :-- |
| `W` | Work | The abstract book across all its editions and translations |
| `M` | Edition | A specific published edition — the thing an ISBN also names |
| `A` | Author | A person (or corporate author) |

The suffix is load-bearing: `OL45804W` and a hypothetical `OL45804M` are unrelated records in different tables. Because the suffix types the identifier, the scheme is **unambiguously typed** and P0-eligible ([§7.3](../spec/07-representation-profiles.md)).

## Value grammar

```regex
^OL\d+[AMW]$
```

Uppercase `OL`, one or more decimal digits, and a single type suffix `A`, `M`, or `W`.

## Canonicalization

1. Trim leading and trailing whitespace.
2. Strip an OpenLibrary URL prefix if present. Accepted prefixes (case-insensitive): `http://openlibrary.org/`, `https://openlibrary.org/`, `http://www.openlibrary.org/`, `https://www.openlibrary.org/`, each followed by `works/`, `books/`, or `authors/`.
3. Strip everything from the first remaining `/` onward — OpenLibrary URLs append a title slug (`/works/OL45804W/Fantastic_Mr_Fox`), which is display text, not identity.
4. Uppercase the entire remaining string.
5. Match against `^OL\d+[AMW]$`. On no match, **reject** (return undefined).

## Validation

A conforming validator accepts a value iff it matches `^OL\d+[AMW]$`, uppercase. Any other suffix letter rejects, as does a bare `OL` number with no suffix. No lookup against OpenLibrary is performed.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `https://openlibrary.org/works/OL45804W` | `OL45804W` | works URL strips to OLID |
| `ol45804w` | `OL45804W` | lowercase OLID uppercases |
| `OL7353617M` | `OL7353617M` | edition OLID is idempotent |
| `OL34184A` | `OL34184A` | author OLID is idempotent |
| `OL45804Z` | ✗ reject | unknown suffix |

## Notes and limitations

- **Why uppercase.** OpenLibrary displays and mints its identifiers uppercase; folding up preserves the registry's own convention while making lowercase transcriptions canonicalize rather than fork.
- **Works versus editions.** For a specific edition, [`isbn`](./isbn.md) is T1 and offline-checksummed, so it ranks above the edition's `M`-suffixed OLID in an identity ladder ([§3.5](../spec/03-identity-classes.md)). The `W`-suffixed work identifier has no T1 competitor — ISBNs do not name works — which is where `olid` earns its place as an anchor.
- **URL path is part of typing.** Only `works/`, `books/`, and `authors/` paths strip; these correspond exactly to the `W`/`M`/`A` suffixes. The suffix, not the path, is authoritative — the path is discarded and the suffix re-validated.
- **Community-edited data.** OpenLibrary records are community-maintained and duplicates occur; merged records leave redirects. Both identifiers canonicalize here, and the merge belongs in the equivalence layer ([§8](../spec/08-equivalence.md)).
