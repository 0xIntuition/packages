# Decisions: Pruning & Structuring the Predicate Spec

**Status:** Decision record — supersedes the schema shape in `predicate-semantics.md` §5
**Companion to:** `predicate-semantics.md` (the map), `predicate-semantics-foundations.md` (the research)
**Date:** 2026-06-30

The previous two docs asked *what could we add?* This one asks the harder question: *what should we
add, and what should we cut?* The rule is strict — **a field must name a consumer and a scenario, or it
does not ship.** "A future reasoner might want it" is not a scenario.

---

## 1. The pruning principle: prefer fields with a consumer that exists today

We have four consumers, in descending order of how real they are right now:

| Consumer | Exists today? | Reads predicate fields to… |
|---|---|---|
| **Frontend** (pickers, edge cards, profiles) | ✅ yes | decide how to render an edge and its object |
| **Indexer / graph layer** | ✅ yes | synthesize reciprocal edges, close transitive queries |
| **Reputation / scoring** | 🟡 emerging | aggregate signed signal, roll up sub-relations |
| **General reasoning engine** | ❌ not built | entailment, consistency checking |

A field justified by the **frontend or indexer** is load-bearing now. A field justified *only* by the
not-yet-built reasoning engine is speculative and should be **deferred until that engine is real** —
this is the "don't out-reason your compute" lesson from the OWL species history, applied to our own roadmap.
Deferring costs nothing: every field is optional and additive, so we can add it the day a consumer appears.

---

## 2. The exact problems we are solving

Six concrete problems, each with a user story and the fields it needs. If a field doesn't serve one of
these, it's cut.

### P1 — Bidirectional relationships without double-writing
> *Kames asserts "Alice **affiliated with** Acme." On Acme's page, Alice appears under affiliations
> automatically. Kames asserts "BigCo **parent organization** Acme"; Acme's page shows BigCo as parent
> and BigCo's page lists Acme as a subsidiary — from one edge.*

The indexer synthesizes the reverse direction instead of forcing users to mint two atoms.
**Needs:** `isSymmetric` (reverse = same predicate), `inverse` (reverse = a different predicate).
**Consumer:** indexer + frontend. **Verdict: ship.**

### P2 — Roll-up queries and signed reputation
> *"Show everyone affiliated with Acme" returns employees, alumni, and members — without the query
> enumerating every sub-relation. Bob's trust score sums endorsements and vouches as positive signal,
> distrust and opposition as negative.*

**Needs:** `specializes` (employedBy/alumniOf/memberOf ⊑ affiliatedWith), `polarity` (signed aggregation).
**Consumer:** indexer (query expansion) + reputation. **Verdict: ship.**

### P3 — Surfacing contradiction (the Intuition-native problem)
> *Alice asserts "trust Bob." Carol asserts "distrust Bob." The app surfaces the tension and opens a
> market on it. The system rejects "A better than B" alongside "B better than A" as incoherent.*

This is the problem classical fact-graphs never had and the one most worth being cutting-edge on. A
belief/trust graph is *valuable precisely because it can represent and price disagreement.*
**Needs:** `contradicts` (trust ⊥ distrust). (`isAsymmetric` would also serve here but was deferred —
its unique value is write-time validation, which has no consumer yet.)
**Consumer:** reputation/markets (emerging) + frontend (conflict badges). **Verdict: ship `contradicts`.**

### P4 — Automatic frontend rendering from the predicate alone (the biggest near-term win)
> *The UI receives an edge and, without any per-predicate hardcoding, knows: the object of `imgUrl` is an
> image (render inline), the object of `url` is a link, the object of `attestedBy` is **another claim**
> (render a nested claim card), the object of `memberOf` is an **entity** (render a clickable node).
> Positive predicates render green, negative red. A `state` edge like `employedBy` shows an "as of" badge;
> a `permanent` edge like `authoredBy` does not.*

This is the field set with the most immediate, concrete payoff, and it's the one the user explicitly
called out. The predicate spec becomes a **rendering contract**, eliminating a giant `switch` in the app.
**Needs:** `objectKind` (entity | claim | literal), `polarity` (color/sentiment), `temporalNature` (freshness badge), plus existing display fields.
**Consumer:** frontend, today. **Verdict: ship — highest confidence in the whole set.**

### P5 — Data freshness and lifecycle
> *The graph knows `employedBy` can silently become false and flags it for re-attestation or display as
> historical, while `authoredBy` is write-once and never decays.*

**Needs:** `temporalNature`. **Consumer:** frontend + data-quality tooling. **Verdict: ship.**

