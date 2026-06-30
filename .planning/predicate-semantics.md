# Design: Machine-Readable Predicate Semantics

**Status:** Draft for review
**Author:** Architecture
**Date:** 2026-06-30
**Scope:** `packages/predicates/src/types.ts`, `record.ts`, `ipfs.ts`, and the 133 specs under `src/generated/specs/`

---

## 1. Motivation

Predicates are how edges are created in the Intuition knowledge graph. Each predicate
(`affiliatedWith`, `memberOf`, `listedIn`, `trust`, `betterThan`, …) says something precise
about the relationship between its subject and object. Today most of that meaning lives in
prose (`description`) and a handful of booleans. A machine cannot reason over prose.

This document maps out the full set of **machine-readable fields** we should add to predicate
specs so that software can:

1. **Entail** — infer edges that were never explicitly written.
2. **Check consistency** — detect contradictory claims.
3. **Traverse & aggregate** — compute reachability, paths, and signed-signal reputation.
4. **Validate** — reject malformed edges at authoring time.
5. **Interpret** — render, price (markets), weigh sentiment, and judge freshness.

A field earns a place in the schema only if a machine can *do* one of those five things with
it. Anything else is documentation and stays in `description`/`examples`.

We deliberately adopt the vocabulary of **OWL / RDF property characteristics** (symmetric,
transitive, functional, inverse, sub-property, disjoint, …). That formal system was built for
exactly this problem, so aligning with it gives us interoperability with existing reasoners
and with schema.org for free.

---

## 2. Current state

`PredicateSpec` (in `types.ts`) carries:

| Field | Facet | Notes |
|---|---|---|
| `key`, `name`, `description` | identity / display | |
| `category`, `status` | classification / lifecycle | |
| `marketPattern` | economic | `depositional \| attributive \| comparative` |
| `conjugates` | **grammar/display** | inflection across locales — *not* a relational property |
| `thirdPerson`, `examples` | display | |
| `isSymmetric`, `isTransitive`, `isHierarchical` | algebraic | partial coverage |
| `inversePredicate` | ontological | **a display-name string, not a typed key** |

Domain/range typing intentionally lives in the `@0xintuition/classifications` predicate matrix;
`entity-type-map.ts` is explicitly legacy. **This design does not duplicate typing into specs.**

### Naming issue to fix first

The user's original prototypes were *symmetric*, *conjugative*, *transitive*. Two are clean.
"Conjugative" is ambiguous and should be retired:

- `conjugates: boolean` in code is a **grammar** concept (it sits next to `i18n`/`thirdPerson`
  in the IPFS serializer) — "this verb inflects across locales."
- The *relational* idea behind "conjugative" — "this relationship has a converse expressed by a
  **different** predicate" — is already `inversePredicate` (`parentOrganization ⇄ subOrganization`).

**Decision:** drop "conjugative" as a relational term. Keep `inverse` for the converse relation.
Rename the grammar field to `inflects` and move it under a `grammar` facet, removing the collision.

---

## 3. Facet model

We organize fields into facets rather than a flat blob. Most specs will only populate a few.

| Facet | Job(s) | Field family |
|---|---|---|
| **Algebraic** | entailment, consistency, validation | `logic { symmetric, asymmetric, transitive, reflexive, irreflexive, functional, inverseFunctional }` |
| **Ontological** | entailment, consistency | `ontology { inverse, specializes, equivalentTo, contradicts }` |
| **Polarity** | aggregation, interpretation | `polarity` |
| **Epistemic** | interpretation, consistency | `claimType`, `verifiability` |
| **Temporal** | interpretation, freshness | `temporalNature` |
| **Target** | validation, traversal | `objectKind` |
| **Economic** | interpretation | `marketPattern` (existing) |
| **Presentation** | rendering only | `grammar { inflects, thirdPerson }`, `examples`, i18n |

---

## 4. Field reference

### 4.1 Algebraic (`logic`)

OWL property characteristics. Cheap booleans that unlock automatic edge inference.

