# 3. Identity classes and openness tiers

---

## 3.1 Why identifiers are classified

Not all identifiers are equally trustworthy, and a specification that treated them as equal would be lying by omission.

An ISBN is unique because an international agency guarantees it. An Ethereum address is unique because of the mathematics of the keypair that produced it. A hash of the string `"Nirvana"` is unique to *the string* `"Nirvana"` and to nothing else in the world.

These are three fundamentally different kinds of statement, and the specification names them so that both machines and people can act on the difference. **Every scheme belongs to exactly one class**, and the class is a fixed property of the scheme, not of any individual identifier.

## 3.2 The three classes

### Class A — registered authority

> An external registry assigns the identifier and guarantees its uniqueness. We borrow their authority.

Class A identifiers are collision-free by construction. The guarantee is institutional: some organization's actual job is ensuring no two entities receive the same identifier, and they have been doing it, in most cases, for decades.

| Scheme | Authority |
| :-- | :-- |
| [`isbn`](../schemes/isbn.md) | International ISBN Agency |
| [`isrc`](../schemes/isrc.md) | IFPI |
| [`iswc`](../schemes/iswc.md) | CISAC |
| [`isni`](../schemes/isni.md) | ISNI International Agency |
| [`orcid`](../schemes/orcid.md) | ORCID, Inc. |
| [`lei`](../schemes/lei.md) | GLEIF |
| [`gtin`](../schemes/gtin.md) | GS1 |
| [`doi`](../schemes/doi.md) | International DOI Foundation |
| [`eidr`](../schemes/eidr.md) | EIDR Association |
| [`wd`](../schemes/wd.md) | Wikidata |
| [`mbid`](../schemes/mbid.md) | MusicBrainz |
| [`olid`](../schemes/olid.md) | OpenLibrary |
| [`imdb`](../schemes/imdb.md) | IMDb |
| [`tmdb`](../schemes/tmdb.md) | The Movie Database |
| [`podcastguid`](../schemes/podcastguid.md) | Podcasting 2.0 (publisher-declared) |

### Class B — intrinsic natural key

> The entity contains its own unique, verifiable identity. No registry is needed or possible.

Nobody assigns a Class B identifier. It falls out of what the entity *is*. An Ethereum address is the account. A URL is the page's address. A SHA-256 digest is the file's content, compressed to 32 bytes — change one byte and it is provably a different file.

Class B identifiers are as strong as Class A but derive their strength from mathematics or protocol rather than from an institution. They cannot be revoked, corrupted, or discontinued, because there is no issuer to discontinue them.

| Scheme | Natural key |
| :-- | :-- |
| [`url`](../schemes/url.md) | The resource's address |
| [`caip10`](../schemes/caip10.md) | A blockchain account or contract address |
| [`caip19`](../schemes/caip19.md) | An on-chain asset's chain + contract |
| [`hash`](../schemes/hash.md) | A cryptographic digest of the content bytes |
| [`appid`](../schemes/appid.md) | A platform-enforced unique bundle ID / package name |
| [`purl`](../schemes/purl.md) | A package's ecosystem + name |
| [`geo`](../schemes/geo.md) | A geohash cell of the Earth's surface |
| [`acct`](../schemes/acct.md) | A platform's immutable user ID |
| [`rssitem`](../schemes/rssitem.md) | A feed GUID + the publisher's item GUID |
| [`termset`](../schemes/termset.md) | A term set + the term's code within it |

### Class C — derived composite key

> No authority and no natural key exists. A canonicalized subset of the entity's own descriptive attributes is hashed.

Class C is legitimate and necessary — most things in the world have no registered identifier — but it is **explicitly weak, by construction, and the specification says so in the identifier itself**.

There is exactly one Class C scheme: [`gen1`](../schemes/gen1.md).

A Class C identifier does not claim to identify a unique entity. It identifies *the set of facts it was derived from*. When two distinct entities share those facts, they share the identifier, and this is the correct outcome ([§0.3](./00-overview.md), tenet 2). Class C identifiers are expected to be superseded over time as stronger identifiers are discovered, via the equivalence layer ([§8](./08-equivalence.md)).

