import { observeProviderRequest } from '@0xintuition/pipeline-runtime/provider-request-observation';
import { TMDB_API_BASE_URL } from '@0xintuition/pipeline-runtime/tmdb';
import { defineEnrichmentPlugin, type EnrichmentPlugin } from '../../../plugins';
import type { EnrichmentArtifact, EnrichmentRequest } from '../../../types';
import { type FetchLike, fetchJsonWithSchema } from '../__shared__/http';
import { getIdentifier, getRequestName } from '../__shared__/request';
import { type TmdbDetailsResponse, tmdbDetailsResponseSchema } from './external';
import { TmdbPayloadMismatchError } from './payload-mismatch';
import { classifyTmdbError } from './request-observer';
import { tmdbDataSchema } from './schema';

type CreateTmdbPluginOptions = {
	apiKey?: string;
	fetch?: FetchLike;
	language?: string;
	priority?: number;
	TTL?: number;
};

export type TmdbTarget = {
	mediaType: 'movie' | 'tv';
	tmdbId: number;
};

const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
const TOP_BILLED_CREDITS_LIMIT = 10;

/**
 * Restored under JP's 2026-09-01 commercial-licensing ruling, which
 * supersedes the 2026-08-27 R1b enforcement stub. The key remains optional so
 * every keyless runtime stays dormant and makes zero TMDB requests.
 */
export function createTmdbPlugin(options: CreateTmdbPluginOptions = {}): EnrichmentPlugin {
	const fetcher = options.fetch ?? (globalThis.fetch as FetchLike);
	const language = options.language?.trim() || 'en-US';
	const apiKey = (options.apiKey ?? tmdbApiKeyFromEnv())?.trim();

	return defineEnrichmentPlugin({
		id: 'tmdb',
		version: '3.0.0',
		runtime: 'server',
		artifactTypes: ['tmdb'],
		priority: options.priority ?? 55,
		TTL: options.TTL ?? 43_200,

		observability: {
			provider: 'tmdb',
			// A cached run stands in for the details lookup it would have made. A keyless runtime
			// makes no request, so it has nothing to stand in for.
			cacheOperations(request) {
				return apiKey && resolveTmdbTarget(request) ? ['details'] : [];
			},
		},

		supports(request: EnrichmentRequest) {
			return Boolean(apiKey && resolveTmdbTarget(request));
		},

		async enrich(request, ctx) {
			const target = resolveTmdbTarget(request);
			if (!(target && apiKey)) {
				return [];
			}

			const endpoint = buildTmdbDetailsEndpoint(target, apiKey, language);
			try {
				const payload = await observeProviderRequest(
					{
						provider: 'tmdb',
						operation: 'details',
						context: ctx,
						classifyError: classifyTmdbError,
					},
					async () => {
						const details = await fetchTmdbDetails(fetcher, endpoint, ctx.signal);
						assertTmdbResponseIdentity(details, target);
						return details;
					}
				);
				return [createTmdbArtifact(target, payload, ctx.now())];
			} catch (error) {
				// An unknown or withdrawn id was recorded as a miss: the engine must see "no result"
				// (cached as empty), not a failed run. The classifier is the only place the rule lives.
				if (classifyTmdbError(error).outcome === 'miss') return [];
				throw error;
			}
		},
	});
}

export function assertTmdbResponseIdentity(
	payload: { id?: unknown },
	target: TmdbTarget
): asserts payload is { id: number } {
	if (payload.id !== target.tmdbId) {
		throw new TmdbPayloadMismatchError(
			`TMDB ${target.mediaType} ${target.tmdbId} returned a mismatched payload id.`
		);
	}
}

