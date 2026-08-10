# 5. Identity ladders

---

## 5.1 Definition

An **identity ladder** is an entity type's ordered list of identifier options, strongest first. It answers the question: *given whatever facts we happen to have about this thing, which identifier should it get?*

Every entity type MUST declare exactly one ladder, consisting of:

| Property | Meaning |
| :-- | :-- |
| `slug` | The entity type's stable slug (`movie`, `music-group`, …). Namespaces `gen1` hashes. |
| `identifies` | Which abstraction level this entity type identifies ([§5.5](#55-abstraction-levels)). |
| `rungs` | The ordered rungs, strongest first. |

A **rung** is either:

- a **scheme rung** — a Class A or B scheme plus a rule for extracting its raw value from the entity's fields; or
- a **`gen1` rung** — a stable tag plus the named set of fields the recipe hashes ([§6](./06-gen1.md)).

Rungs MUST be ordered by the rules in [§3.5](./03-identity-classes.md).

### Example

The ladder for `movie`:

| Rung | Class | Tier | Scheme | Fires when |
| :-: | :-: | :-: | :-- | :-- |
| 1 | A | T2 | `wd` | A Wikidata QID is known |
| 2 | A | T1 | `eidr` | An EIDR is known |
| 3 | A | T2 | `tmdb` | A TMDB movie ID is known |
| 4 | A | T3 | `imdb` | An IMDb title ID is known |
| 5 | C | — | `gen1{name, yearPublished}` | Both title and release year are present |
| 6 | C | — | `gen1{name}` | A title is present |

## 5.2 Selection algorithm

> **Mint using the highest rung whose complete field set is available and valid.**

Normatively:

```text
derive(entity, ladder):
    for each rung in ladder.rungs, in order:
        if rung is a scheme rung:
            raw ← rung.extract(entity)
            if raw is absent: continue
            value ← scheme.canonicalize(raw)
            if value is undefined: continue          # invalid — try the next rung
            return "int:" + scheme + ":" + value

        if rung is a gen1 rung:
            values ← { field.key → NORM-1(field.extract(entity)) for each field }
            if any value is absent or empty: continue        # all-or-nothing
            return buildGen1(ladder.slug, rung.tag, values)

    return undefined                                  # entity cannot be identified
```

Four requirements follow:

1. **A rung that produces an invalid value MUST be skipped, not fail the derivation.** A malformed ISBN in the source data means the book falls through to the next rung — it does not mean the book cannot be minted. Bad data from one provider must not block identification.
2. **`gen1` rungs are all-or-nothing.** If a recipe names three fields and only two are present, the rung does not fire. Hashing a partially-filled recipe would make the identifier depend on *data completeness* rather than on the entity, so the same film would get different identifiers from a rich source and a sparse one.
3. **Derivation MAY return nothing.** An entity with no name, no identifier, and no natural key cannot be identified, and the specification does not invent one for it.
4. **The algorithm MUST be deterministic given the entity's fields.** Two implementations evaluating the same ladder against the same fields produce the same result, including the same choice of rung.

## 5.3 One identifier per atom

> **Exactly one IID is embedded in an atom's data at mint: the primary.**

This is a hard requirement, and the reason is subtle enough to state fully.

The atom ID is a hash of the atom's data. If the data carried a *variable number* of identifiers, then a minter who knew three identifiers and a minter who knew one would produce different atom data for the same entity — and therefore different atoms. **The identifier list would leak data completeness into identity, which is exactly the failure the specification exists to prevent.**

So: one primary IID. All other known identifiers travel as:

- **`sameAs` evidence** in the atom's payload — corroborating references, not identity claims; or
- **equivalence claims** made after the fact ([§8](./08-equivalence.md)).

Both are strictly better places for them. Evidence and claims can accumulate without limit and can be corrected; on-chain atom data cannot.

## 5.4 Upgrades

Discovering a stronger identifier later **never** mutates an existing atom. It cannot — the data is on-chain and immutable.

Instead:

1. The stronger identifier is minted as a new atom (or already exists as one).
2. An equivalence claim links the two.
3. The equivalence layer elects the stronger identifier's atom as identity-canonical for the cluster ([§8.3](./08-equivalence.md)).

This is why Class C identifiers are described as *expected to be superseded* rather than as errors. A `gen1` atom minted from a band's name is not a mistake to be cleaned up; it is a correct record of what was known at that moment, later joined to a stronger record.

## 5.5 Abstraction levels

Every entity type MUST declare what it identifies, because many domains have several legitimate levels and confusing them silently corrupts the graph.

| Domain | Level stack (most abstract first) | What we identify |
| :-- | :-- | :-- |
| Books | work → edition → physical copy | The **work**. `isbn` identifies an edition, and edition atoms attach to the work cluster by equivalence. |
| Music | artist → release-group → release → recording | Three separate entity types, one per level. `music-album` is the **release-group**, not a pressing. |
| Film | work → release/version | The **work**. |
| Commerce | company → brand → local business → premises | Four separate entity types. A McDonald's franchise is not the McDonald's brand. |
| Software | package → version | The **package**. `purl` values have their version stripped. |
| Podcasts | series → feed item | Two entity types. An episode atom identifies the **feed item**; the episode-as-work is the cluster over feed items. |

Two entities at different levels MUST NOT be merged by the equivalence layer. A name match across levels — the brand "McDonald's" and forty thousand restaurants called "McDonald's" — is evidence of a *relationship*, never of identity. Candidate generation MUST therefore be level-aware.

### 5.5.1 The scoped-identifier litmus test

Some identifiers legitimately embed a container: an `rssitem` is scoped by its feed, a `caip19` asset by its chain, an `appid` by its store, a `termset` term by its set. Others must not be: a restaurant's identifier does not embed its chain.

The test that separates them:

> **Scope belongs in the identifier only when the child has no identity independent of the container.**
>
> Ask: *if the container vanished or was renamed, would the child still be identifiable as itself?*

A podcast episode's GUID is a publisher-chosen string, meaningless outside its feed — scope it. Token `0xa0b8…` is meaningless without knowing its chain — scope it. A restaurant remains that restaurant regardless of which sign hangs on it — do **not** scope it; the chain membership is a relationship claim.

Embedding a relationship in an identifier fails for three compounding reasons: it makes the child's identifier contingent on correctly resolving the parent (so two importers who disagree about the parent produce different identifiers for the same child); relationships change while identifiers cannot, so a franchise sale turns a permanent identifier into a false statement; and it builds a second, worse graph inside a system that already has subject–predicate–object as its native primitive.

### 5.5.2 Why concepts get simpler identifiers

Concepts — brands, companies, works — tend to receive short Class A identifiers, while instances tend to receive Class C hashes. This is not a rule in the specification; it is a consequence of one.

Concepts are notable, notable things are covered by registries, and ladders reward registry coverage. Instances are long-tail and uncovered, so they fall to `gen1`. The identifier space ends up shaped like the world's own distribution of documented knowledge, without anything in the specification arranging for it.

## 5.6 What ladders must not do

1. A rung MUST NOT incorporate the free-text name of a related entity ([§0.3](./00-overview.md), tenet 3). A book's recipe excludes its author; a recording's excludes its artist; a product's excludes its brand.
2. A rung MUST NOT incorporate a value that varies by observer, by time of observation, or by source. This excludes retrieval timestamps, source names, provider record IDs that are not stable identifiers, and any counter.
3. A rung MUST NOT incorporate personal data used solely as a disambiguator. Notably, a person's date of birth MUST NOT enter an identity hash, even though it would disambiguate effectively — an immutable public record is the wrong place for it, and the resulting ambiguity is handled by the equivalence layer instead.
4. A rung MUST NOT require network access to evaluate ([§0.3](./00-overview.md), tenet 4).

---

**Previous:** [4. Normalization](./04-normalization.md) · **Next:** [6. The `gen1` scheme](./06-gen1.md)
