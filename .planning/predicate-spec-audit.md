# Audit: Predicate Spec Review Against 30 Years of KG Research

**Status:** ✅ Applied — all findings (A1–D5) folded into the planning docs on 2026-07-01; this file
remains as the record of *why* each change was made
**Audits:** `predicate-spec-decisions.md` (canonical), `predicate-fields/*` (scores), backend docs
**Date:** 2026-07-01

This is the adversarial pass: take the proposed field set and structure, and stress-test it against the
research record (OWL 2 semantics, RDFS entailment rules, Wikidata's operational lessons, signed-network
theory, the identity/smushing literature) *and* against Intuition's own mechanics (content-addressed IDs,
staking, counter-triples). Findings are ordered by severity. §E lists what survives unchanged — which is
most of it.

---

## A. Must resolve before shipping (semantic or economic correctness)

### A1 — Symmetric/inverse predicates + content-addressed IDs = duplicate facts with split stake

**The finding.** The entire OWL tradition assumes a triple store where synthesizing a reverse edge is a
pure inference: cheap, idempotent, no side effects. Intuition triples are different — each triple has a
**deterministic ID and its own vault/market**. That creates a failure mode OWL never had:

- `⟨Acme, partnerOf, BigCo⟩` and `⟨BigCo, partnerOf, Acme⟩` are the *same fact* but hash to **two
  different triple IDs → two different markets**. Stake splits across them; neither reflects true conviction.
- Same for inverse pairs: `⟨Alice, employedBy, Acme⟩` vs `⟨Acme, employs, Alice⟩` — one fact, two
  mintable triples, two vaults.

The current docs handle the *read* side (indexer synthesizes reverse edges, marks them `inferred`) but
not the *write/mint* side. Nothing stops two users from independently minting both directions.

**The research precedent.** Wikidata hit exactly this operationally: inverse property pairs (e.g.
child/parent-style pairs) required permanent bot armies to keep both directions in sync, and the community's
considered response was to **avoid inverse properties and designate one canonical direction** wherever
possible. We should learn this before we ship, not after.

**Recommendation (two layers):**
1. **Mint-time canonicalization in `primitives`.** For `isSymmetric` predicates, canonically order
   subject/object (e.g., by atom ID) before computing the triple ID — both user intents resolve to one
   triple, one market. For `inverse` pairs, designate a **canonical direction** per pair (a derived flag in
   `definePredicateRecord`, e.g., the non-inverse member or lexicographically smaller key) and have
   builders normalize to it: a user asserting the non-canonical direction gets the canonical triple.
2. **Indexer-side merge as backstop** for triples minted before the rule (or via raw protocol calls):
   detect symmetric/inverse duplicates and link them (the `sibling_triple_id` pattern already exists for
   counter-triples; this is a second, analogous linkage), with an explicit policy for how their stake is
   presented in aggregate.

This is the one place the proposal is not just incomplete but **economically unsound** if skipped: edge
synthesis without mint canonicalization actively encourages liquidity fragmentation.
**Owner surface:** `primitives` + `ids` (canonicalization), backend (merge backstop), decision record §5.

### A2 — `contradicts` conflates two different kinds of conflict

**The finding.** The docs use two incompatible notions of contradiction interchangeably:

1. **Pair-level logical disjointness** (OWL `propertyDisjointWith`): `⟨s, trust, o⟩` and `⟨s, distrust, o⟩`
   with the **same subject and object** cannot both hold. This is what `contradicts` formally is, and what
   `contradicts.md` defines ("cannot both hold for the same subject/object pair").
2. **Attester-level disagreement**: *"Alice asserts trust Bob; Carol asserts distrust Bob"* (decision
   record P3, `contradicts.md` example 1). If the triples are `⟨Alice, trust, Bob⟩` and
   `⟨Carol, distrust, Bob⟩`, the **subjects differ** — there is no logical contradiction at all. Two people
   disagreeing about Bob is not incoherence; it's the graph working as intended.

