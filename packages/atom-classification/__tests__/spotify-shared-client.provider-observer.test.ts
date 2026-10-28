import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
	createPinAwareFetch,
	createSpotifyPlugin as createSpotifyEnrichmentPlugin,
} from '@0xintuition/atom-enrichment/providers';
import {
	createMockAtomInput,
	createMockPluginContext,
	createMockRequest,
	useStubbedPublicDns,
} from '@0xintuition/atom-enrichment/testing';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderReason,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';

import { createClassificationEngine } from '../src/engine';
import {
	createSpotifyDomainApiAdapter,
	createSpotifyPlugin,
	createV0TypeProfilesPlugin,
} from '../src/plugins/index';

// The shared provider hop resolves every target before it dials; no network is used.
useStubbedPublicDns();

const TRACK_ID = '4iV5W9uYEdYUVa79Axb7Rh';
const SHOW_ID = '38bS44xjbVVZ3No3ByF1dJ';
const TRACK_URL = `https://open.spotify.com/track/${TRACK_ID}`;
const trackPayload = {
	id: TRACK_ID,
	name: 'Resolved track',
	external_urls: { spotify: TRACK_URL },
	external_ids: { isrc: 'USQX91300108' },
	artists: [{ id: 'artistFixture123456789', name: 'An Artist' }],
	album: { name: 'An Album', images: [{ url: 'https://i.scdn.co/album.jpg' }] },
};

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

type Handler = (url: string, init?: RequestInit) => Response | Promise<Response>;

function route(handlers: { token?: Handler; item?: Handler }) {
	const urls: string[] = [];
	const signals: Array<AbortSignal | null | undefined> = [];
	const fetch = createPinAwareFetch(async (input: string, init?: RequestInit) => {
		urls.push(input);
		signals.push(init?.signal);
		const handler =
			new URL(input).hostname === 'accounts.spotify.com'
				? (handlers.token ??
					(() => Response.json({ access_token: 'fake-access-token', expires_in: 3600 })))
				: handlers.item;
		if (!handler) throw new Error(`unexpected request: ${input}`);
		return await handler(input, init);
	});
	return {
		fetch,
		urls,
		signals,
		count: (host: string) => urls.filter((url) => url.includes(host)).length,
	};
}

let seq = 0;
function credentials() {
	seq += 1;
	return { clientId: `shared-client-${seq}`, clientSecret: `shared-secret-${seq}` };
}

function classificationEngine(
	fetch: ReturnType<typeof route>['fetch'],
	creds: ReturnType<typeof credentials>,
	extra: { market?: string; resolverTimeoutMs?: number } = {}
) {
	return createClassificationEngine({
		onClassifierError: () => undefined,
		runtime: 'server',
		...(extra.resolverTimeoutMs ? { resolverTimeoutMs: extra.resolverTimeoutMs } : {}),
		plugins: [
			createV0TypeProfilesPlugin(),
			createSpotifyPlugin({
				credentials: { spotify: creds },
				adapters: {
					domainApi: createSpotifyDomainApiAdapter({
						...creds,
						...(extra.market ? { market: extra.market } : {}),
						fetch,
					}),
				},
			}),
		],
	});
}

