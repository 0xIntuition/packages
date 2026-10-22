# 8. Equivalence

> **Status: informative.** This section describes the layer that sits *above* identifiers and explains what IIDs deliberately do not solve. It is included because a specification that presented deterministic identifiers as a complete answer to entity resolution would be misleading. The equivalence layer's own normative rules are defined elsewhere.

---

## 8.1 Why identifiers are not enough

> **De-duplication is identifiers plus an equivalence layer. Never identifiers alone.**

One real entity legitimately carries many identifiers. A book has one ISBN per edition. A recording has one ISRC per release. A business has a Wikidata QID *and* a geohash-derived identifier. A band has an ISNI *and* a MusicBrainz ID.

Deterministic identifiers make *exact* duplicates impossible — two parties with the same facts converge automatically, which handles the overwhelming bulk of real duplication. They cannot make two *different but correct* identifiers for one entity converge, because there is no deterministic function from "this ISNI" to "that MBID". That is a lookup, a judgement, or an assertion — and each of those is a claim.

So the architecture splits along the line of what is mechanical and what is not.

## 8.2 Three layers

| Layer | Mechanism | Guarantee |
| :-- | :-- | :-- |
| **1 — Mint-time collision** | Identical facts, normalized identically, produce byte-identical atom data and therefore the same atom ID. The mint is literally the same atom. | Absolute, at the protocol level. Fires only when *all* atom data matches — which is precisely what a [P0 anchor](./07-representation-profiles.md) guarantees. |
| **2 — Identifier keying** | The indexer maintains a unique index on the embedded IID. A new atom bearing an already-seen IID joins that identity cluster at ingest. | Deterministic. Fires whenever identifiers match, even when descriptions differ. |
| **3 — Equivalence graph** | `sameAs` claims between atoms, clustered by union-find. | Attested. Handles multi-identifier entities, strength upgrades, and cross-scheme identity. |

Layer 2 is the guarantee. Layer 1 is the bonus. Layer 3 is the completion.

Between layers 2 and 3 sits **candidate generation**: a matching stage that proposes `sameAs` edges for review rather than merging directly. It exists because Class C identifiers fork more than intuition suggests — geohash cell-boundary straddle alone forks roughly a quarter of venues under realistic GPS jitter. Exact identifier keying is therefore the *blocking* stage of a standard entity-resolution pipeline, not the whole pipeline.

Candidate generation searches deliberately narrow neighbourhoods: adjacent geohash cells for the same normalized name, release year ± 1 for the same title, the same normalized name across entity types. Proposals enter the layer-3 acceptance pipeline; they never merge on their own.

## 8.3 Canonical election

Each cluster elects one canonical atom — the one applications render and link to, and the default target for new claims:

1. Highest identity class wins: **A > B > C**.
2. Tie → higher rung within the entity type's ladder.
3. Tie → earliest mint.
4. Tie → lowest atom ID, lexicographically.

Rule 3 rewards first movers with canonical status without granting them semantic authority: a later atom bearing a stronger identifier takes canonical status from an earlier Class C atom, because rule 1 outranks rule 3. That ordering is the economic incentive to mint with strong identifiers.

## 8.4 Merges are reversible

**No atom is ever deleted or rewritten.** A cluster is a projection over accepted edges. Signal, claims, and positions remain on their original atoms and are aggregated at cluster level for display and ranking.

A wrong merge is therefore corrected by removing an edge from the accepted set and recomputing — not by unpicking a destructive operation. A `differentFrom` counter-claim above the dispute threshold excludes an edge from the union until resolved.

This property is what makes it safe for the identifier layer to be aggressive about automatic clustering: every automatic decision is reversible.

## 8.5 Trust and adversarial cases

| Concern | Treatment |
| :-- | :-- |
| **Identifiers are claims, not certificates** | Anyone may mint `int:isbn:X` over any data. Check digits catch typos, never lies. Verification is a stakeable, disputable claim about the atom. |
| **Squatting** | Minting a correct identifier first is not an attack — the data is either accurate (a useful mint) or inaccurate (disputable, and canonical election moves status to better atoms). |
| **Misleading data under a real identifier** | An ordinary false-claim scenario, handled by dispute mechanics, not by the identifier layer. |
| **Poisoned equivalence edges** | The sharpest attack, since wrong merges pollute aggregation. Mitigated by acceptance thresholds, `differentFrom` counter-edges, view-layer-only merges, and per-consumer strictness. |

Acceptance thresholds are consumer configuration, not protocol. Different applications may reasonably choose different strictness over the same underlying graph.

## 8.6 The division of labour

| | Identifiers | Equivalence claims |
| :-- | :-- | :-- |
| Nature | Mechanical, deterministic | Social, contestable |
| Cost | Free | Carries economic weight |
| Handles | The high-volume, obvious cases | The judgement calls |
| Reversible | N/A — nothing is decided | Yes, by design |
| Fails by | Producing an honestly ambiguous identifier | Being disputed |

This split is the reason the identifier layer can afford to be strict, minimal, and frozen. It does not have to be right about hard cases. It only has to be *predictable*, and to hand the hard cases upward in a form that a person can inspect and argue with.

---

**Previous:** [7. Representation profiles](./07-representation-profiles.md) · **Next:** [9. Registry governance](./09-registry-governance.md)
