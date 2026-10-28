import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
	WIKIMEDIA_MAXLAG_SECONDS,
	WIKIMEDIA_REQUEST_SPACING_MS,
} from '@0xintuition/atom-enrichment/provider-fetch';
import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';
import { useStubbedPublicDns } from '@0xintuition/atom-enrichment/testing';
import {
	addProviderObserver,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import {
	createRequestSlot,
	type RequestSlot,
	RequestSlotRejectedError,
	RequestSlotTimeoutError,
	SLOT_REFUSAL_RETRY_MAX_MS,
} from '@0xintuition/pipeline-runtime/request-slot';
import { stuckRequestSlot } from '@0xintuition/pipeline-runtime/testing/held-request-slot';
import type { ClassificationResult } from '../src';
import { createWikidataIdentityBridge } from '../src';
import { unspacedRequestSlot } from '../src/testing';
import { musicEntity, musicFetch, musicResult } from './fixtures/music-identity';

useStubbedPublicDns();

/**
 * The api identity bridge reports its two Wikidata hops as `wikidata|bridge_search` and
 * `wikidata|bridge_entity` (ENG-17016). Every case drives the real bridge and mocks only fetch.
 */

const MOVIE_ID = '550';
const QID = 'Q190050';
const UA = 'IntuitionCreate/0.1 (https://intuition.systems; data@intuition.systems)';

let events: ProviderRequestEvent[];
beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		if (event.type === 'provider_request') events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

const tuples = () =>
	events.map(
		(event) =>
			`${event.provider}|${event.operation}:${event.outcome}:${event.reason}:${event.source}`
	);

function movie(canonicalId = `tmdb:movie:${MOVIE_ID}`, schemaType = 'Movie'): ClassificationResult {
	return {
		ok: true,
		status: 'complete',
		contractVersion: 'cpkg-02',
		runtime: 'server',
		mode: 'progressive',
		classificationSessionId: 'bridge-observer',
		policy: {},
		message: 'ok',
		receivedAt: '2026-10-22T00:00:00Z',
		resolved: {
			resolverId: 'fixture',
			resolverChain: ['fixture'],
			dedupeKey: 'fixture',
			fallbackUsed: false,
			classifications: [],
			publishable: [],
			atoms: [
				{
					schemaType,
					category: 'thing',
					title: 'Fight Club',
					canonicalId,
					sameAs: [],
					source: 'fixture',
					confidence: 1,
					hints: {},
					metadata: {},
					data: { '@type': schemaType, name: 'Fight Club' },
				},
			],
		},
		debug: {},
	} as unknown as ClassificationResult;
}

const claim = (value: unknown) => [{ rank: 'normal', mainsnak: { datavalue: { value } } }];

function entityBody(
	overrides: { p31?: string; property?: string; value?: string; omitClaim?: boolean } = {}
) {
	const property = overrides.property ?? 'P4947';
	return {
		entities: {
			[QID]: {
				id: QID,
				claims: {
					...(overrides.omitClaim ? {} : { [property]: claim(overrides.value ?? MOVIE_ID) }),
					P31: claim({ id: overrides.p31 ?? 'Q11424' }),
				},
			},
		},
	};
}

type Handler = (url: URL, init?: RequestInit) => Response | Promise<Response>;

/** A pin-aware fetch that records the requests and answers search and EntityData separately. */
function routes(handlers: { search?: Handler; entity?: Handler }) {
	const requests: Array<{ url: URL; headers: Headers }> = [];
	const fetch = createPinAwareFetch(async (input: string, init?: RequestInit) => {
		const url = new URL(input);
		requests.push({ url, headers: new Headers(init?.headers) });
		const isEntity = url.pathname.includes('Special:EntityData');
		const handler = isEntity ? handlers.entity : handlers.search;
		if (!handler) throw new Error(`unexpected ${isEntity ? 'entity' : 'search'} request`);
		return await handler(url, init);
	});
	return { fetch, requests };
}

const searchHit = () => Response.json({ query: { search: [{ title: QID }] } });
const entityOk = () => Response.json(entityBody());

function bridgeFor(
	handlers: { search?: Handler; entity?: Handler },
	options: Parameters<typeof createWikidataIdentityBridge>[0] = {}
) {
	const harness = routes(handlers);
	return {
		...harness,
		bridge: createWikidataIdentityBridge({
			fetch: harness.fetch,
			requestSlot: unspacedRequestSlot(),
			...options,
		}),
	};
}

describe('identity bridge observation: live outcomes', () => {
	it('records one hit per hop for a promotion, with a duration, and nothing else', async () => {
		const { bridge } = bridgeFor({ search: searchHit, entity: entityOk });
		const result = await bridge(movie());
		expect(result.resolved?.atoms[0]?.canonicalId).toBe(`int:wd:film:${QID}`);
		expect(tuples()).toEqual([
			'wikidata|bridge_search:hit:none:live',
			'wikidata|bridge_entity:hit:none:live',
		]);
		for (const event of events) expect(typeof event.durationMs).toBe('number');
	});

	it.each([
		['an empty search', { query: { search: [] } }],
		['two search hits', { query: { search: [{ title: 'Q1' }, { title: 'Q2' }] } }],
	])('%s is a search miss and never reaches EntityData', async (_name, body) => {
		const { bridge, requests } = bridgeFor({ search: () => Response.json(body) });
		await bridge(movie());
		expect(tuples()).toEqual(['wikidata|bridge_search:miss:none:live']);
		expect(requests).toHaveLength(1);
	});

	it.each([
		['a disambiguation page', entityBody({ p31: 'Q4167410' })],
		['a P31 type mismatch', entityBody({ p31: 'Q5398426' })],
		['an item that does not own the id', entityBody({ value: '999' })],
		['an item without the claim', entityBody({ omitClaim: true })],
	])('%s is an entity miss, kept as a verified miss (cached, not retried)', async (_name, body) => {
		const { bridge, requests } = bridgeFor({
			search: searchHit,
			entity: () => Response.json(body),
		});
		const first = await bridge(movie());
		expect(first.resolved?.atoms[0]?.canonicalId).toBe(`tmdb:movie:${MOVIE_ID}`);
		expect(tuples()).toEqual([
			'wikidata|bridge_search:hit:none:live',
			'wikidata|bridge_entity:miss:none:live',
		]);
		await bridge(movie());
		expect(requests).toHaveLength(2);
		expect(tuples().slice(2)).toEqual(['wikidata|bridge_entity:miss:none:cache']);
	});

	it('an EntityData 404 is an entity miss', async () => {
		const { bridge } = bridgeFor({
			search: searchHit,
			entity: () => new Response('<html>Not Found</html>', { status: 404 }),
		});
		await bridge(movie());
		expect(tuples()).toEqual([
			'wikidata|bridge_search:hit:none:live',
			'wikidata|bridge_entity:miss:none:live',
		]);
	});

	it('separates a 429 (rate_limited, Retry-After honoured) from a 5xx', async () => {
		let now = 0;
		let status = 429;
		const { bridge, requests } = bridgeFor(
			{
				search: () =>
					new Response('', {
						status,
						headers: status === 429 ? { 'retry-after': '7' } : {},
					}),
			},
			{ now: () => now }
		);
		await bridge(movie());
		expect(tuples()).toEqual(['wikidata|bridge_search:error:rate_limited:live']);
		// Inside the server's Retry-After window nothing is dialled or recorded.
		now = 6_999;
		await bridge(movie());
		expect(requests).toHaveLength(1);
		expect(events).toHaveLength(1);
		// After it, a 503 is an upstream error, not a rate limit.
		now = 7_001;
		status = 503;
		await bridge(movie());
		expect(tuples().slice(1)).toEqual(['wikidata|bridge_search:error:upstream_5xx:live']);
	});

	it('reads a maxlag reply (HTTP 200 with an error body) as rate_limited and keeps its Retry-After', async () => {
		let now = 0;
		const { bridge, requests } = bridgeFor(
			{
				search: () =>
					Response.json(
						{ error: { code: 'maxlag', info: 'Waiting for a server: 2 seconds lagged.', lag: 2 } },
						{ headers: { 'retry-after': '5', 'mediawiki-api-error': 'maxlag' } }
					),
			},
			{ now: () => now }
		);
		await bridge(movie());
		expect(tuples()).toEqual(['wikidata|bridge_search:error:rate_limited:live']);
		now = 4_900;
		await bridge(movie());
		expect(requests).toHaveLength(1);
		now = 5_100;
		await bridge(movie());
		expect(requests).toHaveLength(2);
	});

	it.each([
		// The action API says every error in the `mediawiki-api-error` header (and in the body).
		['maxlag', { 'mediawiki-api-error': 'maxlag', 'retry-after': '5' }, 'rate_limited'],
		['ratelimited', { 'mediawiki-api-error': 'ratelimited' }, 'rate_limited'],
		['readonly', { 'mediawiki-api-error': 'readonly' }, 'upstream_5xx'],
		['internal_api_error_X', { 'mediawiki-api-error': 'internal_api_error_X' }, 'upstream_5xx'],
		// Our own malformed request is not a Wikimedia fault.
		['badvalue', { 'mediawiki-api-error': 'badvalue' }, 'invalid_response'],
		['missingparam', { 'mediawiki-api-error': 'missingparam' }, 'invalid_response'],
		['toomanyvalues', { 'mediawiki-api-error': 'toomanyvalues' }, 'invalid_response'],
		// The same errors as a body without the header map by code too, never an empty search.
		['maxlag', {}, 'rate_limited'],
		['ratelimited', {}, 'rate_limited'],
		['readonly', {}, 'upstream_5xx'],
		['internal_api_error_X', {}, 'upstream_5xx'],
		['badvalue', {}, 'invalid_response'],
	])('maps the MediaWiki error code %s (headers %j) to %s, through the shared api.php mapping', async (code, headers, reason) => {
		const { bridge } = bridgeFor({
			search: () => Response.json({ error: { code, info: 'x' } }, { headers }),
		});
		const result = await bridge(movie());
		expect(tuples()).toEqual([`wikidata|bridge_search:error:${reason}:live`]);
		// Whatever the code, the lookup stays a transient failure, never a promotion or a miss.
		expect(result.resolved?.atoms[0]?.canonicalId).toBe(`tmdb:movie:${MOVIE_ID}`);
	});

	it('records a 5xx on the EntityData hop under bridge_entity, after a search hit', async () => {
		const { bridge } = bridgeFor({
			search: searchHit,
			entity: () => new Response('', { status: 502 }),
		});
		await bridge(movie());
		expect(tuples()).toEqual([
			'wikidata|bridge_search:hit:none:live',
			'wikidata|bridge_entity:error:upstream_5xx:live',
		]);
	});

	it.each([
		['a 403 (User-Agent refused)', () => new Response('', { status: 403 }), 'auth_failed'],
		['a 400', () => new Response('', { status: 400 }), 'http_4xx'],
		['a non-JSON body', () => new Response('<html>'), 'invalid_response'],
		['a body of the wrong shape', () => Response.json({ query: {} }), 'invalid_response'],
		[
			'an API error that is not a throttle',
			() => Response.json({ error: { code: 'internal_api_error_X' } }),
			'upstream_5xx',
		],
		[
			'a failed fetch',
			() => {
				throw new TypeError('fetch failed');
			},
			'network',
		],
	])('search %s is error/%s', async (_name, search, reason) => {
		const { bridge } = bridgeFor({ search });
		await bridge(movie());
		expect(tuples()).toEqual([`wikidata|bridge_search:error:${reason}:live`]);
	});

	it('an oversized EntityData body is an invalid_response, not a promotion', async () => {
		const huge = JSON.stringify({
			entities: { [QID]: { id: QID, filler: 'x'.repeat(600 * 1024) } },
		});
		const { bridge } = bridgeFor({ search: searchHit, entity: () => new Response(huge) });
		const result = await bridge(movie());
		expect(result.resolved?.atoms[0]?.canonicalId).toBe(`tmdb:movie:${MOVIE_ID}`);
		expect(tuples()[1]).toBe('wikidata|bridge_entity:error:invalid_response:live');
	});

	it('a Spotify bridge refuses redirects (invalid_response) and an IMDb redirect is blocked', async () => {
		const spotify = bridgeFor({
			search: () => new Response(null, { status: 302, headers: { location: 'https://x.test/' } }),
		});
		await spotify.bridge(musicResult('artist'));
		expect(tuples()).toEqual(['wikidata|bridge_search:error:invalid_response:live']);

		events.length = 0;
		const imdb = bridgeFor({
			search: () =>
				new Response(null, { status: 302, headers: { location: 'https://www.imdb.com/title/x' } }),
		});
		await imdb.bridge(movie());
		expect(tuples()).toEqual(['wikidata|bridge_search:error:blocked:live']);
	});

	it('sends the Wikimedia User-Agent on both hops, and no maxlag by default (an interactive paste)', async () => {
		const { bridge, requests } = bridgeFor({ search: searchHit, entity: entityOk });
		await bridge(movie());
		expect(requests).toHaveLength(2);
		for (const request of requests) expect(request.headers.get('user-agent')).toBe(UA);
		// Manual:Maxlag_parameter: an interactive task may omit it, and with it every paste would be
		// refused while the query service lags.
		expect(requests.map(({ url }) => url.searchParams.has('maxlag'))).toEqual([false, false]);
	});

	it('a background caller that opts in sends maxlag on api.php only (EntityData ignores it)', async () => {
		const { bridge, requests } = bridgeFor(
			{ search: searchHit, entity: entityOk },
			{ maxlag: WIKIMEDIA_MAXLAG_SECONDS }
		);
		await bridge(movie());
		expect(requests.map(({ url }) => url.searchParams.get('maxlag'))).toEqual([
			String(WIKIMEDIA_MAXLAG_SECONDS),
			null,
		]);
		expect(requests[1]?.url.pathname).toContain('Special:EntityData');
		const custom = bridgeFor({ search: searchHit, entity: entityOk }, { maxlag: 2 });
		await custom.bridge(movie('tmdb:movie:551'));
		expect(custom.requests.map(({ url }) => url.searchParams.get('maxlag'))).toEqual(['2', null]);
	});
});

/** A slot that counts the requests it was asked to run and delegates to a private real one. */
function countingSlot(minSpacingMs: number) {
	const inner = createRequestSlot({ minSpacingMs });
	const state = { runs: 0 };
	const slot: RequestSlot = {
		run: (request, options) => {
			state.runs += 1;
			return inner.run(request, options);
		},
	};
	return { slot, state };
}

describe('identity bridge pacing (the shared Wikimedia slot)', () => {
	it('takes the slot once per request, not once per redirect hop (a deliberate choice)', async () => {
		let searchHops = 0;
		const { slot, state } = countingSlot(0);
		const { bridge, requests } = bridgeFor(
			{
				search: (url) => {
					searchHops += 1;
					return searchHops === 1
						? new Response(null, {
								status: 302,
								headers: { location: `${url.origin}/w/api.php?moved=1` },
							})
						: searchHit();
				},
				entity: entityOk,
			},
			{ requestSlot: slot }
		);
		await bridge(movie());
		// Search (one redirect hop) and EntityData are three dials but two requests: two slot turns.
		expect(requests).toHaveLength(3);
		expect(state.runs).toBe(2);
		expect(tuples()).toEqual([
			'wikidata|bridge_search:hit:none:live',
			'wikidata|bridge_entity:hit:none:live',
		]);
	});

	it('spaces consecutive requests by the shared spacing', async () => {
		const starts: number[] = [];
		const { bridge } = bridgeFor(
			{
				search: () => {
					starts.push(performance.now());
					return Response.json({ query: { search: [] } });
				},
			},
			{ requestSlot: createRequestSlot({ minSpacingMs: WIKIMEDIA_REQUEST_SPACING_MS }) }
		);
		await bridge(movie('tmdb:movie:1'));
		await bridge(movie('tmdb:movie:2'));
		expect(starts).toHaveLength(2);
		expect((starts[1] ?? 0) - (starts[0] ?? 0)).toBeGreaterThanOrEqual(
			WIKIMEDIA_REQUEST_SPACING_MS - 20
		);
	});
});

describe('identity bridge observation: refused or abandoned before the wire', () => {
	/** A prior lookup leaves the slot owing spacing, so the next one has to queue or be refused. */
	async function afterPriorRequest(
		slotOptions: { minSpacingMs: number; maxQueue?: number },
		next: (bridge: ReturnType<typeof bridgeFor>['bridge']) => Promise<ClassificationResult>,
		options: Parameters<typeof createWikidataIdentityBridge>[0] = {}
	) {
		const { bridge, requests } = bridgeFor(
			{ search: () => Response.json({ query: { search: [] } }), entity: entityOk },
			{ requestSlot: createRequestSlot(slotOptions), ...options }
		);
		await bridge(movie('tmdb:movie:1'));
		events.length = 0;
		const requestsBefore = requests.length;
		const result = await next(bridge);
		return { result, requests, requestsBefore };
	}

	it('a slot that cannot start a Spotify lookup before its 1 s budget refuses it: budget_exhausted, nothing dialled', async () => {
		const { result, requests, requestsBefore } = await afterPriorRequest(
			{ minSpacingMs: 5_000 },
			(bridge) => bridge(musicResult('artist'))
		);
		expect(tuples()).toEqual(['wikidata|bridge_search:budget_exhausted:none:live']);
		expect(events[0]?.durationMs).toBeUndefined();
		expect(requests).toHaveLength(requestsBefore);
		expect(result.resolved?.atoms[0]?.metadata?.skippedStages).toContain('bridge_timeout');
	});

	it('a full slot queue is budget_exhausted too, and the lookup is retried later (transient)', async () => {
		const { requests, requestsBefore } = await afterPriorRequest(
			{ minSpacingMs: 1_000, maxQueue: 0 },
			(bridge) => bridge(movie('tmdb:movie:2'))
		);
		expect(tuples()).toEqual(['wikidata|bridge_search:budget_exhausted:none:live']);
		expect(requests).toHaveLength(requestsBefore);
	});

	it("the bridge's own budget running out while the request waits for the slot is budget_exhausted", async () => {
		const { bridge, requests } = bridgeFor(
			{ search: searchHit },
			{ requestSlot: stuckRequestSlot, timeoutMs: 50 }
		);
		const result = await bridge(musicResult('artist'));
		expect(tuples()).toEqual(['wikidata|bridge_search:budget_exhausted:none:live']);
		expect(requests).toHaveLength(0);
		expect(result.resolved?.atoms[0]?.metadata?.skippedStages).toContain('bridge_timeout');
	});

	it("the slot's own deadline timer firing before the dial is budget_exhausted too (the same event)", async () => {
		const slot: RequestSlot = {
			run: async () => {
				throw new RequestSlotTimeoutError(false);
			},
		};
		const { bridge } = bridgeFor({ search: searchHit }, { requestSlot: slot });
		await bridge(movie());
		expect(tuples()).toEqual(['wikidata|bridge_search:budget_exhausted:none:live']);
		expect(events[0]?.durationMs).toBeUndefined();
	});

	it('a request still queued at the deadline is always budget_exhausted, whichever timer fires first (20 real runs)', async () => {
		for (let run = 0; run < 20; run += 1) {
			events.length = 0;
			// Another caller (enrichment sharing the process slot) holds the lane past the Spotify budget.
			const slot = createRequestSlot({ minSpacingMs: 0 });
			const holder = slot.run(() => new Promise<void>((resolve) => setTimeout(resolve, 120)));
			const { bridge, requests } = bridgeFor(
				{ search: searchHit },
				{ requestSlot: slot, timeoutMs: 40 }
			);
			const result = await bridge(musicResult('artist'));
			await holder;
			expect(tuples()).toEqual(['wikidata|bridge_search:budget_exhausted:none:live']);
			expect(events[0]?.durationMs).toBeUndefined();
			expect(requests).toHaveLength(0);
			expect(result.resolved?.atoms[0]?.metadata?.skippedStages).toContain('bridge_timeout');
		}
	}, 20_000);

	it('a caller that leaves while the request is queued records nothing', async () => {
		const { bridge, requests } = bridgeFor(
			{ search: searchHit },
			{ requestSlot: stuckRequestSlot }
		);
		const controller = new AbortController();
		const pending = bridge(movie(), controller.signal);
		await new Promise((resolve) => setTimeout(resolve, 20));
		controller.abort(new Error('caller left'));
		await pending;
		expect(tuples()).toEqual([]);
		expect(requests).toHaveLength(0);
	});

	it('a budget that still has time after the slot wait dials normally', async () => {
		const { requests, requestsBefore } = await afterPriorRequest({ minSpacingMs: 30 }, (bridge) =>
			bridge(musicResult('artist'))
		);
		expect(requests.length).toBeGreaterThan(requestsBefore);
		expect(tuples()).toEqual(['wikidata|bridge_search:miss:none:live']);
	});
});

describe('identity bridge: direct TMDB terminal outcome of an entity-side miss', () => {
	const outcomeOf = (result: ClassificationResult) =>
		result.resolved?.atoms[0]?.metadata?.acquisitionOutcome;
	/** A direct TMDB atom is the one the TMDB plugin produced (`platform: 'tmdb'`). */
	const directTmdbMovie = () => {
		const result = movie();
		const atom = result.resolved?.atoms[0];
		if (!atom) throw new Error('Expected a movie atom.');
		atom.metadata = { ...atom.metadata, platform: 'tmdb', provider: 'tmdb' };
		return result;
	};

	it.each([
		['a P31 mismatch', entityBody({ p31: 'Q5' })],
		['a missing claim', entityBody({ omitClaim: true })],
		['a disambiguation page', entityBody({ p31: 'Q4167410' })],
	])('%s is unavailable / identity_bridge_not_found (it used to be degraded / identity_bridge_transient)', async (_name, body) => {
		const { bridge } = bridgeFor({ search: searchHit, entity: () => Response.json(body) });
		const result = await bridge(directTmdbMovie());
		expect(outcomeOf(result)).toEqual({
			reason: 'identity_bridge_not_found',
			status: 'unavailable',
			terminal: true,
		});
	});

	it.each([
		[
			'a disambiguation page',
			() =>
				musicEntity('artist', {
					P31: [{ rank: 'normal', mainsnak: { datavalue: { value: { id: 'Q4167410' } } } }],
				}),
		],
		[
			'an entity that does not own the id',
			() => ({ entities: { Q189729: { id: 'Q189729', claims: {} } } }),
		],
	])('a Spotify lookup whose entity is %s is identityBridge.outcome miss (it used to be transient)', async (_name, body) => {
		const { bridge } = bridgeFor({
			search: () => Response.json({ query: { search: [{ title: 'Q189729' }] } }),
			entity: () => Response.json(body()),
		});
		const result = await bridge(musicResult('artist'));
		expect(result.resolved?.atoms[0]?.metadata?.identityBridge).toMatchObject({
			outcome: 'miss',
			promotionPending: true,
		});
		expect(tuples()).toEqual([
			'wikidata|bridge_search:hit:none:live',
			'wikidata|bridge_entity:miss:none:live',
		]);
	});

	it('a real Wikimedia fault stays degraded / identity_bridge_transient', async () => {
		const { bridge } = bridgeFor({
			search: searchHit,
			entity: () => new Response('boom', { status: 503 }),
		});
		const result = await bridge(directTmdbMovie());
		expect(outcomeOf(result)).toEqual({
			reason: 'identity_bridge_transient',
			status: 'degraded',
			terminal: true,
		});
	});
});

describe('identity bridge observation: duration', () => {
	it('measures the request and not our own request spacing', async () => {
		const { bridge } = bridgeFor(
			{ search: searchHit, entity: entityOk },
			{ requestSlot: createRequestSlot({ minSpacingMs: 120 }) }
		);
		const startedAt = Date.now();
		await bridge(movie());
		// The second hop waited out the 120 ms slot spacing.
		expect(Date.now() - startedAt).toBeGreaterThanOrEqual(100);
		for (const event of events) expect(event.durationMs).toBeLessThan(60);
	});
});

describe('identity bridge observation: deadline, cancel and local backpressure', () => {
	it("records the bridge's own timeout as timeout, even when fetch ignores the signal", async () => {
		const { bridge } = bridgeFor(
			{ search: () => new Promise<Response>(() => undefined) },
			{ timeoutMs: 30 }
		);
		const result = await bridge(movie());
		expect(result.resolved?.atoms[0]?.metadata?.skippedStages).toContain('bridge_timeout');
		expect(tuples()).toEqual(['wikidata|bridge_search:error:timeout:live']);
	});

	it('records a timeout on the EntityData hop under bridge_entity', async () => {
		const { bridge } = bridgeFor(
			{ search: searchHit, entity: () => new Promise<Response>(() => undefined) },
			{ timeoutMs: 40 }
		);
		await bridge(movie());
		expect(tuples()).toEqual([
			'wikidata|bridge_search:hit:none:live',
			'wikidata|bridge_entity:error:timeout:live',
		]);
	});

	it('a Spotify lookup that overruns its 1 s budget in flight is a timeout', async () => {
		const { bridge } = bridgeFor(
			{ search: () => new Promise<Response>(() => undefined) },
			{ timeoutMs: 5_000 }
		);
		const result = await bridge(musicResult('artist'));
		expect(result.resolved?.atoms[0]?.metadata?.skippedStages).toContain('bridge_timeout');
		expect(tuples()).toEqual(['wikidata|bridge_search:error:timeout:live']);
	}, 10_000);

	it('a caller that leaves before the deadline records nothing', async () => {
		const controller = new AbortController();
		const { bridge } = bridgeFor(
			{ search: () => new Promise<Response>(() => undefined) },
			{ timeoutMs: 5_000 }
		);
		const pending = bridge(movie(), controller.signal);
		await new Promise((resolve) => setTimeout(resolve, 20));
		controller.abort(new Error('user navigated away'));
		await pending;
		expect(tuples()).toEqual([]);
	});

	it('a full queue is budget_exhausted without a duration or a request, not a provider error', async () => {
		let release: (() => void) | undefined;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		let dialled = 0;
		const { bridge } = bridgeFor(
			{
				search: async () => {
					dialled += 1;
					await gate;
					return Response.json({ query: { search: [] } });
				},
			},
			{ queueMaxEntries: 1 }
		);
		// One lookup runs, one waits, the third finds the queue full.
		const calls = [1, 2, 3].map((id) => bridge(movie(`tmdb:movie:${id}`)));
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(tuples()).toEqual(['wikidata|bridge_search:budget_exhausted:none:live']);
		expect(events[0]?.durationMs).toBeUndefined();
		release?.();
		const results = await Promise.all(calls);
		expect(dialled).toBe(2);
		expect(
			results.filter((r) =>
				(r.resolved?.atoms[0]?.metadata?.skippedStages as string[] | undefined)?.includes(
					'bridge_backpressure'
				)
			)
		).toHaveLength(1);
		expect(tuples().sort()).toEqual(
			[
				'wikidata|bridge_search:budget_exhausted:none:live',
				'wikidata|bridge_search:miss:none:live',
				'wikidata|bridge_search:miss:none:live',
			].sort()
		);
	});

	it('a Spotify budget spent while queued is budget_exhausted, not a provider timeout', async () => {
		let release: (() => void) | undefined;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const { bridge } = bridgeFor({
			search: async () => {
				await gate;
				return Response.json({ query: { search: [] } });
			},
		});
		// The first lookup holds the queue past the second one's 1 s total budget.
		const first = bridge(movie());
		await new Promise((resolve) => setTimeout(resolve, 5));
		const second = await bridge(musicResult('artist'));
		expect(second.resolved?.atoms[0]?.metadata?.skippedStages).toContain('bridge_timeout');
		expect(tuples()).toEqual(['wikidata|bridge_search:budget_exhausted:none:live']);
		release?.();
		await first;
	}, 10_000);
});

describe('identity bridge observation: cache source', () => {
	it('a repeat promotion is a bridge_entity cache hit, without a duration or a request', async () => {
		const { bridge, requests } = bridgeFor({ search: searchHit, entity: entityOk });
		await bridge(movie());
		await bridge(movie());
		expect(requests).toHaveLength(2);
		expect(tuples()).toEqual([
			'wikidata|bridge_search:hit:none:live',
			'wikidata|bridge_entity:hit:none:live',
			'wikidata|bridge_entity:hit:none:cache',
		]);
		expect(events[2]?.durationMs).toBeUndefined();
	});

	it('a repeat empty search is a bridge_search cache miss', async () => {
		const { bridge, requests } = bridgeFor({
			search: () => Response.json({ query: { search: [] } }),
		});
		await bridge(movie());
		await bridge(movie());
		expect(requests).toHaveLength(1);
		expect(tuples()).toEqual([
			'wikidata|bridge_search:miss:none:live',
			'wikidata|bridge_search:miss:none:cache',
		]);
	});

	it('a repeat inside the failure backoff records nothing (the error was already counted)', async () => {
		const { bridge, requests } = bridgeFor({ search: () => new Response('', { status: 503 }) });
		await bridge(movie());
		await bridge(movie());
		expect(requests).toHaveLength(1);
		expect(tuples()).toEqual(['wikidata|bridge_search:error:upstream_5xx:live']);
	});

	it('callers that join one in-flight lookup count one live request and one cache answer each', async () => {
		let release: (() => void) | undefined;
		const gate = new Promise<void>((resolve) => {
			release = resolve;
		});
		const { bridge, requests } = bridgeFor({
			search: async () => {
				await gate;
				return Response.json({ query: { search: [] } });
			},
		});
		const calls = [bridge(movie()), bridge(movie()), bridge(movie())];
		await new Promise((resolve) => setTimeout(resolve, 10));
		release?.();
		await Promise.all(calls);
		expect(requests).toHaveLength(1);
		expect(tuples().sort()).toEqual(
			[
				'wikidata|bridge_search:miss:none:live',
				'wikidata|bridge_search:miss:none:cache',
				'wikidata|bridge_search:miss:none:cache',
			].sort()
		);
	});
});

describe('identity bridge observation: Spotify targets', () => {
	it('records the same two hops for a Spotify artist lookup', async () => {
		const { bridge } = bridgeFor({
			search: () => Response.json({ query: { search: [{ title: 'Q189729' }] } }),
			entity: () => Response.json(musicEntity('artist')),
		});
		await bridge(musicResult('artist'));
		expect(tuples()).toEqual([
			'wikidata|bridge_search:hit:none:live',
			'wikidata|bridge_entity:hit:none:live',
		]);
	});

	it('the shared music fixture fetch drives the bridge to a promotion', async () => {
		const bridge = createWikidataIdentityBridge({
			fetch: musicFetch('artist'),
			requestSlot: unspacedRequestSlot(),
		});
		const result = await bridge(musicResult('artist'));
		expect(result.resolved?.atoms[0]?.canonicalId).toStartWith('int:');
		expect(tuples()).toEqual([
			'wikidata|bridge_search:hit:none:live',
			'wikidata|bridge_entity:hit:none:live',
		]);
	});
});

describe("identity bridge: a refused lookup is retried after the slot's own hint (ENG-17116)", () => {
	it('a full queue is not retried before the slot says it has room, then is retried', async () => {
		const clock = { now: 1_000_000 };
		// 2 s of spacing owed after the first lookup (inside the 3 s budget, so the refusal is
		// `queue_full`, not `deadline`); the queue holds nobody.
		const { bridge, requests } = bridgeFor(
			{ search: () => Response.json({ query: { search: [] } }), entity: entityOk },
			{ requestSlot: createRequestSlot({ minSpacingMs: 2_000, maxQueue: 0 }), now: () => clock.now }
		);
		await bridge(movie('tmdb:movie:1'));
		const dialled = requests.length;
		events.length = 0;

		await bridge(movie('tmdb:movie:2'));
		expect(tuples()).toEqual(['wikidata|bridge_search:budget_exhausted:none:live']);

		// The old window (250 ms for a first failure) has long passed after 1 s; the slot's own hint
		// (about 4 s: the 2 s owed plus one spacing) has not. The lookup must not go back to the slot.
		clock.now += 1_000;
		await bridge(movie('tmdb:movie:2'));
		expect(tuples()).toEqual(['wikidata|bridge_search:budget_exhausted:none:live']);
		expect(requests).toHaveLength(dialled);

		// Past the hint it asks the slot again; the slot is still owed spacing in real time, so the
		// second refusal is recorded.
		clock.now += 10_000;
		await bridge(movie('tmdb:movie:2'));
		expect(tuples()).toEqual([
			'wikidata|bridge_search:budget_exhausted:none:live',
			'wikidata|bridge_search:budget_exhausted:none:live',
		]);
	});
});

describe('identity bridge: the retry hint of a refusal is honored and bounded (ENG-17116)', () => {
	/** A slot that refuses every request with `error`, counting how often the bridge asked. */
	function refusingSlot(error: Error) {
		const counter = { asked: 0 };
		const slot: RequestSlot = {
			run: async () => {
				counter.asked += 1;
				throw error;
			},
		};
		return { slot, counter };
	}

	async function askAt(
		clock: { now: number },
		elapsedMs: number,
		bridge: ReturnType<typeof bridgeFor>['bridge']
	) {
		clock.now += elapsedMs;
		await bridge(movie('tmdb:movie:77'));
	}

	it('queue_full: a hint beyond the shared maximum parks the lookup for at most 30 s, not for the hint', async () => {
		expect(SLOT_REFUSAL_RETRY_MAX_MS).toBe(30_000);
		const clock = { now: 5_000_000 };
		const { slot, counter } = refusingSlot(
			new RequestSlotRejectedError('queue_full', undefined, 10 * 60_000)
		);
		const { bridge } = bridgeFor(
			{ search: searchHit, entity: entityOk },
			{ requestSlot: slot, now: () => clock.now, failureTtlMs: 1_000 }
		);
		await askAt(clock, 0, bridge);
		expect(counter.asked).toBe(1);
		await askAt(clock, 29_000, bridge);
		expect(counter.asked).toBe(1); // still inside the clamped window
		await askAt(clock, 2_000, bridge); // 31 s after the refusal
		expect(counter.asked).toBe(2); // asked again: an unclamped 10 min hint would still block
	});

	it("queue_full: a small hint is honored over the bridge's own short window", async () => {
		const clock = { now: 5_000_000 };
		const { slot, counter } = refusingSlot(
			new RequestSlotRejectedError('queue_full', undefined, 8_000)
		);
		const { bridge } = bridgeFor(
			{ search: searchHit, entity: entityOk },
			{ requestSlot: slot, now: () => clock.now, failureTtlMs: 1_000 }
		);
		await askAt(clock, 0, bridge);
		await askAt(clock, 7_000, bridge);
		expect(counter.asked).toBe(1);
		await askAt(clock, 1_500, bridge);
		expect(counter.asked).toBe(2);
	});

	it('deadline: the slot hint is the retry window of the timeout, and an oversized one is clamped too', async () => {
		const clock = { now: 5_000_000 };
		const { slot, counter } = refusingSlot(new RequestSlotRejectedError('deadline', 0, 5_000));
		const { bridge } = bridgeFor(
			{ search: searchHit, entity: entityOk },
			{ requestSlot: slot, now: () => clock.now, failureTtlMs: 1_000 }
		);
		await askAt(clock, 0, bridge);
		await askAt(clock, 4_000, bridge);
		expect(counter.asked).toBe(1);
		await askAt(clock, 1_500, bridge); // 5.5 s
		expect(counter.asked).toBe(2);

		const huge = { now: 9_000_000 };
		const hugeRefusal = refusingSlot(new RequestSlotRejectedError('deadline', 0, 60 * 60_000));
		const { bridge: hugeBridge } = bridgeFor(
			{ search: searchHit, entity: entityOk },
			{ requestSlot: hugeRefusal.slot, now: () => huge.now, failureTtlMs: 1_000 }
		);
		await askAt(huge, 0, hugeBridge);
		await askAt(huge, 29_000, hugeBridge);
		expect(hugeRefusal.counter.asked).toBe(1);
		await askAt(huge, 2_000, hugeBridge);
		expect(hugeRefusal.counter.asked).toBe(2);
	});

	it("deadline without a hint, and a deadline that passed while queued, use the bridge's own window", async () => {
		for (const error of [
			new RequestSlotRejectedError('deadline'),
			new RequestSlotTimeoutError(false),
		]) {
			const clock = { now: 5_000_000 };
			const { slot, counter } = refusingSlot(error);
			const { bridge } = bridgeFor(
				{ search: searchHit, entity: entityOk },
				{ requestSlot: slot, now: () => clock.now, failureTtlMs: 4_000 }
			);
			await askAt(clock, 0, bridge);
			await askAt(clock, 3_000, bridge);
			expect(counter.asked).toBe(1);
			await askAt(clock, 1_500, bridge);
			expect(counter.asked).toBe(2);
			// Both are budget_exhausted observations: nothing was dialled.
		}
		expect(
			tuples().every((tuple) => tuple === 'wikidata|bridge_search:budget_exhausted:none:live')
		).toBe(true);
	});
});
