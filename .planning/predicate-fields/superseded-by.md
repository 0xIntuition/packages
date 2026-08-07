# `supersededBy`

**Type:** `PredicateKey` — only valid when `status === 'deprecated'`
**Confidence: 70 / 100 — Soft-ship.** *(Added by the audit pass, `predicate-spec-audit.md` D1.)*

> Verdict: deprecation without forwarding is a dead end. Wikidata's "replaced by" is the precedent; with
> 133 community-evolving specs, predicate succession will be routine, and the pointer is one optional key.

## The problem it solves

`status: 'deprecated'` currently tells consumers only "don't use this." Nothing tells:

- a **picker** what to offer instead (it can only hide the predicate),
- a **renderer** of existing triples how to present an old edge ("this used `partneredWith`, superseded by
  `partnerOf`"),
- a **migration script** where old edges should map.

`supersededBy` is the forwarding address.

## Examples across the value axes

1. **[RENDER] Pickers hide-and-redirect.** Selecting or searching a deprecated predicate surfaces "use
   `partnerOf` instead" — driven by the field, not a hardcoded redirect table.

2. **[DATA] Old triples stay legible.** Edges minted under a deprecated predicate render with a
   "superseded" affordance linking to the successor, instead of silently rotting or disappearing from
   grouped views.

3. **[QUERY] Optional read-time widening.** A query on the successor can opt in to including
   edges asserted under its deprecated predecessors — the same shape as `specializes` roll-up, reusing
   that machinery.

4. **[MACHINE] Serializes to `schema:supersededBy`** — an existing schema.org term, so the succession
   chain is standards-legible.

## Why soft-ship, not ship

The consumer (pickers/migration tooling) is real but the *population* is nearly empty today — few
predicates are deprecated yet. Define the field and validation now; populate as deprecations happen.
That's exactly the soft-ship band.

## Cost / complexity

Trivial. One optional key; validated by rule 14 in `definePredicateRecord` (must point at a
non-deprecated spec; only valid on `status: 'deprecated'`; chains permitted but must be acyclic).

## Pruning check

- *Derivable?* No — succession is editorial.
- *Duplicated?* No. `status` says *that* it's retired; this says *what replaced it*. Distinct from
  `specializes` (entailment between live predicates) and `inverse` (direction pairing).
- *Mergeable?* No.

## Confidence breakdown

Leverage 24/40 · Consumer readiness 18/25 · Simplicity 19/20 · Non-redundancy 13/15 → **70**.
(Deductions: leverage is modest — lifecycle hygiene, not new query power — and today's deprecated set is
small. The cost is so low that the field still clears its band comfortably.)
