# `rssitem` — Podcast Feed Item

| | |
| :-- | :-- |
| Identity class | B — intrinsic natural key |
| Openness tier | — (Class B) |
| Scheme typing | unambiguous (a podcast feed item) |
| Natural key | The feed's GUID + a digest of the publisher's item GUID |
| Canonical form | `<feed-guid-uuid>:<32-hex-item-hash>`, entirely lowercase |

## What it identifies

An `rssitem` value names one item in one podcast feed — the *manifestation* level of the podcast domain ([§5.5](../spec/05-identity-ladders.md)): an episode atom identifies the feed item, and the episode-as-work is the equivalence cluster over feed items republished across feeds.

This is a **scoped identifier**, and it passes the litmus test of [§5.5.1](../spec/05-identity-ladders.md) cleanly: a feed item's GUID is a publisher-chosen string — often a URL, often just a slug — that is meaningful only within its feed. If the feed vanished, the item GUID would identify nothing. The scope therefore belongs *in* the identifier: the value binds the feed's GUID (the same UUID space as [`podcastguid`](./podcastguid.md)) to a fixed-length digest of the item's GUID.

## Value grammar

```regex
^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{32}$
```

Two colon-separated parts: a lowercase UUID (the Podcasting 2.0 feed GUID) and 32 lowercase hex characters (a 16-byte digest standing in for the publisher's item GUID). The value contains hyphens and one internal colon; per [§2.3](../spec/02-grammar.md) a parser splits an IID on the first two colons only.

## Canonicalization

1. Trim leading and trailing whitespace.
2. Lowercase the entire string.
3. Match `^([0-9a-f-]{36}):([0-9a-f]{32})$`. On no match, **reject**.
4. Verify the first part is a structurally valid UUID (8-4-4-4-12 grouping). On failure, **reject** — 36 characters of hex and hyphens in the wrong arrangement is not a feed GUID.
5. Reassemble as `<feed-guid>:<item-hash>`.

## Validation

A conforming validator accepts a value iff it is entirely lowercase, the first segment is a well-formed UUID, and the second is exactly 32 hex characters. No feed is fetched; whether the item exists in the feed is a resolution concern, not a validity concern.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `917393E3-1B1E-5CEF-ACE4-EDAA54E1F810:1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D` | `917393e3-1b1e-5cef-ace4-edaa54e1f810:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d` | feed GUID + item hash lowercase |
| `not-a-uuid:1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d` | ✗ reject | feed GUID must be a UUID |

## Notes and limitations

- **Why a hash instead of the raw item GUID.** Publishers put anything in `<guid>` — URLs, arbitrary Unicode, strings of any length. Raw item GUIDs would violate the IID grammar's visible-ASCII and length rules ([§2.2](../spec/02-grammar.md), requirements 3–5), which is exactly the case those rules anticipate: natural-language-shaped input reaches an IID only through a hash. The reference deriver computes the digest as the first 16 bytes of keccak-256 over the `NORM-1`-normalized item GUID (the same `keccak16` used by [`gen1`](../spec/06-gen1.md)). The canonicalizer itself accepts any 32-hex digest; the derivation rule lives with the entity type's ladder.
- **Class B despite containing a hash.** The hash here is an *encoding* of a publisher-assigned key, not a `gen1`-style composite of descriptive attributes. The pair (feed GUID, item GUID) is a genuine natural key — the publisher guarantees item-GUID uniqueness within their feed — so the identity claim is as strong as the publisher's feed discipline, not a probabilistic guess.
- **One item per feed, by design.** The same episode syndicated into two feeds gets two `rssitem` IIDs. That is correct: they are two manifestations. The work-level identity across feeds is established by the equivalence layer ([§8](../spec/08-equivalence.md)), never by guessing inside the identifier.
- **Feeds without a Podcasting 2.0 GUID cannot mint this scheme.** The feed GUID is required to be a UUID; feeds lacking one fall to the next rung of the podcast-episode ladder (typically `url`, then `gen1`).
