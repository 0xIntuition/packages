# `geo` — Geohash Cell

| | |
| :-- | :-- |
| Identity class | B — intrinsic natural key |
| Openness tier | — (Class B) |
| Scheme typing | polymorphic (a cell may be a location or a business premises) |
| Natural key | A geohash cell of the Earth's surface |
| Canonical form | 1–12 lowercase geohash base-32 characters |

## What it identifies

A `geo` value names one cell of the geohash grid — a fixed, globally agreed subdivision of the Earth's surface. The cell is the entity: it exists independent of any observer, any registry, and any measurement, which is what qualifies the scheme as Class B. Anyone, anywhere, computing the geohash of the same coordinates at the same precision gets the same cell, character for character.

This is deliberately **not** an identifier for raw coordinates. Raw latitude/longitude was proposed and rejected ([§9.5](../spec/09-registry-governance.md)): a coordinate pair is *measured*, not assigned, so two observations of one place differ in their trailing decimals and the value is observer-dependent. `geo` replaces the measurement with a quantization — the cell containing it — which is deterministic where the measurement is not.

The scheme is **polymorphic**: a cell may anchor a location or a local business's premises, so a bare `int:geo:…` does not imply the entity's classification and geo-anchored atoms floor at profile P1 ([§7.2](../spec/07-representation-profiles.md)).

## Value grammar

```regex
^[0123456789bcdefghjkmnpqrstuvwxyz]{1,12}$
```

The alphabet is geohash base-32: the digits `0-9` and the lowercase letters `b-z` **excluding `a`, `i`, `l`, `o`** (dropped by the geohash design to avoid visual confusion with `1` and `0`). Each character adds 5 bits of precision; 12 characters is sub-centimeter, which is finer than any plausible entity requires and is the grammar's ceiling.

## Canonicalization

1. Trim leading and trailing whitespace.
2. Lowercase the entire string.
3. Match against the grammar above. On no match, **reject** (return undefined).

There is no separator stripping and no prefix handling — a geohash has neither. Any character outside the alphabet (including `a`, `i`, `l`, `o`) rejects the whole value rather than being repaired, because a "corrected" character would silently name a different cell.

## Validation

A conforming validator accepts a value iff it is 1–12 characters drawn entirely from the geohash base-32 alphabet, all lowercase. Validation is fully offline; no dataset is consulted because none exists to consult — the grid is mathematics, not a registry.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `9q8yyk8y` | `9q8yyk8y` | canonical geohash is idempotent |
| `9Q8YYK8Y` | `9q8yyk8y` | uppercase geohash lowercases |
| `9q8yyk8a` | ✗ reject | a is not in the geohash alphabet |

## Notes and limitations

- **Precision is a derivation-time decision.** The canonicalizer accepts any length from 1 to 12; it does not choose one. A deriver picks the precision appropriate to the entity — 8 characters (a cell roughly 40 m across) suits a business premises — and the choice is part of the entity type's ladder configuration, not of this scheme. The same physical spot at 7 and at 8 characters yields two *different, both valid* IIDs naming nested cells; if both are minted, they are joined by the equivalence layer ([§8](../spec/08-equivalence.md)), never by truncation at the identifier layer.
- **Boundary effects are inherent.** A place near a cell edge may be quantized into adjacent cells by two observers whose measurements differ by meters. Quantization makes the value deterministic *given the input coordinates*; it does not make the input coordinates agree. Resolving near-boundary duplicates is an equivalence-layer concern, exactly like any other near-duplicate.
- **A cell is a place, not a claim about what occupies it.** Businesses move; the cell does not. "This restaurant is at this cell" is a relationship that travels as a claim, which is why the polymorphic typing is correct rather than an inconvenience: the cell itself never tells you what, if anything, sits on it today.