export function createTmdbArtifact(
	target: TmdbTarget,
	payload: TmdbDetailsResponse,
	fetchedAt: string
): EnrichmentArtifact {
	assertTmdbResponseIdentity(payload, target);
	const tmdbId = target.tmdbId;
	const sourceUrl = canonicalTmdbUrl(target.mediaType, tmdbId);
	const imdbId = normalizeImdbId(payload.external_ids?.imdb_id ?? payload.imdb_id);
	const tvdbId = positiveInteger(payload.external_ids?.tvdb_id);
	const wikidataId = normalizeWikidataId(payload.external_ids?.wikidata_id);
	const sameAs = [sourceUrl, ...(imdbId ? [canonicalImdbUrl(imdbId)] : [])];
	const identifierRung = [
		{ scheme: 'tmdb' as const, value: `${target.mediaType}:${tmdbId}` },
		...(imdbId ? [{ scheme: 'imdb' as const, value: `title:${imdbId}` }] : []),
	];

	return {
		artifact_type: 'tmdb',
		data: tmdbDataSchema.parse({
			tmdbId,
			mediaType: target.mediaType,
			title: payload.title?.trim() || payload.name?.trim(),
			overview: optionalString(payload.overview),
			posterPath: optionalString(payload.poster_path),
			posterUrl: tmdbImageUrl(payload.poster_path),
			backdropPath: optionalString(payload.backdrop_path),
			backdropUrl: tmdbImageUrl(payload.backdrop_path),
			releaseDate: optionalString(payload.release_date ?? payload.first_air_date),
			voteAverage: finiteNumber(payload.vote_average),
			voteCount: nonnegativeInteger(payload.vote_count),
			genres: payload.genres?.map((genre) => genre.name) ?? [],
			runtime: runtimeFor(payload),
			originalLanguage: optionalString(payload.original_language),
			spokenLanguages: uniqueStrings(
				payload.spoken_languages?.map((languageEntry) => languageEntry.name) ?? []
			),
			productionCountries: uniqueStrings(
				payload.production_countries?.map((country) => country.name) ?? []
			),
			keywords: keywordNames(payload),
			topBilledCredits: topBilledCredits(payload),
			imdbId,
			tvdbId,
			wikidataId,
			externalIds: { imdbId, tvdbId, wikidataId },
			identifierRung,
			sameAs,
			tmdbApiPayload: payload,
		}),
		meta: {
			pluginId: 'tmdb',
			provider: 'tmdb',
			fetchedAt,
			sourceUrl,
		},
	};
}

function tmdbApiKeyFromEnv(): string | undefined {
	return process.env.TMDB_API_KEY;
}

export function buildTmdbDetailsEndpoint(
	target: TmdbTarget,
	apiKey: string,
	language = 'en-US'
): string {
	const endpoint = new URL(`${TMDB_API_BASE_URL}/${target.mediaType}/${target.tmdbId}`);
	endpoint.searchParams.set('language', language);
	endpoint.searchParams.set('api_key', apiKey);
	endpoint.searchParams.set(
		'append_to_response',
		target.mediaType === 'movie'
			? 'credits,keywords,external_ids,release_dates,videos'
			: 'credits,keywords,external_ids,content_ratings,videos'
	);
	return endpoint.toString();
}

export function resolveTmdbTarget(request: EnrichmentRequest): TmdbTarget | undefined {
	const identifier = getIdentifier(request, 'tmdb', 'tmdbId', 'tmdb_id');
	const identifierTarget = identifier ? parseTmdbReference(identifier) : undefined;
	if (identifierTarget) {
		return identifierTarget;
	}

	const url = getTmdbRequestUrl(request);
	const urlTarget = url ? parseTmdbUrl(url) : undefined;
	if (urlTarget) {
		return urlTarget;
	}

	const name = getRequestName(request);
	return name ? parseTmdbReference(name) : undefined;
}

function getTmdbRequestUrl(request: EnrichmentRequest): string | undefined {
	const candidates = [
		request.input.hints?.url,
		request.input.jsonLd.url,
		...(Array.isArray(request.input.jsonLd.sameAs)
			? request.input.jsonLd.sameAs
			: [request.input.jsonLd.sameAs]),
	];
	return candidates.find(
		(value): value is string => typeof value === 'string' && parseTmdbUrl(value) !== undefined
	);
}

