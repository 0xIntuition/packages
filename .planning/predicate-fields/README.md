# Predicate Field Justifications

One document per candidate field. Each makes the case for inclusion with multiple concrete
examples spanning the value axes, then assigns a **confidence score** under a fixed rubric. The
scoring is allowed to *overturn* earlier "ship" decisions — if a field can't clear the bar here, it
gets demoted. That's the point.

## Scoring rubric (0–100)

A field's score is a holistic judgment across four weighted dimensions:

| Dimension | Weight | Asks |
|---|---|---|
| **Leverage** | 40% | How much does it unlock — querying, machine interpretation, frontend auto-generation, economics? Does it enable something otherwise impossible or expensive? |
| **Consumer readiness** | 25% | Does a consumer read it *today* (frontend, indexer), or only a hypothetical future engine? |
| **Simplicity / cost** | 20% | Authoring burden across 133 specs, reasoning cost at graph scale, maintenance. Cheaper is better. |
| **Non-redundancy** | 15% | Is it derivable from other fields, duplicated elsewhere, or merge-able? |

### Bands

| Score | Band | Action |
|---|---|---|
| 90–100 | Core | Ship now, foundational |
| 75–89 | Ship | Ship now |
| 60–74 | Soft-ship | Define now, populate opportunistically; don't block on it |
| 40–59 | Defer | Keep documented; add when a consumer appears |
| <40 | Cut | Do not add |

## The value axes (what "leverage" is measured against)

Every example in these docs is tagged with which axis it serves:

- **[QUERY]** — better querying / indexer optimization / edge synthesis
- **[MACHINE]** — machine-readable interpretation, inference, consistency
- **[RENDER]** — frontend automatically generating components from the spec
- **[ECON]** — market design, reputation, staking semantics
- **[DATA]** — data quality, freshness, lifecycle

## Summary

| Field | Doc | Score | Band |
|---|---|---|---|
| `objectKind` | [object-kind.md](object-kind.md) | **92** | Core |
| `inverse` | [inverse.md](inverse.md) | **88** | Ship |
| `polarity` | [polarity.md](polarity.md) | **88** | Ship |
| `isSymmetric` | [is-symmetric.md](is-symmetric.md) | **85** | Ship |
| `temporalNature` | [temporal-nature.md](temporal-nature.md) | **85** | Ship |
| `marketPattern` | [market-pattern.md](market-pattern.md) | **84** | Ship (grandfathered) |
| `contradicts` | [contradicts.md](contradicts.md) | **82** | Ship |
| `isTransitive` | [is-transitive.md](is-transitive.md) | **80** | Ship |
| `specializes` | [specializes.md](specializes.md) | **80** | Ship |
| `claimType` | [claim-type.md](claim-type.md) | **64** | Soft-ship |
| `isAsymmetric` | [is-asymmetric.md](is-asymmetric.md) | **54** | **Defer** (demoted) |
| `isInverseFunctional` | [deferred-and-cut.md](deferred-and-cut.md) | 50 | Defer |
| `isFunctional` | [deferred-and-cut.md](deferred-and-cut.md) | 44 | Defer |
| `isReflexive`/`isIrreflexive` | [deferred-and-cut.md](deferred-and-cut.md) | 34 | Cut |
| `equivalentTo` | [deferred-and-cut.md](deferred-and-cut.md) | 32 | Cut |
| `verifiability` | [deferred-and-cut.md](deferred-and-cut.md) | 30 | Cut |
| property chains | [deferred-and-cut.md](deferred-and-cut.md) | 26 | Cut |
| `isHierarchical` | [deferred-and-cut.md](deferred-and-cut.md) | 18 | Cut (redundant) |

### What changed from the decision record

- **`isAsymmetric` demoted to Defer (54).** Under scrutiny its only consumer is a validation engine
  that doesn't exist; its "don't mirror" signal is already covered by the absence of `isSymmetric`.
  The shipped algebraic set tightens to **`isSymmetric` + `isTransitive`** — both with a consumer today.
- **`claimType` lands at Soft-ship (64),** not full ship — define it, populate where obvious, but no
  consumer branches on it yet.

**Final ship list (9 new/active semantic fields):** `objectKind`, `inverse`, `polarity`,
`isSymmetric`, `temporalNature`, `contradicts`, `isTransitive`, `specializes` + grandfathered
`marketPattern`; plus `claimType` as soft-ship.
