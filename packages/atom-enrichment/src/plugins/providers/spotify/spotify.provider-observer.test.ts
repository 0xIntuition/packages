import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderReason,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';

import { createMemoryCacheAdapter } from '../../../cache';
import { createEnrichmentEngine } from '../../../engine';
import { registerEnrichmentPluginSpan } from '../../../plugin-tracing';
import {
	createMockAtomInput,
	createMockPluginContext,
	createMockRequest,
	useStubbedPublicDns,
} from '../../../testing';
import { createPinAwareFetch } from '../__shared__/http';
import trackFixture from './__fixtures__/track.json';
import { createSpotifyPlugin } from './index';

useStubbedPublicDns();

const TRACK_ID = trackFixture.single.id;
const SHOW_ID = '38bS44xjbVVZ3No3ByF1dJ';
const ISRC = 'USFIX2600001';

let events: ProviderEvent[];
const requests = () =>
	events.filter((event): event is ProviderRequestEvent => event.type === 'provider_request');
const tuples = () =>
	requests().map(({ operation, outcome, reason, source }) => ({
		operation,
		outcome,
		reason,
		source,
	}));
const tuple = (
	operation: ProviderRequestEvent['operation'],
	outcome: ProviderRequestEvent['outcome'],
	reason: ProviderReason = 'none'
) => ({ operation, outcome, reason, source: 'live' as const });

beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

type Handler = (input: string, init?: RequestInit) => Response | Promise<Response>;
type Handlers = { token?: Handler; item?: Handler; search?: Handler; oembed?: Handler };

const tokenOk: Handler = () =>
	Response.json({ access_token: 'fake-access-token', token_type: 'Bearer', expires_in: 3600 });
const oembedOk: Handler = () =>
	Response.json({ title: 'OEmbed Title', thumbnail_url: 'https://i.scdn.co/oembed.jpg' });

/** A pin-aware fetch that routes by endpoint and records every URL it was asked for. */
function route(handlers: Handlers) {
	const urls: string[] = [];
	const fetch = createPinAwareFetch(async (input: string, init?: RequestInit) => {
		urls.push(input);
		const { hostname, pathname } = new URL(input);
		const handler =
			hostname === 'accounts.spotify.com'
				? (handlers.token ?? tokenOk)
				: hostname === 'open.spotify.com'
					? (handlers.oembed ?? oembedOk)
					: pathname === '/v1/search'
						? handlers.search
						: handlers.item;
		if (!handler) throw new Error(`unexpected request: ${input}`);
		return await handler(input, init);
	});
	return { fetch, urls, count: (host: string) => urls.filter((u) => u.includes(host)).length };
}

let seq = 0;
function plugin(fetch: ReturnType<typeof route>['fetch'], market?: string) {
	seq += 1;
	return createSpotifyPlugin({
		clientId: `obs-client-${seq}`,
		clientSecret: `obs-secret-${seq}`,
		fetch,
		...(market ? { market } : {}),
	});
}

function requestFor(type: string, id: string) {
	return createMockRequest({
		input: createMockAtomInput({ hints: { url: `https://open.spotify.com/${type}/${id}` } }),
	});
}

function isrcRequest() {
	return createMockRequest({
		input: createMockAtomInput({ hints: { identifiers: { isrc: ISRC } } }),
	});
}