### P6 — Machine-readability / interoperability
> *A third party (or a future reasoner) pulls our predicate's IPFS document and reads standard
> schema.org/OWL-shaped property characteristics without bespoke parsing.*

This is served *for free* by the fields above as long as we serialize them in the existing
`additionalProperty` array using OWL-aligned names. **Verdict: no new fields; constrains naming/structure (see §4).**

---

## 3. Field-by-field verdicts (the cuts are the point)

| Field | Scenario it serves | Verdict |
|---|---|---|
| `isSymmetric` | P1 reciprocal edges | **Ship** |
| `inverse` (typed key) | P1 reverse-as-different-predicate | **Ship** |
| `isTransitive` | P2 closure ("places within California", org trees) | **Ship** |
| `specializes` | P2 roll-up query + reputation | **Ship** (needs curation) |
| `polarity` | P2 reputation, P4 color | **Ship** |
| `contradicts` | P3 belief markets | **Ship** (needs curation) |
| `isAsymmetric` | P3 validation; tells indexer "don't mirror" | **Defer** — see note below; demoted in per-field review |
| `objectKind` | P4 render literal/claim/entity differently | **Ship** (highest-value) |
| `temporalNature` | P4 freshness badge, P5 lifecycle | **Ship** |
| `marketPattern` | existing economic layer | **Keep** |
| `claimType` (factual/evaluative) | market-design + "opinion vs fact" badge | **Ship, simplified** — drop the `normative` value until a consumer needs it |
| `isHierarchical` | — derivable from `transitive + asymmetric + inverse` | **Cut** (redundant) |
| `isReflexive`/`isIrreflexive` | self-loop validation; rare, derivable (`asymmetric ⟹ irreflexive`) | **Defer** — no consumer creates self-loops today |
| `isFunctional` | "one manufacturer" conflict check | **Defer** — no validation engine consuming it yet |
| `isInverseFunctional` | identity resolution / dedup of minted entities | **Defer, but flagged strategic** — revisit when a dedup engine exists; powerful for permissionless minting |
| `equivalentTo` | predicate aliasing | **Cut** — we deliberately keep near-synonyms distinct; "smushing" risk (no-UNA) outweighs benefit |
| `verifiability` | onChain/offChain | **Cut** — ~correlated with `claimType`; a redundant second axis |
| property chains | grandparentOf from parentOf∘parentOf | **Cut for now** — most expensive axiom, no consumer |

**Net change vs the original proposal:** we drop from ~7 logic booleans to **2** (`isSymmetric`,
`isTransitive`), cut `equivalentTo`/`verifiability`/`isHierarchical`, defer the functional family,
reflexivity, **and `isAsymmetric`**, and simplify `claimType`. That is roughly a 45% reduction in surface
area — and every survivor names a consumer that exists or is emerging.

> **`isAsymmetric` was demoted to Defer** during the per-field review (`predicate-fields/is-asymmetric.md`,
> score 54). Its only unique value is write-time validation, which has no consumer yet; its "don't mirror
> the edge" signal is already implied by the *absence* of `isSymmetric` plus the presence of `inverse`. It
> graduates alongside `isFunctional` when a validation engine ships. The active algebraic set is therefore
> just `isSymmetric` + `isTransitive`, both with an indexer consumer today.

---

## 4. Flat vs nested — decision: **flat**

I previously recommended nesting (`logic{}`, `ontology{}`). **The research reverses that.** Three reasons:

1. **The serialization target is flat.** Our IPFS document emits `additionalProperty: PropertyValue[]` —
   a flat list of `{name, value}`. Nesting in TS just means flattening again at serialization. The data's
   destination is flat; the source should match it.
2. **The entire tradition is flat.** OWL doesn't nest — it asserts `P rdf:type owl:SymmetricProperty`,
   `P owl:inverseOf Q`. schema.org is flat key/value. RDF is flat triples. We get interoperability by
   *looking like* the standards, and the standards are flat.
3. **After pruning, there's nothing to nest.** ~10 semantic fields, most absent on any given spec. Wrapping
   3 booleans in a `logic:{}` object is ceremony that adds a layer of access (`spec.logic?.symmetric`) and
   complicates `as const satisfies`, grep-ability, and diffs for zero benefit.

Nesting earns its keep when a group is large, frequently co-populated, and namespaced against collisions.
None of those hold here. **Go flat.** Use the OWL-aligned `is*` convention for the algebraic booleans so
the names self-document and map 1:1 to the serialized property names.

(Corollary: don't rename `conjugates`. We dropped "conjugative" as a *relational* term entirely, so the
collision is gone — `conjugates` can keep meaning grammatical inflection. One less migration.)

