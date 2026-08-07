# `temporalNature`

**Type:** `'permanent' | 'state' | 'event'`
**Confidence: 85 / 100 — Ship.**

> Verdict: the only field that tells the system which edges *rot*. Drives freshness UX today and data
> lifecycle long-term. Grounded in 50+ years of AI knowledge representation (fluents vs events) and in
> OntoClean's rigidity meta-property.

## The problem it solves

Edges age very differently, and nothing in the current schema captures it. `temporalNature` classifies
the relationship's relationship-to-time:

- `permanent` — true forever once true; never decays: `authoredBy`, `derivedFrom`, `founded`,
  `precededBy`, `forkedFrom`, `byArtist`.
- `state` — a condition that holds over an interval and can silently become false: `employedBy`,
  `memberOf`, `locatedIn`, `governedBy`, `availableOn`, `pinnedIn`.
- `event` — a point-in-time fact that stays true *as history*: `votedFor`, `reviewed`, `attestedBy`,
  `triggered`.

## Examples across the value axes

1. **[RENDER] Freshness badges, automatically.** A `state` edge like `employedBy` renders an "as of {date}"
   badge and a "still true?" affordance; a `permanent` edge like `authoredBy` renders neither. The UI
   derives this from `temporalNature` instead of a hardcoded list of "decayable" predicates.

2. **[DATA] Targeted re-attestation.** A data-quality job re-checks only `state` edges (those are the ones
   that go stale) and never wastes work re-validating `permanent` ones. Without the field, you either
   re-validate everything or nothing.

3. **[QUERY] "Current" vs "historical" queries.** "Where does Alice work *now*?" must consider only the
   most recent live `state` edge; "every company Alice has worked at" wants the full `event`-like history.
   The query layer needs to know which model applies — `state` edges supersede, `event`/`permanent` edges
   accumulate.

4. **[ECON] Market resolution windows.** A market on a `state` claim (`Alice memberOf DAO`) is naturally
   time-bounded and may need re-opening when the state could have changed; a market on a `permanent`
   claim (`Alice founded DAO`) resolves once and stays resolved. Different economic lifecycles.

5. **[MACHINE] Maps to a deep, validated distinction.** Situation/event calculus (McCarthy & Hayes 1969;
   Kowalski & Sergot 1986) and OntoClean's rigidity (Guarino & Welty 2002) both encode exactly this
   fluent/event/essential split. We're not inventing a category; we're naming a well-studied one.

## What breaks without it

The graph has no model of freshness. Stale `state` edges (`employedBy` from three jobs ago) look as
authoritative as permanent facts, and the UI can't distinguish "fact" from "expired condition." For a
graph meant to represent reality over time, that's a structural blind spot.

## Cost / complexity

Low. The three-way classification is usually obvious from the predicate's meaning. No reasoning cost — it's
a hint consumed by UI and data jobs, not an inference rule.

## Pruning check

- *Derivable?* No.
- *Duplicated?* No — orthogonal to every other field. (A `permanent` predicate can be positive, factual,
  symmetric, etc.)
- *Mergeable?* No; the three values each drive distinct behavior.

## Confidence breakdown

Leverage 34/40 · Consumer readiness 21/25 · Simplicity 19/20 · Non-redundancy 11/15 → **85**.
(Deduction: full payoff for `state` edges depends on a validity-interval mechanism that doesn't exist yet;
the rendering/lifecycle value lands immediately regardless.)