function loggerSpy() {
	const warnings: Array<{ message: string; fields: unknown }> = [];
	return {
		warnings,
		logger: {
			debug: () => {},
			error: () => {},
			warn: (message: string, fields?: unknown) => {
				warnings.push({ message, fields });
			},
		},
	};
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Spotify enrichment observer: the happy path', () => {
	test('a track records one token hit and one item hit, with durations', async () => {
		const { fetch } = route({ item: () => Response.json(trackFixture.single) });
		const artifacts = await plugin(fetch).enrich(
			requestFor('track', TRACK_ID),
			createMockPluginContext()
		);
		expect(artifacts[0]?.meta.provider).toBe('spotify-web-api');
		expect(tuples()).toEqual([tuple('token', 'hit'), tuple('item', 'hit')]);
		for (const event of requests()) {
			expect(typeof event.durationMs).toBe('number');
		}
	});

	test('the cached token is reused: the second paste records only the item', async () => {
		const routed = route({ item: () => Response.json(trackFixture.single) });
		const spotify = plugin(routed.fetch);
		await spotify.enrich(requestFor('track', TRACK_ID), createMockPluginContext());
		await spotify.enrich(requestFor('track', TRACK_ID), createMockPluginContext());
		expect(routed.count('accounts.spotify.com')).toBe(1);
		expect(tuples()).toEqual([tuple('token', 'hit'), tuple('item', 'hit'), tuple('item', 'hit')]);
	});

	test('concurrent pastes share one token request and one token event', async () => {
		const routed = route({
			token: async (url, init) => {
				await sleep(20);
				return await tokenOk(url, init);
			},
			item: () => Response.json(trackFixture.single),
		});
		const spotify = plugin(routed.fetch);
		await Promise.all(
			[1, 2, 3].map(() => spotify.enrich(requestFor('track', TRACK_ID), createMockPluginContext()))
		);
		expect(routed.count('accounts.spotify.com')).toBe(1);
		expect(tuples().filter((t) => t.operation === 'token')).toEqual([tuple('token', 'hit')]);
		expect(tuples().filter((t) => t.operation === 'item')).toHaveLength(3);
	});

	test('show lookups default to market=US; a configured market wins', async () => {
		const shows = route({ item: () => Response.json({ id: SHOW_ID, name: 'A Show' }) });
		await plugin(shows.fetch).enrich(requestFor('show', SHOW_ID), createMockPluginContext());
		expect(shows.urls.find((u) => u.includes('/v1/shows/'))).toBe(
			`https://api.spotify.com/v1/shows/${SHOW_ID}?market=US`
		);
		const tracks = route({ item: () => Response.json(trackFixture.single) });
		await plugin(tracks.fetch, 'DE').enrich(
			requestFor('track', TRACK_ID),
			createMockPluginContext()
		);
		expect(tracks.urls.find((u) => u.includes('/v1/tracks/'))).toBe(
			`https://api.spotify.com/v1/tracks/${TRACK_ID}?market=DE`
		);
	});
});

describe('Spotify enrichment observer: item failures fall back to oEmbed, visibly', () => {
	const cases: Array<[string, Handler, ProviderReason | 'miss']> = [
		['404 is a miss', () => new Response('{}', { status: 404 }), 'miss'],
		['403 is auth_failed', () => new Response('{}', { status: 403 }), 'auth_failed'],
		[
			'429 is rate_limited',
			() => new Response('{}', { status: 429, headers: { 'retry-after': '7' } }),
			'rate_limited',
		],
		['500 is upstream_5xx', () => new Response('{}', { status: 500 }), 'upstream_5xx'],
		['400 is http_4xx', () => new Response('{}', { status: 400 }), 'http_4xx'],
		['a non-JSON body is invalid_response', () => new Response('<html>'), 'invalid_response'],
		[
			'a body that fails the schema is invalid_response',
			() => Response.json({ id: 123 }),
			'invalid_response',
		],
		[
			'a failed fetch is network',
			() => {
				throw new TypeError('fetch failed');
			},
			'network',
		],
	];
	for (const [name, item, expected] of cases) {
		test(name, async () => {
			const { fetch } = route({ item });
			const { logger, warnings } = loggerSpy();
			const artifacts = await plugin(fetch).enrich(
				requestFor('track', TRACK_ID),
				createMockPluginContext({ logger })
			);
			expect(tuples()).toEqual([
				tuple('token', 'hit'),
				expected === 'miss' ? tuple('item', 'miss') : tuple('item', 'error', expected),
				tuple('oembed', 'hit'),
			]);
			// Behaviour is unchanged: a failed Web API call keeps the `spotify-url` tier (with the
			// oEmbed title), never `spotify-web-api`.
			expect(artifacts[0]?.meta.provider).toBe('spotify-url');
			expect(artifacts[0]?.data.name).toBe('OEmbed Title');
			// The fallback is logged with structured facts only, never the error text.
			expect(warnings).toHaveLength(1);
			expect(Object.keys(warnings[0]?.fields as object)).not.toContain('error');
		});
	}

	test('a 429 logs its retryAfterMs, status and reason, not the error text', async () => {
		const { fetch } = route({
			item: () => new Response('{}', { status: 429, headers: { 'retry-after': '7' } }),
		});
		const { logger, warnings } = loggerSpy();
		await plugin(fetch).enrich(requestFor('track', TRACK_ID), createMockPluginContext({ logger }));
		expect(warnings[0]?.fields).toEqual({
			reason: 'rate_limited',
			status: 429,
			retryAfterMs: 7000,
			sourceUrl: `https://open.spotify.com/track/${TRACK_ID}`,
		});
	});

	test('a failed oEmbed after a failed item records both and keeps the URL tier', async () => {
		const { fetch } = route({
			item: () => new Response('{}', { status: 500 }),
			oembed: () => new Response('{}', { status: 500 }),
		});
		const artifacts = await plugin(fetch).enrich(
			requestFor('track', TRACK_ID),
			createMockPluginContext()
		);
		expect(tuples()).toEqual([
			tuple('token', 'hit'),
			tuple('item', 'error', 'upstream_5xx'),
			tuple('oembed', 'error', 'upstream_5xx'),
		]);
		expect(artifacts[0]?.meta.provider).toBe('spotify-url');
	});
});

