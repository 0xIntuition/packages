# `objectKind`

**Type:** `'entity' | 'claim' | 'literal'`
**Confidence: 92 / 100 — Core. Ship first.**

> Verdict in one line: this is the single field that turns the predicate spec into a frontend
> **rendering contract**, and it's the only place our reification model (claims-about-claims) is made
> machine-visible. Highest leverage, a consumer that exists today, near-zero cost, fully non-redundant.

## The problem it solves

Given an edge `⟨subject, predicate, object⟩`, software has to decide *what the object even is* before it
can render it, traverse it, or reason about it. Today that knowledge is implicit and re-derived ad hoc.
`objectKind` declares it once, on the predicate:

- `literal` — the object is a value, not a node (`url`, `imgUrl`, `hasDescription`, `hasSource`).
- `claim` — the object is **another statement/atom**, not an entity (`disputedBy`, `confirmedBy`,
  `attestedBy`, `citedBy`, `evidencedBy`, `verifiedBy`). This is Intuition's reification surface.
- `entity` — the object is a graph node (`memberOf`, `manufacturer`, `locatedIn`). The default majority.

## Examples across the value axes

1. **[RENDER] The app renders any edge with zero per-predicate hardcoding.** A generic `<EdgeObject>`
   component switches on `objectKind`: `literal` → render `imgUrl` as an `<img>`, `url` as an `<a>`,
   `hasDescription` as text; `entity` → render a clickable node chip; `claim` → render a nested claim
   card. Without this field, the frontend needs a giant hand-maintained `switch(predicate)` covering all
   133 predicates — exactly the kind of coupling we're trying to delete.

2. **[QUERY] The indexer knows what not to traverse.** Graph traversal, "related entities," and
   PageRank-style walks must skip `literal` objects (an image URL is not a node) and must treat `claim`
   objects as edges-on-edges. Marking `objectKind` lets the indexer build a clean entity-only subgraph
   for traversal and a separate reification layer for claims.

3. **[MACHINE] Reification becomes explicit.** `disputedBy`/`confirmedBy` point at *other claims*. Our
   foundations doc traced 20 years of the field struggling to represent "statements about statements"
   (RDF reification → singleton properties → RDF-star). `objectKind: 'claim'` is how we declare which
   predicates are meta-relations, so a consumer can follow the citation/dispute graph instead of
   mistaking a claim-id for an entity-id.

4. **[ECON] Markets on claims vs markets on entities differ.** A stake on `Alice disputedBy [claim X]`
   is a second-order market (betting on the credibility of another claim). The economic layer needs to
   know it's pricing a meta-claim, which `objectKind: 'claim'` flags directly.

5. **[DATA] Validation at authoring.** "You attached an entity where this predicate expects a literal"
   is catchable the moment the field is known. `url`'s object should be a URL literal, not an atom.

## What breaks without it

Every consumer re-implements object-type detection by sniffing the atom data or hardcoding predicate
lists, and the claim-vs-entity distinction stays invisible — meaning the dispute/attestation graph can't
be walked generically. The frontend `switch` becomes the de-facto (untyped, drifting) source of truth.

## Cost / complexity

Trivial. A single 3-value enum, mechanically assignable across all 133 specs in an afternoon (the
literal set and claim set are small and obvious). Zero reasoning cost.

## Pruning check

- *Derivable?* No. Atom data may sometimes reveal a literal, but the **claim** case is not derivable from
  anything we store — it's semantic intent of the predicate.
- *Duplicated?* No. Closest neighbor is classifications' object typing, but that answers *which entity
  type*, not *entity vs claim vs literal* — a different, coarser axis that the rendering layer needs.
- *Mergeable?* No.

## Confidence breakdown

Leverage 38/40 · Consumer readiness 24/25 · Simplicity 19/20 · Non-redundancy 11/15 → **92**.
(The only deduction: minor conceptual overlap with classifications typing, resolved by keeping this axis
deliberately coarse and rendering-focused.)