These need different machinery. Pair-level disjointness is a consistency/validation signal (and the correct
trigger for a *single* conflict market: same s/o pair, disjoint predicates). Attester-level disagreement
about an object is a **sentiment-aggregation** question already served by `polarity` (signed sum over
edges into Bob) plus the existing counter-triple mechanism.

**Recommendation:** Define `contradicts` strictly as pair-level disjointness (matching OWL and
`contradicts.md`'s own formal definition). Rewrite the P3 user story so the example shares a subject —
or explicitly shows both layers: pair-level conflict routes to one market; object-level disagreement is a
polarity aggregate. This is a documentation fix, but it determines what the indexer's conflict-detection
query actually joins on, so it must be settled before WS-D. **Owner surface:** decision record P3,
`contradicts.md`, backend conflict-detection spec.

### A3 — `objectKind: 'literal'` can't fulfill the rendering contract without a datatype

**The finding.** `objectKind` is our highest-scored field (92) on the promise that the frontend renders any
edge with zero per-predicate code. But its own flagship example betrays a gap: *"`literal` → render
`imgUrl` as an `<img>`, `url` as an `<a>`"* — that switch is back on the **predicate key**, not on
`objectKind`. Knowing "it's a literal" doesn't tell you image vs link vs date vs number vs prose. RDF
solved exactly this with **typed literals** (`xsd:anyURI`, `xsd:date`, …); schema.org with `rangeIncludes`
datatypes. Without a datatype, the "giant switch" the field promises to delete survives for the literal
subset — which is precisely the subset with the most rendering variance.

**Recommendation:** Add a companion field, only meaningful when `objectKind === 'literal'`:

```ts
literalType?: 'url' | 'image' | 'date' | 'number' | 'text';
```

Validated in `definePredicateRecord` (`literalType` present ⟹ `objectKind === 'literal'`). It scores like
`objectKind` itself: frontend consumer today, mechanical to author (the literal predicate set is small),
non-redundant, serializes cleanly to XSD datatypes. Estimated score under the rubric: **~85 (Ship)**.
Alternative if we want to stay minimal: document that literal rendering falls back to schema.org property
types via `classifications` — but that re-introduces a cross-package lookup in the hot rendering path,
which the rendering-contract argument was built to avoid. **Owner surface:** types, decision record §5,
new `predicate-fields/literal-type.md`.

---

## B. Structural decisions — cheap now, painful later

### B1 — `specializes` should be an array (DAG), not a single key (tree)

RDFS `subPropertyOf`, WordNet hypernymy, and schema.org all permit **multiple broader terms** — property
hierarchies are DAGs, not trees. Real cases hit this immediately: `founder` specializes `affiliatedWith`
*and* plausibly a creation/contribution relation; `authoredBy` sits under both `contributedTo` and a
provenance relation. A single `PredicateKey` forces false choices, and widening the type later is a
migration; widening it now is free. It also makes the shape consistent with `contradicts`
(`readonly PredicateKey[]`).

**Recommendation:** `specializes?: readonly PredicateKey[]`. Keep the curation guidance "usually one
parent, never more than two" as a lint warning, not a type constraint.

### B2 — Enumerate the full validation/derivation rule set for `definePredicateRecord`

The decision record names three rules (symmetric ⟹ self-inverse; inverse mirroring; contradicts declared
symmetrically). The DL literature gives us the **complete** list for our field set — and half of it is
missing. The gate should enforce:

| # | Rule | Kind | Source |
|---|---|---|---|
| 1 | `isSymmetric` ⟹ no distinct `inverse` (inverse = self) | error | OWL (already specified) |
| 2 | `P.inverse = Q ⟺ Q.inverse = P` | error | OWL (already specified) |
| 3 | `contradicts` symmetric: `B ∈ A.contradicts ⟺ A ∈ B.contradicts` | error | OWL (already specified) |
| 4 | `contradicts` irreflexive: `P ∉ P.contradicts` | error | coherence |
| 5 | `specializes` acyclic (no `P ⊑ … ⊑ P`) | error | RDFS coherence |
| 6 | P may not contradict its own `specializes` ancestor/descendant (asserting P entails the ancestor — contradiction with it is incoherent) | error | DL: `P ⊑ Q` ∧ `P ⊥ Q` ⟹ P unsatisfiable |
| 7 | **Derive** contradiction closure down the hierarchy: `P ⊑ Q` ∧ `Q ⊥ R` ⟹ `P ⊥ R` — expand at build time so consumers get the full disjointness set without walking `specializes` at query time | derivation | OWL 2 RL |
| 8 | Inverse pairs mirror algebra: `P.isTransitive ⟺ inverse(P).isTransitive` (theorem: the inverse of a transitive relation is transitive); same `temporalNature`; same `claimType`; polarity equal (lint, not error — near-universal but conceivable exceptions) | error/lint | DL theorems |
| 9 | `isSymmetric && isTransitive` together ⟹ the predicate behaves as an **equivalence relation** — allowed only for an explicit allow-list (`sameAs`); warn otherwise | lint | see C2 |
| 10 | `polarity` present (sentiment predicate) ∧ `isTransitive` ⟹ **error** | error | see C1 |
| 11 | `isTransitive` is **not** inherited via `specializes` (a sub-property of a transitive property is not transitive — RDFS/OWL) — document so the indexer never expands closure over sub-properties | doc/derivation guard | OWL semantics |
| 12 | `literalType` present ⟹ `objectKind === 'literal'` (if A3 accepted) | error | — |
| 13 | `objectKind === 'claim'` ∧ `inverse` present ⟹ warn (the inverse's *subject* would be a claim — expressible but almost always a modeling smell) | lint | — |

Rules 6, 7, and 11 are the ones most likely to cause silent bugs if unenforced: 6 and 7 because
`contradicts` × `specializes` interaction is invisible until a conflict query misses (`vouchFor ⊑ trust`,
`trust ⊥ distrust` — a `vouchFor`/`distrust` pair on the same s/o *is* a conflict and won't be detected
without closure); 11 because "transitive-ish inheritance" is an extremely natural indexer bug to write.

### B3 — Ship the explicit serialization mapping table (P6 is asserted, not specified)

The decision record claims interoperability "for free" via OWL-aligned flat naming, but no doc pins the
actual field↔IRI mapping. Make it normative:

| Spec field | Serialized as | Standard |
|---|---|---|
| `isSymmetric: true` | `rdf:type owl:SymmetricProperty` | OWL 2 |
| `isTransitive: true` | `rdf:type owl:TransitiveProperty` | OWL 2 |
| `inverse` | `owl:inverseOf` | OWL 2 |
| `specializes` | `rdfs:subPropertyOf` | RDFS |
| `contradicts` | `owl:propertyDisjointWith` | OWL 2 |
| `literalType` (if accepted) | XSD datatype on range (`xsd:anyURI`, `xsd:date`, …) | RDF/XSD |
| `objectKind` / `polarity` / `temporalNature` / `claimType` / `marketPattern` | Intuition-namespaced `PropertyValue` entries (no standard equivalent — that's fine; they're our pragmatic extensions, like Wikidata's own property metadata) | — |

Third parties get standards-compliant characteristics without bespoke parsing only if this table is
implemented exactly; otherwise P6 is aspiration.

---

## C. Guardrails the literature insists on (encode as lint rules + doc warnings)

### C1 — Sentiment is never transitive

Guha et al. (2004), *Propagation of Trust and Distrust* — the canonical result: trust propagation decays
sharply with path length, and **distrust does not propagate transitively at all** (one-step only; two
"distrust" hops do not imply distrust — arguably the opposite, per structural balance). Marking any
polarity-bearing predicate `isTransitive` would let the indexer synthesize edges the theory says are
false, and at graph scale, closure over a social predicate is also a combinatorial explosion.
`isTransitive` belongs to **structural containment** (`locatedIn`, `partOf`, `subOrganizationOf`) and
`sameAs` — nothing social. This is validation rule B2-#10, and it deserves a visible warning in
`is-transitive.md` because it's the single most tempting authoring mistake ("if Alice trusts Bob and Bob
trusts Carol…" is exactly the intuition the research debunks).

### C2 — The equivalence engine keys off an explicit `sameAs` allow-list, not inferred algebra

`isSymmetric + isTransitive` mathematically characterizes an equivalence-like relation, and it's tempting
to have the identity engine (query-optimization spec §5) treat *any* such predicate as identity-bearing.
Don't. The no-UNA "smushing" literature (foundations doc, Part IV) is unambiguous: **identity merge is the
highest-blast-radius inference in the system** — one bad `sameAs` edge already merges two entities'
metadata, stake context, and reputation; letting the behavior attach to an algebraic pattern rather than a
named predicate means a future author can create it *by accident* with two booleans. Equivalence-class
membership must be opt-in by predicate key (today: `sameAs` only), with the symmetric+transitive
combination elsewhere triggering lint (B2-#9).

### C3 — Inferred edges need a confidence-decay policy

`kg.triples.confidence` exists, and transitive closure will write inferred edges derived from chains. The
probabilistic-KG literature (PSL, Markov logic, Google Knowledge Vault) is consistent: chained inference
compounds uncertainty — an inferred edge's confidence must be a **non-increasing function of the chain**
(min or product of constituent confidences; min is the conservative standard choice), never a copy of one
constituent and never 1.0. Also: inferred edges must **not feed further rounds of inference across
different rules** without depth bounds (materialization loops). One paragraph in the backend
implementation plan (WS-D) settles this; its absence is how "everything is 100% confident" graphs happen.

---

## D. Worth considering (small, non-blocking)

### D1 — `supersededBy?: PredicateKey` on deprecated predicates

`status: 'deprecated'` is a dead end today — nothing tells a picker, a renderer of old triples, or a
migration script *what replaced it*. Wikidata's "replaced by" is the precedent, and with 133 community-
evolving specs, deprecation-with-forwarding will be routine. Cheap (one optional key, validated to point
at a non-deprecated spec), real consumer (pickers hide-and-redirect; old edges render with a "superseded"
affordance). Estimated score: **~70 (Soft-ship)**. Natural companion to the lifecycle fields we already have.

### D2 — Roadmap note: the predicate metadata should eventually live *in the graph*

Wikidata models property metadata as ordinary statements **on the property entities themselves** — which
is why its community can extend and contest property semantics without a software release. Our metadata
lives in a TS package + IPFS docs — right for now (deterministic, reviewable, ships with the code). But
the end-state for a permissionless knowledge graph is **self-description**: `⟨trust, contradicts, distrust⟩`
as an actual triple that can itself be staked on. The current design is compatible with that future
(predicates are atoms; the meta-relations are just more predicates) — state it explicitly in the decision
record §7 so nobody designs it out, and so "the community disagrees with our `contradicts` curation" has
an eventual on-protocol answer rather than a GitHub issue.

### D3 — Acknowledge the P3 asymmetry hole explicitly

With `isAsymmetric` deferred, the P3 story's second example — rejecting *"A better than B"* alongside
*"B better than A"* — has **no shipped mechanism**: that incoherence is converse-pair (`⟨s,P,o⟩` vs
`⟨o,P,s⟩`), which `contradicts` (same-pair, different-predicate) cannot express. The deferral is still
right (score 54 stands; no validation engine exists), but the decision record should stop implying P3
covers it. Amend the story, and note in `is-asymmetric.md` that comparative-predicate coherence is what
graduates it. (If A1's mint-time canonicalization lands, the machinery for direction-aware handling will
exist and make `isAsymmetric` cheaper to activate later — the two findings are related.)

### D4 — Define `polarity`'s direction of aggregation precisely

One sentence prevents a class of reputation bugs: **polarity is the sign of the edge from subject toward
object; signed aggregation accrues to the *object*.** (Heider/Leskovec signed-network convention.) So
`reported` is negative *about the thing reported*, not about the reporter. Without the sentence, someone
will eventually aggregate signal onto subjects, and the two implementations will disagree. Also specify
whether inverse pairs share polarity (per B2-#8: yes, lint-enforced) — for `trustedBy`, the aggregation
target flips to the *subject*, which the indexer must handle by normalizing through the canonical direction
(ties back to A1).

### D5 — Policy for mixed-kind objects on `objectKind`

schema.org's `rangeIncludes` is famously multi-valued, and a few of our predicates will have objects that
are legitimately entity-or-literal (`hasSource`: URL or an entity). Single-value enum is still right
(the rendering contract needs one answer), but state the tie-break policy: assign the **dominant** kind;
if genuinely mixed, leave the field absent (absent = "sniff the atom," today's behavior) rather than
guessing. One paragraph in `object-kind.md`.

---

## E. What survives the audit unchanged (confirmations)

- **Flat structure** — reconfirmed. Every argument in decisions §4 holds; nothing found favors nesting.
- **The pruning bar and all cuts/deferrals** — reconfirmed field by field. `isHierarchical` (redundant),
  `equivalentTo` (smushing — reinforced by C2), `verifiability`, property chains (still the most expensive
  axiom with no consumer), reflexivity, the functional family: all correct calls. `isAsymmetric` at Defer
  is consistent (with the D3 documentation caveat). No cut field needs resurrection.
- **OWL 2 RL scoping** — the shipped algebra (symmetric, transitive, inverse, subPropertyOf, disjointness)
  is exactly the forward-chainable core; still the right ceiling.
- **`claimType` soft-ship, `polarity` with explicit `neutral`, `temporalNature`'s 3 values** — all hold.
  (`temporalNature: 'state'` remains the correct future hook for since/until qualifiers via reification —
  no change needed now.)
- **The scoring rubric and bands** — no score changed by more than noise except where new fields are
  proposed (A3's `literalType` ~85, D1's `supersededBy` ~70).
- **`definePredicateRecord` as the single consistency gate** — right pattern; B2 just completes its rule set.
- **The differentiator thesis** — `contradicts` + `polarity` + `marketPattern` as a *priced-disagreement*
  graph survives scrutiny; A2 sharpens it rather than weakening it.

---

## Summary of proposed changes

| # | Change | Severity | Touches |
|---|---|---|---|
| A1 | Mint-time canonicalization for symmetric/inverse triples + merge backstop | **Blocking** (economic) | primitives, ids, backend, decisions §5 |
| A2 | Define `contradicts` as pair-level; fix P3 story; split attester-disagreement into polarity aggregation | **Blocking** (semantic) | decisions P3, contradicts.md, backend WS-D |
| A3 | Add `literalType` companion field (~85, Ship) | **High** | types, decisions §5, new field doc |
| B1 | `specializes` → `readonly PredicateKey[]` | High (cheap now) | types, decisions §5, specializes.md |
| B2 | Complete validation rule set (13 rules) in `definePredicateRecord` | High | record.ts spec, decisions §5 |
| B3 | Normative field↔IRI serialization table | Medium | decisions §2/P6 |
| C1–C3 | Lint rules + doc warnings (no transitive sentiment; sameAs allow-list; confidence decay) | Medium | field docs, backend plan |
| D1 | `supersededBy` (~70, Soft-ship) | Low | types, decisions |
| D2–D5 | Doc clarifications (self-description roadmap, P3 hole, polarity direction, mixed objectKind) | Low | various docs |

Net effect on the field set: **+1 ship** (`literalType`), **+1 soft-ship** (`supersededBy`), **1 type
widening** (`specializes` array), **0 removals**. The shape and philosophy hold; the fixes are about
Intuition-specific mechanics (A1, A2) and completing the consistency layer (B2) — exactly the places
where our design departs from the classical literature and therefore couldn't lean on it.
