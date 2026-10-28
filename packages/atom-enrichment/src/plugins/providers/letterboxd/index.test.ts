import { beforeEach, describe, expect, it } from 'bun:test';
import {
	getLetterboxdHostCircuitSnapshot,
	resetLetterboxdHostPolicyForTests,
} from '@0xintuition/pipeline-runtime/letterboxd';
import { createEnrichmentEngine } from '../../../engine';
import { createMockAtomInput, createMockRequest } from '../../../testing';
import { createPinAwareFetch } from '../__shared__/http';
import { createLetterboxdPlugin } from '.';

const FIXTURE = await Bun.file(new URL('./__fixtures__/movie.html', import.meta.url)).text();
const SOURCE_URL = 'https://letterboxd.com/film/moonlight/';

describe('letterboxd enrichment provider', () => {
	beforeEach(() => resetLetterboxdHostPolicyForTests());

	it('emits a Letterboxd movie artifact from a canonical film URL', async () => {
		const requestedHosts: string[] = [];
		const engine = createEnrichmentEngine({
			plugins: [
				createLetterboxdPlugin({
					fetch: createPinAwareFetch(async (input) => {
						requestedHosts.push(new URL(input).hostname);
						return new Response(FIXTURE, { status: 200 });
					}),
				}),
			],
		});

		const result = await engine.enrich(
			createMockRequest({
				input: createMockAtomInput({
					atomType: 'thing',
					hints: { name: 'Moonlight', url: SOURCE_URL },
					jsonLd: {
						'@context': 'https://schema.org/',
						'@type': 'Movie',
						name: 'Moonlight',
						url: SOURCE_URL,
					},
				}),
			})
		);

		expect(result.errors).toEqual([]);
		expect(result.artifacts).toEqual([
			expect.objectContaining({
				artifact_type: 'letterboxd',
				data: {
					description: 'A young man searches for his place in the world.',
					directors: ['Barry Jenkins'],
					image:
						'https://a.ltrbxd.com/resized/film-poster/2/4/0/3/4/4/240344-moonlight-0-500-0-750-crop.jpg',
					rating: 4.2,
					bestRating: 5,
					ratingCount: 643000,
					title: 'Moonlight',
					tmdbId: '376867',
					year: 2016,
				},
				meta: expect.objectContaining({
					pluginId: 'letterboxd',
					provider: 'letterboxd',
					sourceUrl: SOURCE_URL,
				}),
			}),
		]);
		expect(requestedHosts).toEqual(['letterboxd.com']);
		expect(requestedHosts).not.toContain('api.themoviedb.org');
	});

	it('omits rating and scale when the page has no aggregateRating', async () => {
		const html = FIXTURE.replace(/"aggregateRating": \{[^}]*\}/, '"unusedRating": null');
		const engine = createEnrichmentEngine({
			plugins: [
				createLetterboxdPlugin({ fetch: createPinAwareFetch(async () => new Response(html)) }),
			],
		});
		const result = await engine.enrich(
			createMockRequest({ input: createMockAtomInput({ hints: { url: SOURCE_URL } }) })
		);
		expect(result.errors).toEqual([]);
		expect(result.artifacts).toHaveLength(1);
		expect(result.artifacts[0]?.data).not.toHaveProperty('rating');
		expect(result.artifacts[0]?.data).not.toHaveProperty('bestRating');
	});

	it('declines non-Letterboxd and non-film URLs without network access', async () => {
		let fetchCallCount = 0;
		const plugin = createLetterboxdPlugin({
			fetch: createPinAwareFetch(async () => {
				fetchCallCount += 1;
				return new Response('', { status: 500 });
			}),
		});

		for (const url of ['https://example.com/film/moonlight/', 'https://letterboxd.com/films/']) {
			expect(
				plugin.supports(createMockRequest({ input: createMockAtomInput({ hints: { url } }) }))
			).toBe(false);
		}
		expect(fetchCallCount).toBe(0);
	});

	it('adjudicates a 403 inside the breaker and cools down later calls without I/O', async () => {
		let fetchCallCount = 0;
		const engine = createEnrichmentEngine({
			plugins: [
				createLetterboxdPlugin({
					fetch: createPinAwareFetch(async () => {
						fetchCallCount += 1;
						return new Response('blocked', {
							headers: { 'retry-after': '60' },
							status: 403,
						});
					}),
				}),
			],
		});
		const request = createMockRequest({
			input: createMockAtomInput({ hints: { url: SOURCE_URL } }),
		});

		const first = await engine.enrich(request);
		const second = await engine.enrich(request);

		expect(fetchCallCount).toBe(1);
		expect(first.errors[0]).toMatchObject({
			code: 'auth_failed',
			details: { retryAfterMs: 60_000, status: 403 },
		});
		expect(second.errors[0]?.message).toContain('blocked');
		expect(getLetterboxdHostCircuitSnapshot('letterboxd.com')?.failures).toBe(1);
	});

	it('rejects a decompressed success body over the shared byte limit', async () => {
		const engine = createEnrichmentEngine({
			plugins: [
				createLetterboxdPlugin({
					fetch: createPinAwareFetch(
						async () =>
							new Response(`<html>${'x'.repeat(1_100_000)}${FIXTURE}</html>`, { status: 200 })
					),
				}),
			],
		});

		const result = await engine.enrich(
			createMockRequest({
				input: createMockAtomInput({ hints: { url: SOURCE_URL } }),
			})
		);

		expect(result.artifacts).toEqual([]);
		expect(result.errors[0]).toMatchObject({
			code: 'upstream_error',
			details: { errorClass: 'body_limit' },
		});
	});

	it('drops diagnostic bodies before returning a typed HTTP error', async () => {
		const engine = createEnrichmentEngine({
			plugins: [
				createLetterboxdPlugin({
					fetch: createPinAwareFetch(
						async () => new Response('x'.repeat(1_100_000), { status: 403 })
					),
				}),
			],
		});

		const result = await engine.enrich(
			createMockRequest({ input: createMockAtomInput({ hints: { url: SOURCE_URL } }) })
		);

		expect(result.errors[0]).toMatchObject({
			code: 'auth_failed',
			details: { status: 403 },
		});
		expect(result.errors[0]?.details).not.toHaveProperty('bodyExcerpt');
		expect(result.errors[0]?.details).not.toHaveProperty('requestUrl');
	});

	it('R3-02 rechecks its absolute deadline before the bounded body read', async () => {
		let nowMs = 9;
		let bodyReadCallCount = 0;
		const engine = createEnrichmentEngine({
			plugins: [
				createLetterboxdPlugin({
					now: () => nowMs,
					fetch: createPinAwareFetch(async () => {
						nowMs = 5_010;
						return {
							ok: true,
							status: 200,
							headers: new Headers(),
							body: {
								getReader: () => {
									bodyReadCallCount += 1;
									return {
										read: async () => ({ done: true }),
										cancel: async () => undefined,
										releaseLock: () => undefined,
									};
								},
							},
						} as unknown as Response;
					}),
				}),
			],
		});

		const result = await engine.enrich(
			createMockRequest({ input: createMockAtomInput({ hints: { url: SOURCE_URL } }) })
		);

		expect(result.artifacts).toEqual([]);
		expect(result.errors[0]).toMatchObject({ details: { errorClass: 'timeout' } });
		expect(bodyReadCallCount).toBe(0);
	});

	it('rejects a foreign redirect without fetching the destination', async () => {
		const requestedHosts: string[] = [];
		const engine = createEnrichmentEngine({
			plugins: [
				createLetterboxdPlugin({
					fetch: createPinAwareFetch(async (input) => {
						requestedHosts.push(new URL(input).hostname);
						return new Response('', {
							headers: { location: 'https://example.com/evil' },
							status: 302,
						});
					}),
				}),
			],
		});

		const result = await engine.enrich(
			createMockRequest({ input: createMockAtomInput({ hints: { url: SOURCE_URL } }) })
		);

		expect(requestedHosts).toEqual(['letterboxd.com']);
		expect(result.artifacts).toEqual([]);
		expect(result.errors[0]?.message).toContain('redirect_rejected');
	});

	it('detects a repeated redirect without issuing a second request', async () => {
		let fetchCallCount = 0;
		const engine = createEnrichmentEngine({
			plugins: [
				createLetterboxdPlugin({
					fetch: createPinAwareFetch(async () => {
						fetchCallCount += 1;
						return new Response('', { headers: { location: SOURCE_URL }, status: 302 });
					}),
				}),
			],
		});

		const result = await engine.enrich(
			createMockRequest({ input: createMockAtomInput({ hints: { url: SOURCE_URL } }) })
		);

		expect(fetchCallCount).toBe(1);
		expect(result.errors[0]?.message).toContain('redirect_exhausted');
	});
});
