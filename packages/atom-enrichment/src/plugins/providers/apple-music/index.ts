import {
	defineEnrichmentPlugin,
	type EnrichmentPlugin,
	type EnrichmentPluginContext,
} from '../../../plugins';
import type { EnrichmentArtifact, EnrichmentRequest } from '../../../types';
import { type FetchLike, fetchJsonWithSchema } from '../__shared__/http';
import { getIdentifier, getRequestUrl } from '../__shared__/request';
import { itunesLookupResponseSchema } from './external';
import {
	beginAppleMusicRequest,
	classifyRequestError,
	operationForTarget,
} from './request-observer';
import { appleMusicDataSchema } from './schema';
import { baseNormalizeMatchText, songDurationsMatch, songTextsMatch } from './song-match';

export {
	normalizeSongMatchText,
	SONG_DURATION_TOLERANCE_MS,
	songDurationsMatch,
	songTextsMatch,
} from './song-match';

type CreateAppleMusicPluginOptions = {
	fetch?: FetchLike;
	priority?: number;
	TTL?: number;
	country?: string;
};

type AppleMusicTarget =
	| { kind: 'lookup'; id: string; country: string; media?: 'podcast' }
	| {
			kind: 'podcast-search';
			term: string;
			media: 'podcast';
			country: string;
			/** Gate: accepted only when the result publisher matches (when given). */
			corroboratePublisher?: string;
	  }
	| {
			kind: 'song-search';
			term: string;
			/** Gate: accepted only when the result artist matches. */
			artist: string;
			/** Gate: accepted only when trackTimeMillis agrees within ±10s (when given). */
			durationMs?: number;
			country: string;
	  };

type ItunesLookupResult = {
	wrapperType?: string;
	kind?: string;
	feedUrl?: string;
	trackId?: number;
	collectionId?: number;
	artistId?: number;
	trackName?: string;
	collectionName?: string;
	artistName?: string;
	trackViewUrl?: string;
	collectionViewUrl?: string;
	artistLinkUrl?: string;
	artworkUrl100?: string;
	previewUrl?: string;
	releaseDate?: string;
	trackTimeMillis?: number;
	primaryGenreName?: string;
	// The public iTunes Search API does not return ISRC, but the response
	// schema passes unknown fields through — so on the rare occasion a result
	// carries one it flows into the artifact verbatim (bonus identifier
	// backfill; never depended upon).
	isrc?: string;
};

const APPLE_MUSIC_HOST_PATTERN = /(^|\.)music\.apple\.com$/i;
const NUMERIC_ID_PATTERN = /^\d{4,}$/;
const DEFAULT_COUNTRY = 'us';

// Pacing: the plugin deliberately takes NO request slot. The only high-volume caller is the
// tRPC track-preview resolver, which paces whole resolutions through its own process-wide gate
// (`apple-music:track-preview`, <=20 starts/min) before any run reaches this plugin; the
// remaining iTunes dials are user-initiated, one or two per create. A slot here would add
// latency to those without protecting anything the gate does not already protect.
// Resolves Apple Music targets via the public iTunes Lookup API — no
// credentials required, and song results include a playable previewUrl.
export function createAppleMusicPlugin(
	options: CreateAppleMusicPluginOptions = {}
): EnrichmentPlugin {
	const fetcher = options.fetch ?? (globalThis.fetch as FetchLike);
	const defaultCountry = options.country ?? DEFAULT_COUNTRY;

	return defineEnrichmentPlugin({
		id: 'apple-music',
		version: '1.0.0',
		runtime: 'universal',
		artifactTypes: ['apple-music'],
		priority: options.priority ?? 49,
		TTL: options.TTL ?? 43_200,

		observability: {
			provider: 'apple-music',
			// A cached run stands in for the iTunes request its target selects.
			cacheOperations(request) {
				const target = resolveAppleMusicTarget(request, defaultCountry);
				return target ? [operationForTarget(target.kind)] : [];
			},
		},

		supports(request: EnrichmentRequest) {
			return !!resolveAppleMusicTarget(request, defaultCountry);
		},

		async enrich(request, ctx) {
			const target = resolveAppleMusicTarget(request, defaultCountry);
			if (!target) {
				return [];
			}

			// One logical request: hit when it produced an artifact, miss when iTunes
			// answered with nothing usable (resultCount 0 or a candidate the gate rejected).
			const observed = beginAppleMusicRequest(target.kind, ctx);
			try {
				const artifacts = await fetchArtifacts(fetcher, request, ctx, target);
				observed?.settle(
					artifacts.length > 0
						? { outcome: 'hit', reason: 'none' }
						: { outcome: 'miss', reason: 'none' }
				);
				return artifacts;
			} catch (error) {
				observed?.fail(error, classifyRequestError);
				throw error;
			}
		},
	});
}

