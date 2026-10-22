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
	providerDurationSeconds,
	providerRequestLabelsKey,
	providerResolutionLabelsKey,
} from './provider-metrics-contract';
import {
	PROVIDER_NAMES,
	PROVIDER_OPERATIONS,
	PROVIDER_OUTCOMES,
	PROVIDER_REASONS,
	PROVIDER_SOURCES,
	providerErrorReason,
} from './provider-observer';

describe('provider metrics contract "1"', () => {
	test('request series counts per scope match the contract enumeration', () => {
		const api = enumerateProviderRequestSeries('api');
		const worker = enumerateProviderRequestSeries('enrichment');
		const classification = enumerateProviderRequestSeries('classification');
		// search_goodreads_id/search_isbn: 3 live + 9 errors + 2 cache = 14; search_title: 16.
		// enrichment x5: 2 live + 8 errors (no circuit_open) = 10.
		// goodreads page x1: hit, miss + 8 errors (no circuit_open) = 10; no cache series.
		expect(api).toHaveLength(14 + 14 + 16 + 5 * 10 + 10);
		expect(api).toHaveLength(104);
		expect(worker).toHaveLength(60);
		expect(classification).toHaveLength(44);
		expect(classification.every((s) => s.operation.startsWith('search_'))).toBe(true);
		expect(new Set(api.map((s) => Object.values(s).join('|'))).size).toBe(api.length);
		expect(api.filter((s) => s.operation === 'search_title')).toHaveLength(16);
		expect(api.filter((s) => s.operation === 'work')).toHaveLength(10);
		expect(api.some((s) => s.operation === 'work' && s.reason === 'circuit_open')).toBe(false);
		expect(api.some((s) => s.operation === 'work' && s.outcome === 'budget_exhausted')).toBe(false);
		expect(api.some((s) => s.operation === 'search_isbn' && s.outcome === 'ambiguous')).toBe(false);
		expect(worker.some((s) => s.operation.startsWith('search_'))).toBe(false);
		// The goodreads.com page is fetched by enrichment only; classification never fetches it.
		expect(classification.some((s) => s.operation === 'page')).toBe(false);
		for (const series of [api, worker]) {
			const page = series.filter((s) => s.operation === 'page');
			expect(page).toHaveLength(10);
			expect(page.every((s) => s.provider === 'goodreads' && s.source === 'live')).toBe(true);
			expect(page.map((s) => `${s.outcome}:${s.reason}`).sort()).toEqual(
				[
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
	});

	test('resolution series: attach_verify only has quality=unknown and route=title only with resolved', () => {
		const series = enumerateProviderResolutionSeries();
		// preview: (3 routes + 1 + 1) x 4 qualities = 20; attach_verify: 5 x unknown = 5.
		expect(series).toHaveLength(25);
		expect(series.filter((s) => s.caller === 'preview')).toHaveLength(20);
		const attach = series.filter((s) => s.caller === 'attach_verify');
		expect(attach).toHaveLength(5);
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
				provider: 'openlibrary',
				operation: 'work',
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
		expect(counts('api')).toEqual({
			requests: 104,
			duration: 9,
			resolutions: 25,
			circuitOpen: 1,
			info: 1,
			dropped: 2,
		});
		expect(counts('classification')).toEqual({
			requests: 44,
			duration: 3,
			resolutions: 0,
			circuitOpen: 1,
			info: 1,
			dropped: 2,
		});
		expect(counts('enrichment')).toEqual({
			requests: 60,
			duration: 6,
			resolutions: 0,
			circuitOpen: 0,
			info: 1,
			dropped: 2,
		});
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

	test('every member of every label allowlist is used by at least one valid series', () => {
		const series = enumerateProviderRequestSeries('api');
		for (const field of ['provider', 'operation', 'outcome', 'reason', 'source'] as const) {
			const allowlist: readonly string[] = {
				provider: PROVIDER_NAMES,
				operation: PROVIDER_OPERATIONS,
				outcome: PROVIDER_OUTCOMES,
				reason: PROVIDER_REASONS,
				source: PROVIDER_SOURCES,
			}[field];
			const used: string[] = [...new Set<string>(series.map((entry) => entry[field]))];
			const expected: string[] = [...allowlist];
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
});
