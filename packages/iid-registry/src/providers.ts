/**
 * The scheme => enrichment-provider dimension.
 *
 * Slugs are CAPABILITY IDENTIFIERS for enrichment providers — never imports
 * of provider implementations; consumers assert alignment with their own
 * provider registries on their side of the boundary. The table declares the
 * DESIRED capability set, ordered open/no-key first (spec §3.3): an
 * enrichment engine intersects with what is actually registered and gated,
 * so providers may appear here before their lookups ship.
 *
 * An empty list means "no identifier-driven providers": for `url` that is a
 * sentinel for the existing URL-first pipeline, not "no enrichment"; for
 * `gen1`/`hash`/`termset` there is genuinely nothing to look up.
 */
import type { SchemeName } from '@0xintuition/iid';
import { parseCanonical } from './canonical.js';

export const PROVIDER_SLUGS = [
	'apple-music',
	'coingecko',
	'crossref',
	'etherscan',
	'github',
	'musicbrainz',
	'npm',
	'openlibrary',
	'podcast-index',
	'spotify',
	'tmdb',
	'wikidata',
	'x-profile',
] as const;

export type ProviderSlug = (typeof PROVIDER_SLUGS)[number];

const NONE: readonly ProviderSlug[] = Object.freeze([]);

export const PROVIDERS_BY_SCHEME: Readonly<Record<SchemeName, readonly ProviderSlug[]>> = {
	isbn: ['openlibrary'],
	isrc: ['musicbrainz', 'spotify', 'apple-music'],
	iswc: ['musicbrainz'],
	isni: NONE,
	orcid: NONE,
	lei: NONE,
	gtin: NONE,
	doi: ['crossref'],
	eidr: ['wikidata'],
	wd: ['wikidata'],
	mbid: ['musicbrainz', 'spotify'],
	olid: ['openlibrary'],
	imdb: ['tmdb', 'wikidata'],
	tmdb: ['tmdb'],
	podcastguid: ['podcast-index', 'apple-music'],
	url: NONE,
	caip10: ['etherscan'],
	caip19: ['coingecko', 'etherscan'],
	hash: NONE,
	appid: NONE,
	purl: ['npm', 'github'],
	geo: NONE,
	acct: ['github', 'x-profile'],
	rssitem: ['podcast-index'],
	termset: NONE,
	gen1: NONE,
};

/**
 * Ordered candidate providers for a scheme. For value-dependent schemes
 * (`acct`, `purl`, `caip10`, `caip19`) this is the union of what any value
 * of the scheme can use — `providersForIid` narrows to the actual value.
 */
export function providersForScheme(scheme: SchemeName): readonly ProviderSlug[] {
	return PROVIDERS_BY_SCHEME[scheme] ?? NONE;
}

/** `acct` values are `<platform>:<id-or-@handle>` — platform picks the provider. */
const ACCT_PLATFORM_PROVIDERS: Readonly<Record<string, readonly ProviderSlug[]>> = {
	github: ['github'],
	x: ['x-profile'],
	twitter: ['x-profile'],
};

/** `purl` values are `<type>/<namespace-and-name>` — the type picks the registry. */
const PURL_TYPE_PROVIDERS: Readonly<Record<string, readonly ProviderSlug[]>> = {
	npm: ['npm'],
	github: ['github'],
};

function segmentBefore(value: string, separator: string): string {
	const index = value.indexOf(separator);
	return index <= 0 ? '' : value.slice(0, index);
}

/**
 * Ordered providers for a concrete IID: the scheme's list, narrowed by the
 * value where the scheme's namespace decides capability. Malformed or
 * uncanonicalizable IIDs get no providers.
 */
export function providersForIid(iid: string): readonly ProviderSlug[] {
	const parsed = parseCanonical(iid);

	if (!parsed) {
		return NONE;
	}

	switch (parsed.scheme) {
		case 'acct':
			return ACCT_PLATFORM_PROVIDERS[segmentBefore(parsed.value, ':')] ?? NONE;
		case 'purl':
			return PURL_TYPE_PROVIDERS[segmentBefore(parsed.value, '/')] ?? NONE;
		case 'caip10':
		case 'caip19':
			// Today's chain providers are eip155-only; other namespaces are
			// valid IIDs with no lookup capability yet.
			return segmentBefore(parsed.value, ':') === 'eip155'
				? PROVIDERS_BY_SCHEME[parsed.scheme]
				: NONE;
		default:
			return PROVIDERS_BY_SCHEME[parsed.scheme];
	}
}
