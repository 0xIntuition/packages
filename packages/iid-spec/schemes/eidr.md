# `eidr` — Entertainment Identifier Registry

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T1 — open standard; structure is validatable entirely offline |
| Scheme typing | unambiguous (always an audiovisual work) |
| Authority | EIDR Association |
| Canonical form | `10.5240/XXXX-XXXX-XXXX-XXXX-XXXX-C`, uppercase |

## What it identifies

An EIDR content ID names an audiovisual work: a film, a television series, a season, an episode, or an edit/version of one of these. EIDR is the film and television industry's registry, and its identifiers are the standard cross-studio reference for audiovisual assets.

Because every EIDR content ID names an audiovisual work, the scheme is **unambiguously typed** and is eligible for P0 anchoring ([§7.2](../spec/07-representation-profiles.md)): the bare IID is sufficient to know what kind of thing it names.

## Value grammar

```regex
^10\.5240\/[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-Z]$
```

Five groups of four uppercase hexadecimal digits, hyphen-separated, followed by a single check character in `[0-9A-Z]`. The registrant prefix is fixed at `10.5240` — EIDR is a DOI sub-namespace, and this scheme accepts only that sub-namespace.

## Canonicalization

1. Trim leading and trailing whitespace.
2. Strip a DOI resolver URL prefix if present. Accepted prefixes (case-insensitive): `http://doi.org/`, `https://doi.org/`, `http://dx.doi.org/`, `https://dx.doi.org/`. (No `doi:` prefix stripping — that form belongs to the [`doi`](./doi.md) scheme.)
3. Uppercase the entire remaining string.
4. Match against the grammar above. On no match, **reject** (return undefined).

## Validation

A conforming validator accepts a value iff it is entirely uppercase and matches the grammar above: prefix `10.5240/`, five hex quads, and a final check character in `[0-9A-Z]`. The check character's *presence and character class* are validated; its ISO 7064 mod 37-36 value is **not** recomputed by this canonicalizer. A transcription error in the payload therefore may pass canonicalization; implementations wanting the stronger guarantee may verify the check character as an additional, non-normative step.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `https://doi.org/10.5240/7791-8534-2C23-9030-8610-5` | `10.5240/7791-8534-2C23-9030-8610-5` | resolver URL form strips to bare EIDR |
| `10.5240/7791-8534-2c23-9030-8610-5` | `10.5240/7791-8534-2C23-9030-8610-5` | lowercase EIDR uppercases |
| `10.5240/7791-8534-2C23-9030-8610` | ✗ reject | missing check segment |

## Notes and limitations

- **Why uppercase.** EIDR displays and documents its identifiers in uppercase hex throughout its own materials. DOIs are case-insensitive, so a fold is mandatory for byte-exact comparison ([§2.4](../spec/02-grammar.md)); this scheme folds up to match the registry's convention. Note the deliberate asymmetry with `doi`, which folds down — the two schemes never produce colliding byte strings for the same input.
- **A DOI sub-namespace.** Every EIDR ID is a valid DOI under registrant `10.5240`, which is why `doi.org` resolver forms are accepted here. The generic `doi` canonicalizer will also accept EIDR-shaped input but lowercases it; mint audiovisual works under `eidr` so the type is carried by the scheme and the registry's canonical casing is preserved.
- **Abstraction levels within EIDR.** EIDR assigns distinct IDs to a title-level work and to each edit or manifestation of it. All are audiovisual works for typing purposes, but they are different entities; minting the title-level ID is the usual choice when referencing "the film."
- **Party and service IDs.** EIDR also operates registries for parties (`10.5237`) and video services (`10.5238`). Those prefixes are **not** accepted by this scheme — only `10.5240` content IDs canonicalize, which is what keeps the scheme unambiguously typed.
