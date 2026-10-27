import { describe, expect, it } from 'bun:test';
import { ZodError } from 'zod/v4';

import { createMockAtomInput, createMockPluginContext, createMockRequest } from '../../../testing';
import { createPinAwareFetch, ProviderHttpError } from '../__shared__/http';
import { createTvmazePlugin } from '.';

const SHOW_FIXTURE = JSON.parse(
	await Bun.file(new URL('./__fixtures__/show.json', import.meta.url)).text()
) as Record<string, unknown>;

describe('tvmaze enrichment provider', () => {
	it('looks up a show by IMDb id and retains the full validated payload', async () => {
		const requestedUrls: string[] = [];
		const plugin = createTvmazePlugin({
			fetch: createPinAwareFetch(async (input) => {
				requestedUrls.push(input);
				if (input.includes('/lookup/shows')) {
					return new Response(null, {
						headers: { location: '/shows/169' },
						status: 302,
					});
				}
				return jsonResponse(SHOW_FIXTURE);
			}),
		});

		const artifacts = await plugin.enrich(
			createTvRequest({ identifiers: { imdb: 'tt0903747', thetvdb: '81189' } }),
			createMockPluginContext()
		);

		expect(requestedUrls).toEqual([
			'https://api.tvmaze.com/lookup/shows?imdb=tt0903747',
			'https://api.tvmaze.com/shows/169',
		]);
		expect(artifacts).toEqual([
			expect.objectContaining({
				artifact_type: 'tvmaze',
				data: expect.objectContaining({
					averageRuntime: 60,
					ended: '2013-09-29',
					externals: { imdb: 'tt0903747', thetvdb: 81189, tvrage: 18164 },
					genres: ['Drama', 'Crime', 'Thriller'],
					id: 169,
					image: {
						medium: 'https://static.tvmaze.com/uploads/images/medium_portrait/0/2400.jpg',
						original: 'https://static.tvmaze.com/uploads/images/original_untouched/0/2400.jpg',
					},
					language: 'English',
					name: 'Breaking Bad',
					network: { name: 'AMC' },
					officialSite: 'https://www.amc.com/shows/breaking-bad--1002078',
					premiered: '2008-01-20',
					rating: { average: 9.3 },
					runtime: 60,
					schedule: { days: ['Sunday'], time: '21:00' },
					status: 'Ended',
					summary: 'A chemistry teacher becomes a methamphetamine producer.',
					tvmazeApiPayload: SHOW_FIXTURE,
					type: 'Scripted',
					url: 'https://www.tvmaze.com/shows/169/breaking-bad',
					webChannel: null,
				}),
				meta: expect.objectContaining({
					pluginId: 'tvmaze',
					provider: 'tvmaze',
					sourceUrl: 'https://www.tvmaze.com/shows/169/breaking-bad',
				}),
			}),
		]);
	});

	it('accepts a title match within the premiere-year tolerance', async () => {
		const requestedUrls: string[] = [];
		const plugin = createTvmazePlugin({
			fetch: createPinAwareFetch(async (input) => {
				requestedUrls.push(input);
				return jsonResponse(SHOW_FIXTURE);
			}),
		});

		const artifacts = await plugin.enrich(
			createTvRequest({ name: 'Breaking Bad', premiereYear: 2009 }),
			createMockPluginContext()
		);

		expect(requestedUrls).toEqual(['https://api.tvmaze.com/singlesearch/shows?q=Breaking+Bad']);
		expect(artifacts).toHaveLength(1);
	});

	it('rejects a title match outside the premiere-year tolerance', async () => {
		const plugin = createTvmazePlugin({
			fetch: createPinAwareFetch(async () => jsonResponse(SHOW_FIXTURE)),
		});

		const artifacts = await plugin.enrich(
			createTvRequest({ name: 'Breaking Bad', premiereYear: 2010 }),
			createMockPluginContext()
		);

		expect(artifacts).toEqual([]);
	});

	it('uses TheTVDB lookup when no stronger provider id is available', async () => {
		const requestedUrls: string[] = [];
		const plugin = createTvmazePlugin({
			fetch: createPinAwareFetch(async (input) => {
				requestedUrls.push(input);
				return jsonResponse(SHOW_FIXTURE);
			}),
		});

		const artifacts = await plugin.enrich(
			createTvRequest({ identifiers: { thetvdb: '81189' } }),
			createMockPluginContext()
		);

		expect(requestedUrls).toEqual(['https://api.tvmaze.com/lookup/shows?thetvdb=81189']);
		expect(artifacts).toHaveLength(1);
	});

	it('fetches a canonical show endpoint from a TVmaze show URL', async () => {
		const requestedUrls: string[] = [];
		const plugin = createTvmazePlugin({
			fetch: createPinAwareFetch(async (input) => {
				requestedUrls.push(input);
				return jsonResponse(SHOW_FIXTURE);
			}),
		});

		const request = createMockRequest({
			input: createMockAtomInput({
				hints: { url: 'https://www.tvmaze.com/shows/169/breaking-bad' },
			}),
		});
		const artifacts = await plugin.enrich(request, createMockPluginContext());

		expect(requestedUrls).toEqual(['https://api.tvmaze.com/shows/169']);
		expect(artifacts).toHaveLength(1);
	});

	it('rejects a canonical show response whose TVmaze id does not match the request', async () => {
		const plugin = createTvmazePlugin({
			fetch: createPinAwareFetch(async () => jsonResponse({ ...SHOW_FIXTURE, id: 999 })),
		});
		const request = createMockRequest({
			input: createMockAtomInput({
				hints: { url: 'https://www.tvmaze.com/shows/169/breaking-bad' },
			}),
		});

		const artifacts = await plugin.enrich(request, createMockPluginContext());

		expect(artifacts).toEqual([]);
	});

	it('rejects an IMDb lookup response whose IMDb id does not match the request', async () => {
		const plugin = createTvmazePlugin({
			fetch: createPinAwareFetch(async () =>
				jsonResponse({
					...SHOW_FIXTURE,
					externals: { imdb: 'tt9999999', thetvdb: 81189, tvrage: 18164 },
				})
			),
		});

		const artifacts = await plugin.enrich(
			createTvRequest({ identifiers: { imdb: 'tt0903747' } }),
			createMockPluginContext()
		);

		expect(artifacts).toEqual([]);
	});

	it('rejects a TheTVDB lookup response whose TheTVDB id does not match the request', async () => {
		const plugin = createTvmazePlugin({
			fetch: createPinAwareFetch(async () =>
				jsonResponse({
					...SHOW_FIXTURE,
					externals: { imdb: 'tt0903747', thetvdb: 999_999, tvrage: 18164 },
				})
			),
		});

		const artifacts = await plugin.enrich(
			createTvRequest({ identifiers: { thetvdb: '81189' } }),
			createMockPluginContext()
		);

		expect(artifacts).toEqual([]);
	});

	it('rejects malformed IMDb ids in a provider response', async () => {
		const plugin = createTvmazePlugin({
			fetch: createPinAwareFetch(async () =>
				jsonResponse({
					...SHOW_FIXTURE,
					externals: { imdb: 'not-an-imdb', thetvdb: 81189, tvrage: 18164 },
				})
			),
		});

		try {
			await plugin.enrich(
				createTvRequest({ identifiers: { imdb: 'tt0903747' } }),
				createMockPluginContext()
			);
			expect.unreachable('Expected malformed IMDb data to fail schema validation.');
		} catch (error) {
			expect(error).toBeInstanceOf(ZodError);
		}
	});

	it('exposes summaries as entity-decoded plain text without markup or attributes', async () => {
		const plugin = createTvmazePlugin({
			fetch: createPinAwareFetch(async () =>
				jsonResponse({
					...SHOW_FIXTURE,
					summary:
						'<img src=x onerror=alert(1)><script>alert(2)</script><p>Safe &amp; ordinary <em>words</em></p>',
				})
			),
		});

		const request = createMockRequest({
			input: createMockAtomInput({
				hints: { url: 'https://www.tvmaze.com/shows/169/breaking-bad' },
			}),
		});
		const artifacts = await plugin.enrich(request, createMockPluginContext());

		expect(artifacts[0]?.data).toMatchObject({ summary: 'Safe & ordinary words' });
		expect(artifacts[0]?.data.tvmazeApiPayload).toMatchObject({
			summary:
				'<img src=x onerror=alert(1)><script>alert(2)</script><p>Safe &amp; ordinary <em>words</em></p>',
		});
	});

	it('materializes a sparse identifiable show with stable metadata defaults', async () => {
		const sparseShow = {
			externals: null,
			genres: [],
			id: 169,
			name: 'Breaking Bad',
			rating: null,
			schedule: null,
			status: 'Ended',
			type: 'Scripted',
			url: 'https://www.tvmaze.com/shows/169/breaking-bad',
		};
		const plugin = createTvmazePlugin({
			fetch: createPinAwareFetch(async () => jsonResponse(sparseShow)),
		});

		const request = createMockRequest({
			input: createMockAtomInput({
				hints: { url: 'https://www.tvmaze.com/shows/169/breaking-bad' },
			}),
		});
		const artifacts = await plugin.enrich(request, createMockPluginContext());

		expect(artifacts).toEqual([
			expect.objectContaining({
				data: expect.objectContaining({
					averageRuntime: null,
					ended: null,
					externals: { imdb: null, thetvdb: null, tvrage: null },
					image: null,
					language: null,
					network: null,
					officialSite: null,
					premiered: null,
					rating: { average: null },
					runtime: null,
					schedule: { days: [], time: '' },
					summary: null,
					tvmazeApiPayload: sparseShow,
					webChannel: null,
				}),
			}),
		]);
	});

	it('handles a 404 as a clean miss', async () => {
		const plugin = createTvmazePlugin({
			fetch: createPinAwareFetch(async () => new Response('Not Found', { status: 404 })),
		});

		const artifacts = await plugin.enrich(
			createTvRequest({ identifiers: { imdb: 'tt0903747' } }),
			createMockPluginContext()
		);

		expect(artifacts).toEqual([]);
	});

	it('surfaces a 429 with the parsed Retry-After delay', async () => {
		const plugin = createTvmazePlugin({
			fetch: createPinAwareFetch(
				async () =>
					new Response('Rate limited', {
						headers: { 'retry-after': '12' },
						status: 429,
					})
			),
		});

		try {
			await plugin.enrich(
				createTvRequest({ identifiers: { imdb: 'tt0903747' } }),
				createMockPluginContext()
			);
			expect.unreachable('Expected the TVmaze request to fail.');
		} catch (error) {
			expect(error).toBeInstanceOf(ProviderHttpError);
			expect(error).toMatchObject({ retryAfterMs: 12_000, status: 429 });
		}
	});

	it('fails loudly when TVmaze returns a malformed show payload', async () => {
		const plugin = createTvmazePlugin({
			fetch: createPinAwareFetch(async () => jsonResponse({ ...SHOW_FIXTURE, id: '169' })),
		});

		try {
			await plugin.enrich(
				createTvRequest({ identifiers: { imdb: 'tt0903747' } }),
				createMockPluginContext()
			);
			expect.unreachable('Expected malformed TVmaze data to fail schema validation.');
		} catch (error) {
			expect(error).toBeInstanceOf(ZodError);
		}
	});
});

function createTvRequest(input: {
	identifiers?: Record<string, string>;
	name?: string;
	premiereYear?: number;
}) {
	const name = input.name ?? 'Breaking Bad';
	return createMockRequest({
		input: createMockAtomInput({
			hints: {
				name,
				...(input.identifiers ? { identifiers: input.identifiers } : {}),
			},
			jsonLd: {
				'@context': 'https://schema.org',
				'@type': 'TVSeries',
				...(input.premiereYear ? { datePublished: `${input.premiereYear}-01-01` } : {}),
				name,
			},
		}),
	});
}

function jsonResponse(payload: unknown): Response {
	return Response.json(payload, { status: 200 });
}
