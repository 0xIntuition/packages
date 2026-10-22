# @0xintuition/iid-ladder

Shared identifier-projection ladder for application, seed, and import pipelines.
ESM-only.

```bash
npm install @0xintuition/iid-ladder@alpha viem@^2
```

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
strong rung, except Class D retains `handle`, subject to the typed Wikidata policy below. Provider capability
resolution is verified in tests and is not a runtime precondition for identity
selection.

The registered provider-local class (Class D, spec §9.7) admits `podcast-index:`,
`apple-podcasts:` and `letterboxd:film:`. These emit canonical IIDs on the `handle`
rung, retain byte-exact grammar, and never enter registry-backed strong selection.
Their valid typed IIDs have a whole-scheme P1 floor (`provider-local` eligibility
reason). Podcast IDs are positive digits without leading zeros; Letterboxd is
`film:<lowercase-hyphenated-slug>`. `apple-podcasts` remains a matching-only
podcast-series alias; Letterboxd adds no movie rung.

Other unregistered namespaces, including `spotify:*` and `goodreads:book:`,
remain explicit `unregistered-provider` envelope fallbacks by default.

## Category rungs

`IDENTITY_CATEGORY_RUNG_POLICY` shares the strongest-first identity order for
application, seed, and import pipelines:

| Category | Rungs, strongest first |
| --- | --- |
| `artist` | `isni`, `mbid:artist`, `wd`, `spotify:artist` |
| `music-album` | `mbid:release-group`, `wd`, `spotify:album` |
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

Music rows come from `MUSIC_IDENTITY_RUNG_POLICY` in `@0xintuition/iid`.
`IDENTITY_CATEGORY_ALIAS_ONLY_POLICY` admits `gtin` for album matching and
`wd` / `apple-podcasts` for podcast-series matching, never primary selection.
`identityRungsForCategory(category)` combines primary and alias-only rungs;
`schemeOrderForIdentityCategory` uses only primary rungs. `IDENTITY_CATEGORIES`,
`IDENTITY_RUNG_TOKENS` and `SCHEMA_TYPE_IDENTITY_CATEGORIES` expose the runtime
vocabulary and schema-to-category mapping.

When `strongIdentifierOrder` is present, it is an allowlist as well as an
ordering for strong selection. A mapped provider identifier joins that
selection in its scheme's position. Candidates in the same scheme are ranked
lexically by canonical IID; provider input does not overwrite direct input.
Wikidata conflict detection includes both sources. A winning provider handle keeps the
`handle` rung; a winning `int:` identifier keeps the `strong` rung. The normal
provider-handle and URL fallback rules still apply if no strong candidate wins.
For the category orders above, alias-only provider schemes are excluded from
primary selection, including the provider fallback path. With no other identifier,
the result is `no-identifier`; a supplied canonical URL can still win. The ladder
does not record aliases in its result.

Direct values are retained when a provider candidate supplies the same scheme.
Promotion runs conflict checks against those direct hints, and a rejected
candidate cannot re-enter through the provider fallback path.

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

`iidForIdentityRung(token, value, primarySchemaType?)` canonicalizes a descriptive
identity alias for matching. It does not select a primary IID. It returns `undefined` for
invalid values, mismatched subtypes, and provider-local tokens under the hold.
When `primarySchemaType` identifies a category, its alias-only rungs are also
refused (including typed WD values for `PodcastSeries`). Without that category
context, registered aliases such as GTIN remain available for matching.

```ts
import { iidForIdentityRung } from '@0xintuition/iid-ladder';

iidForIdentityRung('isbn', '0140328726'); // 'int:isbn:9780140328721'
iidForIdentityRung('wd:film', 'q485271'); // 'int:wd:film:Q485271'
iidForIdentityRung('tmdb:movie', 'tv:550'); // undefined
iidForIdentityRung('podcast-index', '123'); // 'int:podcast-index:123'
```

## Typed Wikidata identities

By default, the ladder mints Wikidata IIDs only with an active EntitySchema
binding, such as `int:wd:film:Q42`. Bare QIDs stay valid and polymorphic in
`@0xintuition/iid`. Set `allowPlainWd: true` only when the music/podcast policy
admits a plain primary (`isPlainWdPrimaryAllowed(primarySchemaType)`). This
allows plain strong inputs and canonical `int:wd:Q42` provider IDs; bare `wd:`
handles retain their existing refusal. Typed bindings remain opt-in through
the value or `wdSlug`, and dormant typed bindings remain refused.

For matching, `iidForIdentityRung('wd', 'Q42', primarySchemaType?)` allows plain
WD when the schema type is absent or admitted by `isPlainWdPrimaryAllowed`.
For example, `MusicGroup` is admitted and `Movie` is refused. Artist and album
MBID rungs require their canonical `artist:` or `release-group:` subtype.

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

## Wikidata labels

`pickWikidataLabel(labels, language = 'en')` selects a trimmed, nonblank string
value from the requested locale, then `en`, `en-gb`, `en-us`, `en-ca`, `en-au`,
and `mul`, in that order. It skips malformed entries and returns `undefined`
when no allowed locale has a usable value.
The labels root must be an object; arrays and other non-object roots are refused.

The package is pure and offline. It performs no network I/O, provider
enrichment, contract calls, or atom serialization; P31 resolution uses only
the supplied classes and pinned local data.

## Provider-local handles

The normative IID specification §9 has a closed registry. Known provider-local
prefixes such as Spotify, Goodreads, YouTube, and Steam are not admitted schemes.
The default `providerLocalHandles: 'reject'` retains every existing conformance
result, including `unregistered-provider` for valid but unregistered handles.

Applications preserving historical identities can opt into `'mint'`, an
**application-local identifier policy**, without changing the normative registry:

```ts
import { createLadder } from '@0xintuition/iid-ladder';

export const { projectIdentifierLadder, iidForIdentityRung } = createLadder({
  providerLocalHandles: 'mint',
});
```

This binds the same option accepted by the direct entry points:

```ts
projectIdentifierLadder(input, options?: LadderOptions): LadderResult;
iidForIdentityRung(rung, value, primarySchemaType?, options?: LadderOptions): string | undefined;
// LadderOptions = { providerLocalHandles?: 'reject' | 'mint' }
```

Minting applies only to the existing `unregistered-provider` fallback. It preserves
the app's byte-exact `int:<iidPrefix><value>` strings, grammar and length checks,
strong-identifier precedence, and alias-only decisions. Every other result passes
through unchanged. Unknown prefixes remain unmapped, invalid handles stay invalid,
and an already-prefixed unregistered `int:` input is not newly admitted.
These application-local strings do not become spec-valid or anchor-eligible merely
because this option emits them. `iidForIdentityRung` retains its canonical-node
check. `createLadder` captures the policy when constructed.

Known-answer fixtures in `__tests__/fixtures/provider-local-handles.json` are
produced by the unmodified app at `7fc0c82b4`; their provenance records the generating
command. Tests cover both modes, classification fixtures, all provider-local prefix
rows, alias contexts, and boundary values.