describe('Spotify enrichment observer: the token endpoint', () => {
	const json =
		(status: number, body: unknown, headers: Record<string, string> = {}): Handler =>
		() =>
			new Response(typeof body === 'string' ? body : JSON.stringify(body), { status, headers });
	const cases: Array<[string, Handler, ProviderReason]> = [
		[
			'400 invalid_client (live-observed) is auth_failed',
			json(400, { error: 'invalid_client', error_description: 'Invalid client' }),
			'auth_failed',
		],
		['400 invalid_grant is auth_failed', json(400, { error: 'invalid_grant' }), 'auth_failed'],
		['401 is auth_failed', json(401, { error: 'invalid_client' }), 'auth_failed'],
		['403 is auth_failed', json(403, '{}'), 'auth_failed'],
		[
			'400 unsupported_grant_type (live-observed) is NOT auth: http_4xx',
			json(400, { error: 'unsupported_grant_type' }),
			'http_4xx',
		],
		['400 with an unreadable body is http_4xx', json(400, '<html>nope</html>'), 'http_4xx'],
		[
			'400 whose error is free text is http_4xx',
			json(400, { error: 'Invalid client, go away' }),
			'http_4xx',
		],
		['429 is rate_limited', json(429, '{}', { 'retry-after': '3' }), 'rate_limited'],
		['500 is upstream_5xx', json(500, '{}'), 'upstream_5xx'],
		[
			'a token response without access_token is invalid_response',
			json(200, {}),
			'invalid_response',
		],
	];
	for (const [name, token, expected] of cases) {
		test(name, async () => {
			const routed = route({ token });
			const artifacts = await plugin(routed.fetch).enrich(
				requestFor('track', TRACK_ID),
				createMockPluginContext()
			);
			// The item is never requested without a token; oEmbed carries the paste.
			expect(routed.count('api.spotify.com')).toBe(0);
			expect(tuples()).toEqual([tuple('token', 'error', expected), tuple('oembed', 'hit')]);
			expect(artifacts[0]?.meta.provider).toBe('spotify-url');
		});
	}

	test('a failed token is not cached: the next paste mints again', async () => {
		let calls = 0;
		const routed = route({
			token: (url, init) =>
				++calls === 1 ? new Response('{}', { status: 500 }) : tokenOk(url, init),
			item: () => Response.json(trackFixture.single),
		});
		const spotify = plugin(routed.fetch);
		await spotify.enrich(requestFor('track', TRACK_ID), createMockPluginContext());
		await spotify.enrich(requestFor('track', TRACK_ID), createMockPluginContext());
		expect(tuples().filter((t) => t.operation === 'token')).toEqual([
			tuple('token', 'error', 'upstream_5xx'),
			tuple('token', 'hit'),
		]);
	});
});

