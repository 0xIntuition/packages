# Deferred & Cut Fields

These candidates did not clear the bar. Documented here so the reasoning is preserved and so each can be
promoted later with a clear trigger. Each carries its confidence score and the specific reason it's held.

---

## `isInverseFunctional` — 50 / 100 — DEFER (strategically flagged)

**Asserts:** the object uniquely identifies the subject — `P(a,c) ∧ P(b,c) ⟹ a = b`. The object is a *key*.

**Best case:** `linkedAccount` — whoever links a given social account is the same person. This is the
Semantic Web's entity-resolution mechanism (an IFP is a database key without the join), and for a
*permissionless* graph where the same real entity gets minted many times, dedup is strategically large.

**Why deferred, not shipped:**
- **No consumer.** There is no dedup/identity-resolution engine reading it today. The value is entirely
  prospective.
- **Dangerous without UNA.** Under no-Unique-Name semantics, a mis-asserted IFP *infers identity* and can
  collapse distinct entities ("smushing"). Shipping it before there's a careful consumer is a footgun on a
  permissionless network.

**Promotion trigger:** when an identity-resolution / dedup feature is scoped. *Consider pulling it forward
to start collecting the data early* (decision-record open question #3) — but only the data, with no
auto-merge, until the consumer is built and safety-reviewed.

---

## `isFunctional` — 44 / 100 — DEFER

**Asserts:** each subject has at most one object — `P(a,b) ∧ P(a,c) ⟹ b = c`.

**Best case:** `manufacturer`, `primaryImageOfPage`, `parentOrganization` (arguably). Enables "you asserted
two manufacturers; one is wrong" conflict detection.

**Why deferred:** the conflict-detection consumer is the same nonexistent validation engine that demotes
`isAsymmetric`. Cardinality is also genuinely ambiguous for many predicates (does a product have exactly
one manufacturer? co-manufacturing exists), so the authoring burden comes with real edge-case debate for
limited present payoff.

**Promotion trigger:** write-time validation engine, shipped together with the rest of the validation
fields.

---

## `isReflexive` / `isIrreflexive` — 34 / 100 — CUT

**Asserts:** `P(a,a)` always / never.

**Why cut:** almost nothing creates self-loops, so the validation value is near-zero in practice;
`irreflexive` is largely *derivable* (`asymmetric ⟹ irreflexive`); and `reflexive` applies to a tiny set
(`sameAs`). High specification overhead for a corner case. If self-loop validation ever matters, it can be
a single special-cased rule rather than a field on all 133 specs.

---

## `equivalentTo` (predicate-level alias) — 32 / 100 — CUT

**Asserts:** two predicates are interchangeable (`createdBy ≡ authoredBy`).

**Why cut:** we *deliberately* keep near-synonyms distinct (they carry different connotation and different
markets), so there are few true equivalences to assert. And under no-UNA, predicate aliasing risks
collapsing distinct claims and destabilizing atom-ids. The cost/risk outweighs a benefit we mostly don't
want. If genuine duplicates emerge, handle them case-by-case via deprecation (`status: 'deprecated'` +
`replacedBy`), not a blanket equivalence axiom.

---

## `verifiability` (`onChain` / `offChainVerifiable` / `unverifiable`) — 30 / 100 — CUT

**Asserts:** how a claim could be checked.

**Why cut:** strongly correlated with `claimType` (factual things are the verifiable ones), so it's a
near-duplicate second axis. It adds three-way authoring overhead for information `claimType` already
approximates. Revisit only if an oracle/resolution system needs a *finer* verifiability signal than
factual-vs-evaluative — and even then, prefer extending `claimType` over a parallel field.

---

## property chains (`P ∘ Q ⊑ R`) — 26 / 100 — CUT (for now)

**Asserts:** composed paths imply a relation (`parentOf ∘ parentOf ⊑ grandparentOf`;
`locatedIn ∘ containedInPlace ⊑ locatedIn`).

**Why cut:** the most expressive *and* most expensive axiom in OWL 2 (SROIQ admits it only under an
acyclicity restriction to stay decidable). No consumer, and it sits at the costly end of the
expressivity/tractability frontier we explicitly chose to stay inside (OWL 2 RL). Pure future research.

**Promotion trigger:** a dedicated reasoning module (`@0xintuition/reasoning`) with a compute budget for
chain materialization.

---

## `isHierarchical` — 18 / 100 — CUT (redundant)

**Asserts (today):** the predicate forms a containment/subsumption tree.

**Why cut:** fully **derivable** from `isTransitive + (isAsymmetric or a defined `inverse`)`. It encodes no
information the other fields don't already carry; it's a convenience label that invites drift (a spec could
declare `isHierarchical: true` while *not* being transitive, producing an incoherent record). Replace any
current use with the derived combination. If a tree-UI hint is genuinely wanted, compute it in
`definePredicateRecord` as a derived getter — never an authored field.

---

## Summary of triggers

| Field | Score | Promote when… |
|---|---|---|
| `isInverseFunctional` | 50 | dedup/identity-resolution feature is scoped (maybe collect data earlier) |
| `isFunctional` | 44 | write-time validation engine ships |
| `isReflexive`/`isIrreflexive` | 34 | (don't) — handle self-loops as a one-off rule if ever needed |
| `equivalentTo` | 32 | (don't) — use deprecation flow instead |
| `verifiability` | 30 | only if oracle resolution needs finer signal than `claimType` |
| property chains | 26 | a reasoning module with a compute budget exists |
| `isHierarchical` | 18 | never — derive it |
