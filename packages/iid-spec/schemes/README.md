# Scheme registry

This directory is the normative scheme registry referenced by [§9.1](../spec/09-registry-governance.md): the governed, **closed** list of schemes that may appear in `int:<scheme>:<value>`. A well-formed IID bearing a scheme not listed here is not a valid IID ([§1.3.1](../spec/01-conformance.md)) — implementations MUST reject unknown schemes rather than passing them through. Each scheme has exactly one normative document, containing its grammar, its ordered canonicalization algorithm, validation rules, and test vectors. Once ratified, a scheme's canonicalization rules are frozen ([§9.3](../spec/09-registry-governance.md)): improvements ship as new schemes, never as edits.

## The 26 schemes

| Scheme | Class | Tier | Typing | Identifies |
| :-- | :-: | :-: | :-- | :-- |
| [`isbn`](./isbn.md) | A | T1 | unambiguous | A book edition |
| [`isrc`](./isrc.md) | A | T1 | unambiguous | A sound recording |
| [`iswc`](./iswc.md) | A | T1 | unambiguous | A musical work (composition) |
| [`isni`](./isni.md) | A | T1 | polymorphic | A public name — person or organization |
| [`orcid`](./orcid.md) | A | T1 | polymorphic | A researcher |
| [`lei`](./lei.md) | A | T1 | unambiguous | A legal entity |
| [`gtin`](./gtin.md) | A | T1 | unambiguous | A trade item (product) |
| [`doi`](./doi.md) | A | T1 | polymorphic | A registered digital object |
| [`eidr`](./eidr.md) | A | T1 | unambiguous | An audiovisual work |
| [`wd`](./wd.md) | A | T2 | polymorphic | Any Wikidata entity |
| [`mbid`](./mbid.md) | A | T2 | unambiguous | A MusicBrainz entity (type in-value) |
| [`olid`](./olid.md) | A | T2 | unambiguous | An OpenLibrary work, edition, or author |
| [`imdb`](./imdb.md) | A | T3 | polymorphic | An IMDb title or name |
| [`tmdb`](./tmdb.md) | A | T2 | polymorphic | A TMDB movie, TV series, or person |
| [`podcastguid`](./podcastguid.md) | A | T2 | unambiguous | A podcast feed |
| [`url`](./url.md) | B | — | polymorphic | A web resource, by its address |
| [`caip10`](./caip10.md) | B | — | polymorphic | A blockchain account or contract |
| [`caip19`](./caip19.md) | B | — | unambiguous | An on-chain asset |
| [`hash`](./hash.md) | B | — | polymorphic | Content, by cryptographic digest |
| [`appid`](./appid.md) | B | — | unambiguous | A mobile application |
| [`purl`](./purl.md) | B | — | unambiguous | A software package |
| [`geo`](./geo.md) | B | — | polymorphic | A geohash cell of the Earth's surface |
| [`acct`](./acct.md) | B | — | unambiguous | A platform account |
| [`rssitem`](./rssitem.md) | B | — | unambiguous | A podcast feed item |
| [`termset`](./termset.md) | B | — | unambiguous | A term within a term set |
| [`gen1`](./gen1.md) | C | — | unambiguous | The facts a recipe hashed — not the entity itself |

Class and typing definitions are in [§3](../spec/03-identity-classes.md) and [§7.2](../spec/07-representation-profiles.md); openness tiers (an axis that applies within Class A only) in [§3.3](../spec/03-identity-classes.md). The class/typing assignments above are snapshotted in machine-readable form in [`conformance/schemes.json`](../conformance/schemes.json), and every scheme document's test vectors appear in [`conformance/canonicalization.json`](../conformance/canonicalization.json); both are normative fixtures.

## Adding a scheme

Adding a scheme is a specification change, governed by [§9.4](../spec/09-registry-governance.md). The proposal is a pull request adding one document to this directory, following the standard per-scheme template: the value grammar, the ordered canonicalization algorithm, validation rules, the identity class, the openness tier, the scheme typing, and a minimum of **five test vectors including at least two rejections**. The proposal must justify how the scheme satisfies all three admission criteria of [§9.2](../spec/09-registry-governance.md) — stable non-recycled identifiers, no restrictive licensing, deterministic offline canonicalization — and state which entity types' ladders gain a rung. On merge the scheme's rules freeze; new schemes are additive only and never change an existing identifier's meaning.
