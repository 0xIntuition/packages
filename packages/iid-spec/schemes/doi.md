# `doi` — Digital Object Identifier

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T1 — open standard; structure is validatable entirely offline |
| Scheme typing | polymorphic (articles, datasets, and — via EIDR — films) |
| Authority | International DOI Foundation |
| Canonical form | `10.<registrant>/<suffix>`, entirely lowercase |

## What it identifies

A DOI names a digital object registered with a DOI registration agency — most commonly a scholarly article, but also datasets, book chapters, standards, and audiovisual works (EIDR mints its identifiers as DOIs under the `10.5240` prefix). The abstraction level is whatever the registrant chose to register: a DOI may name a journal article as a work, a specific version of a dataset, or a component of a larger object. The scheme itself does not constrain this.

Because a DOI's referent can be a person-authored article, a dataset, or a film, the scheme is **polymorphic**: a bare `int:doi:…` does not imply the entity's type, so DOI-anchored atoms floor at profile P1 ([§7.3](../spec/07-representation-profiles.md)).

## Value grammar

```regex
^10\.\d{4,9}\/\S+$
```

The directory indicator is always `10`. The registrant code is 4–9 digits. The suffix is any non-empty run of non-whitespace characters (visible ASCII only, per [§2.2](../spec/02-grammar.md)) and is opaque to this specification. The value contains a `/`; per [§2.3](../spec/02-grammar.md) a parser splits an IID on the first two colons only, so the slash is simply part of the value.

## Canonicalization

1. Trim leading and trailing whitespace.
2. Strip a resolver URL prefix if present. Accepted prefixes (case-insensitive): `http://doi.org/`, `https://doi.org/`, `http://dx.doi.org/`, `https://dx.doi.org/`.
3. Strip a `doi:` prefix if present (case-insensitive).
4. Lowercase the entire remaining string.
5. Match against the grammar above. On no match, **reject** (return undefined).

## Validation

A conforming validator accepts a value iff it is entirely lowercase and matches `^10\.\d{4,9}\/\S+$`. No registry lookup is performed and none is needed for structural validity; whether the DOI actually resolves is a resolution concern, not a validity concern.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `https://doi.org/10.1000/182` | `10.1000/182` | resolver URL form strips to bare DOI |
| `DOI:10.1000/182` | `10.1000/182` | doi: prefix strips |
| `10.1000/182` | `10.1000/182` | canonical DOI is idempotent |
| `10.1000/ABC` | `10.1000/abc` | DOI suffix lowercases |
| `11.1000/182` | ✗ reject | directory indicator must be 10 |

## Notes and limitations

- **Why lowercase.** The DOI Handbook declares DOIs case-insensitive: `10.1000/ABC` and `10.1000/abc` resolve identically. Byte-exact comparison ([§2.4](../spec/02-grammar.md)) therefore requires folding to one case, and this scheme folds down. Any consistently applied direction would work; lowercase matches the majority of DOIs as displayed by registration agencies.
- **The suffix is opaque.** Registration agencies impose their own suffix conventions, but this scheme validates only the shape `10.<digits>/<non-space>`. There is no check digit in a generic DOI; T1 status here means the *structure* is verifiable offline, not that a per-value checksum exists.
- **EIDR overlap.** EIDR identifiers are DOIs under registrant `10.5240`. An EIDR-shaped input is accepted by this canonicalizer too — but lowercased, which is not EIDR's canonical form. Audiovisual works SHOULD be minted under [`eidr`](./eidr.md), which preserves EIDR's uppercase convention and validates the five-quad structure. The resulting `int:doi:…` and `int:eidr:…` strings are distinct IIDs joined, when both exist, by the equivalence layer ([§8](../spec/08-equivalence.md)).
- **Versioned objects.** Some agencies mint distinct DOIs per version of a dataset alongside a concept DOI for all versions. Choosing which to mint is a modeling decision outside this scheme; both are valid values.
