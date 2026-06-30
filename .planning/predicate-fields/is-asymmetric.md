# `isAsymmetric`

**Type:** `boolean` (default false)
**Confidence: 54 / 100 — DEFER. Demoted from the decision record's "ship."**

> Verdict: scrutiny didn't hold up the ship call. `isAsymmetric`'s only genuine consumer is a validation
> engine that doesn't exist, and its "don't mirror the edge" signal is already implied by the *absence* of
> `isSymmetric`. Keep it documented; add it the day write-time validation lands.

## What it would assert

`R(a,b) ⟹ ¬R(b,a)` — the relationship cannot hold in both directions:

- `parentOrganization`, `betterThan`, `founder`, `predecessorOf`, `rankedAbove`.

## The case that was made for it

1. **[MACHINE] Validation.** Reject `A betterThan B` *and* `B betterThan A` as incoherent.
2. **[QUERY] "Don't synthesize the reverse as the same predicate."**
3. **[MACHINE] Implies irreflexivity** (`A betterThan A` is invalid).

## Why it doesn't clear the bar

1. **Its query/indexer value is already covered.** The indexer synthesizes a same-predicate reverse edge
   *only* when `isSymmetric` is true. So "don't mirror" is the **default** — the absence of `isSymmetric`
   already says it. `isAsymmetric` adds no new instruction to the one consumer that exists today (the
   indexer). And where the reverse direction *is* meaningful, `inverse` already names it.

2. **Its only unique value is write-time validation, which has no consumer.** Rejecting contradictory
   asymmetric assertions requires a validation engine the system doesn't have. Per the project's own
   pruning principle — *prefer fields with a consumer that exists today* — this is exactly the kind of
   field to defer until that engine appears.

3. **The implication it carries is derivable.** `asymmetric ⟹ irreflexive` is a logical entailment, not
   independent information; a reasoner derives it.

4. **Consistency with the rest of the prune.** We deferred the functional family and reflexivity for the
   same reason (validation-only, no consumer). Shipping `isAsymmetric` while deferring those would be
   incoherent — it sits in the same bucket.

## When to promote

Pull it in (likely alongside `isFunctional`/reflexivity) the moment write-time edge validation or a
consistency-checking pass becomes a real consumer. At that point all the "reject incoherent edges" fields
graduate together as a coherent validation layer.

## Confidence breakdown

Leverage 22/40 · Consumer readiness 8/25 · Simplicity 18/20 · Non-redundancy 6/15 → **54**.
(The deductions are consumer-readiness and non-redundancy: no live consumer, and the live signal is
already implied by `¬isSymmetric` + `inverse`.)
