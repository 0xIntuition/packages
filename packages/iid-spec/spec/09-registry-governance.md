# 9. Registry governance

---

## 9.1 The registry

The scheme registry is the governed list of schemes that may appear in `int:<scheme>:<value>`. It is enumerated in [`schemes/README.md`](../schemes/README.md), with one normative document per scheme.

The registry is **closed**: a well-formed IID bearing an unregistered scheme is not a valid IID ([§1.3.1](./01-conformance.md)). Implementations MUST reject unknown schemes rather than passing them through.

This is a deliberate rejection of forward compatibility. An unknown scheme means an unknown canonicalization, and a value that has not been canonicalized by a rule anyone has agreed on is exactly the uncanonicalized, ambiguous string the specification exists to eliminate. Accepting it "just in case" would let the identifier space silently fill with values that compare unequal for reasons no implementation can explain.

## 9.2 Admission criteria

A candidate scheme MUST satisfy all three:

### 1. Stable, non-recycled identifiers

The scheme must be backed by an open or de-facto registry that assigns identifiers which are stable over time and never reassigned to a different entity — **or** it must be an intrinsic natural key with a fully offline canonicalization.

Recycling is disqualifying. An identifier that can be reassigned makes historical statements false without any record having changed. This is why social media handles are not admitted as a primary identifier: handles are renamed and recycled routinely, so the [`acct`](../schemes/acct.md) scheme's strong form requires a platform's immutable numeric user ID, and the handle form ranks a rung lower with its weakness documented.

### 2. No restrictive licensing

No licensing terms may restrict storage or republication of the identifier values.

This criterion excludes Google Place IDs, which are widely used and technically excellent but whose terms restrict retention and redistribution. An identifier that cannot legally be stored in a public knowledge graph cannot be a public knowledge graph's identifier, however well it works.

### 3. Deterministic offline canonicalization

The scheme's canonicalization must be implementable as a pure function: no network access, no clock, no locale, no configuration ([§0.3](./00-overview.md), tenet 4).

## 9.3 The freeze rule

> **Once ratified, a scheme's canonicalization rules are frozen. They are never edited in place.**

This is the strictest rule in the specification, and the least negotiable.

Every identifier ever produced is a function of the rules that produced it. Editing a rule does not fix past identifiers — it *re-derives* them, silently, so that data written under the old rule no longer matches data written under the new one. In Intuition's case the affected data is immutably on-chain, so it cannot be migrated even in principle.

Improvements therefore ship as new versioned entities:

| To change | Ship |
| :-- | :-- |
| A scheme's canonicalization | A new scheme name, or an explicitly versioned successor |
| The `NORM-1` algorithm | `NORM-2`, with a companion `gen2` scheme |
| The `gen1` preimage or hash | `gen2` |

Old and new coexist in the registry. Identifiers under each remain valid and stable, and atoms carrying the old and new forms for one entity are joined by the equivalence layer exactly as any other pair would be ([§8](./08-equivalence.md)). Nothing is re-minted and nothing is invalidated.

**Corollary — bugs are frozen too.** If a ratified canonicalizer contains a defect, the defect is now part of the definition of that scheme. The fix is a new scheme, never a patch. This is uncomfortable and it is correct: the alternative is that any implementation may disagree with any other about what a historical identifier means, depending on which version it happens to be running.

Known defects in the reference implementation are recorded in [`implementation-notes.md`](../implementation-notes.md) rather than silently repaired.

## 9.4 Adding a scheme

Adding a scheme is a specification change, reviewed and merged.

1. **Propose.** Open a pull request adding a scheme document under [`schemes/`](../schemes/README.md), following the standard template.
2. **Justify.** State which entities the scheme identifies, why the existing registry is insufficient, and how the scheme satisfies each admission criterion in [§9.2](#92-admission-criteria).
3. **Specify.** Provide the value grammar, the ordered canonicalization algorithm, validation rules, the identity class, the openness tier, and the scheme typing.
4. **Provide vectors.** A minimum of five test vectors, including at least two rejections. Vectors are normative ([§1.4](./01-conformance.md)).
5. **Place it.** Identify which entity types' ladders gain a rung, and at what position.
6. **Review and ratify.** On merge, the scheme's rules become frozen under [§9.3](#93-the-freeze-rule) and the registry version increments a MINOR release.

New schemes are **additive only**. Adding one never changes an existing identifier's meaning.

## 9.5 Rejected schemes

Recorded so that the same proposals are not relitigated.

| Scheme | Reason |
| :-- | :-- |
| **Google Place ID** | Licensing terms restrict storage and republication (criterion 2). |
| **OpenStreetMap element IDs** | Unstable — elements are split, merged, and renumbered by ordinary editing (criterion 1). |
| **ENS names** | Transferable. An ENS name identifies whoever currently controls it, not a fixed entity (criterion 1). |
| **Raw latitude/longitude** | Measured, not assigned. Two observations of one place differ, so the value is observer-dependent. Superseded by [`geo`](../schemes/geo.md), which quantizes to a cell. |
| **ISTC** (International Standard Text Code) | Effectively defunct; negligible coverage. |
| **Social handles as a primary identifier** | Renamed and recycled (criterion 1). Retained as the documented weak form of [`acct`](../schemes/acct.md). |

## 9.6 Deprecating a scheme

A scheme MAY be deprecated when its registry ceases operation or its licensing changes such that criterion 2 no longer holds.

Deprecation means:

- The scheme is marked deprecated in the registry and removed from all ladders, so no new identifiers are minted under it.
- **Existing identifiers remain valid.** Validators MUST continue to accept them, and canonicalization rules remain frozen.

A scheme is never *removed*. Removal would invalidate historical data, which is precisely what [§9.3](#93-the-freeze-rule) forbids.

---

**Previous:** [8. Equivalence](./08-equivalence.md) · **Back to:** [Overview](./00-overview.md)
