import { describe, expect, it } from 'bun:test';

import {
	BUDGET_EXHAUSTED_ERROR_CLASS,
	classifiedAtomInputSchema,
	enrichmentRequestSchema,
	enrichmentRunResultSchema,
	pluginExecutionErrorCodeSchema,
	pluginExecutionErrorSchema,
	providerHttpErrorDetailsSchema,
	slotRefusalErrorDetailsSchema,
} from '../src/types';

describe('enrichment contract schemas', () => {
	it('preserves existing JSON-LD-bearing inputs byte-for-byte', () => {
		const input = {
			atomType: 'company' as const,
			jsonLd: {
				'@context': 'https://schema.org',
				'@type': 'Organization',
				name: 'Acme Labs',
			},
			source: {
				classificationEngine: 'legacy-classifier',
				classifiedAt: '2026-02-10T18:00:00.000Z',
			},
			hints: {
				name: 'Acme Labs',
			},
		};

		expect(classifiedAtomInputSchema.parse(input)).toEqual(input);
	});

	it('accepts a canonical first-class IID without JSON-LD and resolves provider hints', () => {
		const input = classifiedAtomInputSchema.parse({
			atomType: 'song',
			identifier: {
				iid: 'int:isrc:USUM71703861',
				scheme: 'isrc',
				value: 'USUM71703861',
				anchorEligible: true,
			},
			source: {
				classificationEngine: 'iid-fixture',
				classifiedAt: '2026-08-07T12:00:00.000Z',
			},
		});

		expect(input.identifier).toEqual({
			iid: 'int:isrc:USUM71703861',
			scheme: 'isrc',
			value: 'USUM71703861',
			anchorEligible: true,
		});
		expect(input.jsonLd).toEqual({});
		expect(input.hints?.identifiers).toEqual({ isrc: 'USUM71703861' });
	});

	it('rejects missing identity data and inconsistent first-class identifiers', () => {
		const source = {
			classificationEngine: 'iid-fixture',
			classifiedAt: '2026-08-07T12:00:00.000Z',
		};

		expect(classifiedAtomInputSchema.safeParse({ atomType: 'thing', source }).success).toBe(false);
		expect(
			classifiedAtomInputSchema.safeParse({
				atomType: 'song',
				identifier: {
					iid: 'int:isrc:USUM71703861',
					scheme: 'isbn',
					value: 'USUM71703861',
				},
				source,
			}).success
		).toBe(false);
	});

	it('canonicalizes embedded IIDs and maps every contracted scheme family', () => {
		const cases = [
			['int:isrc:us-um7-17-03861', { isrc: 'USUM71703861' }],
			['int:isbn:0-684-83272-0', { isbn: '9780684832722' }],
			['int:wd:Q42', { wd: 'Q42', wikidata: 'Q42' }],
			['int:wd:film:Q25188', { wd: 'Q25188', wikidata: 'Q25188', wdSlug: 'film' }],
			['int:tmdb:movie:603', { tmdb: 'movie:603', tmdbId: 'movie:603' }],
			[
				'int:caip19:eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
				{
					caip19: 'eip155:1/erc20:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
					chainId: '1',
					address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
				},
			],
			['int:olid:ol45804w', { olid: 'OL45804W' }],
			['int:appid:android:com.spotify.music', { appid: 'android:com.spotify.music' }],
		] as const;

		for (const [identifier, expectedHints] of cases) {
			const input = classifiedAtomInputSchema.parse({
				atomType: 'thing',
				jsonLd: { identifier },
				source: {
					classificationEngine: 'iid-fixture',
					classifiedAt: '2026-08-07T12:00:00.000Z',
				},
			});

			expect(input.hints?.identifiers, identifier).toEqual(expectedHints);
		}
	});

	it('ignores invalid embedded IIDs without rejecting otherwise valid JSON-LD', () => {
		const input = classifiedAtomInputSchema.parse({
			atomType: 'song',
			jsonLd: { identifier: 'int:isrc:not-valid' },
			source: {
				classificationEngine: 'iid-fixture',
				classifiedAt: '2026-08-07T12:00:00.000Z',
			},
		});

		expect(input.hints?.identifiers).toBeUndefined();
	});

	it('parses a valid enrichment request', () => {
		const request = enrichmentRequestSchema.parse({
			input: {
				atomType: 'company',
				jsonLd: {
					'@context': 'https://schema.org',
					'@type': 'Organization',
					name: 'Acme Labs',
					url: 'https://acme.example',
				},
				source: {
					classificationEngine: '@0xintuition/atom-classification',
					classifiedAt: '2026-02-10T18:00:00.000Z',
				},
				hints: {
					name: 'Acme Labs',
					url: 'https://acme.example',
				},
			},
			runtime: 'server',
			plugins: ['opengraph', 'brand'],
			artifactTypes: ['opengraph', 'brand'],
			concurrency: 3,
			timeoutMs: 5_000,
			traceId: 'trace-123',
		});

		expect(request.runtime).toBe('server');
		expect(request.input.atomType).toBe('company');
		expect(request.plugins).toEqual(['opengraph', 'brand']);
	});

	it('rejects invalid request runtime values', () => {
		expect(() =>
			enrichmentRequestSchema.parse({
				input: {
					atomType: 'company',
					jsonLd: {},
					source: {
						classificationEngine: 'test',
						classifiedAt: '2026-02-10T18:00:00.000Z',
					},
				},
				runtime: 'edge',
			})
		).toThrow();
	});

	it('parses a valid run result with cache timing metadata', () => {
		const result = enrichmentRunResultSchema.parse({
			status: 'partial',
			artifacts: [
				{
					artifact_type: 'opengraph',
					data: {
						title: 'Acme Labs',
						url: 'https://acme.example',
					},
					meta: {
						pluginId: 'opengraph',
						provider: 'website',
						fetchedAt: '2026-02-10T18:00:01.100Z',
						fromCache: true,
						cachedAt: '2026-02-10T18:00:00.000Z',
					},
				},
			],
			errors: [
				{
					pluginId: 'crunchbase',
					code: 'rate_limited',
					message: '429 rate limited',
					retriable: true,
					details: {
						status: 429,
						retryAfterMs: 30_000,
						errorClass: 'provider_http_error',
					},
				},
			],
			skipped: [{ pluginId: 'spotify', reason: 'runtime_mismatch' }],
			timings: {
				startedAt: '2026-02-10T18:00:01.000Z',
				finishedAt: '2026-02-10T18:00:01.450Z',
				durationMs: 450,
				perPluginMs: {
					opengraph: 90,
					crunchbase: 145,
				},
				cacheHits: 1,
				cacheMisses: 1,
			},
			traceId: 'trace-123',
		});

		expect(result.status).toBe('partial');
		expect(result.timings.cacheHits).toBe(1);
		expect(result.artifacts[0]?.meta.fromCache).toBe(true);
		expect(result.errors[0]?.details?.retryAfterMs).toBe(30_000);
	});

	it('enforces plugin execution error code values', () => {
		expect(pluginExecutionErrorCodeSchema.safeParse('timeout').success).toBe(true);
		expect(pluginExecutionErrorCodeSchema.safeParse('bad_gateway').success).toBe(false);
	});
});

