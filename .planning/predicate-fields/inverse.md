# `inverse`

**Type:** `PredicateKey` (typed reference to another predicate)
**Confidence: 88 / 100 — Ship.**

> Verdict: lets the indexer serve both directions of a relationship from a single stored edge, using the
> *correct* predicate for the reverse direction. Direct descendant of `owl:inverseOf`. A consumer (the
> indexer) reads it today.

## The problem it solves

Most directional relationships are interesting from both ends, but the reverse end is usually a
*different* predicate. `inverse` declares that pairing so the reverse edge never has to be minted
separately:

- `parentOrganization` ⇄ `subOrganization`
- `follow` ⇄ `followedBy`
- `predecessorOf` ⇄ `successorOf`
- `containsPlace` ⇄ `containedInPlace`
- `reviewed` ⇄ `reviewedBy`

## Examples across the value axes

1. **[QUERY] One write, two views.** Kames asserts `BigCo parentOrganization Acme`. Acme's profile shows
   "Parent: BigCo"; BigCo's profile lists "Subsidiaries: Acme, …" — both synthesized by the indexer from
   one atom via `inverse`. We don't ask users to also mint `Acme subOrganization BigCo`, and we don't
   store it.

2. **[RENDER] The reverse section labels itself.** A profile page renders an "incoming edges" section by
   looking up each predicate's `inverse` and using *its* display name. Without the field, the UI either
   shows awkward passive phrasings ("is parent-organization-of by BigCo") or hardcodes reverse labels.

3. **[MACHINE] Closes the relationship under inversion.** A reasoner that knows `inverse` can answer
   "is Acme a subsidiary of BigCo?" from a `parentOrganization` assertion. This is one of the four
   relational patterns (symmetry, antisymmetry, **inversion**, composition) that both OWL and the RotatE
   embedding line independently identified as load-bearing — strong evidence it's not optional fluff.

4. **[DATA] Consistency gate.** `definePredicateRecord` cross-checks that `parentOrganization.inverse ===
   'subOrganization'` *and* `subOrganization.inverse === 'parentOrganization'`, and that the pair mirror
   each other's algebraic properties (both transitive, etc.). A one-sided inverse fails the build.

## Why typed key, not string

Today the codebase has `inversePredicate: 'sub organization'` — a *display name*. Display names get
edited, translated, and drift; the link silently rots. A typed `PredicateKey` is validatable at build
time and lets the consistency gate above exist at all. This is the one genuine refactor in the field set.

## What breaks without it

Reverse-direction navigation either forces double-minting (more atoms, more user friction, divergent
data) or relies on hardcoded reverse-label maps in the frontend. Inversion-based inference is impossible.

## Cost / complexity

Low. Many predicates already imply their inverse; curating the pairs is a bounded one-time pass. The
string→key migration is mechanical. Reasoning cost is trivial (a lookup).

## Pruning check

- *Derivable?* No — the pairing is semantic, declared per predicate.
- *Duplicated?* Partially overlaps `isSymmetric` conceptually (a symmetric predicate is its own inverse),
  which we handle by deriving `inverse = self` when `isSymmetric` is set, so authors never write both.
- *Mergeable?* No.

## Confidence breakdown

Leverage 35/40 · Consumer readiness 22/25 · Simplicity 18/20 · Non-redundancy 13/15 → **88**.
