import { afterEach, beforeEach, describe, expect, spyOn, test } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';

import { useStubbedPublicDns } from '../../../testing';
import { createPinAwareFetch, type FetchLike } from '../__shared__/http';
import {
	describeSpotifyFailure,
	readSpotifyAccessToken,
	spotifyApiGetJson,
	spotifyLooseObjectSchema,
	spotifyTransportKey,
} from './client';

useStubbedPublicDns();

let events: ProviderEvent[];
beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

describe('spotifyTransportKey', () => {
	test('every fetcher the shared hop ignores dials the one pinned transport, so they share a key', () => {
		const first: FetchLike = async () => new Response('');
		const second: FetchLike = async () => new Response('');
		expect(spotifyTransportKey(first)).toBe(spotifyTransportKey(second));
		expect(spotifyTransportKey(first)).toBe(spotifyTransportKey(globalThis.fetch as FetchLike));
	});

	test('a pin-aware fetcher is its own transport', () => {
		const first = createPinAwareFetch(async () => new Response(''));
		const second = createPinAwareFetch(async () => new Response(''));
		expect(spotifyTransportKey(first)).toBe(first);
		expect(spotifyTransportKey(first)).not.toBe(spotifyTransportKey(second));
		expect(spotifyTransportKey(first)).not.toBe(spotifyTransportKey(async () => new Response('')));
	});
});

describe('readSpotifyAccessToken (the accessor other Spotify callers use)', () => {
	function tokenFetch() {
		let mints = 0;
		const fetch = createPinAwareFetch(async () => {
			mints += 1;
			return Response.json({ access_token: `token-${mints}`, expires_in: 3600 });
		});
		return { fetch, mints: () => mints };
	}

	test('returns the cached token for the same credentials and mints once', async () => {
		const { fetch, mints } = tokenFetch();
		expect(await readSpotifyAccessToken(fetch, 'acc-id', 'acc-secret')).toBe('token-1');
		expect(await readSpotifyAccessToken(fetch, 'acc-id', 'acc-secret')).toBe('token-1');
		expect(mints()).toBe(1);
	});

	test('different credentials mint separately, and forceRefresh mints a new token', async () => {
		const { fetch, mints } = tokenFetch();
		await readSpotifyAccessToken(fetch, 'acc-id', 'acc-secret');
		expect(await readSpotifyAccessToken(fetch, 'acc-id', 'other-secret')).toBe('token-2');
		expect(
			await readSpotifyAccessToken(fetch, 'acc-id', 'acc-secret', undefined, { forceRefresh: true })
		).toBe('token-3');
		expect(mints()).toBe(3);
	});

	test('is unobserved unless the caller passes an observation context', async () => {
		const { fetch } = tokenFetch();
		await readSpotifyAccessToken(fetch, 'acc-id', 'acc-secret');
		expect(events).toEqual([]);
		await readSpotifyAccessToken(fetch, 'acc-id', 'acc-secret', undefined, {
			forceRefresh: true,
			observation: {},
		});
		expect(events).toMatchObject([
			{ type: 'provider_request', provider: 'spotify', operation: 'token', outcome: 'hit' },
		]);
	});

	test('a refused token request rejects with a structured ProviderHttpError', async () => {
		const fetch = createPinAwareFetch(async () =>
			Response.json({ error: 'invalid_client' }, { status: 400 })
		);
		const error = await readSpotifyAccessToken(fetch, 'acc-id', 'acc-secret').catch((e) => e);
		expect(error).toMatchObject({
			name: 'ProviderHttpError',
			status: 400,
			errorCode: 'invalid_client',
		});
	});

	test('a failed token request that is not a refusal caches nothing: the next call mints', async () => {
		let calls = 0;
		const fetch = createPinAwareFetch(async () => {
			calls += 1;
			return calls === 1
				? new Response('{}', { status: 503 })
				: Response.json({ access_token: 'late-token', expires_in: 3600 });
		});
		await readSpotifyAccessToken(fetch, 'acc-id-503', 'acc-secret').catch(() => undefined);
		expect(await readSpotifyAccessToken(fetch, 'acc-id-503', 'acc-secret')).toBe('late-token');
	});
});

