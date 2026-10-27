import {
	createRequestSlot,
	getProcessRequestSlot,
	type RequestSlot,
} from '@0xintuition/pipeline-runtime/request-slot';
import type { z } from 'zod/v4';
import { normalizeIsrc } from '../../../extraction/isrc';
import {
	defineEnrichmentPlugin,
	type EnrichmentPlugin,
	type EnrichmentPluginContext,
} from '../../../plugins';
import type { EnrichmentRequest } from '../../../types';
import { type FetchLike, fetchJsonWithSchema } from '../__shared__/http';
import {
	getIdentifier,
	getRequestName,
	isSynthesizedProviderPlaceholderTitle,
} from '../__shared__/request';
import { musicBrainzRecordingResponseSchema, musicBrainzSearchResponseSchema } from './external';
import {
	classifyRequestError,
	MUSICBRAINZ_STATUS_CLASSES,
	type MusicBrainzOperation,
	observeRequest,
} from './request-observer';
import { musicbrainzDataSchema } from './schema';

type CreateMusicBrainzPluginOptions = {
	fetch?: FetchLike;
	priority?: number;
	TTL?: number;
	userAgent?: string;
	/**
	 * Spacing of a PRIVATE slot (tests, tooling). Omitted or equal to the default, the plugin paces
	 * through the process-wide `musicbrainz` slot shared by every engine and plugin instance.
	 */
	requestSpacingMs?: number;
	/** An explicit slot (tests); wins over `requestSpacingMs`. */
	requestSlot?: RequestSlot;
};

type MusicBrainzRecording = {
	id?: string;
	title?: string;
	disambiguation?: string;
	isrcs?: string[];
	'first-release-date'?: string;
	'artist-credit'?: Array<{ name?: string }>;
	tags?: Array<{ name?: string }>;
};

const CACHED_OPERATIONS = {
	mbid: 'recording',
	isrc: 'isrc',
	search: 'search',
} as const satisfies Record<ResolvedMusicBrainzRequest['kind'], MusicBrainzOperation>;

const MBID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** MusicBrainz asks anonymous clients for at most one request per second per IP. */
const MUSICBRAINZ_PLUGIN_VERSION = '1.0.0';

const DEFAULT_REQUEST_SPACING_MS = 1_000;

/**
 * MusicBrainz rejects requests without a User-Agent (403) and asks for a contact in it. Deployments
 * override it with `MUSICBRAINZ_USER_AGENT`; see `createServerDefaultPresetOptions`.
 */
export const DEFAULT_MUSICBRAINZ_USER_AGENT = `IntuitionAtomEnrichment/${MUSICBRAINZ_PLUGIN_VERSION} (+https://intuition.systems; MusicBrainz recording lookup)`;

/** A User-Agent must be printable ASCII; a CR/LF or control character makes fetch throw. */
export function resolveMusicBrainzUserAgent(userAgent: string | undefined): string {
	const trimmed = userAgent?.trim();
	if (!trimmed) return DEFAULT_MUSICBRAINZ_USER_AGENT;
	if (!/^[\x20-\x7e]+$/.test(trimmed)) {
		console.warn('MUSICBRAINZ_USER_AGENT has non-printable characters; using the default');
		return DEFAULT_MUSICBRAINZ_USER_AGENT;
	}
	return trimmed;
}

/**
 * One slot per process, however many engines and plugin instances exist (the api builds one engine
 * per preset): MusicBrainz limits per IP. Replicas behind one egress IP still add up.
 */
function resolveRequestSlot(options: CreateMusicBrainzPluginOptions): RequestSlot {
	if (options.requestSlot) return options.requestSlot;
	const spacing = options.requestSpacingMs ?? DEFAULT_REQUEST_SPACING_MS;
	if (spacing !== DEFAULT_REQUEST_SPACING_MS) return createRequestSlot({ minSpacingMs: spacing });
	return getProcessRequestSlot('musicbrainz', { minSpacingMs: DEFAULT_REQUEST_SPACING_MS });
}

export function createMusicBrainzPlugin(
	options: CreateMusicBrainzPluginOptions = {}
): EnrichmentPlugin {
	const fetcher = options.fetch ?? (globalThis.fetch as FetchLike);
	const userAgent = resolveMusicBrainzUserAgent(options.userAgent);
	const requestSlot = resolveRequestSlot(options);

	return defineEnrichmentPlugin({
		id: 'musicbrainz',
		version: MUSICBRAINZ_PLUGIN_VERSION,
		runtime: 'universal',
		artifactTypes: ['musicbrainz'],
		priority: options.priority ?? 50,
		TTL: options.TTL ?? 3_600,

		observability: {
			provider: 'musicbrainz',
			// A cached run stands in for the lookup its request selects.
			cacheOperations(request) {
				const resolved = resolveMusicBrainzRequest(request);
				return resolved ? [CACHED_OPERATIONS[resolved.kind]] : [];
			},
		},

		supports(request: EnrichmentRequest) {
			return !!resolveMusicBrainzRequest(request);
		},

		async enrich(request, ctx) {
			const resolved = resolveMusicBrainzRequest(request);
			if (!resolved) {
				return [];
			}

			const recording = await fetchRecording(fetcher, requestSlot, resolved, ctx, userAgent);
			if (!recording?.id || !recording.title) {
				return [];
			}

			return [
				{
					artifact_type: 'musicbrainz',
					data: musicbrainzDataSchema.parse({
						mbid: recording.id,
						name: recording.title,
						type: 'Recording',
						disambiguation: recording.disambiguation,
						isrcs: recording.isrcs,
						releaseDate: recording['first-release-date'],
						artistCredit: recording['artist-credit']
							?.map((entry) => entry.name)
							.filter((value): value is string => !!value)
							.join(', '),
						tags: recording.tags
							?.map((entry) => entry.name)
							.filter((value): value is string => !!value),
					}),
					meta: {
						pluginId: 'musicbrainz',
						provider: 'musicbrainz',
						fetchedAt: ctx.now(),
						sourceUrl: `https://musicbrainz.org/recording/${recording.id}`,
					},
				},
			];
		},
	});
}

