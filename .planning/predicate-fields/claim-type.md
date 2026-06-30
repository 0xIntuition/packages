# `claimType`

**Type:** `'factual' | 'evaluative'` (`normative` dropped)
**Confidence: 64 / 100 — Soft-ship. Define now, populate opportunistically, don't block on it.**

> Verdict: real and orthogonal value (fact vs opinion changes market and UI semantics), but no consumer
> *branches* on it yet. Cheap enough to define and populate where obvious; not worth a curation campaign
> until a market or badge actually reads it.

## The problem it solves

A claim that can be checked against the world (`manufacturer`) is a different *kind* of thing from a
perpetual opinion (`betterThan`). `claimType` records that distinction:

- `factual` — verifiable in principle: `manufacturer`, `authoredBy`, `parentOrganization`,
  `linkedAccount`, `containedInPlace`, `founded`.
- `evaluative` — subjective judgment: `betterThan`, `like`, `bullishOn`, `trust`, `recommend`,
  `worseThan`.

(`normative` — "ought" claims like `compliantWith` — was cut: too few predicates, no consumer.)

## Examples across the value axes

1. **[ECON] Market resolution semantics.** A `factual` claim can in principle *resolve* (an oracle or
   consensus settles "is Foxconn the manufacturer?") and pay out. An `evaluative` claim is perpetually
   contestable — there's no ground truth to "Apple is better than Samsung," so its market stays open as
   an opinion poll. The economic layer *would* branch on this — but doesn't yet. This is the strongest
   justification and also the reason the field is soft-ship: the consumer is real but future.

2. **[RENDER] "Verifiable" vs "Opinion" badge.** The UI can badge factual claims as checkable and
   evaluative ones as opinions, setting user expectations about whether a claim can ever be "settled."
   This consumer *could* ship today but is low-stakes.

3. **[QUERY] Separate the knowledge graph from the opinion graph.** "Show only factual claims about this
   entity" gives a sourcing/encyclopedia view; "show opinions" gives a sentiment view. Useful slice,
   not yet requested.

## Honest case against (why not full ship)

- **No consumer branches on it today.** Unlike `objectKind` (frontend reads it now) or `polarity`
  (reputation reads it now), nothing currently changes behavior based on `claimType`.
- **Partial correlation with other fields.** `evaluative` claims usually have a `polarity` and often a
  `comparative` `marketPattern`; `factual` claims usually have `polarity` absent. It's not *derivable*
  (`blocked` is factual yet negative-polarity), but the correlation means it carries less *independent*
  information than the top-tier fields.

## Resolution: soft-ship

Add the field to the type. Populate it where the answer is obvious and free (during the other backfills).
Do **not** run a dedicated curation pass or block the rollout on it. Promote to full ship the moment a
market mechanic or a shipped badge reads it.

## Cost / complexity

Low to define; the temptation-to-overthink (where exactly is the fact/opinion line?) is the real cost,
which soft-ship avoids by not demanding completeness.

## Pruning check

- *Derivable?* No, but correlated — hence the docked non-redundancy score.
- *Duplicated?* Overlaps conceptually with `marketPattern: comparative` and with `polarity`; distinct but
  related.
- *Mergeable?* Considered merging into `marketPattern`; rejected — "how it trades" ≠ "what kind of claim."

## Confidence breakdown

Leverage 28/40 · Consumer readiness 12/25 · Simplicity 17/20 · Non-redundancy 7/15 → **64**.
