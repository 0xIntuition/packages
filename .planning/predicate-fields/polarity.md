# `polarity`

**Type:** `'positive' | 'negative' | 'neutral'` (absent = no inherent sentiment)
**Confidence: 88 / 100 — Ship.**

> Verdict: the field that lets a *trust/belief* graph aggregate signed signal and lets the frontend color
> sentiment, both from the predicate alone. Classical fact-graphs never needed it; Intuition cannot do
> without it. Grounded in signed-network theory (Heider; Leskovec et al.).

## The problem it solves

A large share of our predicates carry directional sentiment, and that sign is the raw material of
reputation. Encoding it once on the predicate means every consumer reads the same sign instead of each
re-hardcoding "trust is good, distrust is bad":

- positive: `endorse`, `trust`, `vouchFor`, `support`, `bullishOn`, `like`, `recommend`, `backedBy`
- negative: `distrust`, `oppose`, `bearishOn`, `blocked`, `skepticalOf`, `disagreeWith`, `reported`, `votedAgainst`
- neutral: `neutralOn` (explicitly zero sentiment — distinct from *absent*)
- absent (no sentiment axis): `manufacturer`, `containedInPlace`, `authoredBy`

## Examples across the value axes

1. **[ECON] One reputation score across heterogeneous predicates.** Bob's standing =
   Σ(stake on positive edges) − Σ(stake on negative edges), summed over `endorse`, `trust`, `vouchFor`
   *and* `distrust`, `reported`, `blocked`. The scoring engine reads `polarity`; it does not carry its own
   per-predicate sign table that drifts out of sync with the predicate set.

2. **[RENDER] Sentiment-aware UI for free.** Edge cards render positive predicates green / negative red;
   a profile splits incoming edges into "Supporters" and "Detractors"; a filter offers "show only
   negative signals." All driven by the field, no per-predicate styling.

3. **[QUERY] Signed-subgraph queries.** "Find entities with net-negative sentiment from accounts I trust"
   requires the indexer to know each edge's sign. `polarity` makes that a first-class filter.

4. **[MACHINE] Powers `contradicts` and balance reasoning.** Sign + the `contradicts` field together let
   the system reason about structural balance ("entities my trusted peers distrust"). Signed-network
   research (Leskovec, Huttenlocher & Kleinberg, 2010) shows these signs are predictable and meaningful —
   we're encoding a quantity with 75 years of theory behind it (Heider 1946).

## Direction of aggregation — the precise definition (audit D4)

One sentence prevents a class of reputation bugs: **polarity is the sign of the edge from subject toward
object; signed aggregation accrues to the *object*** (the Heider/Leskovec signed-network convention). So
`reported` is negative *about the thing reported*, not about the reporter. Two corollaries the gate and
indexer enforce:

- **Inverse pairs share polarity** (gate rule 8, lint): `trust`/`trustedBy` are both positive. But for the
  inverse direction the aggregation target flips to the triple's *subject* — the indexer handles this by
  normalizing through the canonical direction (decision record §5.2) before aggregating, so every signed
  edge is summed exactly once, onto the right node.
- Never mark a sentiment predicate transitive (gate rule 10; see `is-transitive.md`).

## Why `neutral` is kept (and absent is different)

`neutralOn` is a *deliberate* zero — "I have considered this and have no lean," which is information.
That's distinct from a relational predicate like `manufacturer` that has *no sentiment axis at all*
(absent). Collapsing them would lose the "explicitly neutral" signal that markets may price. (Open
question flagged in the decision record; current lean: keep the 3-value enum + absence.)

## What breaks without it

Every reputation/scoring/rendering surface maintains its own predicate→sign lookup. These drift, and new
predicates silently score as zero until each consumer is patched. Sentiment becomes tribal knowledge.

## Cost / complexity

Low. The sign of a predicate is obvious to assign; ~one afternoon across 133 specs. Trivial to consume.

## Pruning check

- *Derivable?* No — sentiment is semantic, not structural.
- *Duplicated?* Orthogonal to `claimType`: `trust` is positive *and* evaluative; `blocked` is negative
  *and* factual; `manufacturer` is absent *and* factual. Two independent axes.
- *Mergeable?* No.

## Confidence breakdown

Leverage 36/40 · Consumer readiness 22/25 · Simplicity 19/20 · Non-redundancy 11/15 → **88**.
(Deduction: the `neutral`-vs-absent subtlety is a small ongoing modeling cost.)