type ResolvedMusicBrainzRequest =
	| {
			kind: 'mbid';
			mbid: string;
	  }
	| {
			kind: 'isrc';
			isrc: string;
	  }
	| {
			kind: 'search';
			query: string;
	  };

function resolveMusicBrainzRequest(
	request: EnrichmentRequest
): ResolvedMusicBrainzRequest | undefined {
	const mbid = getIdentifier(request, 'musicbrainz', 'mbid');
	if (mbid) {
		const mbidType = getIdentifier(request, 'mbidType');
		if (mbidType && mbidType !== 'recording') return undefined;
		// A malformed id would cost a request slot to earn a 400.
		if (!MBID_PATTERN.test(mbid)) return undefined;
		return { kind: 'mbid', mbid: mbid.toLowerCase() };
	}

	const isrc = normalizeIsrc(getIdentifier(request, 'isrc'));
	if (isrc) {
		return { kind: 'isrc', isrc };
	}

	if (!isMusicRecordingRequest(request)) {
		return undefined;
	}

	const name = getRequestName(request);
	if (!name || isSynthesizedProviderPlaceholderTitle(request, name)) {
		return undefined;
	}

	return { kind: 'search', query: name };
}

function isMusicRecordingRequest(request: EnrichmentRequest): boolean {
	if (request.input.atomType !== 'song') {
		return false;
	}

	const schemaType = request.input.jsonLd['@type'];
	if (schemaType === undefined) {
		return true;
	}
	if (Array.isArray(schemaType)) {
		return schemaType.includes('MusicRecording');
	}

	return schemaType === 'MusicRecording';
}

/** One MusicBrainz lookup: where it goes and how its payload becomes a recording. */
type RecordingEndpoint = {
	operation: MusicBrainzOperation;
	url: string;
	read: (
		load: <T>(schema: z.ZodType<T>) => Promise<T>
	) => Promise<MusicBrainzRecording | undefined>;
};

function recordingEndpoint(request: ResolvedMusicBrainzRequest): RecordingEndpoint {
	const base = 'https://musicbrainz.org/ws/2';
	switch (request.kind) {
		case 'mbid':
			return {
				operation: 'recording',
				url: `${base}/recording/${request.mbid}?fmt=json`,
				read: (load) => load(musicBrainzRecordingResponseSchema),
			};
		case 'isrc': {
			const url = new URL(`${base}/isrc/${encodeURIComponent(request.isrc)}`);
			url.searchParams.set('fmt', 'json');
			url.searchParams.set('inc', 'artist-credits+isrcs');
			return {
				operation: 'isrc',
				url: url.toString(),
				read: async (load) => (await load(musicBrainzSearchResponseSchema)).recordings?.[0],
			};
		}
		case 'search': {
			const url = new URL(`${base}/recording`);
			url.searchParams.set('fmt', 'json');
			url.searchParams.set('limit', '1');
			url.searchParams.set('query', `recording:"${escapeLucenePhrase(request.query)}"`);
			return {
				operation: 'search',
				url: url.toString(),
				read: async (load) => (await load(musicBrainzSearchResponseSchema)).recordings?.[0],
			};
		}
	}
}

/**
 * Escapes Lucene syntax (`+ - && || ! ( ) { } [ ] ^ " ~ * ? : \ /`) so a title is matched as a
 * phrase and cannot add operators, fields or wildcards to the query.
 */
export function escapeLucenePhrase(text: string): string {
	return text.replace(/[+\-!(){}[\]^"~*?:\\/&|]/g, '\\$&');
}

async function fetchRecording(
	fetcher: FetchLike,
	requestSlot: RequestSlot,
	request: ResolvedMusicBrainzRequest,
	ctx: EnrichmentPluginContext,
	userAgent: string
): Promise<MusicBrainzRecording | undefined> {
	const endpoint = recordingEndpoint(request);
	try {
		return await observeRequest(requestSlot, endpoint.operation, ctx, (signal) =>
			endpoint.read((schema) =>
				fetchJsonWithSchema(
					fetcher,
					endpoint.url,
					schema,
					{ signal, headers: { 'User-Agent': userAgent } },
					{ statusClasses: MUSICBRAINZ_STATUS_CLASSES }
				)
			)
		);
	} catch (error) {
		// A 404 was recorded as a miss; the engine must see "no result", not a provider error.
		if (classifyRequestError(error).outcome === 'miss') return undefined;
		throw error;
	}
}
