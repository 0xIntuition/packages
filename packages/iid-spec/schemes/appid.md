# `appid` — Mobile Application ID

| | |
| :-- | :-- |
| Identity class | B — intrinsic natural key |
| Openness tier | — (Class B) |
| Scheme typing | unambiguous (an application) |
| Natural key | A platform-enforced unique bundle ID / package name |
| Canonical form | `<store>:<bundle-id>` with `store` ∈ {`ios`, `android`} |

## What it identifies

A mobile application, identified by its bundle ID (iOS) or package name (Android). The store platform enforces uniqueness of these identifiers as a technical invariant — two apps cannot share a package name on one platform — which is what makes this a natural key rather than a registry assignment: the identifier is part of how the platform addresses the app, not a catalogue number issued alongside it.

The store prefix passes the scoped-identifier litmus test ([§5.5.1](../spec/05-identity-ladders.md)): `com.spotify.music` is only guaranteed unique *within* Google Play's namespace, so the store belongs in the identifier.

The scheme is unambiguously typed — an `appid` is always an application — so it is eligible for P0 anchoring ([§7](../spec/07-representation-profiles.md)).

## Value grammar

```text
value     = store ":" bundle-id
store     = "ios" / "android"
bundle-id = 1*( %x61-7A / DIGIT / "." / "_" / "-" )   ; a-z 0-9 . _ -
```

The value contains a colon; split the IID on the first two colons only ([§2.3](../spec/02-grammar.md)):

```text
int:appid:ios:com.spotify.client
int:appid:android:com.spotify.music
```

## Canonicalization

1. Trim surrounding whitespace and match `<store>:<rest>` where the store segment is alphabetic. Reject on no match.
2. Lowercase the store. It MUST be `ios` or `android`; reject any other store.
3. Lowercase the bundle ID. Vendors and listings render bundle IDs with inconsistent case (`com.Spotify.Client` vs `com.spotify.client`) while the platforms resolve them to the same app; case-folding here is what lets two independent writers converge, which byte-exact comparison ([§2.4](../spec/02-grammar.md)) would otherwise prevent.
4. The lowercased bundle ID MUST consist only of `a-z 0-9 . _ -`. Reject anything else — a bundle ID containing spaces, slashes, or non-ASCII is not a real platform identifier.

## Validation

A value is canonical iff canonicalizing it returns it unchanged: a registered store and an all-lowercase bundle ID in the permitted alphabet. `ios:com.Spotify.Client` is well-formed but not valid and MUST be rejected ([§2.5](../spec/02-grammar.md)).

## Test vectors

| Raw input | Canonical value | Note |
| :-- | :-- | :-- |
| `ios:com.Spotify.Client` | `ios:com.spotify.client` | bundle ID lowercases |
| `android:com.spotify.music` | `android:com.spotify.music` | android package name |
| `windows:spotify` | ✗ reject | unregistered store |

## Notes and limitations

- **One app, two identifiers.** The same product shipped on both platforms yields two IIDs (`ios:…` and `android:…`); they are joined by an equivalence claim, not merged at the identifier layer. This is correct: the two store listings are genuinely distinct artifacts with distinct binaries, ratings, and lifecycles.
- The store list is frozen with the scheme (tenet 5). Additional stores (desktop platforms, alternative Android stores) ship as a registry change under governance, not as an in-place edit to this scheme.
- The bundle ID identifies the app, not a version or a listing-page URL. Store URLs canonicalize under [`url`](./url.md) and rank below `appid` for app entities, since the bundle ID survives listing-page redesigns.
- Numeric store IDs (Apple's `id324684580`) are *not* this scheme's value; the bundle ID is preferred because it is the developer-chosen, platform-enforced key. A numeric ID travels as evidence.
