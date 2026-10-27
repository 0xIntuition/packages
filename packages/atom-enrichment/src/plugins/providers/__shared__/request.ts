import { resolveCanonicalIid, resolveIdentifierHints } from '../../../identifier';
import type { AmazonTarget, EnrichmentRequest, GitHubTarget, XTarget } from '../../../types';

const urlLikePattern = /^https?:\/\//i;
const doiPattern = /^10\.\d{4,9}\/.+/;

/** Classifier-generated display title for a Goodreads book it could not read a title for. */
export const GOODREADS_PLACEHOLDER_TITLE_PATTERN = /^Goodreads Book \d+$/i;

const GENERATED_PROVIDER_PLACEHOLDERS = [
	{ host: 'amazon.com', pattern: /^Amazon Product [A-Z0-9]{10}$/i, provider: 'amazon' },
	{ host: 'etsy.com', pattern: /^Etsy Listing \d+$/i, provider: 'etsy' },
	{ host: 'goodreads.com', pattern: GOODREADS_PLACEHOLDER_TITLE_PATTERN, provider: 'goodreads' },
	{ host: 'imdb.com', pattern: /^IMDb (?:Person|Title) [a-z]{2}\d+$/i, provider: 'imdb' },
	{
		host: 'instagram.com',
		pattern: /^Instagram (?:Post|Video) [A-Za-z0-9_-]+$/i,
		provider: 'instagram',
	},
	{
		host: 'openlibrary.org',
		pattern: /^OpenLibrary (?:(?:Book|Edition) OL\d+M|Work OL\d+W)$/i,
		provider: 'openlibrary',
	},
	{
		host: 'open.spotify.com',
		pattern: /^(?:Spotify )?(?:Track|Album|Artist|Playlist|Show|Episode) [A-Za-z0-9]{8,}$/i,
		provider: 'spotify',
	},
	{ host: 'steampowered.com', pattern: /^Steam App \d+$/i, provider: 'steam' },
	{ host: 'tiktok.com', pattern: /^TikTok Video \d+$/i, provider: 'tiktok' },
	{
		host: 'themoviedb.org',
		pattern: /^TMDB (?:Movie|TV Series) \d+$/i,
		provider: 'tmdb',
	},
	{ host: 'youtube.com', pattern: /^YouTube Video [A-Za-z0-9_-]+$/i, provider: 'youtube' },
	{ host: null, pattern: /^Website [a-z0-9.-]+$/i, provider: 'default-url' },
] as const;

export function getRequestUrl(request: EnrichmentRequest): string | undefined {
	const hintUrl = request.input.hints?.url;
	if (
		typeof hintUrl === 'string' &&
		urlLikePattern.test(hintUrl) &&
		!isForbiddenTmdbSourceUrl(hintUrl)
	) {
		return hintUrl;
	}

	const jsonLdUrl = request.input.jsonLd.url;
	if (
		typeof jsonLdUrl === 'string' &&
		urlLikePattern.test(jsonLdUrl) &&
		!isForbiddenTmdbSourceUrl(jsonLdUrl)
	) {
		return jsonLdUrl;
	}

	const sameAsUrl = findFirstUrl(request.input.jsonLd.sameAs);
	if (sameAsUrl) {
		return sameAsUrl;
	}

	return undefined;
}

function findFirstUrl(value: unknown): string | undefined {
	if (typeof value === 'string') {
		const trimmed = value.trim();
		return urlLikePattern.test(trimmed) && !isForbiddenTmdbSourceUrl(trimmed) ? trimmed : undefined;
	}

	if (!Array.isArray(value)) {
		return undefined;
	}

	for (const entry of value) {
		const url = findFirstUrl(entry);
		if (url) {
			return url;
		}
	}

	return undefined;
}

function isForbiddenTmdbSourceUrl(value: string): boolean {
	try {
		const hostname = new URL(value).hostname.toLowerCase().replace(/\.+$/, '');
		if (hostname === 'imdb.com' || hostname.endsWith('.imdb.com')) return true;
		// JP ruling R1b (2026-08-27): TMDB is identity-only. No page, image,
		// OpenGraph, or API hostname may be used as an enrichment source.
		return hostname.endsWith('themoviedb.org') || hostname.endsWith('tmdb.org');
	} catch {
		return false;
	}
}

export function getRequestName(request: EnrichmentRequest): string | undefined {
	const hintName = request.input.hints?.name;
	if (typeof hintName === 'string') {
		const normalizedHintName = hintName.trim();
		if (normalizedHintName.length > 0 && !urlLikePattern.test(normalizedHintName)) {
			return normalizedHintName;
		}
	}

	const jsonLdName = request.input.jsonLd.name;
	if (typeof jsonLdName === 'string') {
		const normalizedJsonLdName = jsonLdName.trim();
		if (normalizedJsonLdName.length > 0 && !urlLikePattern.test(normalizedJsonLdName)) {
			return normalizedJsonLdName;
		}
	}

	return undefined;
}