Implementations that display entities to users SHOULD surface the distinction between Class A/B and Class C, because the difference is material to how much a user should trust that two things are the same thing.

## 3.3 Openness tiers

Within Class A, a second axis applies. Two registries may be equally authoritative and equally correct, yet differ in whether anyone outside the registry can actually work with their data.

| Tier | Meaning | Examples |
| :-: | :-- | :-- |
| **T1** | Open standard. The identifier is validatable entirely offline — the check digit is the proof. No registry access is required at all. | `isbn`, `isrc`, `iswc`, `isni`, `orcid`, `lei`, `gtin`, `doi`, `eidr` |
| **T2** | Community registry with open data. Identifiers are assigned by an organization, but the full dataset is published under an open licence — bulk exports, dumps, or an openly licensed API. | `wd`, `mbid`, `olid`, `tmdb`, `podcastguid` |
| **T3** | Proprietary. The identifier is stable and widely used, but the dataset is closed. Correctness cannot be independently verified without the vendor's cooperation. | `imdb` |

### 3.3.1 The ordering rule

> **Within Class A, T1 and T2 schemes MUST rank above T3 schemes in an identity ladder.**

When two identifiers are equally correct, the more open one is preferred.

The clearest case is film. Both `tmdb` and `imdb` identify films reliably. TMDB publishes daily ID exports under an open attribution model; IMDb's dataset is closed and Amazon-owned. Both work. TMDB ranks higher, and Wikidata (CC0, T2, and cross-referencing both) ranks higher still.

The rationale is not ideological. An identifier that only one company can verify is a weaker foundation for a public knowledge graph than one anyone can verify, *independent of how well it functions today*, because the ability to independently check an identifier determines whether the graph can be audited, forked, or rebuilt without permission. T3 identifiers remain valuable as corroborating evidence; they are simply not the preferred anchor.

Openness is a **licensing and access** property, not a quality judgement. A T3 identifier is not less accurate. It is less verifiable by third parties.

### 3.3.2 Tier changes

A scheme's openness tier MAY change if a registry's licensing changes — a dataset opening or closing. Such a change is a MINOR version bump ([§1.5](./01-conformance.md)) and affects only which rung a *new* mint prefers. It never invalidates existing identifiers, and it never changes a scheme's canonicalization.

## 3.4 Class comparison

| | Class A | Class B | Class C |
| :-- | :-- | :-- | :-- |
| Uniqueness guaranteed by | An institution | Mathematics or protocol | Nothing — it is not guaranteed |
| Collisions possible | No | No | **Yes, by design** |
| Requires an external registry | Yes | No | No |
| Offline-validatable | T1 only | Yes | Yes |
| Can be revoked or discontinued | In principle | No | No |
| Expected to be superseded | No | No | **Yes** |
| Eligible for P0 anchoring ([§7](./07-representation-profiles.md)) | If unambiguously typed | If unambiguously typed | **Never** |

## 3.5 Class and the ladder

Identity ladders ([§5](./05-identity-ladders.md)) are ordered by these rules, in order of precedence:

1. Class A before Class B before Class C.
2. Within Class A: T1/T2 before T3 ([§3.3.1](#331-the-ordering-rule)).
3. Within a class and tier: the identifier that identifies the entity type most precisely ranks higher.
4. Within `gen1`: the recipe using more identifying fields ranks higher than the one using fewer.

Rule 3 resolves cases where one scheme names the exact thing and another names something adjacent. For a music recording, `isrc` identifies the recording itself and ranks above `mbid`, which is correct but broader in scope.

Rule 1 has one important consequence worth stating plainly: **a Class B natural key outranks no Class A registry identifier, but it does outrank every `gen1` hash.** A URL is a weaker anchor than an ISBN, and a far stronger one than a hash of a title.

---

**Previous:** [2. Grammar](./02-grammar.md) · **Next:** [4. Normalization](./04-normalization.md)