describe('Spotify enrichment observer: the 401 refresh', () => {
	test('a rejected token is refreshed once and the item retried: two token and two item events', async () => {
		let items = 0;
		let tokens = 0;
		const routed = route({
			token: () => {
				tokens += 1;
				return Response.json({ access_token: `token-${tokens}`, expires_in: 3600 });
			},
			item: (_url, init) => {
				items += 1;
				const authorization = new Headers(init?.headers).get('authorization');
				return items === 1
					? new Response('expired', { status: 401 })
					: authorization === 'Bearer token-2'
						? Response.json(trackFixture.single)
						: new Response('stale token reused', { status: 500 });
			},
		});
		const retries: Array<{ name: string; attributes: unknown }> = [];
		const context = createMockPluginContext();
		registerEnrichmentPluginSpan(context.signal, {
			event: (name: string, _time: bigint, attributes: unknown) => {
				retries.push({ name, attributes });
			},
		} as never);
		const artifacts = await plugin(routed.fetch).enrich(requestFor('track', TRACK_ID), context);
		expect(artifacts[0]?.meta.provider).toBe('spotify-web-api');
		expect(tuples()).toEqual([
			tuple('token', 'hit'),
			tuple('item', 'error', 'auth_failed'),
			tuple('token', 'hit'),
			tuple('item', 'hit'),
		]);
		expect(retries).toEqual([
			{
				name: 'enrichment.plugin.retry',
				attributes: { 'retry.attempt': 2, 'retry.reason': 'authentication_rejected' },
			},
		]);
	});

	test('a second 401 is not retried again; oEmbed carries the paste', async () => {
		const routed = route({ item: () => new Response('no', { status: 401 }) });
		const artifacts = await plugin(routed.fetch).enrich(
			requestFor('track', TRACK_ID),
			createMockPluginContext()
		);
		expect(routed.count('accounts.spotify.com')).toBe(2);
		expect(routed.count('api.spotify.com')).toBe(2);
		expect(tuples()).toEqual([
			tuple('token', 'hit'),
			tuple('item', 'error', 'auth_failed'),
			tuple('token', 'hit'),
			tuple('item', 'error', 'auth_failed'),
			tuple('oembed', 'hit'),
		]);
		expect(artifacts[0]?.meta.provider).toBe('spotify-url');
	});
});

describe('Spotify enrichment observer: ISRC search', () => {
	const searchHit = () => Response.json({ tracks: { items: [trackFixture.single] } });

	test('a hit records token and isrc_search hit', async () => {
		const { fetch } = route({ search: searchHit });
		const artifacts = await plugin(fetch).enrich(isrcRequest(), createMockPluginContext());
		expect(artifacts[0]?.data.spotifyId).toBe(TRACK_ID);
		expect(tuples()).toEqual([tuple('token', 'hit'), tuple('isrc_search', 'hit')]);
	});

	test('an empty result is a miss, not a hit', async () => {
		const { fetch } = route({ search: () => Response.json({ tracks: { items: [] } }) });
		const artifacts = await plugin(fetch).enrich(isrcRequest(), createMockPluginContext());
		expect(artifacts).toEqual([]);
		expect(tuples()).toEqual([tuple('token', 'hit'), tuple('isrc_search', 'miss')]);
	});

	test('404 is a miss, 403 is auth_failed, 500 is upstream_5xx', async () => {
		for (const [status, expected] of [
			[404, tuple('isrc_search', 'miss')],
			[403, tuple('isrc_search', 'error', 'auth_failed')],
			[500, tuple('isrc_search', 'error', 'upstream_5xx')],
		] as const) {
			events = [];
			const { fetch } = route({ search: () => new Response('{}', { status }) });
			const artifacts = await plugin(fetch).enrich(isrcRequest(), createMockPluginContext());
			expect(artifacts).toEqual([]);
			expect(tuples()).toEqual([tuple('token', 'hit'), expected]);
		}
	});

	test('the failure log carries neither the ISRC nor the raw error message', async () => {
		const { fetch } = route({
			search: () => new Response('{}', { status: 429, headers: { 'retry-after': '2' } }),
		});
		const { logger, warnings } = loggerSpy();
		await plugin(fetch).enrich(isrcRequest(), createMockPluginContext({ logger }));
		expect(warnings).toEqual([
			{
				message: 'Spotify ISRC lookup failed.',
				fields: { reason: 'rate_limited', status: 429, retryAfterMs: 2000 },
			},
		]);
		const serialized = JSON.stringify(warnings);
		expect(serialized).not.toContain(ISRC);
		expect(serialized).not.toContain('HTTP 429');
	});

	test('a non-HTTP failure logs a reason and nothing else', async () => {
		const { fetch } = route({
			search: () => {
				throw new Error(`socket hang up while searching isrc:${ISRC}`);
			},
		});
		const { logger, warnings } = loggerSpy();
		await plugin(fetch).enrich(isrcRequest(), createMockPluginContext({ logger }));
		expect(warnings[0]?.fields).toEqual({ reason: 'other' });
		expect(JSON.stringify(warnings)).not.toContain(ISRC);
	});
});