export function parseTmdbReference(value: string): TmdbTarget | undefined {
	const match = value.trim().match(/^(?:tmdb:)?(movie|tv):([1-9]\d*)$/i);
	if (!(match?.[1] && match[2])) {
		return undefined;
	}
	return {
		mediaType: match[1].toLowerCase() as 'movie' | 'tv',
		tmdbId: Number.parseInt(match[2], 10),
	};
}

export function parseTmdbUrl(value: string): TmdbTarget | undefined {
	try {
		const url = new URL(value);
		const hostname = url.hostname.toLowerCase().replace(/\.+$/, '');
		if (hostname !== 'themoviedb.org' && hostname !== 'www.themoviedb.org') {
			return undefined;
		}
		const match = url.pathname.match(/^\/(movie|tv)\/([1-9]\d*)(?:[-/]|$)/i);
		return match?.[1] && match[2]
			? {
					mediaType: match[1].toLowerCase() as 'movie' | 'tv',
					tmdbId: Number.parseInt(match[2], 10),
				}
			: undefined;
	} catch {
		return undefined;
	}
}

async function fetchTmdbDetails(
	fetcher: FetchLike,
	endpoint: string,
	signal: AbortSignal
): Promise<TmdbDetailsResponse> {
	return await fetchJsonWithSchema(
		fetcher,
		endpoint,
		tmdbDetailsResponseSchema,
		{ redirect: 'error', signal },
		{ allowTmdbApi: true }
	);
}

function runtimeFor(payload: TmdbDetailsResponse): number | undefined {
	return finiteNumber(payload.runtime) ?? payload.episode_run_time?.find((value) => value > 0);
}

function keywordNames(payload: TmdbDetailsResponse): string[] {
	return uniqueStrings(
		(payload.keywords?.keywords ?? payload.keywords?.results ?? []).map((keyword) => keyword.name)
	);
}

function topBilledCredits(payload: TmdbDetailsResponse) {
	return [...(payload.credits?.cast ?? [])]
		.sort(
			(left, right) =>
				(left.order ?? Number.MAX_SAFE_INTEGER) - (right.order ?? Number.MAX_SAFE_INTEGER)
		)
		.slice(0, TOP_BILLED_CREDITS_LIMIT)
		.map((credit) => ({
			id: credit.id,
			name: credit.name,
			...(optionalString(credit.character) ? { character: credit.character?.trim() } : {}),
			...(optionalString(credit.credit_id) ? { creditId: credit.credit_id?.trim() } : {}),
			...(credit.order === undefined ? {} : { order: credit.order }),
			...(optionalString(credit.profile_path) ? { profilePath: credit.profile_path?.trim() } : {}),
		}));
}

function canonicalTmdbUrl(kind: 'movie' | 'tv', id: number): string {
	return `https://www.themoviedb.org/${kind}/${id}`;
}

function canonicalImdbUrl(id: string): string {
	return `https://www.imdb.com/title/${id}/`;
}

function tmdbImageUrl(path: string | null | undefined): string | undefined {
	const normalized = optionalString(path);
	return normalized
		? `${TMDB_IMAGE_BASE_URL}${normalized.startsWith('/') ? normalized : `/${normalized}`}`
		: undefined;
}

function normalizeImdbId(value: unknown): string | undefined {
	const normalized = typeof value === 'string' ? value.trim().toLowerCase() : '';
	return /^tt\d+$/.test(normalized) ? normalized : undefined;
}

function normalizeWikidataId(value: unknown): string | undefined {
	const normalized = typeof value === 'string' ? value.trim().toUpperCase() : '';
	return /^Q[1-9]\d*$/.test(normalized) ? normalized : undefined;
}

function positiveInteger(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

function nonnegativeInteger(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
}

function finiteNumber(value: unknown): number | undefined {
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function optionalString(value: unknown): string | undefined {
	return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function uniqueStrings(values: readonly unknown[]): string[] {
	return [
		...new Set(
			values
				.filter((value): value is string => typeof value === 'string')
				.map((value) => value.trim())
				.filter(Boolean)
		),
	];
}

export { tmdbDataSchema, tmdbDetailsResponseSchema };