function enrichmentRequest(url: string) {
	return createMockRequest({ input: createMockAtomInput({ hints: { url } }) });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Spotify shared client: one token per process for classification and enrichment', () => {
	it('classifying then enriching the same paste mints the token once', async () => {
		const creds = credentials();
		const routed = route({ item: () => Response.json(trackPayload) });
		const classified = await classificationEngine(routed.fetch, creds).classify({
			input: TRACK_URL,
			mode: 'progressive',
		});
		const artifacts = await createSpotifyEnrichmentPlugin({
			...creds,
			fetch: routed.fetch,
		}).enrich(enrichmentRequest(TRACK_URL), createMockPluginContext());

		expect(classified.resolved?.atoms[0]?.source).toBe('platform-v0:domain-api');
		expect(artifacts[0]?.meta.provider).toBe('spotify-web-api');
		expect(routed.count('accounts.spotify.com')).toBe(1);
		expect(routed.count('api.spotify.com')).toBe(2);
		// The classification lookup, then the enrichment lookup, each under its own operation;
		// the token was minted exactly once.
		expect(tuples()).toEqual([
			tuple('token', 'hit'),
			tuple('classify_item', 'hit'),
			tuple('item', 'hit'),
		]);
	});

	it('enriching first and classifying second also shares the token', async () => {
		const creds = credentials();
		const routed = route({ item: () => Response.json(trackPayload) });
		await createSpotifyEnrichmentPlugin({ ...creds, fetch: routed.fetch }).enrich(
			enrichmentRequest(TRACK_URL),
			createMockPluginContext()
		);
		await classificationEngine(routed.fetch, creds).classify({
			input: TRACK_URL,
			mode: 'progressive',
		});
		expect(routed.count('accounts.spotify.com')).toBe(1);
		expect(tuples()).toEqual([
			tuple('token', 'hit'),
			tuple('item', 'hit'),
			tuple('classify_item', 'hit'),
		]);
	});

	it('a different credential pair does not borrow the cached token', async () => {
		const first = credentials();
		const second = credentials();
		const routed = route({ item: () => Response.json(trackPayload) });
		await classificationEngine(routed.fetch, first).classify({
			input: TRACK_URL,
			mode: 'progressive',
		});
		await classificationEngine(routed.fetch, second).classify({
			input: TRACK_URL,
			mode: 'progressive',
		});
		expect(routed.count('accounts.spotify.com')).toBe(2);
	});

	it('a 401 from the item refreshes the token for the next caller too', async () => {
		const creds = credentials();
		let tokens = 0;
		let items = 0;
		const routed = route({
			token: () => Response.json({ access_token: `token-${++tokens}`, expires_in: 3600 }),
			item: (_url, init) => {
				items += 1;
				const authorization = new Headers(init?.headers).get('authorization');
				return authorization === 'Bearer token-1'
					? new Response('expired', { status: 401 })
					: Response.json(trackPayload);
			},
		});
		const classified = await classificationEngine(routed.fetch, creds).classify({
			input: TRACK_URL,
			mode: 'progressive',
		});
		expect(classified.resolved?.atoms[0]?.source).toBe('platform-v0:domain-api');
		expect(tuples()).toEqual([
			tuple('token', 'hit'),
			tuple('classify_item', 'error', 'auth_failed'),
			tuple('token', 'hit'),
			tuple('classify_item', 'hit'),
		]);
		// Enrichment now reuses the refreshed token: no third mint, and no stale token.
		await createSpotifyEnrichmentPlugin({ ...creds, fetch: routed.fetch }).enrich(
			enrichmentRequest(TRACK_URL),
			createMockPluginContext()
		);
		expect(tokens).toBe(2);
		expect(items).toBe(3);
	});
});