describe('Spotify enrichment observer: oEmbed without credentials', () => {
	const keyless = (fetch: ReturnType<typeof route>['fetch']) => createSpotifyPlugin({ fetch });

	test('the keyless tier records only oembed', async () => {
		const routed = route({});
		const artifacts = await keyless(routed.fetch).enrich(
			requestFor('track', TRACK_ID),
			createMockPluginContext()
		);
		expect(artifacts[0]?.meta.provider).toBe('spotify-oembed');
		expect(tuples()).toEqual([tuple('oembed', 'hit')]);
		expect(routed.count('accounts.spotify.com')).toBe(0);
	});

	test('404 is a miss, 500 and 429 are errors; the artifact keeps the URL tier', async () => {
		for (const [status, expected] of [
			[404, tuple('oembed', 'miss')],
			[500, tuple('oembed', 'error', 'upstream_5xx')],
			[429, tuple('oembed', 'error', 'rate_limited')],
		] as const) {
			events = [];
			const routed = route({ oembed: () => new Response('{}', { status }) });
			const artifacts = await keyless(routed.fetch).enrich(
				requestFor('track', TRACK_ID),
				createMockPluginContext()
			);
			expect(tuples()).toEqual([expected]);
			expect(artifacts[0]?.meta.provider).toBe('spotify-url');
		}
	});

	test('oembed never reports auth_failed: it takes no credentials', async () => {
		const routed = route({ oembed: () => new Response('{}', { status: 403 }) });
		await keyless(routed.fetch).enrich(requestFor('track', TRACK_ID), createMockPluginContext());
		expect(tuples()).toEqual([tuple('oembed', 'error', 'http_4xx')]);
	});
});

describe('Spotify enrichment observer: caller cancellation is not a provider timeout', () => {
	const hang: Handler = () => new Promise<Response>(() => {});

	test('a caller abort before the engine deadline records no item event', async () => {
		const external = new AbortController();
		const { fetch } = route({ item: hang });
		const engine = createEnrichmentEngine({ plugins: [plugin(fetch)] });
		const pending = engine
			.enrich({ ...requestFor('track', TRACK_ID), timeoutMs: 5000 }, { signal: external.signal })
			.catch((error: unknown) => error);
		await sleep(60);
		external.abort(new Error('user left'));
		await pending;
		await sleep(20);
		// The token was minted before the cancel and is real; the cancelled item is not counted.
		expect(tuples()).toEqual([tuple('token', 'hit')]);
	});

	test('the engine deadline records exactly one item timeout', async () => {
		const { fetch } = route({ item: hang });
		const engine = createEnrichmentEngine({ plugins: [plugin(fetch)] });
		await engine.enrich({ ...requestFor('track', TRACK_ID), timeoutMs: 250 });
		await sleep(30);
		expect(tuples()).toEqual([tuple('token', 'hit'), tuple('item', 'error', 'timeout')]);
	});

	test('a hung token request at the deadline is a token timeout, and item never starts', async () => {
		const routed = route({ token: hang });
		const engine = createEnrichmentEngine({ plugins: [plugin(routed.fetch)] });
		await engine.enrich({ ...requestFor('track', TRACK_ID), timeoutMs: 80 });
		await sleep(30);
		expect(tuples().filter((t) => t.operation === 'token')).toEqual([
			tuple('token', 'error', 'timeout'),
		]);
		expect(routed.count('api.spotify.com')).toBe(0);
	});

	test('an already-aborted signal records nothing', async () => {
		const controller = new AbortController();
		controller.abort(new Error('already cancelled'));
		const { fetch } = route({ item: () => Response.json(trackFixture.single) });
		await plugin(fetch)
			.enrich(
				requestFor('track', TRACK_ID),
				createMockPluginContext({ signal: controller.signal, deadlineAtMs: Date.now() - 1 })
			)
			.catch(() => undefined);
		expect(tuples()).toEqual([]);
	});
});

