import { defineProvider, ERROR_REASONS_WITHOUT_CIRCUIT, type ProviderOperationSpec } from './types';

/**
 * MusicBrainz web service lookups made by enrichment. A 404 is a miss. MusicBrainz refuses a
 * request without a User-Agent with 403 (`auth_failed`) and answers its per-IP throttle with 503
 * (`rate_limited`). One request per call, no breaker and no budget. Every call is paced by the
 * process slot `musicbrainz` (1 s): `budget_exhausted` is that slot refusing the request (queue full,
 * or it cannot start before the deadline) or the deadline arriving while it waits for its turn.
 * Nothing was dialled, so no duration, and it is our own backpressure, not MusicBrainz throttling
 * (a real 503 / 429 stays `rate_limited`).
 */
const lookupOperation = (): ProviderOperationSpec => ({
	scopes: ['api', 'enrichment'],
	liveOutcomes: ['hit', 'miss', 'budget_exhausted'],
	errorReasons: [...ERROR_REASONS_WITHOUT_CIRCUIT, 'auth_failed'],
	// The engine's artifact cache can absorb a run (TTL 3600 s): hit with artifacts, miss for a
	// cached empty result (an unknown id or an empty search).
	cacheOutcomes: ['hit', 'miss'],
});

export const musicBrainzProvider = defineProvider({
	provider: 'musicbrainz',
	operations: {
		recording: lookupOperation(),
		isrc: lookupOperation(),
		search: lookupOperation(),
	},
	circuitHosts: [],
});