// ENG-16644 compatibility (one release): an old atom-services still sends the legacy
// diagnostics; they are accepted on parse and dropped, never kept.
it('client error details drop legacy URL and fetched body fields on parse', () => {
	const details = { status: 400, errorClass: 'target_rejected' };
	expect(providerHttpErrorDetailsSchema.parse(details)).toEqual(details);
	expect(
		providerHttpErrorDetailsSchema.parse({ ...details, requestUrl: 'https://private.example/' })
	).toEqual(details);
	expect(
		providerHttpErrorDetailsSchema.parse({ ...details, bodyExcerpt: 'internal body' })
	).toEqual(details);
	expect(providerHttpErrorDetailsSchema.safeParse({ ...details, somethingElse: 'x' }).success).toBe(
		false
	);
});

// ENG-17116: error details are a union. An HTTP failure always has a `status`; a lookup our own
// pacing slot refused has no HTTP exchange, so it carries `errorClass: 'budget_exhausted'` and a
// `retryAfterMs`, and never a status.
describe('error details: HTTP shape or slot-refusal shape (ENG-17116)', () => {
	const refusal = { errorClass: 'budget_exhausted', retryAfterMs: 4_000 } as const;

	it('accepts the refusal shape exactly as the engine emits it', () => {
		expect(providerHttpErrorDetailsSchema.parse(refusal)).toEqual(refusal);
		expect(
			pluginExecutionErrorSchema.parse({
				pluginId: 'musicbrainz',
				code: 'internal_error',
				message: 'Request slot queue is full',
				retriable: true,
				details: refusal,
			}).details
		).toEqual(refusal);
	});

	it('still requires a status on the HTTP shape: details with neither status nor a refusal class are rejected', () => {
		expect(providerHttpErrorDetailsSchema.safeParse({}).success).toBe(false);
		expect(providerHttpErrorDetailsSchema.safeParse({ retryAfterMs: 1_000 }).success).toBe(false);
		expect(providerHttpErrorDetailsSchema.safeParse({ errorClass: 'rate_limited' }).success).toBe(
			false
		);
		// The old defaulting is only for a real HTTP failure.
		expect(providerHttpErrorDetailsSchema.parse({ status: 503 })).toEqual({
			status: 503,
			errorClass: 'provider_http_error',
		});
	});

	it('requires the retry delay on the refusal shape, and refuses a status on it', () => {
		expect(
			providerHttpErrorDetailsSchema.safeParse({ errorClass: 'budget_exhausted' }).success
		).toBe(false);
		expect(providerHttpErrorDetailsSchema.safeParse({ ...refusal, retryAfterMs: -1 }).success).toBe(
			false
		);
		expect(
			providerHttpErrorDetailsSchema.safeParse({ ...refusal, retryAfterMs: 1.5 }).success
		).toBe(false);
		// The refusal shape itself has no place for a status.
		expect(slotRefusalErrorDetailsSchema.safeParse({ ...refusal, status: 429 }).success).toBe(
			false
		);
	});

	it('legacy diagnostics are dropped from the refusal shape too', () => {
		expect(
			providerHttpErrorDetailsSchema.parse({ ...refusal, requestUrl: 'https://private.example/' })
		).toEqual(refusal);
	});

	it('exports the one class name the engine and the worker share', () => {
		expect(BUDGET_EXHAUSTED_ERROR_CLASS).toBe('budget_exhausted');
		expect(slotRefusalErrorDetailsSchema.parse(refusal).errorClass).toBe(
			BUDGET_EXHAUSTED_ERROR_CLASS
		);
	});
});