---

## 5. The resulting spec

```ts
export interface PredicateSpec {
  // identity & lifecycle
  key: string;
  name: string;
  description: string;
  category: PredicateCategory;
  status: PredicateStatus;

  // economic (Intuition-native)
  marketPattern: MarketPattern;

  // rendering contract (frontend reads these directly)
  objectKind?: 'entity' | 'claim' | 'literal';
  polarity?: 'positive' | 'negative' | 'neutral';
  temporalNature?: 'permanent' | 'state' | 'event';
  claimType?: 'factual' | 'evaluative';

  // algebraic (OWL-aligned, flat, is* convention)
  isSymmetric?: boolean;
  isTransitive?: boolean;
  // isAsymmetric?: boolean;  // deferred — add with the validation engine (see predicate-fields/is-asymmetric.md)

  // inter-predicate (typed key references — validated in definePredicateRecord)
  inverse?: PredicateKey;
  specializes?: PredicateKey;
  contradicts?: readonly PredicateKey[];

  // display
  conjugates: boolean;          // grammatical inflection (unchanged)
  thirdPerson?: string;
  examples?: readonly string[];
}
```

`definePredicateRecord` stays the consistency gate: derive implications (`isSymmetric ⟹ inverse = self`;
a symmetric predicate cannot also declare a different `inverse`), verify inverse pairs mirror each other's
algebraic properties, and verify `contradicts` is declared symmetrically on both sides.

---

## 6. Pros, cons, and the value proposition

**Pros**
- **Self-describing graph → automatic rendering.** The frontend stops hardcoding per-predicate behavior;
  the spec *is* the rendering contract (P4). This is the clearest, nearest win.
- **Cheap, scalable inference.** The shipped set is exactly the forward-chainable OWL 2 RL core — symmetry,
  transitivity, inverse, sub-property, disjointness. Computable at graph scale; no decidability cliffs.
- **Fewer stored edges.** Symmetric/inverse synthesis means we store one direction and serve both.
- **A differentiator, not a clone.** `contradicts` + `polarity` + `marketPattern` make this a *belief and
  trust* graph that prices disagreement — something no classical fact-graph (DBpedia, Wikidata, Google KG)
  was built to do. That is the cutting-edge claim, and it's grounded in signed-network theory, not vibes.
- **Interoperability for free** via OWL/schema.org-aligned flat naming.

**Cons / risks (and mitigations)**
- *Authoring burden across 133 specs.* → Most fields are optional; `objectKind`/`polarity`/`temporalNature`/
  the booleans are mechanical and scriptable; only `specializes`/`contradicts`/`inverse` need human curation.
- *Cross-referential consistency* (inverse/specializes/contradicts form a predicate graph that can drift).
  → `definePredicateRecord` validates it at build time; an inconsistent set fails the build.
- *Encoding reasoning we can't run.* → Explicitly mitigated by the cuts in §3: we ship the RL core and defer
  chains, equality, and the functional family until a consumer exists.
- *Modeling opinion as fact.* → `claimType` keeps the distinction explicit so markets/UI treat them differently.

**The one-sentence value proposition:** *Every predicate carries just enough machine-readable structure
that the graph can render itself, query across relationship hierarchies, synthesize reverse edges, and
price disagreement — using the proven flat vocabulary of 30 years of knowledge-graph research, and nothing
more than that.*

---

## 7. What we are explicitly NOT doing (and why that's a feature)

- **Not** building domain/range typing into specs — it lives in `@0xintuition/classifications` (validation,
  not OWL inference). One source of truth.
- **Not** shipping property chains, equality reasoning, or the functional family — no consumer yet; they're
  the expensive end of the frontier and we can add them the day a reasoner exists.
- **Not** nesting — the data's destination and the entire standards tradition are flat.
- **Not** asserting global, timeless truth so hard we can't add Cyc-style context-scoping later.

Restraint here is the design. The graph that ships the *minimal sufficient* property set — and computes all
of it — beats the graph that declares axioms it can never run.

---

## 8. Open questions for sign-off

1. `claimType` — ship 2-value (`factual`/`evaluative`) now, or hold it entirely until a market actually
   branches on it? (Leaning: ship; it's cheap and drives a frontend badge today.)
2. `polarity` — do we need `neutral` as a value, or is "absent = no sentiment" enough? (Leaning: keep
   `neutral` only for predicates like `neutralOn` whose sentiment is *explicitly* zero, distinct from absent.)
3. `inverseFunctional` for identity resolution — strategically important for permissionless dedup. Do we
   want to pull it forward into P1 to start collecting the data before the dedup engine exists?