async function fetchArtifacts(
	fetcher: FetchLike,
	request: EnrichmentRequest,
	ctx: EnrichmentPluginContext,
	target: AppleMusicTarget
): Promise<EnrichmentArtifact[]> {
	const endpoint = resolveEndpoint(target);
	const payload = await fetchJsonWithSchema(fetcher, endpoint, itunesLookupResponseSchema, {
		signal: ctx.signal,
	});

	const results = (payload.results ?? []) as ItunesLookupResult[];
	const result = selectResult(results, target);
	if (!result) {
		return [];
	}

	const type = resolveResultType(result);
	const name = resolveResultName(result, type);
	if (!(type && name)) {
		return [];
	}

	const targetId = resolveTargetId(target, result);
	const appleMusicUrl =
		result.trackViewUrl ??
		result.collectionViewUrl ??
		result.artistLinkUrl ??
		(target.kind === 'lookup' ? getRequestUrl(request) : undefined) ??
		`https://music.apple.com/${target.country}/${type}/${targetId}`;

	return [
		{
			artifact_type: 'apple-music',
			data: appleMusicDataSchema.parse({
				name,
				type,
				appleMusicId: targetId,
				appleMusicUrl,
				artworkUrl: upscaleArtworkUrl(result.artworkUrl100),
				previewUrl: result.previewUrl,
				artistName: result.artistName,
				albumName: type === 'song' ? result.collectionName : undefined,
				releaseDate: result.releaseDate,
				durationMs: result.trackTimeMillis,
				// Bonus backfill only — the free API almost never returns this.
				isrc: result.isrc,
				genres: result.primaryGenreName ? [result.primaryGenreName] : undefined,
				feedUrl: result.feedUrl,
			}),
			meta: {
				pluginId: 'apple-music',
				provider: 'apple-music',
				fetchedAt: ctx.now(),
				sourceUrl: appleMusicUrl,
			},
		},
	];
}

function resolveEndpoint(target: AppleMusicTarget): string {
	if (target.kind === 'lookup') {
		return `https://itunes.apple.com/lookup?id=${encodeURIComponent(target.id)}&country=${encodeURIComponent(target.country)}`;
	}
	if (target.kind === 'song-search') {
		// "name artist" as one query maximizes recall; the acceptance gate in
		// selectGatedSongResult does the precision work.
		return `https://itunes.apple.com/search?term=${encodeURIComponent(`${target.term} ${target.artist}`)}&media=music&entity=song&limit=10&country=${encodeURIComponent(target.country)}`;
	}
	return `https://itunes.apple.com/search?term=${encodeURIComponent(target.term)}&media=${target.media}&limit=5&country=${encodeURIComponent(target.country)}`;
}

function selectResult(
	results: ItunesLookupResult[],
	target: AppleMusicTarget
): ItunesLookupResult | undefined {
	if (target.kind === 'podcast-search') {
		return selectGatedSearchResult(results, target);
	}
	if (target.kind === 'song-search') {
		return selectGatedSongResult(results, target);
	}
	return results[0];
}

function resolveTargetId(target: AppleMusicTarget, result: ItunesLookupResult): string {
	if (target.kind === 'lookup') {
		return target.id;
	}
	// Song searches resolve a recording, so the song's own trackId identifies
	// it; podcast catalog searches resolve collections, where collectionId
	// leads.
	if (target.kind === 'song-search') {
		return String(result.trackId ?? result.collectionId ?? '');
	}
	return String(result.collectionId ?? result.trackId ?? '');
}

