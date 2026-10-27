import { afterEach, describe, expect, it } from 'bun:test';
import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';
import { useStubbedPublicDns } from '@0xintuition/atom-enrichment/testing';
import {
	addProviderObserver,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import type { ClassificationResult } from '../src';
import { createWikidataIdentityBridge } from '../src';
import { unspacedRequestSlot } from '../src/testing';

useStubbedPublicDns();

// A failing assertion must not leave an observer attached to the tests that follow.
afterEach(() => resetProviderObserversForTests());

const BASE_RESULT = {
	ok: true,
	status: 'complete',
	contractVersion: 'cpkg-02',
	runtime: 'server',
	mode: 'progressive',
	classificationSessionId: 'bridge-test',
	policy: {
		runClientClassification: true,
		runServerEnrichment: true,
		runDedupe: true,
		runAiFallback: true,
		includeProvenance: true,
		requestedServerTiers: [2, 3, 4],
	},
	message: 'ok',
	receivedAt: '2026-08-26T00:00:00.000Z',
	resolved: {
		resolverId: 'fixture',
		resolverChain: ['fixture'],
		dedupeKey: 'fixture',
		fallbackUsed: false,
		classifications: [],
		publishable: [],
		atoms: [
			{
				schemaType: 'Movie',
				category: 'thing',
				title: 'Fight Club',
				canonicalId: 'tmdb:movie:550',
				sameAs: ['https://www.themoviedb.org/movie/550'],
				source: 'letterboxd',
				confidence: 0.99,
				hints: {},
				metadata: {},
				data: { '@type': 'Movie', name: 'Fight Club' },
			},
		],
	},
	debug: {
		inputPreview: 'fixture',
		hasClientHints: false,
		inputIntent: 'generic',
		requestedPluginIds: [],
		requestedServerTiers: [2, 3, 4],
	},
} as ClassificationResult;

function resultFor(canonicalId: string, schemaType = 'Movie'): ClassificationResult {
	const baseResolved = BASE_RESULT.resolved;
	if (!baseResolved) throw new Error('Bridge fixture must include a resolved payload.');
	return {
		...BASE_RESULT,
		resolved: {
			...baseResolved,
			atoms: [
				{
					...baseResolved.atoms[0],
					canonicalId,
					schemaType,
				},
			],
		},
	} as ClassificationResult;
}

function entityPayload(
	qid: string,
	property: 'P345' | 'P4947' | 'P4983' = 'P4947',
	value = '550',
	p31 = 'Q11424'
) {
	return {
		entities: {
			[qid]: {
				id: qid,
				claims: {
					[property]: [{ mainsnak: { datavalue: { value } }, rank: 'normal' }],
					P31: [{ mainsnak: { datavalue: { value: { id: p31 } } }, rank: 'normal' }],
				},
			},
		},
	};
}

function bridgeWithHits(hits: unknown[]) {
	const requests: Array<{ headers: Headers; url: URL }> = [];
	return {
		requests,
		bridge: createWikidataIdentityBridge({
			fetch: createPinAwareFetch(async (input, init) => {
				const url = new URL(String(input));
				requests.push({ headers: new Headers(init?.headers), url });
				if (url.pathname.includes('Special:EntityData')) {
					return new Response(JSON.stringify(entityPayload('Q190050')), { status: 200 });
				}
				return new Response(
					JSON.stringify({
						query: {
							search: hits.map((entry) => (typeof entry === 'string' ? { title: entry } : entry)),
						},
					}),
					{ status: 200 }
				);
			}),
			requestSlot: unspacedRequestSlot(),
		}),
	};
}

describe('Wikidata provider-id bridge', () => {
	it('promotes exactly one hit and retains provider aliases and URLs', async () => {
		const { bridge, requests } = bridgeWithHits(['Q190050']);
		const result = await bridge(BASE_RESULT);
		const atom = result.resolved?.atoms[0];

		expect(atom).toMatchObject({
			canonicalId: 'int:wd:film:Q190050',
			hints: { providerCanonicalIds: ['tmdb:movie:550'] },
		});
		expect(atom?.sameAs).toEqual([
			'https://www.themoviedb.org/movie/550',
			'https://www.wikidata.org/wiki/Q190050',
		]);
		expect(requests[0]?.url.searchParams.get('srsearch')).toBe('haswbstatement:P4947=550');
		expect(requests[0]?.headers.get('user-agent')).toBe(
			'IntuitionCreate/0.1 (https://intuition.systems; data@intuition.systems)'
		);
		expect(requests.map(({ url }) => url.pathname)).toContain(
			'/wiki/Special:EntityData/Q190050.json'
		);
	});

	for (const hits of [[], ['Q1', 'Q2']]) {
		it(`keeps provider identity for ${hits.length} hits`, async () => {
			const { bridge } = bridgeWithHits(hits);
			const result = await bridge(BASE_RESULT);
			expect(result.resolved?.atoms[0]?.canonicalId).toBe('tmdb:movie:550');
		});
	}

	it('caches by property and value', async () => {
		const { bridge, requests } = bridgeWithHits(['Q190050']);
		await bridge(BASE_RESULT);
		await bridge(BASE_RESULT);
		expect(requests).toHaveLength(2);
	});

	it('counts raw search hits before validating the sole result', async () => {
		for (const hits of [
			[{ title: 'Q190050' }, { title: 'not-a-qid' }],
			[{ title: 'Q190050' }, { title: 'Q190050' }],
		]) {
			const { bridge, requests } = bridgeWithHits(hits);
			const result = await bridge(BASE_RESULT);
			expect(result.resolved?.atoms[0]?.canonicalId).toBe('tmdb:movie:550');
			expect(requests).toHaveLength(1);
		}
	});

	it('rejects a stale unique hit that does not own the exact provider property', async () => {
		const bridge = createWikidataIdentityBridge({
			fetch: createPinAwareFetch(async (input) => {
				const url = new URL(String(input));
				return url.pathname.includes('Special:EntityData')
					? new Response(JSON.stringify(entityPayload('Q190050', 'P4947', '999')), { status: 200 })
					: new Response(JSON.stringify({ query: { search: [{ title: 'Q190050' }] } }), {
							status: 200,
						});
			}),
			requestSlot: unspacedRequestSlot(),
		});

		expect((await bridge(BASE_RESULT)).resolved?.atoms[0]?.canonicalId).toBe('tmdb:movie:550');
	});

	it('rejects incompatible, disambiguation, deleted, invalid, and malformed EntityData', async () => {
		for (const payload of [
			entityPayload('Q190050', 'P4947', '550', 'Q5398426'),
			entityPayload('Q190050', 'P4947', '550', 'Q4167410'),
			{ entities: { Q190050: { deleted: '', id: 'Q190050' } } },
			{ entities: { Q190050: { id: 'Q190050', invalid: '' } } },
			'{',
		]) {
			const bridge = createWikidataIdentityBridge({
				fetch: createPinAwareFetch(async (input) => {
					const url = new URL(String(input));
					return url.pathname.includes('Special:EntityData')
						? new Response(typeof payload === 'string' ? payload : JSON.stringify(payload), {
								status: 200,
							})
						: new Response(JSON.stringify({ query: { search: [{ title: 'Q190050' }] } }), {
								status: 200,
							});
				}),
				requestSlot: unspacedRequestSlot(),
			});
			expect((await bridge(BASE_RESULT)).resolved?.atoms[0]?.canonicalId).toBe('tmdb:movie:550');
		}
	});

	it('uses the final QID of a validated EntityData redirect', async () => {
		const bridge = createWikidataIdentityBridge({
			fetch: createPinAwareFetch(async (input) => {
				const url = new URL(String(input));
				if (!url.pathname.includes('Special:EntityData')) {
					return new Response(JSON.stringify({ query: { search: [{ title: 'Q1' }] } }), {
						status: 200,
					});
				}
				const response = new Response(JSON.stringify(entityPayload('Q190050')), { status: 200 });
				Object.defineProperty(response, 'url', {
					value: 'https://www.wikidata.org/wiki/Special:EntityData/Q190050.json',
				});
				return response;
			}),
			requestSlot: unspacedRequestSlot(),
		});

		expect((await bridge(BASE_RESULT)).resolved?.atoms[0]?.canonicalId).toBe('int:wd:film:Q190050');
	});

	it('types TMDB TV and IMDb film versus television targets', async () => {
		for (const fixture of [
			{
				input: resultFor('tmdb:tv:1396', 'TVSeries'),
				property: 'P4983' as const,
				value: '1396',
				p31: 'Q5398426',
				expected: 'int:wd:television-series:Q123',
			},
			{
				input: resultFor('imdb:title:tt0137523', 'Movie'),
				property: 'P345' as const,
				value: 'tt0137523',
				p31: 'Q11424',
				expected: 'int:wd:film:Q123',
			},
			{
				input: resultFor('imdb:title:tt0903747', 'TVSeries'),
				property: 'P345' as const,
				value: 'tt0903747',
				p31: 'Q5398426',
				expected: 'int:wd:television-series:Q123',
			},
		]) {
			const bridge = createWikidataIdentityBridge({
				fetch: createPinAwareFetch(async (input) => {
					const url = new URL(String(input));
					return url.pathname.includes('Special:EntityData')
						? new Response(
								JSON.stringify(entityPayload('Q123', fixture.property, fixture.value, fixture.p31)),
								{ status: 200 }
							)
						: new Response(JSON.stringify({ query: { search: [{ title: 'Q123' }] } }), {
								status: 200,
							});
				}),
				requestSlot: unspacedRequestSlot(),
			});
			expect((await bridge(fixture.input)).resolved?.atoms[0]?.canonicalId).toBe(fixture.expected);
		}
	});

	it('bounds the queue and coalesces identical in-flight keys', async () => {
		let releaseFirst: (() => void) | undefined;
		let fetchCount = 0;
		const firstFetch = new Promise<void>((resolve) => {
			releaseFirst = resolve;
		});
		const bridge = createWikidataIdentityBridge({
			queueMaxEntries: 32,
			fetch: createPinAwareFetch(async () => {
				fetchCount += 1;
				if (fetchCount === 1) await firstFetch;
				return new Response(JSON.stringify({ query: { search: [] } }), { status: 200 });
			}),
			requestSlot: unspacedRequestSlot(),
		});
		const duplicateCalls = Array.from({ length: 10 }, () => bridge(BASE_RESULT));
		await Promise.resolve();
		releaseFirst?.();
		await Promise.all(duplicateCalls);
		expect(fetchCount).toBe(1);

		let releaseWave: (() => void) | undefined;
		const waveBlock = new Promise<void>((resolve) => {
			releaseWave = resolve;
		});
		let waveFetches = 0;
		const waveBridge = createWikidataIdentityBridge({
			queueMaxEntries: 32,
			fetch: createPinAwareFetch(async () => {
				waveFetches += 1;
				if (waveFetches === 1) await waveBlock;
				return new Response(JSON.stringify({ query: { search: [] } }), { status: 200 });
			}),
			requestSlot: unspacedRequestSlot(),
		});
		const wave = Array.from({ length: 50 }, (_, index) =>
			waveBridge(resultFor(`tmdb:movie:${index + 1}`))
		);
		await Promise.resolve();
		releaseWave?.();
		const results = await Promise.all(wave);
		expect(waveFetches).toBeLessThanOrEqual(33);
		expect(
			results.filter((result) =>
				(result.resolved?.atoms[0]?.metadata?.skippedStages as string[] | undefined)?.includes(
					'bridge_backpressure'
				)
			)
		).toHaveLength(17);
	});

	it('does not cache a transient 429 as a verified miss', async () => {
		let now = 0;
		let requestCount = 0;
		const bridge = createWikidataIdentityBridge({
			now: () => now,
			fetch: createPinAwareFetch(async (input) => {
				requestCount += 1;
				const url = new URL(String(input));
				if (requestCount === 1) {
					return new Response('', { headers: { 'retry-after': '1' }, status: 429 });
				}
				return url.pathname.includes('Special:EntityData')
					? new Response(JSON.stringify(entityPayload('Q190050')), { status: 200 })
					: new Response(JSON.stringify({ query: { search: [{ title: 'Q190050' }] } }), {
							status: 200,
						});
			}),
			requestSlot: unspacedRequestSlot(),
		});

		expect((await bridge(BASE_RESULT)).resolved?.atoms[0]?.canonicalId).toBe('tmdb:movie:550');
		now = 1_001;
		expect((await bridge(BASE_RESULT)).resolved?.atoms[0]?.canonicalId).toBe('int:wd:film:Q190050');
		expect(requestCount).toBe(3);
	});

	it('keeps the LRU bounded and evicts the oldest verified key', async () => {
		let requestCount = 0;
		const bridge = createWikidataIdentityBridge({
			cacheMaxEntries: 2,
			fetch: createPinAwareFetch(async () => {
				requestCount += 1;
				return new Response(JSON.stringify({ query: { search: [] } }), { status: 200 });
			}),
			requestSlot: unspacedRequestSlot(),
		});

		for (const id of [1, 2, 3, 1]) await bridge(resultFor(`tmdb:movie:${id}`));
		expect(requestCount).toBe(4);
	});

	it('removes an aborted queued entry immediately', async () => {
		let releaseFirst: (() => void) | undefined;
		const firstFetch = new Promise<void>((resolve) => {
			releaseFirst = resolve;
		});
		let requestCount = 0;
		const bridge = createWikidataIdentityBridge({
			fetch: createPinAwareFetch(async () => {
				requestCount += 1;
				if (requestCount === 1) await firstFetch;
				return new Response(JSON.stringify({ query: { search: [] } }), { status: 200 });
			}),
			requestSlot: unspacedRequestSlot(),
		});
		const first = bridge(resultFor('tmdb:movie:1'));
		const abortController = new AbortController();
		const queued = bridge(resultFor('tmdb:movie:2'), abortController.signal);
		abortController.abort(new Error('test abort'));
		const aborted = await queued;
		expect(aborted.resolved?.atoms[0]?.metadata?.skippedStages).toContain('bridge_aborted');
		// The first lookup dials after the shared fetch resolved its target.
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(requestCount).toBe(1);
		releaseFirst?.();
		await first;
	});

	it('aborts the underlying fetch at the three-second request deadline', async () => {
		let observedAbort = false;
		const bridge = createWikidataIdentityBridge({
			fetch: createPinAwareFetch(
				async (_input, init) =>
					await new Promise<Response>((resolve) => {
						init?.signal?.addEventListener(
							'abort',
							() => {
								observedAbort = true;
								resolve(new Response('', { status: 499 }));
							},
							{ once: true }
						);
					})
			),
		});

		expect((await bridge(BASE_RESULT)).resolved?.atoms[0]?.canonicalId).toBe('tmdb:movie:550');
		expect(observedAbort).toBe(true);
	});

	it('keeps one deadline through EntityData body consumption and records the stalled body read as a bridge_entity timeout', async () => {
		const events: string[] = [];
		resetProviderObserversForTests();
		addProviderObserver((event) => {
			if (event.type === 'provider_request') {
				events.push(`${event.provider}|${event.operation}:${event.outcome}:${event.reason}`);
			}
		});
		let entitySignal: AbortSignal | undefined;
		let readCount = 0;
		const directTmdbResult = resultFor('tmdb:movie:550');
		const atom = directTmdbResult.resolved?.atoms[0];
		if (!atom) throw new Error('Expected direct TMDB bridge fixture.');
		atom.metadata = { ...atom.metadata, platform: 'tmdb', provider: 'tmdb' };

		const bridge = createWikidataIdentityBridge({
			timeoutMs: 10,
			requestSlot: unspacedRequestSlot(),
			fetch: createPinAwareFetch(async (input, init) => {
				const url = new URL(String(input));
				if (!url.pathname.includes('Special:EntityData')) {
					return new Response(JSON.stringify({ query: { search: [{ title: 'Q190050' }] } }), {
						status: 200,
					});
				}
				entitySignal = init?.signal ?? undefined;
				return {
					ok: true,
					status: 200,
					url: 'https://www.wikidata.org/wiki/Special:EntityData/Q190050.json',
					headers: new Headers(),
					body: {
						getReader: () => ({
							read: async () => {
								readCount += 1;
								if (readCount === 1) {
									return {
										done: false,
										value: new TextEncoder().encode(JSON.stringify(entityPayload('Q190050'))),
									};
								}
								return await new Promise<never>(() => undefined);
							},
							cancel: async () => undefined,
							releaseLock: () => undefined,
						}),
					},
				} as unknown as Response;
			}),
		});

		const timeoutMarker = Symbol('test timeout');
		const result = await Promise.race([
			bridge(directTmdbResult),
			new Promise<typeof timeoutMarker>((resolve) => {
				setTimeout(() => resolve(timeoutMarker), 250);
			}),
		]);

		expect(result).not.toBe(timeoutMarker);
		if (result === timeoutMarker) return;
		expect(result.resolved?.atoms[0]?.canonicalId).toBe('tmdb:movie:550');
		expect(result.resolved?.atoms[0]?.metadata?.acquisitionOutcome).toEqual({
			reason: 'bridge_timeout',
			status: 'degraded',
			terminal: true,
		});
		// One deadline, attributed to the EntityData hop whose body stalled.
		expect(entitySignal?.aborted).toBe(true);
		expect(events).toEqual([
			'wikidata|bridge_search:hit:none',
			'wikidata|bridge_entity:error:timeout',
		]);
	});
});

describe('Wikidata bridge locale policy', () => {
	for (const [locale, expected] of [
		['mul', 'Toy Story'],
		['en-gb', 'Toy Story'],
		['en', 'Toy Story'],
		['ja', undefined],
	] as const) {
		it(`selects ${locale} labels and descriptions without losing the TMDB presentation`, async () => {
			const input = resultFor('tmdb:movie:550');
			const atom = input.resolved?.atoms[0];
			if (!atom) throw new Error('Missing fixture atom');
			atom.title = 'TMDB Toy Story';
			atom.description = 'TMDB description';
			atom.data = {
				...atom.data,
				name: atom.title,
				title: atom.title,
				description: atom.description,
			};
			atom.metadata = { provider: 'tmdb', platform: 'tmdb' };
			const payload = entityPayload('Q171048');
			const entity = {
				...payload.entities.Q171048,
				labels: { dv: { value: 'ޓޯއި ސްޓޯރީ' }, [locale]: { value: 'Toy Story' } },
				descriptions: { dv: { value: 'unapproved description' }, [locale]: { value: '1995 film' } },
			};
			const bridge = createWikidataIdentityBridge({
				requestSlot: unspacedRequestSlot(),
				fetch: createPinAwareFetch(
					async (input) =>
						new Response(
							JSON.stringify(
								String(input).includes('Special:EntityData')
									? { entities: { Q171048: entity } }
									: { query: { search: [{ title: 'Q171048' }] } }
							),
							{ status: 200 }
						)
				),
			});
			const output = (await bridge(input)).resolved?.atoms[0];
			expect(output?.title).toBe(expected ?? 'TMDB Toy Story');
			expect(output?.data.name).toBe(expected ?? 'TMDB Toy Story');
			expect(output?.description).toBe(expected ? '1995 film' : 'TMDB description');
			expect(output?.data.description).toBe(expected ? '1995 film' : 'TMDB description');
			if (!expected) expect(output?.data.title).toBe('TMDB Toy Story');
		});
	}
});
