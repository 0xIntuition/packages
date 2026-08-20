import type { SchemeName } from '@0xintuition/iid';

type ProviderPrefixMappingBase = { providerPrefix: string };

export type RegisteredProviderPrefixMapping = ProviderPrefixMappingBase & {
	kind: 'registered';
	scheme: SchemeName;
	schemeValuePrefix: string;
	stripLeadingAt?: true;
};

export type ProviderLocalPrefixMapping = ProviderPrefixMappingBase & {
	kind: 'provider-local';
	iidPrefix: string;
	valuePattern: RegExp;
};

export type ProviderPrefixMapping = RegisteredProviderPrefixMapping | ProviderLocalPrefixMapping;

const CASE_SENSITIVE_TOKEN = /^[A-Za-z0-9_-]+$/;
const SPOTIFY_ID = /^[0-9A-Za-z]{22}$/;
const YOUTUBE_VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const LOWER_TOKEN = /^[a-z0-9]+(?:[._-][a-z0-9]+)*$/;
const LOWER_OPAQUE = /^[a-z0-9@#./:_-]+$/;
const DIGITS = /^[1-9]\d*$/;

/**
 * Exhaustive audit map for provider canonical IDs currently emitted by the
 * private default classification preset. Registered rows may become IIDs.
 * Provider-local rows are recognized but must remain envelope fallbacks until
 * a public IID scheme is ratified for their namespace.
 */
export const PROVIDER_PREFIX_MAPPINGS = [
	{
		kind: 'provider-local',
		providerPrefix: 'spotify:track:',
		iidPrefix: 'spotify:track:',
		valuePattern: SPOTIFY_ID,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'spotify:album:',
		iidPrefix: 'spotify:album:',
		valuePattern: SPOTIFY_ID,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'spotify:artist:',
		iidPrefix: 'spotify:artist:',
		valuePattern: SPOTIFY_ID,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'spotify:playlist:',
		iidPrefix: 'spotify:playlist:',
		valuePattern: SPOTIFY_ID,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'spotify:show:',
		iidPrefix: 'spotify:show:',
		valuePattern: SPOTIFY_ID,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'spotify:episode:',
		iidPrefix: 'spotify:episode:',
		valuePattern: SPOTIFY_ID,
	},
	{
		kind: 'registered',
		providerPrefix: 'github:user:',
		scheme: 'acct',
		schemeValuePrefix: 'github:@',
	},
	{
		kind: 'provider-local',
		providerPrefix: 'github:org:',
		iidPrefix: 'github:org:',
		valuePattern: LOWER_TOKEN,
	},
	{
		kind: 'registered',
		providerPrefix: 'github:repo:',
		scheme: 'purl',
		schemeValuePrefix: 'github/',
	},
	{
		kind: 'provider-local',
		providerPrefix: 'github:issue:',
		iidPrefix: 'github:issue:',
		valuePattern: LOWER_OPAQUE,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'github:pull:',
		iidPrefix: 'github:pull:',
		valuePattern: LOWER_OPAQUE,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'github:commit:',
		iidPrefix: 'github:commit:',
		valuePattern: LOWER_OPAQUE,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'youtube:video:',
		iidPrefix: 'youtube:video:',
		valuePattern: YOUTUBE_VIDEO_ID,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'wikipedia:',
		iidPrefix: 'wikipedia:',
		valuePattern: LOWER_TOKEN,
	},
	{ kind: 'registered', providerPrefix: 'imdb:title:', scheme: 'imdb', schemeValuePrefix: '' },
	{ kind: 'registered', providerPrefix: 'imdb:name:', scheme: 'imdb', schemeValuePrefix: '' },
	{
		kind: 'registered',
		providerPrefix: 'tmdb:movie:',
		scheme: 'tmdb',
		schemeValuePrefix: 'movie:',
	},
	{ kind: 'registered', providerPrefix: 'tmdb:tv:', scheme: 'tmdb', schemeValuePrefix: 'tv:' },
	{
		kind: 'registered',
		providerPrefix: 'openlibrary:work:',
		scheme: 'olid',
		schemeValuePrefix: '',
	},
	{
		kind: 'registered',
		providerPrefix: 'openlibrary:book:',
		scheme: 'olid',
		schemeValuePrefix: '',
	},
	{
		kind: 'provider-local',
		providerPrefix: 'steam:app:',
		iidPrefix: 'steam:app:',
		valuePattern: DIGITS,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'coingecko:',
		iidPrefix: 'coingecko:',
		valuePattern: LOWER_TOKEN,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'coinmarketcap:',
		iidPrefix: 'coinmarketcap:',
		valuePattern: LOWER_TOKEN,
	},
	{
		kind: 'registered',
		providerPrefix: 'npm:package:',
		scheme: 'purl',
		schemeValuePrefix: 'npm/',
		stripLeadingAt: true,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'etsy:listing:',
		iidPrefix: 'etsy:listing:',
		valuePattern: DIGITS,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'shopify:product:',
		iidPrefix: 'shopify:product:',
		valuePattern: /^[a-z0-9.-]+:[a-z0-9]+(?:-[a-z0-9]+)*$/,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'goodreads:book:',
		iidPrefix: 'goodreads:book:',
		valuePattern: DIGITS,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'amazon:store:',
		iidPrefix: 'amazon:store:',
		valuePattern: LOWER_TOKEN,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'asin:',
		iidPrefix: 'asin:',
		valuePattern: /^[A-Z0-9]{10}$/,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'instagram:user:',
		iidPrefix: 'instagram:user:',
		valuePattern: LOWER_TOKEN,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'instagram:video:',
		iidPrefix: 'instagram:video:',
		valuePattern: CASE_SENSITIVE_TOKEN,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'instagram:post:',
		iidPrefix: 'instagram:post:',
		valuePattern: CASE_SENSITIVE_TOKEN,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'tiktok:user:',
		iidPrefix: 'tiktok:user:',
		valuePattern: LOWER_TOKEN,
	},
	{
		kind: 'provider-local',
		providerPrefix: 'tiktok:video:',
		iidPrefix: 'tiktok:video:',
		valuePattern: DIGITS,
	},
	{ kind: 'registered', providerPrefix: 'x:user:', scheme: 'acct', schemeValuePrefix: 'x:@' },
	{
		kind: 'provider-local',
		providerPrefix: 'x:post:',
		iidPrefix: 'x:post:',
		valuePattern: /^\d+$/,
	},
	{ kind: 'registered', providerPrefix: 'isbn:', scheme: 'isbn', schemeValuePrefix: '' },
	{
		kind: 'provider-local',
		providerPrefix: 'places:',
		iidPrefix: 'places:',
		valuePattern: LOWER_TOKEN,
	},
	{ kind: 'registered', providerPrefix: 'eip155:', scheme: 'caip10', schemeValuePrefix: 'eip155:' },
	{
		kind: 'provider-local',
		providerPrefix: 'ens:',
		iidPrefix: 'ens:',
		valuePattern: /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/,
	},
] as const satisfies readonly ProviderPrefixMapping[];

export const UNREGISTERED_PROVIDER_LOCAL_PREFIXES = PROVIDER_PREFIX_MAPPINGS.filter(
	(mapping) => mapping.kind === 'provider-local'
).map((mapping) => mapping.providerPrefix);

export const INTENTIONALLY_UNMAPPED_PROVIDER_PREFIXES = ['term:'] as const;