function resolveResultType(
	result: ItunesLookupResult
): 'song' | 'album' | 'artist' | 'podcast' | undefined {
	if (result.kind === 'podcast' || result.wrapperType === 'podcast') return 'podcast';
	if (result.wrapperType === 'track' || result.kind === 'song') return 'song';
	if (result.wrapperType === 'collection') return 'album';
	if (result.wrapperType === 'artist') return 'artist';
	return undefined;
}

// Search joins are gated (cross-provider-augmentation-spec.md): accept only a
// result whose title matches the searched term, corroborated by publisher
// when one was provided. Blank beats wrong.
function selectGatedSearchResult(
	results: ItunesLookupResult[],
	target: Extract<AppleMusicTarget, { kind: 'podcast-search' }>
): ItunesLookupResult | undefined {
	const expectedTitle = baseNormalizeMatchText(target.term);
	const expectedPublisher = target.corroboratePublisher
		? baseNormalizeMatchText(target.corroboratePublisher)
		: undefined;
	return results.find((result) => {
		const title = result.collectionName ? baseNormalizeMatchText(result.collectionName) : '';
		if (title.length === 0 || title !== expectedTitle) return false;
		if (!expectedPublisher) return true;
		const publisher = result.artistName ? baseNormalizeMatchText(result.artistName) : '';
		return (
			publisher === expectedPublisher ||
			publisher.includes(expectedPublisher) ||
			expectedPublisher.includes(publisher)
		);
	});
}

// Song search joins are gated stricter than podcast searches (ENG-13713
// round 4 — never attach the wrong song's preview): the candidate must be a
// song, must carry the previewUrl this join exists to recover, its title AND
// artist must corroborate under the shared normalization (equality or
// containment — Spotify and iTunes disagree on remaster/feat./live
// qualifiers), and its duration must agree within ±10s when the caller knows
// the recording length. Blank beats wrong.
//
// This gate does NOT check ISRC (the free API almost never returns one), but
// the tRPC track-preview resolver re-checks the full gate and DOES reject an
// ISRC mismatch when both sides carry one. So a plugin `hit` can still become
// a permanent negative-cache entry in the resolver: the plugin's `hit` means
// "iTunes answered with a candidate that passed this gate", not "accepted".
function selectGatedSongResult(
	results: ItunesLookupResult[],
	target: Extract<AppleMusicTarget, { kind: 'song-search' }>
): ItunesLookupResult | undefined {
	return results.find(
		(result) =>
			resolveResultType(result) === 'song' &&
			Boolean(result.previewUrl) &&
			songTextsMatch(result.trackName, target.term) &&
			songTextsMatch(result.artistName, target.artist) &&
			songDurationsMatch(result.trackTimeMillis, target.durationMs)
	);
}

function resolveResultName(
	result: ItunesLookupResult,
	type: 'song' | 'album' | 'artist' | 'podcast' | undefined
): string | undefined {
	if (type === 'song') return result.trackName;
	if (type === 'album' || type === 'podcast') return result.collectionName;
	if (type === 'artist') return result.artistName;
	return undefined;
}

function upscaleArtworkUrl(value: string | undefined): string | undefined {
	return value?.replace('100x100', '600x600');
}