/** Prevents catalog/search providers from querying with classifier-generated display fallbacks. */
export function isSynthesizedProviderPlaceholderTitle(
	request: EnrichmentRequest,
	title: string
): boolean {
	const normalizedTitle = title.trim();
	const placeholder = GENERATED_PROVIDER_PLACEHOLDERS.find(({ pattern }) =>
		pattern.test(normalizedTitle)
	);
	if (!placeholder) {
		return false;
	}

	const sourceProvider = request.input.source.provider?.trim().toLowerCase();
	const fallbackStage = request.input.source.fallbackStage?.trim().toLowerCase();
	const providerMatches =
		sourceProvider === placeholder.provider || sourceProvider === `${placeholder.provider}-url`;
	if (providerMatches && fallbackStage === 'generic') {
		return true;
	}

	// Preserve only the historical Goodreads host fallback. All newer provider
	// guards fail open unless the handoff carries an explicit generic stage.
	if (
		placeholder.provider !== 'goodreads' ||
		fallbackStage !== undefined ||
		(sourceProvider !== undefined && !providerMatches) ||
		!placeholder.host
	) {
		return false;
	}
	const requestUrl = getRequestUrl(request);
	if (!requestUrl) {
		return false;
	}

	try {
		const hostname = new URL(requestUrl).hostname.replace(/^www\./i, '').toLowerCase();
		return hostname === placeholder.host || hostname.endsWith(`.${placeholder.host}`);
	} catch {
		return false;
	}
}

export function getIdentifier(request: EnrichmentRequest, ...keys: string[]): string | undefined {
	const identifiers = resolveIdentifierHints(request.input);
	if (!identifiers) {
		return undefined;
	}

	for (const key of keys) {
		const value = identifiers[key];
		if (typeof value === 'string' && value.trim().length > 0) {
			return value.trim();
		}
	}

	return undefined;
}

export function getRequestIid(request: EnrichmentRequest): string | undefined {
	return resolveCanonicalIid(request.input);
}

export function getGitHubTarget(request: EnrichmentRequest): GitHubTarget | undefined {
	return request.input.targets?.github;
}

export function getAmazonTarget(request: EnrichmentRequest): AmazonTarget | undefined {
	return request.input.targets?.amazon;
}

export function getXTarget(request: EnrichmentRequest): XTarget | undefined {
	return request.input.targets?.x;
}

export function getDomainFromUrl(url: string): string | undefined {
	try {
		const parsed = new URL(url);
		return parsed.hostname;
	} catch {
		return undefined;
	}
}

export function getDoiFromRequest(request: EnrichmentRequest): string | undefined {
	const identifier = getIdentifier(request, 'doi');
	if (identifier) {
		return identifier;
	}

	const url = getRequestUrl(request);
	if (url) {
		const fromUrl = parseDoiFromUrl(url);
		if (fromUrl) {
			return fromUrl;
		}
	}

	const name = getRequestName(request);
	if (name && doiPattern.test(name)) {
		return name;
	}

	return undefined;
}

export function parseDoiFromUrl(url: string): string | undefined {
	try {
		const parsed = new URL(url);
		if (!parsed.hostname.includes('doi.org')) {
			return undefined;
		}

		const normalized = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
		return normalized.length > 0 ? normalized : undefined;
	} catch {
		return undefined;
	}
}

export function parseWikipediaTitleFromUrl(url: string): string | undefined {
	try {
		const parsed = new URL(url);
		if (!parsed.hostname.includes('wikipedia.org')) {
			return undefined;
		}

		const wikiPrefix = '/wiki/';
		if (!parsed.pathname.startsWith(wikiPrefix)) {
			return undefined;
		}

		const slug = decodeURIComponent(parsed.pathname.slice(wikiPrefix.length));
		const title = slug.replace(/_/g, ' ').trim();
		return title.length > 0 ? title : undefined;
	} catch {
		return undefined;
	}
}

export function parseNpmPackageFromUrl(url: string): string | undefined {
	try {
		const parsed = new URL(url);
		if (!parsed.hostname.includes('npmjs.com')) {
			return undefined;
		}

		const match = parsed.pathname.match(/^\/package\/(.+)$/);
		if (!match?.[1]) {
			return undefined;
		}

		return decodeURIComponent(match[1]);
	} catch {
		return undefined;
	}
}
