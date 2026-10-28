# 1. Conformance

---

## 1.1 Requirement levels

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **MAY**, and **OPTIONAL** are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) and [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174), and only when appearing in all capitals.

## 1.2 Terminology

| Term | Definition |
| :-- | :-- |
| **IID** | An Intuition ID: a string of the form `int:<scheme>:<value>` conforming to [§2](./02-grammar.md). |
| **Scheme** | A registered identifier namespace (`isbn`, `url`, `gen1`, …) that owns the syntax and canonicalization of its values. |
| **Value** | Everything after the second colon. Opaque to generic parsers; interpreted only by the scheme that owns it. |
| **Canonicalization** | The pure function mapping a raw input string to a scheme's single canonical value form, or to *undefined* if the input is not valid for that scheme. |
| **Canonical form** | The unique output of canonicalization. A value `v` is in canonical form iff `canonicalize(v) = v`. |
| **Identity class** | One of A, B, or C — the strength category of a scheme ([§3](./03-identity-classes.md)). |
| **Openness tier** | One of T1, T2, or T3 — how openly available a Class A registry's data is ([§3.3](./03-identity-classes.md)). |
| **Identity ladder** | An entity type's ordered list of identifier options, strongest first ([§5](./05-identity-ladders.md)). |
| **Rung** | One entry in a ladder. |
| **Rung tag** | The stable numeric identifier `r<N>` of a `gen1` recipe, frozen at creation ([§6.4](./06-gen1.md)). |
| **Recipe** | The named set of fields a `gen1` rung hashes. |
| **Preimage** | The exact byte string a `gen1` hash is computed over ([§6.2](./06-gen1.md)). |
| **NORM-1** | The frozen string-normalization algorithm ([§4](./04-normalization.md)). |
| **Representation profile** | P0, P1, or P2 — how much data accompanies the identifier in an atom ([§7](./07-representation-profiles.md)). |
| **Anchor-eligible** | A property of an IID: whether it MAY be minted as a bare P0 anchor ([§7.2](./07-representation-profiles.md)). |
| **Classification** | An entity type (`movie`, `book`, `person`, …) with a declared schema and identity ladder. Referred to as an *entity type* in non-normative text. |
| **Minting** | Creating an on-chain atom carrying an IID. |
| **Enrichment** | Any out-of-band process that improves the facts available before derivation. Explicitly outside this specification ([§0.3](./00-overview.md), tenet 4). |

## 1.3 Conformance classes

### 1.3.1 Conforming validator

An implementation is a **conforming validator** if, for every registered scheme, it correctly decides whether a given string is a well-formed IID whose value is in that scheme's canonical form, per [§2](./02-grammar.md) and the scheme's own document.

A conforming validator MUST reject an IID whose scheme is not in the registry, even if the string is otherwise well-formed. Unknown schemes are not forward-compatible: accepting them would allow uncanonicalized values to enter the identifier space.

### 1.3.2 Conforming canonicalizer

An implementation is a **conforming canonicalizer** for a set of schemes if, for each scheme in that set, it implements the scheme's canonicalization algorithm exactly, and produces identical output to the scheme's published test vectors.

A conforming canonicalizer MUST be a pure function. It MUST NOT perform network I/O, read a clock, consult locale settings, or depend on any state outside its input.

A conforming canonicalizer MUST be idempotent: `canonicalize(canonicalize(x)) = canonicalize(x)` for all `x` where the inner call succeeds.

### 1.3.3 Conforming deriver

An implementation is a **conforming deriver** if it selects an entity's identifier by evaluating that entity's identity ladder per [§5](./05-identity-ladders.md), and, where a `gen1` rung is selected, computes the value per [§6](./06-gen1.md).

Implementations MAY be conforming validators or canonicalizers without being conforming derivers. Consuming IIDs is a lower bar than producing them, deliberately: reading the identifier space should be cheap.

## 1.4 Test vectors

Each scheme document contains a **Test vectors** section: a table of raw inputs paired with either an expected canonical value or an explicit rejection.

Test vectors are normative. Where a vector and the prose of a scheme document disagree, that is a defect in this specification and MUST be reported; neither takes automatic precedence, because a disagreement means the intent is unclear.

Every vector in this specification is executable against the reference implementation ([`@0xintuition/iid`](https://www.npmjs.com/package/@0xintuition/iid)). Vectors that the reference implementation does not currently satisfy are recorded in [`implementation-notes.md`](../implementation-notes.md), which states both the specified behaviour and the current behaviour.

## 1.5 Versioning

This specification is versioned `MAJOR.MINOR.PATCH`.

| Change | Version impact |
| :-- | :-- |
| A new scheme is registered | MINOR |
| A new `gen1` recipe rung is added to a ladder | MINOR |
| A ladder's rung order changes | MINOR |
| Editorial clarification with no behavioural effect | PATCH |
| A scheme's canonicalization changes | **Not permitted** — see [§9.3](./09-registry-governance.md) |
| The grammar in [§2](./02-grammar.md) changes | MAJOR |
| `NORM-1` changes | **Not permitted** — a new algorithm version ships as `NORM-2` with a new `gen*` scheme |

### 1.5.1 Stability guarantees

The following are frozen. An implementation MAY rely on them permanently:

1. **The grammar.** `int:<scheme>:<value>`, split on the first two colons, ASCII, maximum 256 bytes.
2. **Scheme canonicalization.** A ratified scheme's rules never change. `int:isbn:9780684832722` means the same thing forever.
3. **`NORM-1`.** The normalization algorithm and its step order are frozen.
4. **`gen1` preimage construction and hash.** Including the exact JSON serialization and the 16-byte keccak-256 truncation.
5. **Rung tags.** A `gen1` recipe's `r<N>` tag is frozen at creation and never reassigned, even if the ladder is reordered around it.

The following are explicitly **not** frozen and MAY change in a MINOR release:

1. Which schemes exist in the registry (additive only).
2. Which rung of a ladder an entity type prefers, and the ordering between rungs.
3. Which entity types exist.
4. The openness tier assigned to a scheme, if a registry's licensing changes.

The distinction matters: an existing identifier's *meaning* is permanent, but the *choice* of which identifier to mint for a newly created entity may improve over time. A ladder reordering never invalidates previously minted identifiers — it only changes what a fresh mint would produce, and any resulting divergence is reconciled by the equivalence layer ([§8](./08-equivalence.md)).

## 1.6 Status of this document

**Version 0.1.0, Draft.** Published for review and adoption.

The grammar, class system, `NORM-1`, `gen1` algorithm, and representation profiles are stable and in production use within Intuition. This specification is not submitted to, endorsed by, or under consideration at any standards body.

---

**Previous:** [0. Overview](./00-overview.md) · **Next:** [2. Grammar](./02-grammar.md)