| Field | Meaning | Powers | Examples |
|---|---|---|---|
| `symmetric` | R(a,b) ⟹ R(b,a) | store one direction, query both; synthesize reciprocal edges | `affiliatedWith`, `partnerOf`, `competeWith`, `sameAs` |
| `asymmetric` | R(a,b) ⟹ ¬R(b,a) (implies irreflexive) | contradiction detection | `parentOrganization`, `betterThan`, `founder`, `predecessorOf` |
| `transitive` | R(a,b) ∧ R(b,c) ⟹ R(a,c) | reachability, containment trees, ranking chains | `containedInPlace`, `parentOrganization`, `rankedAbove`, `dependOn` |
| `reflexive` / `irreflexive` | R(a,a) always / never | self-loop validation | `sameAs` reflexive; nearly all else irreflexive |
| `functional` | subject → ≤1 object | uniqueness validation | `manufacturer`, `primaryImageOfPage`, `parentOrganization` |
| `inverseFunctional` | object → ≤1 subject | identity resolution (key constraint) | `linkedAccount`, `sameAs` |

**`isHierarchical` is redundant** — derivable from `transitive + asymmetric + has-inverse`. Drop it
as a primitive; if a tree-UI hint is wanted, document it as derived, not authored.

**Payoff:** with `symmetric` + `inverse`, reciprocal edges are never stored — the graph layer
synthesizes them, halving writes for bidirectional predicates and making queries direction-agnostic.

### 4.2 Ontological (`ontology`) — predicates relating to predicates

The highest-leverage *new* facet. Predicates form their own graph.

| Field | Meaning | Powers | Example |
|---|---|---|---|
| `inverse` (typed `PredicateKey`) | converse predicate | bidirectional query | `parentOrganization` → `subOrganization` |
| `specializes` (subPropertyOf) | this edge implies a broader edge | **roll-up reasoning** | `employedBy`, `alumniOf`, `memberOf` ⊑ `affiliatedWith` |
| `equivalentTo` | predicate-level alias | dedup | curate, e.g. `createdBy` ≡ `authoredBy`? |
| `contradicts` (disjointWith) | both cannot hold for same (s,o) | **contradiction / disagreement markets** | `trust` ⊥ `distrust`; `bullishOn` ⊥ `bearishOn`; `support` ⊥ `oppose` |

> **Typed refs, not strings.** `inversePredicate: 'sub organization'` today is a display name that can
> drift from the `subOrganization` key. All ontological references must be **typed `PredicateKey`s**,
> so they are validatable and `definePredicateRecord` can cross-check that inverse pairs mirror each
> other's algebraic properties.

`specializes` and `contradicts` are the two to ship first (equal priority). `specializes` lets a query
for "is X affiliated with Y" automatically catch `employedBy`/`alumniOf`/`memberOf`. `contradicts`
turns the trust graph into something that can detect and price disagreement.

### 4.3 Polarity (`polarity`)

```
polarity: 'positive' | 'negative' | 'neutral' | 'none'
```

- positive: `endorse`, `trust`, `vouchFor`, `support`, `bullishOn`, `like`, `recommend`
- negative: `oppose`, `distrust`, `bearishOn`, `blocked`, `skepticalOf`, `disagreeWith`, `reported`
- neutral: `neutralOn`
- none: `manufacturer`, `containedInPlace`, `authoredBy` (relational, no sentiment)

Lets a reputation engine aggregate **signed signal across heterogeneous predicates** into one score,
instead of hard-coding the sign of each predicate in the scoring layer. (`intensity: weak | strong`
is a deferred follow-up.)

### 4.4 Epistemic (`claimType`, `verifiability`)

```
claimType:     'factual' | 'evaluative' | 'normative'
verifiability: 'onChain' | 'offChainVerifiable' | 'unverifiable'
```

- `factual`/verifiable: `manufacturer`, `authoredBy`, `parentOrganization`, `linkedAccount` — staking is *truth discovery*.
- `evaluative` (subjective): `betterThan`, `like`, `bullishOn` — staking is *opinion aggregation*.
- `normative` (ought): `compliantWith`, `regulatedBy`, `governedBy`.

A market over a fact and a market over an opinion mean different things; economics and UI should
treat them differently. The schema currently cannot tell them apart.

### 4.5 Temporal (`temporalNature`)

```
temporalNature: 'permanent' | 'state' | 'event'
```

- `permanent` — immutable once true; never stale: `authoredBy`, `derivedFrom`, `founded`, `precededBy`.
- `state` — durative, can silently become false; **needs validity intervals / "current"**: `employedBy`, `memberOf`, `locatedIn`, `governedBy`.
- `event` — point-in-time fact, stays true as history: `votedFor`, `reviewed`, `attestedBy`.

Tells the graph layer which edges can rot (need expiry / re-attestation) versus write-once.

### 4.6 Target (`objectKind`)