describe('credentials never follow a redirect', () => {
	function redirecting(host: 'accounts.spotify.com' | 'api.spotify.com') {
		const dials: Array<{ url: string; authorization: string | null }> = [];
		const fetch = createPinAwareFetch(async (input: string, init?: RequestInit) => {
			dials.push({ url: input, authorization: new Headers(init?.headers).get('authorization') });
			const { hostname } = new URL(input);
			if (hostname === host) {
				return new Response(null, {
					status: 302,
					headers: { location: 'https://evil.example/steal' },
				});
			}
			if (hostname === 'accounts.spotify.com') {
				return Response.json({ access_token: 'fake-access-token', expires_in: 3600 });
			}
			return Response.json({});
		});
		return { fetch, dials };
	}

	test('a token endpoint that redirects is refused: evil.example is never dialled with Basic auth', async () => {
		const { fetch, dials } = redirecting('accounts.spotify.com');
		const error = await readSpotifyAccessToken(fetch, 'redir-id', 'redir-secret').catch((e) => e);
		expect(error).toMatchObject({ name: 'ProviderHttpError', errorClass: 'redirect_rejected' });
		expect(dials.map((dial) => new URL(dial.url).hostname)).toEqual(['accounts.spotify.com']);
		expect(dials.some((dial) => dial.url.includes('evil.example'))).toBe(false);
	});

	test('an API endpoint that redirects is refused: evil.example is never dialled with the bearer token', async () => {
		const { fetch, dials } = redirecting('api.spotify.com');
		const error = await spotifyApiGetJson({
			fetch,
			clientId: 'redir-api-id',
			clientSecret: 'redir-api-secret',
			url: 'https://api.spotify.com/v1/tracks/abc',
			schema: spotifyLooseObjectSchema,
		}).catch((e) => e);
		expect(error).toMatchObject({ name: 'ProviderHttpError', errorClass: 'redirect_rejected' });
		expect(dials.map((dial) => new URL(dial.url).hostname)).toEqual([
			'accounts.spotify.com',
			'api.spotify.com',
		]);
		expect(dials.some((dial) => dial.url.includes('evil.example'))).toBe(false);
	});
});

describe('the 401 refresh reuses a newer token', () => {
	test('a token another caller refreshed meanwhile is used instead of minting a third', async () => {
		let mints = 0;
		const authorizations: string[] = [];
		const fetch = createPinAwareFetch(async (input: string, init?: RequestInit) => {
			if (new URL(input).hostname === 'accounts.spotify.com') {
				mints += 1;
				return Response.json({ access_token: `reuse-token-${mints}`, expires_in: 3600 });
			}
			const authorization = new Headers(init?.headers).get('authorization') ?? '';
			authorizations.push(authorization);
			if (authorizations.length === 1) {
				// While this request is in flight another caller notices the same expiry and
				// refreshes the shared token.
				await readSpotifyAccessToken(fetch, 'reuse-id', 'reuse-secret', undefined, {
					forceRefresh: true,
				});
				return new Response('expired', { status: 401 });
			}
			return Response.json({});
		});
		await spotifyApiGetJson({
			fetch,
			clientId: 'reuse-id',
			clientSecret: 'reuse-secret',
			url: 'https://api.spotify.com/v1/tracks/abc',
			schema: spotifyLooseObjectSchema,
		});
		expect(authorizations).toEqual(['Bearer reuse-token-1', 'Bearer reuse-token-2']);
		expect(mints).toBe(2);
	});

	test('when the cached token is still the rejected one the retry mints a fresh one', async () => {
		let mints = 0;
		const authorizations: string[] = [];
		const fetch = createPinAwareFetch(async (input: string, init?: RequestInit) => {
			if (new URL(input).hostname === 'accounts.spotify.com') {
				mints += 1;
				return Response.json({ access_token: `stale-token-${mints}`, expires_in: 3600 });
			}
			authorizations.push(new Headers(init?.headers).get('authorization') ?? '');
			return authorizations.length === 1
				? new Response('expired', { status: 401 })
				: Response.json({});
		});
		await spotifyApiGetJson({
			fetch,
			clientId: 'stale-id',
			clientSecret: 'stale-secret',
			url: 'https://api.spotify.com/v1/tracks/abc',
			schema: spotifyLooseObjectSchema,
		});
		expect(authorizations).toEqual(['Bearer stale-token-1', 'Bearer stale-token-2']);
		expect(mints).toBe(2);
	});
});

