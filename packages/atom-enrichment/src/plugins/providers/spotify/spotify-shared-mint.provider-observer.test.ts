import { afterEach, beforeEach, expect, test } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import {
	createMockAtomInput,
	createMockPluginContext,
	createMockRequest,
	useStubbedPublicDns,
} from '../../../testing';
import { createPinAwareFetch } from '../__shared__/http';
import trackFixture from './__fixtures__/track.json';
import { readSpotifyAccessToken } from './client';
import { createSpotifyPlugin } from './index';

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
const tokenEvents = () =>
	events.filter((e) => e.type === 'provider_request' && e.operation === 'token');

const req = () =>
	createMockRequest({
		input: createMockAtomInput({
			hints: { url: `https://open.spotify.com/track/${trackFixture.single.id}` },
		}),
	});

test('caller A cancelling a shared in-flight token mint must not fail caller B', async () => {
	let release: (() => void) | undefined;
	const fetch = createPinAwareFetch(async (input: string, init?: RequestInit) => {
		const { hostname } = new URL(input);
		if (hostname === 'accounts.spotify.com') {
			return await new Promise<Response>((resolve, reject) => {
				init?.signal?.addEventListener('abort', () =>
					reject(new DOMException('aborted', 'AbortError'))
				);
				release = () => resolve(Response.json({ access_token: 't', expires_in: 3600 }));
			});
		}
		if (hostname === 'open.spotify.com') return Response.json({ title: 'oembed' });
		return Response.json(trackFixture.single);
	});
	const plugin = createSpotifyPlugin({ clientId: 'probe-a', clientSecret: 'probe-b', fetch });
	const a = new AbortController();
	const pa = plugin.enrich(req(), createMockPluginContext({ signal: a.signal })).catch((e) => e);
	await new Promise((r) => setTimeout(r, 10));
	const pb = plugin.enrich(req(), createMockPluginContext());
	await new Promise((r) => setTimeout(r, 10));
	a.abort(new Error('user left'));
	setTimeout(() => release?.(), 10);
	await pa;
	const b = await pb;
	expect(b[0]?.meta.provider).toBe('spotify-web-api');
	// B's token request is recorded once, as a hit: A's cancel neither fails nor hides it.
	expect(tokenEvents()).toMatchObject([{ outcome: 'hit', reason: 'none' }]);
	expect(tokenEvents()).toHaveLength(1);
});

/** A token endpoint that hangs until released and reports whether its request was aborted. */
function hangingMint() {
	const state = { dials: 0, aborted: false, release: () => {} };
	const fetch = createPinAwareFetch(async (_input: string, init?: RequestInit) => {
		state.dials += 1;
		return await new Promise<Response>((resolve, reject) => {
			init?.signal?.addEventListener('abort', () => {
				state.aborted = true;
				reject(new DOMException('aborted', 'AbortError'));
			});
			state.release = () => resolve(Response.json({ access_token: 'late', expires_in: 3600 }));
		});
	});
	return { fetch, state };
}

test('the mint is aborted only once every waiter has left, and a cancel is not a timeout', async () => {
	const { fetch, state } = hangingMint();
	const a = new AbortController();
	const b = new AbortController();
	const pa = readSpotifyAccessToken(fetch, 'mint-all-a', 'mint-all-b', a.signal, {
		observation: { signal: a.signal },
	}).catch((e) => e);
	const pb = readSpotifyAccessToken(fetch, 'mint-all-a', 'mint-all-b', b.signal, {
		observation: { signal: b.signal },
	}).catch((e) => e);
	await new Promise((r) => setTimeout(r, 10));
	expect(state.dials).toBe(1);
	a.abort(new Error('a left'));
	await new Promise((r) => setTimeout(r, 10));
	expect(state.aborted).toBe(false);
	b.abort(new Error('b left'));
	await Promise.all([pa, pb]);
	await new Promise((r) => setTimeout(r, 10));
	expect(state.aborted).toBe(true);
	expect(tokenEvents()).toEqual([]);
	// The abandoned mint leaves nothing behind: the next caller mints afresh.
	const next = readSpotifyAccessToken(fetch, 'mint-all-a', 'mint-all-b');
	await new Promise((r) => setTimeout(r, 10));
	expect(state.dials).toBe(2);
	state.release();
	expect(await next).toBe('late');
});

test('each waiter leaves with its own abort reason', async () => {
	const { fetch } = hangingMint();
	const a = new AbortController();
	const pa = readSpotifyAccessToken(fetch, 'mint-reason-a', 'mint-reason-b', a.signal).catch(
		(e) => e
	);
	const reason = new Error('a-specific reason');
	a.abort(reason);
	expect(await pa).toBe(reason);
	await readSpotifyAccessToken(fetch, 'mint-reason-a', 'mint-reason-b', AbortSignal.abort()).catch(
		() => undefined
	);
});

test('a mint started by an unobserved caller is recorded when an observed caller waits on it', async () => {
	const { fetch, state } = hangingMint();
	const starter = readSpotifyAccessToken(fetch, 'mint-obs-a', 'mint-obs-b');
	await new Promise((r) => setTimeout(r, 10));
	const joiner = readSpotifyAccessToken(fetch, 'mint-obs-a', 'mint-obs-b', undefined, {
		observation: {},
	});
	await new Promise((r) => setTimeout(r, 10));
	state.release();
	await Promise.all([starter, joiner]);
	expect(state.dials).toBe(1);
	expect(tokenEvents()).toMatchObject([{ outcome: 'hit', reason: 'none' }]);
	expect(tokenEvents()).toHaveLength(1);
});

test('a mint nobody observes records nothing', async () => {
	const { fetch, state } = hangingMint();
	const pending = readSpotifyAccessToken(fetch, 'mint-none-a', 'mint-none-b');
	await new Promise((r) => setTimeout(r, 10));
	state.release();
	await pending;
	expect(tokenEvents()).toEqual([]);
});
