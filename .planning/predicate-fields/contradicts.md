# `contradicts`

**Type:** `readonly PredicateKey[]` (declared symmetrically on both predicates)
**Confidence: 82 / 100 — Ship.**

> Verdict: the most Intuition-*native* reasoning field. A belief/trust graph is valuable precisely because
> it can represent and price disagreement — and `contradicts` is the formal hook for it. Descends from
> OWL 2 `propertyDisjointWith` and WordNet antonymy.

## The problem it solves

Some predicates cannot both hold for the same subject/object pair without incoherence. `contradicts`
declares those disjoint pairs so the system can *detect* conflict instead of silently storing both:

- `trust` ⊥ `distrust`
- `bullishOn` ⊥ `bearishOn`
- `support` ⊥ `oppose`
- `agreeWith` ⊥ `disagreeWith`
- `endorse` ⊥ `reported` (softer; see "strength" below)

## Examples across the value axes

1. **[ECON] Disagreement markets — the differentiator.** The triples `⟨DAO-X, trust, Bob⟩` and
   `⟨DAO-X, distrust, Bob⟩` — **same subject, same object** — both accrue stake. Because the predicates
   are declared `contradicts`, the system recognizes a *priced contradiction* and routes both into a
   single conflict market rather than two unrelated claims. No classical fact-graph (DBpedia, Wikidata,
   Google KG) was built to model this; it is the cutting-edge capability the whole effort is aiming at.

   > **Precision (audit A2): pair-level only.** "Alice asserts trust Bob, Carol asserts distrust Bob"
   > is **not** a contradiction — the subjects differ; that's ordinary disagreement, and the aggregate
   > ("how contested is Bob?") is served by `polarity` (signed sum over edges into Bob) plus
   > counter-triples. `contradicts` fires only on the same ⟨subject, object⟩ pair with disjoint
   > predicates, exactly as OWL `propertyDisjointWith` defines it — and that's what the backend's
   > conflict-detection join keys on. Conflating the two layers produces a conflict query that matches
   > everything or nothing.

2. **[RENDER] Conflict surfacing in the UI.** An entity page can render a "Contested" badge and show the
   opposing camps side by side when contradictory predicates both have stake. The frontend finds the
   conflict by reading `contradicts`, not by hardcoding which predicate pairs oppose.

3. **[MACHINE] Consistency checking.** Under the Open World Assumption you can *never* infer `¬trust` from
   the absence of a trust edge (foundations doc, Part IV) — so contradiction must come from an explicit
   disjointness axiom. `contradicts` *is* that axiom. It's the only correct way to detect conflict in an
   open-world graph.

4. **[QUERY] Find the controversies.** "Show the most contested entities this week" = rank entities by
   stake-weighted presence of `contradicts` pairs. A first-class signal for discovery/feeds.

## Hard vs soft contradiction (a real design nuance)

`trust`/`distrust` is a *hard* logical contradiction. `skepticalOf`/`trust` is *tension*, not strict
contradiction — one can be skeptical yet still net-trusting. The decision record flags whether we need a
separate `tension` relation. Current lean: ship `contradicts` for hard pairs now; model soft tension later
if a consumer needs it. Don't overload one field with two strengths.

## What breaks without it

The graph can hold `trust Bob` and `distrust Bob` with no idea they conflict. The disagreement-market
thesis — arguably Intuition's core value proposition — has no data substrate. Conflict detection devolves
to per-pair hardcoding in each consumer.

## Cost / complexity

Moderate — it needs **human curation** (which pairs truly oppose) and must be declared symmetrically, which
the derivation layer enforces (`A.contradicts ∋ B ⟺ B.contradicts ∋ A`). Forward-chainable / cheap to
check. The curation set is small (sentiment pairs).

Two additional gate rules from the audit (decision record §5.1): a predicate may not contradict its own
`specializes` ancestor/descendant (`P ⊑ Q` ∧ `P ⊥ Q` makes P unsatisfiable), and the contradiction set is
**closed down the hierarchy at build time** (`vouchFor ⊑ trust` ∧ `trust ⊥ distrust` ⟹ `vouchFor ⊥
distrust`) — otherwise conflict detection silently misses every sub-predicate pair.

**What it cannot express (audit D3):** converse-pair incoherence — `⟨A, betterThan, B⟩` alongside
`⟨B, betterThan, A⟩` is a *reversed pair with the same predicate*, i.e. asymmetry violation, not
disjointness. That has no shipped mechanism while `isAsymmetric` is deferred; we accept the gap knowingly.

## Pruning check

- *Derivable?* Partially correlated with `polarity` (opposite polarity is a *hint*) but not derivable —
  `blocked` (negative) doesn't contradict `manufacturer` (absent); only specific semantic pairs oppose.
- *Duplicated?* No.
- *Mergeable?* No.

## Confidence breakdown

Leverage 36/40 · Consumer readiness 18/25 · Simplicity 15/20 · Non-redundancy 13/15 → **82**.
(Deductions: curation cost, and the consuming market layer is emerging rather than shipped. The
strategic upside keeps it firmly in "ship.")
