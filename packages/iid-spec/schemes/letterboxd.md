# `letterboxd` — Letterboxd

| | |
| :-- | :-- |
| Identity class | D — provider-local identifiers |
| Openness tier | — (tiers apply within Class A only) |
| Scheme typing | unambiguous — film (`movie`) |
| Assigning provider | Letterboxd |
| Canonical form | Byte-exact value matching the grammar below |
| Anchor eligibility | Never P0; whole scheme floors at P1 |

## What it identifies

An identifier assigned by Letterboxd for a film (`movie`). It is stable within that provider and is not governed by a registry outside it. Admission and the provider-local class are defined in the [dated §9.7 amendment](../spec/09-registry-governance.md#2026-10-19--provider-local-identifiers-class-d). This does not claim global uniqueness outside the provider's namespace.

## Value grammar

```regex
^film:[a-z0-9]+(?:-[a-z0-9]+)*$
```

The complete value must match byte-for-byte, including at the end of input. No whitespace, case normalization, or leading-zero repair is allowed.

## Canonicalization

1. Match the entire raw value against the grammar.
2. On success return the raw value unchanged (the identity function).
3. Otherwise reject (return undefined). Never trim, fold case, or repair an invalid value.

## Validation and eligibility

`int:letterboxd:film:moonlight` is valid and unambiguously typed. Every valid value is anchor-ineligible, with `anchorIneligibilityReason: 'provider-local'`. The existing `anchorIneligibleValuePattern` mechanism in `schemes.json` matches every value: **whole scheme ineligible**. Carry the IID in a P1 payload with its type; never mint a bare P0 anchor.

## Ladder placement and matching

Provider projection uses the `handle` rung, never registry-backed strong selection. No category rung. Movie remains `wd:film`, `tmdb:movie`, `imdb:title`.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `film:moonlight` | `film:moonlight` | identity function |
| `film:Moonlight` | ✗ reject | invalid values are never repaired |
| `film:-moonlight` | ✗ reject | invalid values are never repaired |
| `film:moon--light` | ✗ reject | invalid values are never repaired |
| `film:moonlight-` | ✗ reject | invalid values are never repaired |
| ` film:moonlight` | ✗ reject | invalid values are never repaired |

The normative corpus includes `canon-letterboxd`, `parse-letterboxd`, `valid-letterboxd`, and their rejection vectors.
