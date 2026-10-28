import { defineEnrichmentPlugin, type EnrichmentPlugin } from '../../../plugins';
import type { EnrichmentRequest } from '../../../types';
import { type FetchLike, fetchJsonWithSchema, ProviderHttpError } from '../__shared__/http';
import {
	getIdentifier,
	getRequestName,
	getRequestUrl,
	isSynthesizedProviderPlaceholderTitle,
} from '../__shared__/request';
import { type TvmazeShowResponse, tvmazeDataSchema, tvmazeShowResponseSchema } from './schema';

type CreateTvmazePluginOptions = {
	fetch?: FetchLike;
	priority?: number;
	TTL?: number;
};

type TvmazeTarget =
	| { kind: 'show'; showId: string }
	| { kind: 'imdb'; imdbId: string }
	| { kind: 'thetvdb'; thetvdbId: string }
	| { kind: 'title'; name: string; premiereYear?: number };

const TVMAZE_API_BASE_URL = 'https://api.tvmaze.com';
const PREMIERE_YEAR_TOLERANCE = 1;
const FOUR_DIGIT_YEAR_PATTERN = /(?:^|\D)((?:18|19|20|21)\d{2})(?:\D|$)/;
const HTML_ENTITY_PATTERN = /&(#x?[0-9a-f]+|[a-z]+);/gi;
const SCRIPT_OR_STYLE_PATTERN = /<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi;
const HTML_TAG_PATTERN = /<[^>]*>/g;

export function createTvmazePlugin(options: CreateTvmazePluginOptions = {}): EnrichmentPlugin {
	const fetcher = options.fetch ?? (globalThis.fetch as FetchLike);

	return defineEnrichmentPlugin({
		id: 'tvmaze',
		version: '1.0.0',
		runtime: 'server',
		artifactTypes: ['tvmaze'],
		priority: options.priority ?? 55,
		TTL: options.TTL ?? 43_200,

		supports(request: EnrichmentRequest) {
			return resolveTvmazeTarget(request) !== undefined;
		},

		async enrich(request, ctx) {
			const target = resolveTvmazeTarget(request);
			if (!target) {
				return [];
			}

			const endpoint = buildTvmazeEndpoint(target);
			let payload: TvmazeShowResponse;
			try {
				payload = await fetchJsonWithSchema(fetcher, endpoint, tvmazeShowResponseSchema, {
					signal: ctx.signal,
				});
			} catch (error) {
				if (error instanceof ProviderHttpError && error.status === 404) {
					return [];
				}
				throw error;
			}

			if (
				target.kind === 'title' &&
				target.premiereYear !== undefined &&
				!premiereYearMatches(payload.premiered ?? null, target.premiereYear)
			) {
				return [];
			}
			if (!responseIdentityMatches(target, payload)) {
				return [];
			}

			return [
				{
					artifact_type: 'tvmaze',
					data: tvmazeDataSchema.parse({
						id: payload.id,
						url: payload.url,
						name: payload.name,
						genres: payload.genres,
						premiered: payload.premiered ?? null,
						ended: payload.ended ?? null,
						status: payload.status,
						network: payload.network ? { name: payload.network.name } : null,
						webChannel: payload.webChannel ? { name: payload.webChannel.name } : null,
						schedule: {
							time: payload.schedule?.time ?? '',
							days: payload.schedule?.days ?? [],
						},
						averageRuntime: payload.averageRuntime ?? null,
						runtime: payload.runtime ?? null,
						language: payload.language ?? null,
						type: payload.type,
						officialSite: payload.officialSite ?? null,
						externals: {
							imdb: payload.externals?.imdb ?? null,
							thetvdb: payload.externals?.thetvdb ?? null,
							tvrage: payload.externals?.tvrage ?? null,
						},
						image: payload.image
							? { medium: payload.image.medium, original: payload.image.original }
							: null,
						summary: toPlainText(payload.summary),
						rating: { average: payload.rating?.average ?? null },
						tvmazeApiPayload: payload,
					}),
					meta: {
						pluginId: 'tvmaze',
						provider: 'tvmaze',
						fetchedAt: ctx.now(),
						sourceUrl: payload.url,
					},
				},
			];
		},
	});
}

function responseIdentityMatches(
	target: TvmazeTarget,
	payload: { id: number; externals?: { imdb?: string | null; thetvdb?: number | null } | null }
): boolean {
	if (target.kind === 'show') {
		return payload.id === Number(target.showId);
	}
	if (target.kind === 'imdb') {
		return payload.externals?.imdb === target.imdbId;
	}
	if (target.kind === 'thetvdb') {
		return payload.externals?.thetvdb === Number(target.thetvdbId);
	}
	return true;
}

function toPlainText(value: string | null | undefined): string | null {
	if (!value) {
		return null;
	}

	const decoded = decodeHtmlEntities(value);
	const normalized = decoded
		.replace(SCRIPT_OR_STYLE_PATTERN, ' ')
		.replace(HTML_TAG_PATTERN, ' ')
		.replace(/\s+/g, ' ')
		.trim();
	return normalized.length > 0 ? normalized : null;
}

function decodeHtmlEntities(value: string): string {
	return value.replace(HTML_ENTITY_PATTERN, (entity, raw: string) => {
		const normalized = raw.toLowerCase();
		if (normalized.startsWith('#')) {
			const isHex = normalized[1] === 'x';
			const codePoint = Number.parseInt(normalized.slice(isHex ? 2 : 1), isHex ? 16 : 10);
			const isValidCodePoint =
				codePoint > 0 && codePoint <= 0x10ffff && (codePoint < 0xd800 || codePoint > 0xdfff);
			return isValidCodePoint ? String.fromCodePoint(codePoint) : entity;
		}

		return (
			{
				amp: '&',
				apos: "'",
				gt: '>',
				lt: '<',
				nbsp: ' ',
				quot: '"',
			}[normalized] ?? entity
		);
	});
}

function resolveTvmazeTarget(request: EnrichmentRequest): TvmazeTarget | undefined {
	const requestUrl = getRequestUrl(request);
	const showId =
		normalizePositiveInteger(getIdentifier(request, 'tvmaze', 'tvmazeId', 'tvmaze_id')) ??
		(requestUrl ? parseTvmazeShowIdFromUrl(requestUrl) : undefined);
	if (showId) {
		return { kind: 'show', showId };
	}

	const imdbId =
		normalizeImdbId(getIdentifier(request, 'imdb', 'imdbId', 'imdb_id')) ??
		(requestUrl ? parseImdbIdFromUrl(requestUrl) : undefined);
	if (imdbId) {
		return { kind: 'imdb', imdbId };
	}

	const thetvdbId =
		normalizePositiveInteger(getIdentifier(request, 'thetvdb', 'thetvdbId', 'tvdb', 'tvdbId')) ??
		(requestUrl ? parseThetvdbIdFromUrl(requestUrl) : undefined);
	if (thetvdbId) {
		return { kind: 'thetvdb', thetvdbId };
	}

	const name = getRequestName(request);
	if (!name || !isTvTitleRequest(request) || isSynthesizedProviderPlaceholderTitle(request, name)) {
		return undefined;
	}

	return {
		kind: 'title',
		name: stripTrailingYear(name),
		premiereYear: resolvePremiereYear(request, name),
	};
}

function buildTvmazeEndpoint(target: TvmazeTarget): string {
	if (target.kind === 'show') {
		return `${TVMAZE_API_BASE_URL}/shows/${target.showId}`;
	}

	const endpoint = new URL(
		target.kind === 'title' ? '/singlesearch/shows' : '/lookup/shows',
		TVMAZE_API_BASE_URL
	);
	if (target.kind === 'imdb') {
		endpoint.searchParams.set('imdb', target.imdbId);
	} else if (target.kind === 'thetvdb') {
		endpoint.searchParams.set('thetvdb', target.thetvdbId);
	} else {
		endpoint.searchParams.set('q', target.name);
	}
	return endpoint.toString();
}

function normalizePositiveInteger(value: string | undefined): string | undefined {
	if (!value || !/^[1-9]\d*$/.test(value.trim())) {
		return undefined;
	}
	return value.trim();
}

function normalizeImdbId(value: string | undefined): string | undefined {
	if (!value) {
		return undefined;
	}
	const normalized = value.trim().toLowerCase();
	if (/^tt\d+$/.test(normalized)) {
		return normalized;
	}
	return /^\d+$/.test(normalized) ? `tt${normalized}` : undefined;
}

function parseTvmazeShowIdFromUrl(value: string): string | undefined {
	return parseProviderPathId(value, 'tvmaze.com', /^\/shows\/([1-9]\d*)(?:\/|$)/i);
}

function parseImdbIdFromUrl(value: string): string | undefined {
	const id = parseProviderPathId(value, 'imdb.com', /^\/title\/(tt\d+)(?:\/|$)/i);
	return normalizeImdbId(id);
}

function parseThetvdbIdFromUrl(value: string): string | undefined {
	return parseProviderPathId(value, 'thetvdb.com', /^\/series\/([1-9]\d*)(?:\/|$)/i);
}

function parseProviderPathId(
	value: string,
	hostSuffix: string,
	pathPattern: RegExp
): string | undefined {
	try {
		const url = new URL(value);
		const hostname = url.hostname.toLowerCase().replace(/\.+$/, '');
		if (hostname !== hostSuffix && !hostname.endsWith(`.${hostSuffix}`)) {
			return undefined;
		}
		return url.pathname.match(pathPattern)?.[1];
	} catch {
		return undefined;
	}
}

function isTvTitleRequest(request: EnrichmentRequest): boolean {
	const provider = request.input.source.provider?.trim().toLowerCase();
	if (provider === 'tvmaze' || provider === 'tvmaze-url') {
		return true;
	}

	const schemaTypes = Array.isArray(request.input.jsonLd['@type'])
		? request.input.jsonLd['@type']
		: [request.input.jsonLd['@type']];
	return schemaTypes.some((value) => {
		if (typeof value !== 'string') {
			return false;
		}
		const type = value.split(/[/#]/).at(-1);
		return type === 'TVSeries' || type === 'TVShow';
	});
}

function resolvePremiereYear(request: EnrichmentRequest, name: string): number | undefined {
	for (const key of ['datePublished', 'startDate', 'releaseDate', 'year']) {
		const year = readYear(request.input.jsonLd[key]);
		if (year !== undefined) {
			return year;
		}
	}

	return readYear(request.input.hints?.identifiers?.year) ?? readYear(name);
}

function readYear(value: unknown): number | undefined {
	if (typeof value === 'number' && Number.isInteger(value) && value >= 1800 && value <= 2199) {
		return value;
	}
	if (typeof value !== 'string') {
		return undefined;
	}
	const match = value.match(FOUR_DIGIT_YEAR_PATTERN);
	return match?.[1] ? Number.parseInt(match[1], 10) : undefined;
}

function stripTrailingYear(value: string): string {
	return value.replace(/\s+\((?:18|19|20|21)\d{2}\)\s*$/, '').trim();
}

function premiereYearMatches(premiered: string | null, expectedYear: number): boolean {
	const actualYear = readYear(premiered);
	return actualYear !== undefined && Math.abs(actualYear - expectedYear) <= PREMIERE_YEAR_TOLERANCE;
}

export { tvmazeDataSchema, tvmazeShowResponseSchema } from './schema';
