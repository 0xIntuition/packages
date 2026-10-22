# 0. Overview

**Intuition ID Specification, version 0.1.0 — Draft**

---

## 0.1 Purpose

An **Intuition ID** (IID) is a deterministic, canonicalized identifier string for a real-world entity, of the form `int:<scheme>:<value>`.

The specification exists to satisfy one requirement:

> Two independent actors, working from the same available facts about the same entity, and following this specification, MUST derive byte-identical identifiers — without communicating with each other or with any central authority.

Where that requirement holds, duplicate entries for one entity converge automatically. Where it cannot hold — because the available facts are genuinely insufficient to distinguish two entities — the specification requires that the resulting identifier be *visibly* weak rather than falsely precise.

## 0.2 Scope

This specification defines:

- The identifier string's grammar, parsing rules, and comparison rules ([§2](./02-grammar.md)).
- A classification of identifiers by strength, and a preference ordering over them ([§3](./03-identity-classes.md)).
- `NORM-1`, the frozen string-normalization algorithm ([§4](./04-normalization.md)).
- The identity ladder: how an entity's identifier is selected from the facts available ([§5](./05-identity-ladders.md)).
- `gen1`, the derived-identifier algorithm used when no authority or natural key exists ([§6](./06-gen1.md)).
- Representation profiles: how much data accompanies an identifier ([§7](./07-representation-profiles.md)).
- The governance process for the scheme registry ([§9](./09-registry-governance.md)).
- A normative definition of each registered scheme ([`schemes/`](../schemes/README.md)).

This specification does **not** define:

- The equivalence layer — clustering, canonical-node election, and the trust model — which sits above IIDs and is summarized non-normatively in [§8](./08-equivalence.md).
- The on-chain atom format, atom ID derivation, or any protocol mechanics beyond the identifier's placement in atom data.
- Enrichment: how facts are obtained from external providers before derivation. Enrichment is explicitly out of band, and this boundary is load-bearing (see tenet 4 below).

## 0.3 Design tenets

These five tenets explain every non-obvious rule in this specification. When a rule seems arbitrary, it is usually one of these being applied.

### Tenet 1 — Hashing does not create identity

A hash preserves exactly as much uniqueness as its input had. `hash(name)` has precisely the collision and duplication characteristics of `name`, with the ambiguity now concealed behind an opaque string.

It follows that the specification's real work is not hashing but **ranking the facts that go into the hash**, and being explicit about how strong the result is. Everything in [§3](./03-identity-classes.md) and [§5](./05-identity-ladders.md) follows from this tenet.

### Tenet 2 — Ambiguity must be honest

When available facts cannot distinguish two entities, the correct behaviour is to produce one identifier for both and label it weak — not to fabricate a distinguishing input.

Two bands named Nirvana, identified only by name, MUST collide. The identifier `int:gen1:music-group:r4:…` does not claim to identify a band; it identifies *the name-level concept*, which is what the minter actually knew. Inventing a disambiguator (a sequence number, a timestamp, a source name) would destroy determinism to hide a limitation, producing a fresh identifier for the same entity on every import.

### Tenet 3 — Identity inputs are intrinsic only

An identifier's inputs MUST be facts about the entity *itself*: its own name, intrinsic stable scalars (a release date, a geographic cell), a content hash, or another entity's already-deterministic identifier.

An identifier MUST NOT incorporate the free-text name of a *related* entity — an author, a performing artist, a brand, an employer, a venue. Related-entity names vary in formatting between sources ("Davidson, J.D." vs "James Dale Davidson"), and any such variance forks the identifier of the entity being named. Relationships are expressed as claims between entities, never as inputs to an identifier.

This is why a book's identifier does not include its author, and a recording's does not include its artist.

### Tenet 4 — Canonicalization is pure and offline

Every transformation in this specification MUST be a pure function of its input. No network access, no clock, no filesystem, no locale, no randomness, no configuration.

This is what makes independent derivation reproducible. It is also why several tempting operations are excluded from canonicalization and pushed into enrichment: resolving HTTP redirects, reading a page's `<link rel="canonical">`, looking up a provider's API. These are all legitimate — they simply MUST happen *before* derivation, producing a better input, rather than *inside* it.

### Tenet 5 — Rules are frozen, versions are additive

Once a scheme's canonicalization rules are ratified, they are frozen. An improvement does not edit the rules in place; it ships as a new scheme name or a new version (`gen1` → `gen2`), and the two are bridged by equivalence.

The reason is that every derived identifier is a function of the rules. Editing a rule silently re-derives every identifier ever produced under it, breaking historical data that is, in Intuition's case, immutably on-chain. See [§9](./09-registry-governance.md).

## 0.4 The core claim, stated precisely

> **An IID is a claim of identity, not a certificate.**

Anyone may mint an atom carrying any IID. Nothing in this specification prevents an incorrect identifier from being attached to an entity, and no mechanism defined here validates that the entity described is the entity the identifier names.

Correctness is established above this layer, through the same attestation and staking mechanics that govern every other claim in Intuition. The identifier layer's guarantee is narrower and mechanical: *given these facts, this is the identifier* — nothing more.

## 0.5 What an IID is not

| It is not | Because |
| :-- | :-- |
| A guarantee of truth | Verification is attestation, layered above ([§8](./08-equivalence.md)) |
| The atom ID | The atom ID is derived from the whole atom payload; the IID travels *inside* that payload ([§7](./07-representation-profiles.md)) |
| A statement about which abstraction level | Each entity type declares what it identifies — a work, an edition, a performance. An ISBN identifies an edition; a book entry may identify a work. Mapping between levels is equivalence, not identity ([§5.5](./05-identity-ladders.md)) |
| Exhaustive | Exactly one IID is embedded per atom. Every other known identifier travels as evidence or as an equivalence claim ([§5.2](./05-identity-ladders.md)) |
| Permanent knowledge capture | An IID fixes identity at creation. Everything learned afterwards lives in claims around the atom |

## 0.6 Document conventions

Requirement levels (MUST, SHOULD, MAY) are used per [§1](./01-conformance.md). Scheme names appear as `code`. Example identifiers are real and, where marked, computed by the reference implementation.

---

**Next:** [1. Conformance](./01-conformance.md)
