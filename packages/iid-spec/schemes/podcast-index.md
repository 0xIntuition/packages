# `podcast-index` — Podcast Index

| | |
| :-- | :-- |
| Identity class | D — provider-local identifiers |
| Openness tier | — (tiers apply within Class A only) |
| Scheme typing | unambiguous — podcast feed (`podcast-series`) |
| Assigning provider | Podcast Index |
| Canonical form | Byte-exact value matching the grammar below |
| Anchor eligibility | Never P0; whole scheme floors at P1 |

## What it identifies

An identifier assigned by Podcast Index for a podcast feed (`podcast-series`). It is stable within that provider and is not governed by a registry outside it. Admission and the provider-local class are defined in the [dated §9.7 amendment](../spec/09-registry-governance.md#2026-10-19--provider-local-identifiers-class-d). This does not claim global uniqueness outside the provider's namespace.

## Value grammar

```regex
^[1-9]\d*$
```

The complete value must match byte-for-byte, including at the end of input. No whitespace, case normalization, or leading-zero repair is allowed.

## Canonicalization

1. Match the entire raw value against the grammar.
2. On success return the raw value unchanged (the identity function).
3. Otherwise reject (return undefined). Never trim, fold case, or repair an invalid value.

## Validation and eligibility

`int:podcast-index:3421639` is valid and unambiguously typed. Every valid value is anchor-ineligible, with `anchorIneligibilityReason: 'provider-local'`. The existing `anchorIneligibleValuePattern` mechanism in `schemes.json` matches every value: **whole scheme ineligible**. Carry the IID in a P1 payload with its type; never mint a bare P0 anchor.

## Ladder placement and matching

Provider projection uses the `handle` rung, never registry-backed strong selection. Second after `podcastguid` for podcast-series and after `rssitem` for podcast-episode. The namespace always identifies a feed.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `3421639` | `3421639` | identity function |
| `0` | ✗ reject | invalid values are never repaired |
| `0123` | ✗ reject | invalid values are never repaired |
| ` 123` | ✗ reject | invalid values are never repaired |
| `123 ` | ✗ reject | invalid values are never repaired |
| `ABC` | ✗ reject | invalid values are never repaired |

The normative corpus includes `canon-podcast-index`, `parse-podcast-index`, `valid-podcast-index`, and their rejection vectors.
