# `podcastguid` — Podcasting 2.0 Podcast GUID

| | |
| :-- | :-- |
| Identity class | A — registered authority |
| Openness tier | T2 — Podcasting 2.0; publisher-declared, indexed in open databases |
| Scheme typing | unambiguous (always a podcast feed) |
| Authority | Podcasting 2.0 (publisher-declared) |
| Canonical form | Lowercase hyphenated UUID |

## What it identifies

A podcast GUID names a podcast — the show as a whole, not any individual episode. It is the value of the `<podcast:guid>` tag defined by the Podcasting 2.0 namespace, designed to survive the one thing that historically destroyed podcast identity: feed URL changes. The show keeps its GUID across hosting migrations, domain changes, and redirects.

Every value in this scheme is a podcast feed, so the scheme is **unambiguously typed** and P0-eligible ([§7.2](../spec/07-representation-profiles.md)). Individual episodes are identified by the [`rssitem`](./rssitem.md) scheme, whose values are scoped by this same feed GUID.

## Value grammar

```regex
^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
```

A lowercase, hyphenated UUID. Nothing else — no URL forms, no prefixes.

## Canonicalization

1. Trim leading and trailing whitespace.
2. Lowercase the entire string.
3. Match against the UUID pattern above. On no match, **reject** (return undefined).

There is no URL-form stripping: the GUID circulates as a bare tag value, not as a resolvable URL.

## Validation

A conforming validator accepts a value iff it is a lowercase hyphenated UUID. The UUID version field is not inspected — the Podcasting 2.0 specification prescribes UUIDv5, but feeds in the wild declare v4 and other GUIDs, and the canonicalizer accepts the shape the ecosystem actually produces.

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `917393E3-1B1E-5CEF-ACE4-EDAA54E1F810` | `917393e3-1b1e-5cef-ace4-edaa54e1f810` | uppercase GUID lowercases |
| `not-a-uuid` | ✗ reject | not a UUID |

## Notes and limitations

- **Publisher-declared authority.** No agency assigns podcast GUIDs. The publisher declares the GUID in their own feed, and open indexes (notably the Podcast Index) record it. This is a materially weaker authority model than an assigned registry: uniqueness holds by convention and by the derivation recipe, not by institutional guarantee. The scheme still earns Class A/T2 because the declared GUID is the ecosystem's registered identity for the show and the indexes publishing it are open — but implementers should understand the guarantee is thinner than `isbn`'s.
- **The v5 derivation.** Podcasting 2.0 specifies the GUID as UUIDv5 of the feed URL (protocol and trailing slashes stripped) under a fixed namespace. When a publisher follows the recipe, anyone can re-derive and check the GUID offline; when they do not, the declared value simply *is* the identity. This canonicalizer validates shape only and does not attempt re-derivation.
- **Duplication in the wild.** Feeds copied between hosts occasionally carry a stale or duplicated GUID, and a publisher can (incorrectly) change theirs. These are data-quality events, handled at the equivalence layer ([§8](../spec/08-equivalence.md)), not by canonicalization.
- **Why lowercase.** UUIDs are case-insensitive by definition (RFC 4122 outputs lowercase); byte-exact comparison ([§2.4](../spec/02-grammar.md)) requires one fold, and lowercase matches the RFC's canonical output.
