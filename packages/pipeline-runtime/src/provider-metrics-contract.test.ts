import { describe, expect, test } from 'vitest';
import {
	enumerateProviderRequestSeries,
	enumerateProviderResolutionSeries,
	forEachValidTuple,
	normalizeProviderCircuitHost,
	normalizeProviderRequestEvent,
	normalizeProviderResolutionEvent,
	PROVIDER_METRIC_FAMILIES,
	PROVIDER_METRICS_SCOPES,
	PROVIDER_RESOLUTION_VALUES,
	type ProviderValidTuple,
	providerDurationLabelsKey,
	providerDurationSeconds,
	providerOperationsForScope,
	providerRequestLabelsKey,
	providerResolutionLabelsKey,
} from './provider-metrics-contract';
import {
	EXPECTED_AUTH_FAILED_OPERATIONS,
	EXPECTED_PROVIDER_SERIES,
	EXPECTED_RESOLUTION_SERIES,
} from './provider-metrics-contract.expected';
import {
	PROVIDER_OUTCOMES,
	PROVIDER_REASONS,
	PROVIDER_SOURCES,
	providerErrorReason,
} from './provider-observer';
import {
	PROVIDER_NAMES,
	PROVIDER_REGISTRY,
	registeredOperationsForScope,
} from './provider-registry';

