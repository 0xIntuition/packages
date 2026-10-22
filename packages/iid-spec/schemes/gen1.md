# `gen1` — Derived Composite Key

| | |
| :-- | :-- |
| Identity class | C — derived composite key |
| Openness tier | — (Class C) |
| Scheme typing | unambiguous (classification slug in-value) — but **never** P0-eligible, see below |
| Natural key | Derived — keccak-256 over a canonicalized recipe preimage |
| Canonical form | `<slug>:r<tag>:<hash16>` |

This document is the scheme's registry entry. The normative algorithm — preimage construction, `NORM-1` dependency, hashing, rung tags, collision semantics — lives in [§6 of the specification](../spec/06-gen1.md) and is not restated here.

## What it identifies

> **A `gen1` identifier does not identify an entity. It identifies the facts it was derived from** ([§6.1](../spec/06-gen1.md)).

`gen1` is the registry's only Class C scheme: the identifier of last resort, used when no authority covers an entity and it has no natural key. Two distinct entities sharing the recipe's facts share the identifier, by design; the class system exists so that this weakness is named rather than hidden ([§3.2](../spec/03-identity-classes.md)).

## Value grammar

```regex
^[a-z0-9-]+:r[1-9]\d*:[0-9a-f]{32}$
```

Three colon-separated parts, per the ABNF in [§6.2](../spec/06-gen1.md): the entity type's classification slug, a stable rung tag `r<N>` (N ≥ 1, no leading zero), and 32 lowercase hex characters — the first 16 bytes of keccak-256 over the preimage. The value contains two internal colons; per [§2.3](../spec/02-grammar.md) they belong to the value, not to IID structure.

## Canonicalization

`gen1` values are **built, never canonicalized from foreign input.** Every other scheme's canonicalizer exists to fold the many representations of an externally issued identifier into one; a `gen1` value has no external representation to fold — it comes into existence already canonical, as the output of the derivation algorithm in [§6.3](../spec/06-gen1.md).

The canonicalizer is therefore a pure acceptance gate:

1. Trim leading and trailing whitespace.
2. Match the grammar above. On no match, **reject**.

Nothing is repaired: an uppercase hash, a zero rung tag, a malformed slug all reject outright, because a `gen1` value that does not match the grammar exactly was not produced by a conforming deriver and cannot be trusted to mean anything.

## Validation

A conforming validator accepts a value iff it matches the grammar exactly. Structural validity is fully offline; verifying that the hash is *correct* additionally requires the recipe fields, which is one of the two reasons the P1 floor exists ([§6.6](../spec/06-gen1.md)).

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `movie:r4:fb681afe7d438cad73ae90a70f1cc55a` | `movie:r4:fb681afe7d438cad73ae90a70f1cc55a` | well-formed gen1 value is accepted as-is |
| `movie:r0:fb681afe7d438cad73ae90a70f1cc55a` | ✗ reject | rung tags start at 1 |
| `movie:r4:FB681AFE7D438CAD73AE90A70F1CC55A` | ✗ reject | hash must be lowercase |

## Notes and limitations

- **Unambiguously typed, yet never P0.** The classification slug rides inside the value, so a `gen1` identifier does imply its entity's type. It is nonetheless **never** eligible for P0 anchoring: [§7.2](../spec/07-representation-profiles.md) makes typing and class independent conditions that must *both* hold, and Class C fails the class condition categorically. Every `gen1` atom carries at least the P1 payload — the recipe fields that are the hash's preimage evidence ([§6.6](../spec/06-gen1.md)).
- **Expected to be superseded.** `gen1` identifiers are placeholders on the ladder's bottom rungs. When a stronger identifier for the entity is later discovered, both coexist and are joined by the equivalence layer ([§8](../spec/08-equivalence.md)); nothing is re-minted.
- **The scheme name is a version.** `gen1` binds to `NORM-1` and to this exact preimage and hash construction, all frozen ([§6.8](../spec/06-gen1.md), [§9.3](../spec/09-registry-governance.md)). An improved normalization ships as `NORM-2` with a companion `gen2` scheme — a new registry entry beside this one, never an edit to it.