describe('refused credentials are negatively cached', () => {
	const NEGATIVE_CACHE_MS = 30_000;
	let now: ReturnType<typeof spyOn>;
	let clock: number;
	beforeEach(() => {
		clock = 1_700_000_000_000;
		now = spyOn(Date, 'now').mockImplementation(() => clock);
	});
	afterEach(() => now.mockRestore());

	function tokenEndpoint(status: number, body: unknown) {
		let dials = 0;
		const fetch = createPinAwareFetch(async () => {
			dials += 1;
			return status === 200 ? Response.json(body) : new Response(JSON.stringify(body), { status });
		});
		return { fetch, dials: () => dials };
	}

	test('a refused client is not asked again for 30 s, then it is', async () => {
		const { fetch, dials } = tokenEndpoint(400, { error: 'invalid_client' });
		const first = await readSpotifyAccessToken(fetch, 'neg-id', 'neg-secret').catch((e) => e);
		expect(first).toMatchObject({ status: 400, errorCode: 'invalid_client' });
		clock += NEGATIVE_CACHE_MS - 1;
		const second = await readSpotifyAccessToken(fetch, 'neg-id', 'neg-secret').catch((e) => e);
		expect(second).toBe(first);
		expect(dials()).toBe(1);
		clock += 2;
		await readSpotifyAccessToken(fetch, 'neg-id', 'neg-secret').catch(() => undefined);
		expect(dials()).toBe(2);
	});

	test('only a refusal is cached: a 503 or a 429 is retried at once', async () => {
		for (const status of [503, 429]) {
			const { fetch, dials } = tokenEndpoint(status, {});
			await readSpotifyAccessToken(fetch, `neg-${status}`, 'secret').catch(() => undefined);
			await readSpotifyAccessToken(fetch, `neg-${status}`, 'secret').catch(() => undefined);
			expect(dials()).toBe(2);
		}
	});

	test('a refusal is per credential pair', async () => {
		const { fetch, dials } = tokenEndpoint(400, { error: 'invalid_client' });
		await readSpotifyAccessToken(fetch, 'neg-a', 'secret').catch(() => undefined);
		await readSpotifyAccessToken(fetch, 'neg-b', 'secret').catch(() => undefined);
		expect(dials()).toBe(2);
	});

	test('the repeat records no token event', async () => {
		const { fetch } = tokenEndpoint(401, { error: 'invalid_client' });
		const observation = { deadlineAtMs: undefined };
		await readSpotifyAccessToken(fetch, 'neg-ev', 'secret', undefined, { observation }).catch(
			() => undefined
		);
		await readSpotifyAccessToken(fetch, 'neg-ev', 'secret', undefined, { observation }).catch(
			() => undefined
		);
		expect(events.filter((e) => e.type === 'provider_request')).toHaveLength(1);
	});
});