describe('Spotify enrichment observer: observation never changes the result', () => {
	test('artifacts are identical observed, unobserved and with a throwing observer', async () => {
		const run = async () => {
			const { fetch } = route({ item: () => Response.json(trackFixture.single) });
			return await plugin(fetch).enrich(requestFor('track', TRACK_ID), createMockPluginContext());
		};
		const observed = await run();
		resetProviderObserversForTests();
		const unobserved = await run();
		addProviderObserver(() => {
			throw new Error('observer exploded');
		});
		const throwing = await run();
		expect(unobserved).toEqual(observed);
		expect(throwing).toEqual(observed);
	});
});

describe('Spotify enrichment observer: ISRC search failure modes', () => {
	test('a 429 records the rate_limited tuple (the log is checked elsewhere)', async () => {
		const { fetch } = route({
			search: () => new Response('{}', { status: 429, headers: { 'retry-after': '2' } }),
		});
		await plugin(fetch).enrich(isrcRequest(), createMockPluginContext());
		expect(tuples()).toEqual([
			tuple('token', 'hit'),
			tuple('isrc_search', 'error', 'rate_limited'),
		]);
	});

	test('a 401 refreshes the token once and retries: two token and two isrc_search events', async () => {
		let tokens = 0;
		let searches = 0;
		const authorizations: Array<string | null> = [];
		const { fetch } = route({
			token: () => {
				tokens += 1;
				return Response.json({ access_token: `isrc-token-${tokens}`, expires_in: 3600 });
			},
			search: (_url, init) => {
				searches += 1;
				authorizations.push(new Headers(init?.headers).get('authorization'));
				return searches === 1
					? new Response('expired', { status: 401 })
					: Response.json({ tracks: { items: [trackFixture.single] } });
			},
		});
		const artifacts = await plugin(fetch).enrich(isrcRequest(), createMockPluginContext());
		expect(artifacts[0]?.data.spotifyId).toBe(TRACK_ID);
		expect(authorizations).toEqual(['Bearer isrc-token-1', 'Bearer isrc-token-2']);
		expect(tuples()).toEqual([
			tuple('token', 'hit'),
			tuple('isrc_search', 'error', 'auth_failed'),
			tuple('token', 'hit'),
			tuple('isrc_search', 'hit'),
		]);
	});

	test('the engine deadline records exactly one isrc_search timeout', async () => {
		const { fetch } = route({ search: () => new Promise<Response>(() => {}) });
		const engine = createEnrichmentEngine({ plugins: [plugin(fetch)] });
		await engine.enrich({ ...isrcRequest(), timeoutMs: 250 });
		await sleep(30);
		expect(tuples()).toEqual([tuple('token', 'hit'), tuple('isrc_search', 'error', 'timeout')]);
	});

	test('a failed fetch is a network error', async () => {
		const { fetch } = route({
			search: () => {
				throw new TypeError('fetch failed');
			},
		});
		await plugin(fetch).enrich(isrcRequest(), createMockPluginContext());
		expect(tuples()).toEqual([tuple('token', 'hit'), tuple('isrc_search', 'error', 'network')]);
	});
});

describe('Spotify enrichment observer: oEmbed failure modes', () => {
	const keyless = (fetch: ReturnType<typeof route>['fetch']) => createSpotifyPlugin({ fetch });

	test.each([
		['a non-JSON body', () => new Response('<html>'), 'invalid_response'],
		['a body that fails the schema', () => Response.json([1, 2]), 'invalid_response'],
		[
			'a failed fetch',
			() => {
				throw new TypeError('fetch failed');
			},
			'network',
		],
	] as const)('%s is %s', async (_name, oembed, reason) => {
		const routed = route({ oembed });
		const artifacts = await keyless(routed.fetch).enrich(
			requestFor('track', TRACK_ID),
			createMockPluginContext()
		);
		expect(tuples()).toEqual([tuple('oembed', 'error', reason)]);
		expect(artifacts[0]?.meta.provider).toBe('spotify-url');
	});

	test('the engine deadline records exactly one oembed timeout', async () => {
		const routed = route({ oembed: () => new Promise<Response>(() => {}) });
		const engine = createEnrichmentEngine({ plugins: [keyless(routed.fetch)] });
		await engine.enrich({ ...requestFor('track', TRACK_ID), timeoutMs: 250 });
		await sleep(30);
		expect(tuples()).toEqual([tuple('oembed', 'error', 'timeout')]);
	});

	test('a caller abort records no oembed event', async () => {
		const routed = route({ oembed: () => new Promise<Response>(() => {}) });
		const external = new AbortController();
		const engine = createEnrichmentEngine({ plugins: [keyless(routed.fetch)] });
		const pending = engine
			.enrich({ ...requestFor('track', TRACK_ID), timeoutMs: 5000 }, { signal: external.signal })
			.catch((error: unknown) => error);
		await sleep(60);
		external.abort(new Error('user left'));
		await pending;
		await sleep(20);
		expect(tuples()).toEqual([]);
	});
});

