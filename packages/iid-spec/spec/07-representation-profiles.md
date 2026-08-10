# 7. Representation profiles

---

## 7.1 The question profiles answer

An IID names an entity. A separate question is **how much data travels alongside it** in the atom that carries it.

Both extremes are wrong. Carrying nothing but the identifier makes weak identifiers unverifiable and unrenderable. Carrying a full descriptive payload makes atom data — and therefore the atom's on-chain ID — depend on how much a particular minter happened to know, which forks the atom for one entity across sources.

The resolution is that **an atom's payload should scale with the entity's ambiguity**. A strong, self-describing identifier needs nothing else. A weak derived identifier needs the evidence it was derived from.

Three profiles, all serializations of the same identity.

## 7.2 The profiles

### P0 — anchor

Atom data is the **bare IID string**, nothing else.

```text
int:isbn:9780684832722
```

This yields a property that nothing else does:

```text
atomId = calculateAtomId(iid)
```

Identity becomes a pure function of the identifier. Two parties who derive the same IID mint *literally the same atom*, with zero coordination and no reliance on any indexer, projection, or off-chain agreement. Deduplication happens at the protocol layer, for free.

**Eligibility.** An IID MAY be minted as P0 only if **both** hold:

1. Its scheme is Class **A or B**. Class C never qualifies ([§6.6](./06-gen1.md)).
2. Its scheme is **unambiguously typed** ([§7.3](#73-scheme-typing)) — the identifier implies the entity's type on its own.

### P1 — identity context

Atom data is an object containing the type, the identifier, the identity-recipe fields, and any corroborating evidence.

```json
{
  "@context": "https://schema.org/",
  "@type": "Movie",
  "identifier": "int:gen1:movie:r4:fb681afe7d438cad73ae90a70f1cc55a",
  "name": "Inception",
  "yearPublished": "2010"
}
```

P1 is the **REQUIRED floor** for:

- **Class C identifiers** — the recipe fields are the hash's preimage evidence. Without them the identifier cannot be verified or re-derived, and there is nothing to display.
- **Polymorphically typed schemes** — a bare `int:wd:Q42` does not say whether Q42 is a person, a book, or a concept. The `@type` must live in the payload.

### P2 — enriched

Atom data is the full descriptive shape: P1 plus descriptions, images, dates, `sameAs` references, and any other schema.org properties the entity type declares.

```json
{
  "@context": "https://schema.org/",
  "@type": "Movie",
  "identifier": "int:wd:Q25188",
  "name": "Inception",
  "datePublished": "2010-07-16",
  "sameAs": [
    "https://www.imdb.com/title/tt1375666/",
    "https://www.themoviedb.org/movie/27205-inception",
    "https://www.wikidata.org/wiki/Q25188"
  ]
}
```

P2 is **opt-in**. Descriptive metadata belongs primarily to enrichment, claims, and open registries rather than to the identity payload — every field added to atom data is a field that can differ between two minters of the same entity, and each such difference is one more atom to reconcile later.

## 7.3 Scheme typing

A scheme is **unambiguously typed** if knowing an identifier's scheme and value is sufficient to know the entity's type. It is **polymorphic** otherwise.

| Typing | Schemes |
| :-- | :-- |
| **Unambiguous** | `isbn`, `isrc`, `iswc`, `lei`, `gtin`, `eidr`, `mbid`, `olid`, `podcastguid`, `caip19`, `appid`, `purl`, `acct`, `rssitem`, `termset`, `gen1` |
| **Polymorphic** | `isni`, `orcid`, `doi`, `wd`, `imdb`, `tmdb`, `url`, `caip10`, `hash`, `geo` |

Some schemes are unambiguous because their domain is narrow: an ISBN is always a book edition, an ISRC always a sound recording. Others carry the type inside the value: `mbid` values begin with an entity-type segment (`artist:`, `recording:`), `olid` values end with `W`/`M`/`A`, and `gen1` values begin with the entity type's slug.

The polymorphic cases are polymorphic for concrete reasons:

| Scheme | Why polymorphic |
| :-- | :-- |
| `wd` | Wikidata covers every kind of thing |
| `isni` / `orcid` | Assigned to persons *and* to bands and organizations |
| `doi` | Articles, datasets, and — via EIDR — films |
| `imdb` / `tmdb` | Values span films, series, and people |
| `url` | A URL can address anything |
| `caip10` | An address may be an account or a contract |
| `hash` | A digest of any content type |
| `geo` | A cell may be a location or a business's premises |

Note that `gen1` is unambiguously typed but still never P0-eligible — it fails the Class A/B requirement. Typing and class are independent conditions and both must hold.

## 7.4 Profiles and clustering

> **The same IID at any profile means one cluster.**

A P0 anchor for `int:isbn:9780684832722` and a P2 enriched atom carrying the same identifier are the same entity. The equivalence layer joins them with no claim required ([§8.2](./08-equivalence.md)).

Within such a cluster, two distinct roles are elected:

| Role | Which member | Used for |
| :-- | :-- | :-- |
| **Identity-canonical** | The P0 anchor, when one exists | The target of triples; the convergence point new claims attach to |
| **Display-canonical** | The richest attested member | What applications render by default |

Separating these matters. The anchor is the stable thing to point at — it never changes and is derivable by anyone. The display choice can improve over time as better-attested descriptions arrive, without ever moving the target that existing claims reference.

## 7.5 Requirements

1. An implementation MUST NOT mint P0 for a Class C identifier.
2. An implementation MUST NOT mint P0 for a polymorphically typed scheme.
3. An implementation MUST include the recipe fields when minting a Class C identifier.
4. Profiles are **additive**. Introducing or preferring a profile MUST NOT require re-minting anything that already exists.
5. An implementation consuming atoms MUST accept all three profiles for any entity type.

## 7.6 Choosing a profile

Non-normative guidance:

- If the identifier is anchor-eligible and the goal is a stable point for claims to attach to — **P0**. It is the cheapest atom possible and the only one with protocol-level dedupe.
- If the identifier is Class C, or the scheme is polymorphic — **P1**. This is a floor, not a preference; it is the minimum that is verifiable and renderable.
- If the atom is the primary record for an entity and descriptive data must be on-chain rather than in enrichment — **P2**. Prefer to justify this case rather than default to it.

---

**Previous:** [6. The `gen1` scheme](./06-gen1.md) · **Next:** [8. Equivalence](./08-equivalence.md)
