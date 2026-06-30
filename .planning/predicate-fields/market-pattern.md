# `marketPattern`

**Type:** `'depositional' | 'attributive' | 'comparative'`
**Confidence: 84 / 100 — Ship (grandfathered; needs a semantics clarification of its own).**

> Verdict: the one economic field with no analog in 30 years of classical knowledge-graph research — it's
> Intuition-native and already in production. It stays. The caveat is that its three values deserve a
> dedicated semantics doc, because unlike the OWL-derived fields, there's no external literature to anchor
> their meaning.

## The problem it solves

Intuition predicates aren't just relations — they're *markets*. `marketPattern` classifies how a
predicate behaves economically (bonding-curve / staking dynamics), which no other field captures:

- `depositional` — e.g. `affiliatedWith`, `alumniOf` (association-style claims).
- `attributive` — e.g. `actor`, `parentOrganization`, `containedInPlace` (attaching an attribute/role).
- `comparative` — e.g. `betterThan`, `equivalentTo`, `outperform`, `rankedAbove` (relative judgments).

## Examples across the value axes

1. **[ECON] Market mechanics per predicate.** The staking/curve behavior, signal interpretation, and
   payout logic can differ by pattern. A `comparative` claim ("A better than B") is inherently relative and
   zero-sum-ish; a `depositional` claim accrues differently. The economic layer reads this field to pick
   mechanics.

2. **[RENDER] Market UI variants.** A comparative predicate can render an A-vs-B versus widget; a
   depositional one renders a simple stake-for/against control. The pattern drives which market component
   shows.

3. **[QUERY] Economic analytics.** "Total value staked across comparative markets" or "most active
   attributive claims" segments the graph economically — only possible if the pattern is recorded.

## Why the lower-than-leverage caveat

Every other shipped field maps to a well-defined external concept (OWL characteristic, sentiment polarity,
fluent/event). `marketPattern`'s three values are *ours*, and their precise economic semantics aren't
written down anywhere in these docs. Before we lean harder on it for market mechanics, it warrants its own
clarification doc answering: what *exactly* distinguishes the three patterns, what mechanic does each
imply, and are three the right number? Until then it's correct to keep (it's in production and clearly
useful) but flagged as under-specified.

## What breaks without it

The economic layer loses its per-predicate behavior switch and falls back to one-size-fits-all market
mechanics — losing the expressiveness that makes different relationship types tradeable in fitting ways.

## Cost / complexity

Already paid (it exists on all specs). Ongoing cost is conceptual clarity, not authoring.

## Pruning check

- *Derivable?* No — economic behavior is an independent axis from logical/semantic structure.
- *Duplicated?* No external overlap; partially correlated with `claimType` (`comparative` ↔ `evaluative`)
  but distinct (a comparative *market* is not the same statement as an evaluative *claim type*).
- *Mergeable?* Possibly worth examining against `claimType` in the clarification doc, but they answer
  different questions (how it trades vs. what kind of claim it is).

## Confidence breakdown

Leverage 34/40 · Consumer readiness 23/25 · Simplicity 18/20 · Non-redundancy 9/15 → **84**.
(Deduction concentrated in non-redundancy/clarity: the values lack an external anchor and overlap
conceptually with `claimType`, pending the semantics doc.)