describe('Spotify enrichment observer: the token failure is logged as a token failure', () => {
	test('an invalid_client token behind an item lookup logs auth_failed, not http_4xx', async () => {
		const { fetch } = route({
			token: () => Response.json({ error: 'invalid_client' }, { status: 400 }),
		});
		const { logger, warnings } = loggerSpy();
		await plugin(fetch).enrich(requestFor('track', TRACK_ID), createMockPluginContext({ logger }));
		expect(tuples()[0]).toEqual(tuple('token', 'error', 'auth_failed'));
		expect(warnings[0]?.fields).toMatchObject({ reason: 'auth_failed', status: 400 });
	});

	test('the same behind an ISRC search', async () => {
		const { fetch } = route({
			token: () => Response.json({ error: 'invalid_client' }, { status: 400 }),
		});
		const { logger, warnings } = loggerSpy();
		await plugin(fetch).enrich(isrcRequest(), createMockPluginContext({ logger }));
		expect(warnings[0]?.fields).toEqual({ reason: 'auth_failed', status: 400 });
	});
});

describe('Spotify enrichment observer: the engine artifact cache', () => {
	const cacheTuples = () =>
		requests()
			.filter((event) => event.source === 'cache')
			.map(({ operation, outcome, reason }) => ({ operation, outcome, reason }));

	async function enrichTwice(
		spotify: ReturnType<typeof plugin>,
		request: ReturnType<typeof requestFor>
	) {
		const engine = createEnrichmentEngine({
			cache: createMemoryCacheAdapter(),
			plugins: [spotify],
		});
		await engine.enrich(request);
		const live = tuples();
		const second = await engine.enrich(request);
		return { live, second };
	}

	test('a cached lookup run is one source=cache item hit and dials nothing', async () => {
		const routed = route({ item: () => Response.json(trackFixture.single) });
		const { live, second } = await enrichTwice(plugin(routed.fetch), requestFor('track', TRACK_ID));
		expect(live).toEqual([tuple('token', 'hit'), tuple('item', 'hit')]);
		expect(second.timings.cacheHits).toBe(1);
		expect(routed.count('spotify.com')).toBe(2);
		expect(cacheTuples()).toEqual([{ operation: 'item', outcome: 'hit', reason: 'none' }]);
	});

	test('a cached ISRC run is an isrc_search hit; a cached empty search is a miss', async () => {
		const hit = route({
			search: () => Response.json({ tracks: { items: [trackFixture.single] } }),
		});
		await enrichTwice(plugin(hit.fetch), isrcRequest());
		expect(cacheTuples()).toEqual([{ operation: 'isrc_search', outcome: 'hit', reason: 'none' }]);

		events = [];
		const empty = route({ search: () => Response.json({ tracks: { items: [] } }) });
		await enrichTwice(plugin(empty.fetch), isrcRequest());
		expect(cacheTuples()).toEqual([{ operation: 'isrc_search', outcome: 'miss', reason: 'none' }]);
	});

	test('without credentials the cached run is an oembed hit', async () => {
		const routed = route({});
		await enrichTwice(createSpotifyPlugin({ fetch: routed.fetch }), requestFor('track', TRACK_ID));
		expect(cacheTuples()).toEqual([{ operation: 'oembed', outcome: 'hit', reason: 'none' }]);
	});

	test('a request the plugin does not support records no cache event', async () => {
		const routed = route({});
		const unrelated = createMockRequest({
			input: createMockAtomInput({ hints: { url: 'https://example.com/page' } }),
		});
		await enrichTwice(plugin(routed.fetch), unrelated);
		expect(cacheTuples()).toEqual([]);
	});
});