describe('token lifetime', () => {
	let now: ReturnType<typeof spyOn>;
	let clock: number;
	beforeEach(() => {
		clock = 1_700_000_000_000;
		now = spyOn(Date, 'now').mockImplementation(() => clock);
	});
	afterEach(() => now.mockRestore());

	function mintCounter(expiresIn: number) {
		let mints = 0;
		const fetch = createPinAwareFetch(async () => {
			mints += 1;
			return Response.json({ access_token: `ttl-token-${mints}`, expires_in: expiresIn });
		});
		return { fetch, mints: () => mints };
	}

	test('a 40 s token is cached for half its life instead of never', async () => {
		const { fetch, mints } = mintCounter(40);
		await readSpotifyAccessToken(fetch, 'ttl-short', 'secret');
		clock += 19_000;
		await readSpotifyAccessToken(fetch, 'ttl-short', 'secret');
		expect(mints()).toBe(1);
		clock += 2_000;
		await readSpotifyAccessToken(fetch, 'ttl-short', 'secret');
		expect(mints()).toBe(2);
	});

	test('a one-hour token keeps the full 60 s margin', async () => {
		const { fetch, mints } = mintCounter(3600);
		await readSpotifyAccessToken(fetch, 'ttl-long', 'secret');
		clock += 3_539_000;
		await readSpotifyAccessToken(fetch, 'ttl-long', 'secret');
		expect(mints()).toBe(1);
		clock += 2_000;
		await readSpotifyAccessToken(fetch, 'ttl-long', 'secret');
		expect(mints()).toBe(2);
	});

	test('a token that expires immediately is never served from the cache', async () => {
		const { fetch, mints } = mintCounter(0);
		await readSpotifyAccessToken(fetch, 'ttl-zero', 'secret');
		await readSpotifyAccessToken(fetch, 'ttl-zero', 'secret');
		expect(mints()).toBe(2);
	});
});

describe('describeSpotifyFailure', () => {
	test('a token failure behind an API request is described as a token failure', async () => {
		const fetch = createPinAwareFetch(async () =>
			Response.json({ error: 'invalid_client' }, { status: 400 })
		);
		const error = await spotifyApiGetJson({
			fetch,
			clientId: 'desc-id',
			clientSecret: 'desc-secret',
			url: 'https://api.spotify.com/v1/tracks/abc',
			schema: spotifyLooseObjectSchema,
		}).catch((e) => e);
		expect(describeSpotifyFailure(error)).toEqual({ reason: 'auth_failed', status: 400 });
	});

	test('a plain API 400 stays http_4xx', async () => {
		const fetch = createPinAwareFetch(async (input: string) =>
			new URL(input).hostname === 'accounts.spotify.com'
				? Response.json({ access_token: 'desc-token', expires_in: 3600 })
				: new Response('{}', { status: 400 })
		);
		const error = await spotifyApiGetJson({
			fetch,
			clientId: 'desc-id-2',
			clientSecret: 'desc-secret',
			url: 'https://api.spotify.com/v1/tracks/abc',
			schema: spotifyLooseObjectSchema,
		}).catch((e) => e);
		expect(describeSpotifyFailure(error)).toEqual({ reason: 'http_4xx', status: 400 });
	});
});

describe('a throwing outcomeOf (ENG-17014: pins the behaviour of the shared helper)', () => {
	test('records a hit and returns the value instead of failing the request', async () => {
		const fetch = createPinAwareFetch(async (url) =>
			url.includes('/api/token')
				? Response.json({ access_token: 'outcome-token', expires_in: 3600 })
				: Response.json({ items: [] })
		);
		const value = await spotifyApiGetJson({
			fetch,
			clientId: 'outcome-id',
			clientSecret: 'outcome-secret',
			url: 'https://api.spotify.com/v1/search?q=isrc',
			schema: spotifyLooseObjectSchema,
			operation: 'classify_item',
			outcomeOf: () => {
				throw new Error('outcomeOf blew up');
			},
		});
		expect(value).toEqual({ items: [] });
		const requests = events.filter((event) => event.type === 'provider_request');
		expect(requests.map((event) => [event.operation, event.outcome])).toContainEqual([
			'classify_item',
			'hit',
		]);
		expect(
			requests.some((event) => event.operation === 'classify_item' && event.outcome === 'error')
		).toBe(false);
	});
});