describe('provider metrics contract "1"', () => {
	test('request series counts per scope match the contract enumeration', () => {
		const api = enumerateProviderRequestSeries('api');
		const worker = enumerateProviderRequestSeries('enrichment');
		const classification = enumerateProviderRequestSeries('classification');
		// search_goodreads_id/search_isbn: 3 live + 9 errors + 2 cache = 14; search_title: 16.
		// enrichment x5: 2 live + 8 errors (no circuit_open) = 10.
		// goodreads page x1: hit, miss + 8 errors (no circuit_open) = 10; no cache series.
		expect(api).toHaveLength(EXPECTED_PROVIDER_SERIES.api.requests);
		expect(worker).toHaveLength(EXPECTED_PROVIDER_SERIES.enrichment.requests);
		expect(classification).toHaveLength(EXPECTED_PROVIDER_SERIES.classification.requests);
		for (const scope of PROVIDER_METRICS_SCOPES) {
			const expected = EXPECTED_PROVIDER_SERIES[scope];
			const perOperation: Record<string, number> = {};
			for (const labels of enumerateProviderRequestSeries(scope)) {
				const key = `${labels.provider}|${labels.operation}`;
				perOperation[key] = (perOperation[key] ?? 0) + 1;
			}
			expect(perOperation).toEqual(expected.operations);
			expect(Object.values(expected.operations).reduce((sum, n) => sum + n, 0)).toBe(
				expected.requests
			);
		}
		expect(
			classification.every(
				(s) =>
					(s.provider === 'openlibrary' && s.operation.startsWith('search_')) ||
					(s.provider === 'spotify' &&
						(s.operation === 'token' || s.operation === 'classify_item')) ||
					(s.provider === 'youtube' && s.operation === 'classify_oembed') ||
					(s.provider === 'tmdb' && s.operation === 'find') ||
					(s.provider === 'wikidata' && s.operation === 'classify_entity') ||
					(s.provider === 'wikipedia' && s.operation === 'classify_summary')
			)
		).toBe(true);
		expect(new Set(api.map((s) => Object.values(s).join('|'))).size).toBe(api.length);
		expect(api.filter((s) => s.operation === 'search_title')).toHaveLength(
			EXPECTED_PROVIDER_SERIES.api.operations['openlibrary|search_title']
		);
		expect(api.filter((s) => s.operation === 'work')).toHaveLength(
			EXPECTED_PROVIDER_SERIES.api.operations['openlibrary|work']
		);
		expect(api.some((s) => s.operation === 'work' && s.reason === 'circuit_open')).toBe(false);
		// ENG-17085: `work` runs through the openlibrary pacing slot, so a refusal is its own series.
		expect(api.some((s) => s.operation === 'work' && s.outcome === 'budget_exhausted')).toBe(true);
		expect(api.some((s) => s.operation === 'page' && s.outcome === 'budget_exhausted')).toBe(false);
		expect(api.some((s) => s.operation === 'search_isbn' && s.outcome === 'ambiguous')).toBe(false);
		expect(worker.some((s) => s.operation.startsWith('search_'))).toBe(false);
		// The goodreads.com page is fetched by enrichment only; classification never fetches it.
		expect(classification.some((s) => s.operation === 'page')).toBe(false);
		// `web|page` (ENG-17017) is the same spec for every other page, with no host label.
		for (const [series, provider] of [
			[api, 'goodreads'],
			[worker, 'goodreads'],
			[api, 'web'],
			[worker, 'web'],
		] as const) {
			const page = series.filter((s) => s.operation === 'page' && s.provider === provider);
			expect(page).toHaveLength(EXPECTED_PROVIDER_SERIES.api.operations[`${provider}|page`]);
			// Cache series: only a hit or a miss; a failed fetch is recorded once, live.
			expect(
				page
					.filter((s) => s.source === 'cache')
					.map((s) => `${s.outcome}:${s.reason}`)
					.sort()
			).toEqual(['hit:none', 'miss:none']);
			expect(
				page
					.filter((s) => s.source === 'live')
					.map((s) => `${s.outcome}:${s.reason}`)
					.sort()
			).toEqual(
				[
					// Only web|page tells a fetched page without metadata and a dead URL apart (live only).
					...(provider === 'web' ? ['hit:no_metadata', 'miss:dead_url'] : []),
					'error:blocked',
					'error:http_4xx',
					'error:invalid_response',
					'error:network',
					'error:other',
					'error:rate_limited',
					'error:timeout',
					'error:upstream_5xx',
					'hit:none',
					'miss:none',
				].sort()
			);
		}
		expect(api.some((s) => s.provider === 'goodreads' && s.operation !== 'page')).toBe(false);
		expect(api.some((s) => s.provider === 'web' && s.operation !== 'page')).toBe(false);
		expect(api.filter((s) => s.operation === 'page')).toHaveLength(26);
	});

	test('web|page: the live hit/miss reasons are declared by the registry, bounded and live-only', () => {
		const norm = (overrides: Record<string, unknown>) =>
			normalizeProviderRequestEvent('enrichment', {
				type: 'provider_request',
				provider: 'web',
				operation: 'page',
				outcome: 'hit',
				reason: 'none',
				source: 'live',
				...overrides,
			});
		expect(norm({ outcome: 'hit', reason: 'no_metadata' })?.reason).toBe('no_metadata');
		expect(norm({ outcome: 'miss', reason: 'dead_url' })?.reason).toBe('dead_url');
		// Not declared for that outcome: collapses to none, never a new series.
		expect(norm({ outcome: 'hit', reason: 'dead_url' })?.reason).toBe('none');
		expect(norm({ outcome: 'miss', reason: 'no_metadata' })?.reason).toBe('none');
		// Cache events carry no reason.
		expect(norm({ source: 'cache', outcome: 'hit', reason: 'no_metadata' })?.reason).toBe('none');
		expect(norm({ source: 'cache', outcome: 'miss', reason: 'dead_url' })?.reason).toBe('none');
		// Goodreads declares none of them: the same event there is a plain hit.
		expect(
			normalizeProviderRequestEvent('enrichment', {
				type: 'provider_request',
				provider: 'goodreads',
				operation: 'page',
				outcome: 'hit',
				reason: 'no_metadata',
				source: 'live',
			})?.reason
		).toBe('none');
		// An error never carries a success reason.
		expect(norm({ outcome: 'error', reason: 'dead_url' })?.reason).toBe('other');
	});

	test('resolution series: attach_verify only has quality=unknown and route=title only with resolved', () => {
		const series = enumerateProviderResolutionSeries();
		// preview: (3 routes + 1 + 1) x 4 qualities; attach_verify: 5 x unknown.
		expect(series).toHaveLength(EXPECTED_PROVIDER_SERIES.api.resolutions);
		expect(series.filter((s) => s.caller === 'preview')).toHaveLength(
			EXPECTED_RESOLUTION_SERIES.preview
		);
		const attach = series.filter((s) => s.caller === 'attach_verify');
		expect(attach).toHaveLength(EXPECTED_RESOLUTION_SERIES.attach_verify);
		expect(attach.every((s) => s.quality === 'unknown')).toBe(true);
		expect(
			normalizeProviderResolutionEvent({
				input: 'goodreads',
				resolution: 'resolved',
				route: 'goodreads_id',
				quality: 'title_only',
				caller: 'attach_verify',
			})
		).toBeUndefined();
		expect(
			normalizeProviderResolutionEvent({
				input: 'goodreads',
				resolution: 'resolved',
				route: 'goodreads_id',
				quality: 'unknown',
				caller: 'attach_verify',
			})
		).toEqual({
			input: 'goodreads',
			resolution: 'resolved',
			route: 'goodreads_id',
			quality: 'unknown',
			caller: 'attach_verify',
		});
		expect(
			series.filter((s) => s.route === 'title').every((s) => s.resolution === 'resolved')
		).toBe(true);
		expect(
			series.filter((s) => s.resolution === 'ambiguous').every((s) => s.route === 'none')
		).toBe(true);
	});

	test('adversarial values never become label values', () => {
		const hostile = 'https://evil.example/?token=abc&id=1';
		expect(
			normalizeProviderRequestEvent('api', {
				provider: 'openlibrary',
				operation: 'search_title',
				outcome: 'error',
				reason: hostile,
				source: 'live',
			})
		).toEqual({
			provider: 'openlibrary',
			operation: 'search_title',
			outcome: 'error',
			reason: 'other',
			source: 'live',
		});
		for (const field of ['provider', 'operation', 'outcome', 'source']) {
			const event = {
				provider: 'openlibrary',
				operation: 'work',
				outcome: 'hit',
				reason: 'none',
				source: 'live',
				[field]: hostile,
			};
			expect(normalizeProviderRequestEvent('api', event)).toBeUndefined();
		}
		expect(normalizeProviderRequestEvent('api', null)).toBeUndefined();
		expect(normalizeProviderRequestEvent('api', 'x')).toBeUndefined();
		// An inapplicable combination is dropped, not coerced into a new series.
		expect(
			normalizeProviderRequestEvent('api', {
				provider: 'goodreads',
				operation: 'page',
				outcome: 'budget_exhausted',
				reason: 'none',
				source: 'live',
			})
		).toBeUndefined();
		// circuit_open is not valid for enrichment: it falls back to other.
		expect(
			normalizeProviderRequestEvent('api', {
				provider: 'openlibrary',
				operation: 'work',
				outcome: 'error',
				reason: 'circuit_open',
				source: 'live',
			})?.reason
		).toBe('other');
		// A non-error outcome ignores any reason text.
		expect(
			normalizeProviderRequestEvent('api', {
				provider: 'openlibrary',
				operation: 'work',
				outcome: 'hit',
				reason: hostile,
				source: 'live',
			})?.reason
		).toBe('none');
		expect(
			normalizeProviderRequestEvent('enrichment', {
				provider: 'openlibrary',
				operation: 'search_title',
				outcome: 'hit',
				reason: 'none',
				source: 'live',
			})
		).toBeUndefined();
	});

	test('resolution and host normalizers reject unknown values', () => {
		expect(
			normalizeProviderResolutionEvent({
				input: 'goodreads',
				resolution: 'resolved',
				route: 'title',
				quality: 'title_only',
				caller: 'preview',
			})
		).toEqual({
			input: 'goodreads',
			resolution: 'resolved',
			route: 'title',
			quality: 'title_only',
			caller: 'preview',
		});
		expect(
			normalizeProviderResolutionEvent({
				input: 'goodreads',
				resolution: 'ambiguous',
				route: 'title',
				quality: 'title_only',
				caller: 'preview',
			})
		).toBeUndefined();
		expect(
			normalizeProviderResolutionEvent({
				input: 'https://www.goodreads.com/book/show/5907',
				resolution: 'resolved',
				route: 'goodreads_id',
				quality: 'title_only',
				caller: 'preview',
			})
		).toBeUndefined();
		expect(normalizeProviderCircuitHost('openlibrary.org')).toBe('openlibrary.org');
		expect(normalizeProviderCircuitHost('goodreads.com')).toBeUndefined();
	});

	test('series keys are explicit and independent of property order', () => {
		const a = {
			operation: 'work',
			provider: 'openlibrary',
			source: 'live',
			outcome: 'hit',
			reason: 'none',
		} as const;
		const b = {
			provider: 'openlibrary',
			operation: 'work',
			outcome: 'hit',
			reason: 'none',
			source: 'live',
		} as const;
		expect(providerRequestLabelsKey(a)).toBe(providerRequestLabelsKey(b));
		expect(providerRequestLabelsKey(a)).toBe('openlibrary|work|hit|none|live');
		const r = {
			caller: 'preview',
			quality: 'unknown',
			route: 'none',
			resolution: 'unresolved',
			input: 'goodreads',
		} as const;
		expect(providerResolutionLabelsKey(r)).toBe('goodreads|unresolved|none|unknown|preview');
	});

	test('forEachValidTuple visits exactly the enumerated series of each scope', () => {
		const counts = (scope: (typeof PROVIDER_METRICS_SCOPES)[number]) => {
			const tuples: ProviderValidTuple[] = [];
			forEachValidTuple(scope, (tuple) => tuples.push(tuple));
			const by = (family: ProviderValidTuple['family']) =>
				tuples.filter((tuple) => tuple.family === family).length;
			return {
				requests: by('requests'),
				duration: by('duration'),
				resolutions: by('resolutions'),
				circuitOpen: by('circuitOpen'),
				info: by('info'),
				dropped: by('dropped'),
			};
		};
		for (const scope of PROVIDER_METRICS_SCOPES) {
			const expected = EXPECTED_PROVIDER_SERIES[scope];
			expect(counts(scope)).toEqual({
				requests: expected.requests,
				duration: expected.durationHistograms,
				resolutions: expected.resolutions,
				circuitOpen: expected.circuitGauges,
				info: expected.info,
				dropped: expected.dropped,
			});
		}
	});

	test('the family table names every exported family exactly once', () => {
		const names = Object.values(PROVIDER_METRIC_FAMILIES).map((family) => family.name);
		expect(new Set(names).size).toBe(names.length);
		expect(names.sort()).toEqual([
			'intuition_provider_circuit_open',
			'intuition_provider_events_dropped_total',
			'intuition_provider_instrumentation_info',
			'intuition_provider_request_duration_seconds',
			'intuition_provider_requests_total',
			'intuition_provider_resolutions_total',
		]);
		expect(PROVIDER_METRIC_FAMILIES.dropped.labelNames).toEqual(['family']);
	});

	test('scopes reject operations they do not export', () => {
		const search = {
			provider: 'openlibrary',
			operation: 'search_isbn',
			outcome: 'hit',
			reason: 'none',
			source: 'live',
		};
		const work = { ...search, operation: 'work' };
		expect(normalizeProviderRequestEvent('classification', search)?.operation).toBe('search_isbn');
		expect(normalizeProviderRequestEvent('classification', work)).toBeUndefined();
		expect(normalizeProviderRequestEvent('enrichment', search)).toBeUndefined();
		expect(normalizeProviderRequestEvent('enrichment', work)?.operation).toBe('work');
	});

	test('providerDurationSeconds is undefined for anything that is not a finite number', () => {
		expect(providerDurationSeconds({ durationMs: 1500 })).toBe(1.5);
		expect(providerDurationSeconds({ durationMs: -5 })).toBe(0);
		expect(providerDurationSeconds({ durationMs: Number.NaN })).toBeUndefined();
		expect(providerDurationSeconds({ durationMs: Number.POSITIVE_INFINITY })).toBeUndefined();
		expect(providerDurationSeconds({ durationMs: '12' })).toBeUndefined();
		expect(providerDurationSeconds({})).toBeUndefined();
	});

	test('reason mapping: redirects are invalid_response, pinned kinds are other', () => {
		expect(providerErrorReason({ kind: 'redirect_exhausted' })).toBe('invalid_response');
		expect(providerErrorReason({ kind: 'redirect_rejected' })).toBe('invalid_response');
		// #2141: a 200 whose body is not JSON.
		expect(providerErrorReason({ kind: 'invalid_json' })).toBe('invalid_response');
		// #2141 / #2268: an oversized body and a guard-refused target.
		expect(providerErrorReason({ kind: 'response_too_large' })).toBe('invalid_response');
		expect(providerErrorReason({ kind: 'target_rejected' })).toBe('blocked');
		expect(providerErrorReason({ reason: 'redirect_rejected', kind: 'non_ok_status' })).toBe(
			'invalid_response'
		);
		expect(providerErrorReason({ kind: 'adapter_null' })).toBe('other');
		expect(providerErrorReason({ kind: 'identity_conflict' })).toBe('other');
		expect(providerErrorReason({ kind: 'timeout' })).toBe('timeout');
		expect(providerErrorReason({ kind: 'non_ok_status', status: 429 })).toBe('rate_limited');
		expect(providerErrorReason({ kind: 'circuit_open' })).toBe('circuit_open');
	});

	test('every enumerated request series round-trips through the normalizer, in every scope', () => {
		for (const scope of PROVIDER_METRICS_SCOPES) {
			for (const labels of enumerateProviderRequestSeries(scope)) {
				// An event carrying exactly the series' labels must map back onto itself: a value in
				// a type but not in the allowlist would be dropped here.
				expect(
					normalizeProviderRequestEvent(scope, { type: 'provider_request', ...labels })
				).toEqual(labels);
			}
		}
	});

	test('every enumerated resolution series round-trips through the normalizer', () => {
		for (const labels of enumerateProviderResolutionSeries()) {
			expect(normalizeProviderResolutionEvent({ type: 'provider_resolution', ...labels })).toEqual(
				labels
			);
		}
	});

	test('every member of every label allowlist is used by at least one valid series, over the union of scopes', () => {
		// The union, not just `api`: an operation that runs only in a worker still needs its labels.
		const series = PROVIDER_METRICS_SCOPES.flatMap((scope) =>
			enumerateProviderRequestSeries(scope)
		);
		const usesAuthFailed = EXPECTED_AUTH_FAILED_OPERATIONS.length > 0;
		for (const field of ['provider', 'operation', 'outcome', 'reason', 'source'] as const) {
			const allowlist: readonly string[] = {
				provider: PROVIDER_NAMES,
				operation: PROVIDER_METRICS_SCOPES.flatMap((scope) =>
					registeredOperationsForScope(scope).map((entry) => entry.operation)
				),
				outcome: PROVIDER_OUTCOMES,
				// `auth_failed` is in the vocabulary before any provider opts into it; the expected
				// table lists the operations that do.
				reason: PROVIDER_REASONS.filter((reason) => usesAuthFailed || reason !== 'auth_failed'),
				source: PROVIDER_SOURCES,
			}[field];
			const used: string[] = [...new Set<string>(series.map((entry) => entry[field]))];
			const expected: string[] = [...new Set<string>(allowlist)];
			expect(used.sort()).toEqual(expected.sort());
		}
		const resolutions = enumerateProviderResolutionSeries();
		for (const field of ['input', 'resolution', 'route', 'quality', 'caller'] as const) {
			const used: string[] = [...new Set<string>(resolutions.map((entry) => entry[field]))];
			const allowed: readonly string[] = PROVIDER_RESOLUTION_VALUES[field];
			const expected: string[] = [...allowed];
			expect(used.sort()).toEqual(expected.sort());
		}
	});

	test('the registry composes every phase-1 provider, and the scope operations derive from it', () => {
		expect([...PROVIDER_NAMES]).toEqual([
			'openlibrary',
			'goodreads',
			'musicbrainz',
			'apple-music',
			'spotify',
			'youtube',
			'oembed',
			'tmdb',
			'web',
			'wikidata',
			'wikipedia',
		]);
		expect(PROVIDER_REGISTRY.map((entry) => entry.provider)).toEqual([...PROVIDER_NAMES]);
		expect(providerOperationsForScope('classification')).toEqual([
			{ provider: 'openlibrary', operation: 'search_goodreads_id' },
			{ provider: 'openlibrary', operation: 'search_isbn' },
			{ provider: 'openlibrary', operation: 'search_title' },
			{ provider: 'spotify', operation: 'token' },
			{ provider: 'spotify', operation: 'classify_item' },
			{ provider: 'youtube', operation: 'classify_oembed' },
			{ provider: 'tmdb', operation: 'find' },
			{ provider: 'wikidata', operation: 'classify_entity' },
			{ provider: 'wikipedia', operation: 'classify_summary' },
		]);
		expect(providerOperationsForScope('enrichment').map((entry) => entry.provider)).toEqual([
			'openlibrary',
			'openlibrary',
			'openlibrary',
			'openlibrary',
			'openlibrary',
			'goodreads',
			'musicbrainz',
			'musicbrainz',
			'musicbrainz',
			'apple-music',
			'apple-music',
			'apple-music',
			'spotify',
			'spotify',
			'spotify',
			'spotify',
			'youtube',
			'oembed',
			'oembed',
			'oembed',
			'tmdb',
			'web',
			'wikidata',
			'wikidata',
			'wikipedia',
		]);
	});

	test('(provider, operation) is the identity: an operation of another provider is dropped', () => {
		const base = { type: 'provider_request', outcome: 'hit', reason: 'none', source: 'live' };
		expect(
			normalizeProviderRequestEvent('api', { ...base, provider: 'openlibrary', operation: 'work' })
		).toBeDefined();
		expect(
			normalizeProviderRequestEvent('api', { ...base, provider: 'goodreads', operation: 'work' })
		).toBeUndefined();
		expect(
			normalizeProviderRequestEvent('api', { ...base, provider: 'openlibrary', operation: 'page' })
		).toBeUndefined();
		expect(
			normalizeProviderRequestEvent('api', {
				...base,
				provider: 'openlibrary',
				operation: 'constructor',
			})
		).toBeUndefined();
	});

	test('auth_failed is in the vocabulary; only the operations that opt in accept it', () => {
		expect(providerErrorReason({ kind: 'auth_failed' })).toBe('auth_failed');
		expect(providerErrorReason({ reason: 'auth_failed' })).toBe('auth_failed');
		expect(
			normalizeProviderRequestEvent('api', {
				provider: 'openlibrary',
				operation: 'work',
				outcome: 'error',
				reason: 'auth_failed',
				source: 'live',
			})
		).toMatchObject({ reason: 'other' });
		const spotify = (operation: string) =>
			normalizeProviderRequestEvent('api', {
				type: 'provider_request',
				provider: 'spotify',
				operation,
				outcome: 'error',
				reason: 'auth_failed',
				source: 'live',
			});
		for (const operation of ['token', 'item', 'classify_item', 'isrc_search']) {
			expect(spotify(operation)).toMatchObject({ reason: 'auth_failed' });
		}
		// The public oEmbed endpoint takes no credentials.
		expect(spotify('oembed')).toMatchObject({ reason: 'other' });
	});

	test('the Spotify item lookup is two operations so the fallback share never double-counts', () => {
		const event = (operation: string) =>
			({
				type: 'provider_request',
				provider: 'spotify',
				operation,
				outcome: 'hit',
				reason: 'none',
				source: 'live',
			}) as const;
		const scopes = ['api', 'classification', 'enrichment'] as const;
		const accepted = (operation: string) =>
			scopes.filter(
				(scope) => normalizeProviderRequestEvent(scope, event(operation)) !== undefined
			);
		// `item` is the enrichment lookup, `classify_item` the classification one; the api runs both.
		expect(accepted('item')).toEqual(['api', 'enrichment']);
		expect(accepted('classify_item')).toEqual(['api', 'classification']);
		expect(accepted('token')).toEqual(['api', 'classification', 'enrichment']);
	});

	test('duration histograms are keyed by provider|operation, never by operation alone', () => {
		expect(providerDurationLabelsKey({ provider: 'openlibrary', operation: 'work' })).toBe(
			'openlibrary|work'
		);
		// Operation names are only unique per provider: the same name under two providers must
		// not share a histogram.
		expect(providerDurationLabelsKey({ provider: 'openlibrary', operation: 'page' })).not.toBe(
			providerDurationLabelsKey({ provider: 'goodreads', operation: 'page' })
		);
		const keys = new Set<string>();
		for (const scope of PROVIDER_METRICS_SCOPES) {
			forEachValidTuple(scope, (tuple) => {
				if (tuple.family === 'duration') keys.add(providerDurationLabelsKey(tuple.labels));
			});
		}
		const registered = PROVIDER_METRICS_SCOPES.flatMap((scope) =>
			providerOperationsForScope(scope).map((entry) => `${entry.provider}|${entry.operation}`)
		);
		expect([...keys].sort()).toEqual([...new Set(registered)].sort());
	});
});