function resolveAppleMusicTarget(
	request: EnrichmentRequest,
	defaultCountry: string
): AppleMusicTarget | undefined {
	const identifier = getIdentifier(request, 'apple-music', 'appleMusicId', 'itunes', 'itunesId');
	if (identifier && NUMERIC_ID_PATTERN.test(identifier)) {
		return { kind: 'lookup', id: identifier, country: defaultCountry };
	}

	// NOTE (ENG-13713 round 5): there is deliberately NO 'isrc' identifier
	// target. The public/free iTunes lookup endpoint (`lookup?isrc=<ISRC>`)
	// does not support ISRC lookups — it returns resultCount:0 for every ISRC
	// (verified live against real catalog ISRCs). ISRC lookup requires the
	// authenticated Apple Music API (api.music.apple.com, filter[isrc]) with a
	// JWT developer token, which is not wired here. Routing ISRCs to the free
	// endpoint only wasted a guaranteed-empty request, so the target was
	// removed. Preview recovery goes exclusively through the gated
	// name+artist song search below; a caller-supplied ISRC is used only as a
	// match-gate confidence signal by the tRPC track-preview resolver.

	// Cross-provider augmentation edge (ENG-13713): preview-less spotify tracks
	// search the song catalog by 'name|artist|durationMs' with a strict
	// acceptance gate (title + artist corroboration, duration within ±10s,
	// preview required).
	const songSearch = getIdentifier(request, 'itunesSongSearch');
	if (songSearch) {
		const [term, artist, durationRaw] = songSearch.split('|');
		const durationMs = durationRaw ? Number.parseInt(durationRaw, 10) : Number.NaN;
		if (term?.trim() && artist?.trim()) {
			return {
				kind: 'song-search',
				term: term.trim(),
				artist: artist.trim(),
				...(Number.isFinite(durationMs) && durationMs > 0 ? { durationMs } : {}),
				country: defaultCountry,
			};
		}
	}

	// Cross-provider augmentation edge: 'term|publisher' searches the podcast
	// catalog with a publisher-corroborated acceptance gate.
	const podcastSearch = getIdentifier(request, 'itunesPodcastSearch');
	if (podcastSearch) {
		const [term, publisher] = podcastSearch.split('|');
		if (term?.trim()) {
			return {
				kind: 'podcast-search',
				term: term.trim(),
				media: 'podcast',
				country: defaultCountry,
				...(publisher?.trim() ? { corroboratePublisher: publisher.trim() } : {}),
			};
		}
	}

	const url = getRequestUrl(request);
	if (!url) {
		return undefined;
	}

	return parseAppleMusicUrl(url, defaultCountry) ?? parseApplePodcastsUrl(url, defaultCountry);
}

// Apple Podcasts URLs: podcasts.apple.com/{storefront}/podcast/{slug}/id{digits}
export function parseApplePodcastsUrl(
	url: string,
	defaultCountry = DEFAULT_COUNTRY
): AppleMusicTarget | undefined {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return undefined;
	}
	const host = parsed.hostname.replace(/^www\./, '').toLowerCase();
	if (host !== 'podcasts.apple.com') {
		return undefined;
	}
	const segments = parsed.pathname.split('/').filter(Boolean);
	const country =
		segments[0] && /^[a-z]{2}$/i.test(segments[0]) ? segments[0].toLowerCase() : defaultCountry;
	const idSegment = segments.at(-1)?.replace(/^id/, '');
	if (idSegment && NUMERIC_ID_PATTERN.test(idSegment)) {
		return { kind: 'lookup', id: idSegment, country, media: 'podcast' };
	}
	return undefined;
}

// Apple Music URLs: music.apple.com/{storefront}/{album|song|artist}/{slug}/{id}
// Tracks inside an album page carry their id in the `i` query parameter.
export function parseAppleMusicUrl(
	url: string,
	defaultCountry = DEFAULT_COUNTRY
): AppleMusicTarget | undefined {
	let parsed: URL;
	try {
		parsed = new URL(url);
	} catch {
		return undefined;
	}

	if (!APPLE_MUSIC_HOST_PATTERN.test(parsed.hostname)) {
		return undefined;
	}

	const segments = parsed.pathname.split('/').filter(Boolean);
	const country =
		segments[0] && /^[a-z]{2}$/i.test(segments[0]) ? segments[0].toLowerCase() : defaultCountry;

	const trackParam = parsed.searchParams.get('i');
	if (trackParam && NUMERIC_ID_PATTERN.test(trackParam)) {
		return { kind: 'lookup', id: trackParam, country };
	}

	const lastSegment = segments.at(-1);
	const idFromPath = lastSegment?.replace(/^id/, '');
	if (idFromPath && NUMERIC_ID_PATTERN.test(idFromPath)) {
		return { kind: 'lookup', id: idFromPath, country };
	}

	return undefined;
}