describe('Spotify shared client: classification honours the resolver signal', () => {
	it('records a resolver timeout of the item lookup as a timeout, and aborts the request', async () => {
		const creds = credentials();
		let aborted = false;
		const routed = route({
			item: (_url, init) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => {
						aborted = true;
						reject(new DOMException('aborted', 'AbortError'));
					});
				}),
		});
		const engine = classificationEngine(routed.fetch, creds, { resolverTimeoutMs: 120 });
		const result = await engine.classify({ input: TRACK_URL, mode: 'progressive' });
		await sleep(30);

		// Nothing is left running past the resolver timeout.
		expect(aborted).toBe(true);
		expect(routed.signals.at(-1)?.aborted).toBe(true);
		// The resolver deadline is the provider's timeout: exactly one item timeout, after the
		// token that was minted.
		expect(tuples()).toEqual([tuple('token', 'hit'), tuple('classify_item', 'error', 'timeout')]);
		// The paste still classifies (the generic tier), as before.
		expect(result.resolved?.atoms[0]?.source).not.toBe('platform-v0:domain-api');
	});

	it('an outer caller cancel of the same hung item lookup records nothing for the item', async () => {
		const creds = credentials();
		const routed = route({ item: () => new Promise<Response>(() => {}) });
		const outer = new AbortController();
		const pending = classificationEngine(routed.fetch, creds, { resolverTimeoutMs: 5000 })
			.classify({ input: TRACK_URL, mode: 'progressive' }, { signal: outer.signal })
			.catch((error: unknown) => error);
		await sleep(80);
		outer.abort(new Error('caller left'));
		await pending;
		await sleep(30);
		expect(tuples()).toEqual([tuple('token', 'hit')]);
	});

	it('aborts a hung token request the same way and records its timeout', async () => {
		const creds = credentials();
		let aborted = false;
		const routed = route({
			token: (_url, init) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => {
						aborted = true;
						reject(new DOMException('aborted', 'AbortError'));
					});
				}),
		});
		await classificationEngine(routed.fetch, creds, { resolverTimeoutMs: 120 }).classify({
			input: TRACK_URL,
			mode: 'progressive',
		});
		await sleep(30);
		expect(aborted).toBe(true);
		expect(routed.count('api.spotify.com')).toBe(0);
		// The resolver deadline is the provider's timeout, here for the token request.
		expect(tuples()).toEqual([tuple('token', 'error', 'timeout')]);
	});

	it('hands the transport a signal at all (the old adapter passed none)', async () => {
		const creds = credentials();
		const routed = route({ item: () => Response.json(trackPayload) });
		await classificationEngine(routed.fetch, creds).classify({
			input: TRACK_URL,
			mode: 'progressive',
		});
		expect(routed.signals).toHaveLength(2);
		for (const signal of routed.signals) {
			expect(signal).toBeInstanceOf(AbortSignal);
		}
	});
});

