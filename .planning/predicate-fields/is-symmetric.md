# `isSymmetric`

**Type:** `boolean` (default false)
**Confidence: 85 / 100 — Ship.**

> Verdict: store one edge, serve both directions, when the reverse is the *same* predicate. Cheap,
> indexer reads it today, one of the four canonical relational patterns.

## The problem it solves

Some relationships are mutual by definition — asserting one direction logically asserts the other, *with
the same predicate*. `isSymmetric` declares this so the reverse edge is synthesized, never minted twice:

- `affiliatedWith` — if Alice is affiliated with Acme, Acme is affiliated with Alice.
- `partnerOf`, `competeWith`, `compatibleWith`, `alternativeTo`, `equivalentTo`, `sameAs`.

(Contrast `inverse`, which handles the case where the reverse is a *different* predicate.)

## Examples across the value axes

1. **[QUERY] Half the writes, symmetric reads.** `Acme partnerOf BigCo` is stored once; the indexer
   answers "who are BigCo's partners?" by matching the edge in either position. For a permissionless graph
   paying for storage, not double-minting every mutual relationship is a real saving.

2. **[RENDER] Both profiles populate from one assertion.** Acme's page and BigCo's page both show the
   partnership without the user creating two atoms or the UI guessing direction.

3. **[MACHINE] Canonical relational pattern.** Symmetry is one of the four patterns (symmetry,
   antisymmetry, inversion, composition) that OWL formalized and the RotatE/ComplEx embedding line
   independently rediscovered as essential. A graph that can't represent symmetry mis-models a large class
   of relations. Cheap to assert, foundational to get right.

4. **[DATA] Consistency.** The derivation layer sets `inverse = self` for symmetric predicates and rejects
   a spec that declares both `isSymmetric` and a *different* `inverse` — a contradiction.

## What breaks without it

Either users mint two atoms per mutual relationship (friction + storage + drift between the two), or the
indexer can't safely answer reverse queries because it doesn't know the relation is mutual.

## Cost / complexity

Minimal — a boolean, obviously true/false per predicate, trivially forward-chainable (OWL 2 RL).

## Pruning check

- *Derivable?* No — mutuality is semantic.
- *Duplicated?* Interacts with `inverse` (symmetric ⟹ self-inverse) but is the cleaner way to express the
  common "same predicate both ways" case; we derive the inverse rather than make authors write it.
- *Mergeable?* Could in theory be modeled as `inverse: <self>`, but a dedicated boolean is far clearer to
  authors and to the serializer (`owl:SymmetricProperty` is itself a dedicated type, not `inverseOf self`).

## Confidence breakdown

Leverage 33/40 · Consumer readiness 22/25 · Simplicity 20/20 · Non-redundancy 10/15 → **85**.