```
objectKind: 'entity' | 'claim' | 'literal'
```

- `literal` — object is a value, do not traverse: `url`, `imgUrl`, `hasDescription`.
- `claim` (reifying / meta-relation) — points at another statement, not an entity: `disputedBy`, `confirmedBy`, `attestedBy`, `citedBy`, `evidencedBy`.
- `entity` — the default majority.

A validation + traversal primitive, and our reification story made explicit.

### 4.7 Domain / range — intentionally excluded

Typed subject/object targets remain in `@0xintuition/classifications`. Do **not** add
`subjectType`/`objectType` to specs; two sources of truth would drift. An optional non-authoritative
schema.org `domain`/`range` hint for export is deferred.

---

## 5. Proposed schema shape (hybrid nested)

Decision: keep small enum semantic fields flat (they read well and serialize trivially) and group
the two field-rich families (`logic`, `ontology`) plus presentation (`grammar`) into nested objects
so the type stays scannable. Retain `as const satisfies PredicateSpec`.

```ts
export interface PredicateSpec {
  key: string;
  name: string;
  description: string;
  category: PredicateCategory;
  status: PredicateStatus;

  // economic (Intuition)
  marketPattern: MarketPattern;

  // semantics (flat enums)
  polarity?: 'positive' | 'negative' | 'neutral' | 'none';
  claimType?: 'factual' | 'evaluative' | 'normative';
  verifiability?: 'onChain' | 'offChainVerifiable' | 'unverifiable';
  temporalNature?: 'permanent' | 'state' | 'event';
  objectKind?: 'entity' | 'claim' | 'literal';

  // algebraic
  logic?: {
    symmetric?: boolean;
    asymmetric?: boolean;
    transitive?: boolean;
    reflexive?: boolean;
    irreflexive?: boolean;
    functional?: boolean;
    inverseFunctional?: boolean;
  };

  // ontological (typed key refs)
  ontology?: {
    inverse?: PredicateKey;
    specializes?: PredicateKey;
    equivalentTo?: PredicateKey;
    contradicts?: readonly PredicateKey[];
  };

  // presentation (rendering only)
  grammar?: { inflects?: boolean; thirdPerson?: string };
  examples?: readonly string[];
}
```

`definePredicateRecord` becomes the **derivation + validation layer**:

- normalize defaults,
- derive implied properties (`asymmetric ⟹ irreflexive`; `symmetric ⟹ inverse = self`;
  `transitive ⟹ inverse is transitive`),
- cross-validate that inverse pairs mirror each other's algebraic properties and that
  `contradicts` is symmetric across the pair.

This keeps authoring terse while the materialized record stays complete and internally consistent.

---

## 6. Rollout plan

All new fields are optional ⟹ additive and non-breaking. The only real refactor is
`inversePredicate: string` → `ontology.inverse: PredicateKey`.

**P0 — adopt now (mostly mechanical backfill across 133 specs):**
- `polarity`, `temporalNature`, `objectKind`
- `logic.{symmetric, asymmetric, transitive, irreflexive}` (migrate existing booleans in)
- convert `inverse` to a typed `PredicateKey`

**P1 — next (human curation; highest reasoning leverage):**
- `ontology.specializes` **and** `ontology.contradicts` (curated together, equal priority)
- `claimType`
- derivation/validation engine in `definePredicateRecord`
- extend the IPFS `additionalProperty` serializer + `PredicateIpfsPropertyName` union

**P2 — research / future:**
- `functional`/`inverseFunctional`, `equivalentTo`, `verifiability`, `intensity`
- OWL property-chain axioms (`grandparentOf` from `parentOf ∘ parentOf`)
- a standalone `@0xintuition/reasoning` module consuming these for live entailment/consistency

---

## 7. Open questions

1. **`equivalentTo` policy** — do we collapse near-synonyms (`createdBy`/`authoredBy`) at the
   predicate level, or keep them distinct and only relate them? Affects atom-id stability.
2. **Inverse coverage** — do all directional predicates get a named inverse, or only where the
   converse is independently useful? (Synthesizing an unnamed inverse vs. minting a predicate.)
3. **`contradicts` strength** — hard logical contradiction (`trust`/`distrust`) vs. soft tension
   (`skepticalOf`/`trust`). Do we need a separate `tension` relation, or is one field enough?
4. **Serialization surface** — which of these belong in the on-chain/IPFS predicate document vs.
   stay package-side metadata for the reasoning layer?
