# Predicate Semantics — Start Here

**What this is:** a proposal to add a small set of machine-readable fields to our predicate specs
(`packages/predicates`) so the Intuition knowledge graph can render itself, query across relationship
hierarchies, synthesize reverse edges, and price disagreement. Grounded in 30 years of knowledge-graph
research, pruned hard to stay simple.

**Status:** Draft for team review · **Date:** 2026-06-30 · **Owner:** Architecture

---

## TL;DR — what we're proposing

Add **8 new fields** to `PredicateSpec` (flat, all optional, additive/non-breaking), plus one soft-ship
(`claimType`), plus the existing `marketPattern`:

| Field | Type | What it unlocks |
|---|---|---|
| `objectKind` | `entity \| claim \| literal` | frontend renders any edge with no per-predicate code; makes reification visible |
| `polarity` | `positive \| negative \| neutral` | one signed reputation score across all predicates; sentiment-colored UI |
| `inverse` | `PredicateKey` | store one edge, serve both directions (different reverse predicate) |
| `isSymmetric` | `boolean` | store one edge, serve both directions (same predicate) |
| `temporalNature` | `permanent \| state \| event` | freshness model — which edges rot, which are forever |
| `contradicts` | `PredicateKey[]` | detect & price disagreement (trust ⊥ distrust) — the differentiator |
| `isTransitive` | `boolean` | closure/reachability queries (containment trees, org charts) |
| `specializes` | `PredicateKey` | roll-up queries & reputation (employedBy ⊑ affiliatedWith) |
| `claimType` *(soft-ship)* | `factual \| evaluative` | fact-vs-opinion market & UI semantics |
| `marketPattern` *(exists)* | `depositional \| attributive \| comparative` | per-predicate market mechanics |

**Deliberately deferred or cut** (no consumer yet / redundant): `isAsymmetric`, `isFunctional`,
`isInverseFunctional`, `isReflexive`/`isIrreflexive`, `equivalentTo`, `verifiability`, property chains,
`isHierarchical`. See `predicate-fields/deferred-and-cut.md`.

**Guiding rule:** a field ships only if it names a *consumer that exists today* (frontend, indexer) or an
*emerging* one (reputation/markets). We deliberately stay inside the cheap, forward-chainable **OWL 2 RL**
reasoning profile and don't encode inference we can't compute at scale.

---

## Reading order

1. **`00-START-HERE.md`** (this file) — the summary and reading order.
2. **`predicate-spec-decisions.md`** — ⭐ *canonical.* The pruned field set, flat-vs-nested decision, the
   final `PredicateSpec`, pros/cons, and what we're explicitly not doing.
3. **`predicate-fields/`** — one document per field with multiple use cases and a confidence score
   (see `predicate-fields/README.md` for the rubric and the score table). This is where each field earns
   its place; the scoring overturned one earlier decision (`isAsymmetric`).
4. **`predicate-semantics.md`** — the original full brainstorm / map of everything possible. Background;
   its §5 schema sketch is superseded by #2.
5. **`predicate-semantics-foundations.md`** — the research grounding: OWL/RDF property characteristics in
   depth and 30 years of KG lineage. Read for the "why these and not others."
6. **`predicate-backend-integration.md`** — how the backend (`alpha/backend`) consumes these fields:
   schema, indexing, query optimization, performance. **Headline:** `kg.predicates` already has dormant
   slots for `is_symmetric`/`is_transitive`/`inverse_predicate_id`/`metadata`, and `kg.triples` already
   has `inferred`/`confidence` for synthesized edges — so this is mostly *activation*, not construction.
   Three gaps: seed real metadata, add the missing columns, build the consumers.
7. **`predicate-backend-implementation-plan.md`** — the ticket-ready build plan: 7 workstreams
   (package → schema → seed → query features → API → consumers → tests), phased P0–P5 with dependencies,
   acceptance criteria, and rough sizing. Start here when we're ready to execute.
8. **`predicate-query-optimization-spec.md`** — deep dive on the hardest read path: gathering metadata &
   resolving identity by traversing connected triples from a root item (the Spotify→Apple Music case).
   Predicate registry/parsing, the exact `kg.triples` indexes, the equivalence-class engine (query-time
   vs materialized union-find), and the batched gather algorithm. **Headline:** identity/metadata is
   moving from embedded JSON-LD (`data_resolved.sameAs`) to triple-native edges; this makes that fast.

If you read only one: **`predicate-spec-decisions.md`**.

---

## Open questions for the team

1. **`claimType`** — soft-ship now (define + populate where obvious), or hold entirely until a market
   branches on it?
2. **`polarity`** — keep an explicit `neutral` value (for `neutralOn`) distinct from "absent," or collapse?
3. **`isInverseFunctional`** — pull forward to *start collecting* dedup/identity data before the resolution
   engine exists (data only, no auto-merge)?
4. **`marketPattern`** — its three values lack an external anchor and overlap conceptually with `claimType`;
   does it need its own semantics-clarification doc before we lean on it for market mechanics?
5. **`contradicts`** — hard contradiction only (trust/distrust), or do we also model soft *tension*
   (skepticalOf/trust) as a separate relation?

---

## The one-sentence pitch

*Every predicate carries just enough machine-readable structure that the graph can render itself, query
across relationship hierarchies, synthesize reverse edges, and price disagreement — using the proven flat
vocabulary of 30 years of knowledge-graph research, and nothing more than that.*