describe('Spotify shared client: classification requests', () => {
	it('defaults show and episode to market=US and keeps a configured market', async () => {
		const creds = credentials();
		const showRoute = route({ item: () => Response.json({ id: SHOW_ID, name: 'A Show' }) });
		await classificationEngine(showRoute.fetch, creds).classify({
			input: `https://open.spotify.com/show/${SHOW_ID}`,
			mode: 'progressive',
		});
		expect(showRoute.urls.find((url) => url.includes('/v1/shows/'))).toBe(
			`https://api.spotify.com/v1/shows/${SHOW_ID}?market=US`
		);
		const episodeRoute = route({ item: () => Response.json({ id: SHOW_ID, name: 'An Episode' }) });
		await classificationEngine(episodeRoute.fetch, creds).classify({
			input: `https://open.spotify.com/episode/${SHOW_ID}`,
			mode: 'progressive',
		});
		expect(episodeRoute.urls.find((url) => url.includes('/v1/episodes/'))).toBe(
			`https://api.spotify.com/v1/episodes/${SHOW_ID}?market=US`
		);
		const trackRoute = route({ item: () => Response.json(trackPayload) });
		await classificationEngine(trackRoute.fetch, creds, { market: 'DE' }).classify({
			input: TRACK_URL,
			mode: 'progressive',
		});
		expect(trackRoute.urls.find((url) => url.includes('/v1/tracks/'))).toBe(
			`https://api.spotify.com/v1/tracks/${TRACK_ID}?market=DE`
		);
		const bareTrack = route({ item: () => Response.json(trackPayload) });
		await classificationEngine(bareTrack.fetch, creds).classify({
			input: TRACK_URL,
			mode: 'progressive',
		});
		expect(bareTrack.urls.find((url) => url.includes('/v1/tracks/'))).toBe(
			`https://api.spotify.com/v1/tracks/${TRACK_ID}`
		);
	});

	const itemCases: Array<[string, Handler, ReturnType<typeof tuple>]> = [
		['404', () => new Response('{}', { status: 404 }), tuple('classify_item', 'miss')],
		[
			'403',
			() => new Response('{}', { status: 403 }),
			tuple('classify_item', 'error', 'auth_failed'),
		],
		[
			'429',
			() => new Response('{}', { status: 429, headers: { 'retry-after': '5' } }),
			tuple('classify_item', 'error', 'rate_limited'),
		],
		[
			'500',
			() => new Response('{}', { status: 500 }),
			tuple('classify_item', 'error', 'upstream_5xx'),
		],
		['non-JSON', () => new Response('<html>'), tuple('classify_item', 'error', 'invalid_response')],
		[
			'non-object JSON',
			() => Response.json([1, 2]),
			tuple('classify_item', 'error', 'invalid_response'),
		],
	];
	for (const [name, item, expected] of itemCases) {
		it(`an item ${name} is recorded with its real reason and the paste still classifies`, async () => {
			const routed = route({ item });
			const result = await classificationEngine(routed.fetch, credentials()).classify({
				input: TRACK_URL,
				mode: 'progressive',
			});
			expect(tuples()).toEqual([tuple('token', 'hit'), expected]);
			// The domain-api stage failed: the atom comes from a later tier.
			expect(result.resolved?.atoms[0]?.source).not.toBe('platform-v0:domain-api');
			expect(result.resolved?.atoms[0]?.title).toBeTruthy();
		});
	}

	it('the stage error is a typed diagnostic with the HTTP status, not Spotify message text', async () => {
		const routed = route({ item: () => new Response('{}', { status: 404 }) });
		const engine = classificationEngine(routed.fetch, credentials());
		await engine.classify({ input: TRACK_URL, mode: 'progressive' });
		const stageErrors = (engine.getLastMetadata().platformResolver as { stageErrors?: string[] })
			?.stageErrors;
		expect(stageErrors).toEqual(['domain-api:non_ok_status: HTTP 404']);
		expect(JSON.stringify(stageErrors)).not.toContain('Spotify');
	});

	it('a failed fetch is a network error on classify_item, and the paste still classifies', async () => {
		const routed = route({
			item: () => {
				throw new TypeError('fetch failed');
			},
		});
		const result = await classificationEngine(routed.fetch, credentials()).classify({
			input: TRACK_URL,
			mode: 'progressive',
		});
		expect(tuples()).toEqual([tuple('token', 'hit'), tuple('classify_item', 'error', 'network')]);
		expect(result.resolved?.atoms[0]?.source).not.toBe('platform-v0:domain-api');
	});

	const tokenCases: Array<[string, Handler, ReturnType<typeof tuple>]> = [
		[
			'400 invalid_client',
			() => Response.json({ error: 'invalid_client' }, { status: 400 }),
			tuple('token', 'error', 'auth_failed'),
		],
		[
			'400 unsupported_grant_type',
			() => Response.json({ error: 'unsupported_grant_type' }, { status: 400 }),
			tuple('token', 'error', 'http_4xx'),
		],
		['401', () => new Response('{}', { status: 401 }), tuple('token', 'error', 'auth_failed')],
		['503', () => new Response('{}', { status: 503 }), tuple('token', 'error', 'upstream_5xx')],
	];
	for (const [name, token, expected] of tokenCases) {
		it(`a token ${name} is recorded and no item is requested`, async () => {
			const routed = route({ token });
			await classificationEngine(routed.fetch, credentials()).classify({
				input: TRACK_URL,
				mode: 'progressive',
			});
			expect(tuples()).toEqual([expected]);
			expect(routed.count('api.spotify.com')).toBe(0);
			// A token-endpoint 401 means bad credentials: it is never retried.
			expect(routed.count('accounts.spotify.com')).toBe(1);
		});
	}

	it('without credentials the adapter makes no request and records nothing', async () => {
		const routed = route({ item: () => Response.json(trackPayload) });
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createSpotifyPlugin({
					adapters: { domainApi: createSpotifyDomainApiAdapter({ fetch: routed.fetch }) },
				}),
			],
		});
		await engine.classify({ input: TRACK_URL, mode: 'progressive' });
		expect(routed.urls).toEqual([]);
		expect(tuples()).toEqual([]);
	});
});
