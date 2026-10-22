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

### 9.3.1 Additive value-grammar extensions

An additive value-grammar extension MAY be ratified in place as a MINOR registry change only when:

1. Every existing canonical value remains canonical and byte-identical.
2. No existing valid identifier changes validity, typing, or anchor eligibility.
3. The new forms were previously invalid.
4. Conformance vectors are added that prove conditions 1–3.

The `wd` extension from bare `Q…` to optional `<slug>:Q…` is the first instance: existing bare identifiers remain polymorphic and ineligible for P0; newly valid typed forms follow the binding rules in [`schemes/wd.md`](../schemes/wd.md). This exception does not permit rewriting existing identifiers or changing their canonical values.

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

## 9.7 Pre-publication amendments

- **2026-10-19 — Weak account eligibility correction.** Before the first publication of `@0xintuition/iid-spec`, the [`acct`](../schemes/acct.md) weak form (`<platform>:@<handle>`) is corrected to be valid and unambiguously typed but not P0 anchor-eligible, with a P1 floor one rung below the strong form because handles can be renamed or recycled. Strong-form eligibility and all canonicalization rules and canonical bytes remain unchanged. This is a pre-publication amendment, not a §9.3.1 additive extension: it changes eligibility of an existing valid form, which §9.3.1 does not permit. The parity ruling is in effect by default, subject to ratification in review.


### 2026-10-19 — Provider-local identifiers (Class D)

A **provider-local identifier** is "an identifier assigned by one provider, stable within that provider, not governed by a registry outside it."

This adds **Class D**. Class A requires an external registry's uniqueness guarantee; Class B is intrinsic and unassigned; Class C is a derived composite hash. None fits this definition verbatim. The three classes in §3 remain unchanged; this dated pre-publication amendment adds a fourth class before the first publication.

Admission requires a named assigning provider, identifiers stable within that provider, permission to store and republish the values, a deterministic offline grammar, explicit entity typing, and normative positive and negative vectors. Names use `int:<provider>:<value>`; a type segment belongs to the value where needed. Provider-local admission does not establish an external registry's uniqueness guarantee or permit unknown schemes. The closed-registry rule in §9.1 stays unchanged.

The admitted schemes are [`podcast-index`](../schemes/podcast-index.md), [`apple-podcasts`](../schemes/apple-podcasts.md), and [`letterboxd`](../schemes/letterboxd.md). Their grammars are respectively `^[1-9]\d*$`, `^[1-9]\d*$`, and `^film:[a-z0-9]+(?:-[a-z0-9]+)*$`. Canonicalization is the identity function on the complete valid value: no trimming, case folding, or leading-zero repair. Invalid values MUST be rejected, never repaired.

The podcast namespaces unambiguously identify podcast feeds (`podcast-series`); Letterboxd identifies films (`movie`). All three are valid and typed but **not anchor-eligible**: they have a P1 floor, reported as `anchorIneligibilityReason: 'provider-local'`. In `schemes.json`, `anchorIneligibleValuePattern: "^[\\s\\S]*$"` means **whole scheme ineligible**, using the existing value-pattern mechanism. No Class D identifier may mint as a bare P0 anchor.

Projection emits these identities on the `handle` rung, never the registry-backed strong path. `podcast-index` is second after `podcastguid` for podcast-series and second after `rssitem` for podcast-episode; its namespace still identifies a feed, not an episode. `apple-podcasts` is matching-only for podcast-series, listed after `wd` in the alias-only policy and excluded from primary category scheme orders. Letterboxd adds no category rung: movie remains `wd:film`, `tmdb:movie`, `imdb:title`. Matching aliases do not authorize primary category selection; the existing alias-only policy governs that distinction.

This amendment changes only these previously unregistered namespaces. Existing scheme canonical bytes, typing, eligibility and category policies remain unchanged. The parity ruling is in effect by default, subject to ratification in review.

---

**Previous:** [8. Equivalence](./08-equivalence.md) · **Back to:** [Overview](./00-overview.md)
