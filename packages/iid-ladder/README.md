# @0xintuition/iid-ladder

Shared identifier-projection ladder for application, seed, and import pipelines.

The ladder selects the first canonical identity available in this order:

1. a registered strong identifier;
2. a provider handle that maps to a registered IID scheme;
3. a canonical URL;
4. an explicit envelope fallback.

```ts
import { projectIdentifierLadder } from '@0xintuition/iid-ladder';

projectIdentifierLadder({
	strongIdentifiers: { isrc: 'USUM71703861' },
	providerCanonicalId: 'spotify:track:1kcfGBb6kSrGqNIMW7rAlB',
	canonicalUrl: 'https://open.spotify.com/track/1kcfGBb6kSrGqNIMW7rAlB',
});
// { iid: 'int:isrc:USUM71703861', rung: 'strong' }
```

Strong inputs are canonicalized using their registered scheme rules; invalid
inputs are refused. Registered provider translations use the same frozen
canonicalizers. An already canonical `int:` provider ID passes through as the
strong rung, subject to the typed Wikidata policy below. Provider capability
resolution is verified in tests and is not a runtime precondition for identity
selection.

Under the R16 hold, provider-local namespaces such as `spotify:*`,
`podcast-index:`, `goodreads:book:` and `letterboxd:film:` remain explicit
`unregistered-provider` envelope fallbacks until their schemes are ratified.

## Category rungs

`IDENTITY_CATEGORY_RUNG_POLICY` shares the strongest-first identity order for
application, seed, and import pipelines:

| Category | Rungs, strongest first |
| --- | --- |
| `song` | `isrc`, `spotify:track` |
| `book` | `olid`, `isbn`, `goodreads:book` |
| `movie` | `wd:film`, `tmdb:movie`, `imdb:title` |
| `tv-series` | `wd:television-series`, `tmdb:tv`, `imdb:title` |
| `podcast-series` | `podcastguid`, `podcast-index`, `spotify:show` |
| `podcast-episode` | `rssitem`, `podcast-index`, `spotify:episode` |

`schemeOrderForIdentityCategory(category)` returns the corresponding scheme
order, accepts `music-recording` as `song` and `podcast` as `podcast-series`,
and returns `undefined` for unknown categories. `IdentityCategory` and
`IdentityRungToken` expose the supported categories and tokens as types.

When `strongIdentifierOrder` is present, it is an allowlist as well as an
ordering for strong selection. A mapped provider identifier joins that
selection in its scheme's position. A winning provider handle keeps the
`handle` rung; a winning `int:` identifier keeps the `strong` rung. The normal
provider-handle and URL fallback rules still apply if no strong candidate wins.

```ts
import {
	projectIdentifierLadder,
	schemeOrderForIdentityCategory,
} from '@0xintuition/iid-ladder';

projectIdentifierLadder({
	strongIdentifierOrder: schemeOrderForIdentityCategory('movie'),
	strongIdentifiers: { imdb: 'tt0073629' },
	providerCanonicalId: 'tmdb:movie:550',
});
// { iid: 'int:tmdb:movie:550', rung: 'handle' }
```

## Rung aliases

`iidForIdentityRung(token, value)` canonicalizes a descriptive identity alias
for matching. It does not select a primary IID. It returns `undefined` for
invalid values, mismatched subtypes, and provider-local tokens under the hold.

```ts
import { iidForIdentityRung } from '@0xintuition/iid-ladder';

iidForIdentityRung('isbn', '0140328726'); // 'int:isbn:9780140328721'
iidForIdentityRung('wd:film', 'q485271'); // 'int:wd:film:Q485271'
iidForIdentityRung('tmdb:movie', 'tv:550'); // undefined
iidForIdentityRung('podcast-index', '123'); // undefined
```

## Typed Wikidata identities

The ladder mints Wikidata IIDs only with an active EntitySchema binding, such
as `int:wd:film:Q42`. Bare QIDs remain parseable legacy identifiers in
`@0xintuition/iid`, but the ladder never mints them. Dormant typed bindings are
also refused. These rules apply to strong inputs, registered `wd:` handles,
and `int:wd:` provider identifiers.

A split hint such as `{ wd: 'Q42', wdSlug: 'film' }` produces
`int:wd:film:Q42`. An inactive split slug or conflicting Wikidata QIDs or typed
slugs disqualifies the WD candidates during strong selection, allowing another
eligible scheme to win.

`resolveWikidataP31Identity(p31)` maps supplied P31 QIDs to a schema type and,
for active bindings, a `wdSlug`. It uses `WIKIDATA_P31_IDENTITY_POLICY` and the
pinned active subclass closure with deterministic policy precedence; unknown
classes return `{ schemaType: 'Thing' }`. Dormant bindings retain their
classification without activating their slug. `WikidataP31Identity` describes
the result. `PINNED_ACTIVE_WD_P31_CLOSURE` and
`PINNED_ACTIVE_WD_P31_CLOSURE_SHA256` expose the pinned data and artifact digest.

The package is pure and offline. It performs no network I/O, provider
enrichment, contract calls, or atom serialization; P31 resolution uses only
the supplied classes and pinned local data.
