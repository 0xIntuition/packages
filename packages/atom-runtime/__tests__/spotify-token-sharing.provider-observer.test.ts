import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { createClassificationEngine } from '@0xintuition/atom-classification';
import {
	createMockAtomInput,
	createMockPluginContext,
	createMockRequest,
	useStubbedPublicDns,
} from '@0xintuition/atom-enrichment/testing';
import { createClassificationPlugins, createEnrichmentPresetFactories } from '../src/presets';

/**
 * Production wiring of the one Spotify token (ENG-16978). The plugins are built the way the
 * workers and the api build them, from the real presets and an env, with NO transport override,
 * so classification and enrichment each default to `globalThis.fetch` and the shared hop dials
 * through the one pinned Node transport. Only that transport's `node:https.request` is faked:
 * nothing is dialled, and the assertion counts the requests that reach it.
 *
 * A test that hands both plugins one pin-aware fetch cannot see a cache that is not shared in
 * production, because that fetch is its own cache key.
 */

type Dial = { host: string; path: string; method: string; authorization: string | undefined };
const dials: Dial[] = [];

const TRACK_ID = '4iV5W9uYEdYUVa79Axb7Rh';
const TRACK_URL = `https://open.spotify.com/track/${TRACK_ID}`;
const trackBody = JSON.stringify({
	id: TRACK_ID,
	name: 'Wired Track',
	external_urls: { spotify: TRACK_URL },
	artists: [],
	album: { name: 'Wired Album', images: [] },
});

function fakeRequest(
	url: URL,
	options: { method?: string; headers?: Record<string, string> },
	onResponse: (res: unknown) => void
) {
	const req = new EventEmitter() as EventEmitter & {
		end(): void;
		destroy(): void;
		write(): void;
	};
	req.write = () => {};
	req.destroy = () => req.emit('close');
	req.end = () => {
		dials.push({
			host: url.hostname,
			path: url.pathname,
			method: options.method ?? 'GET',
			authorization: options.headers?.authorization,
		});
		const body =
			url.hostname === 'accounts.spotify.com'
				? JSON.stringify({ access_token: 'fake-wired-token', expires_in: 3600 })
				: trackBody;
		const res = new PassThrough() as PassThrough & { statusCode: number; rawHeaders: string[] };
		res.statusCode = 200;
		res.rawHeaders = ['content-type', 'application/json'];
		queueMicrotask(() => {
			onResponse(res);
			res.end(body);
		});
	};
	return req;
}

useStubbedPublicDns();

let realHttps: typeof import('node:https') | undefined;
beforeAll(async () => {
	realHttps = await import('node:https');
	const real = realHttps;
	// mock-module-exempt: the lowest seam of the pinned transport; no socket is opened, and the real
	// module is put back in afterAll.
	mock.module('node:https', () => ({
		...real,
		default: { ...real, request: fakeRequest },
		request: fakeRequest,
	}));
});
afterAll(() => {
	const real = realHttps;
	if (!real) return;
	// mock-module-exempt: restores the real module registered in beforeAll.
	mock.module('node:https', () => ({ ...real, default: real }));
});

let seq = 0;
function freshEnv() {
	seq += 1;
	return { SPOTIFY_CLIENT_ID: `wired-id-${seq}`, SPOTIFY_CLIENT_SECRET: `wired-secret-${seq}` };
}

const spotifyPlugin = (env: ReturnType<typeof freshEnv>, preset: 'music' | 'default') => {
	const plugin = createEnrichmentPresetFactories(env)
		[preset]()
		.find((candidate) => candidate.id === 'spotify');
	if (!plugin) throw new Error('the preset has no spotify plugin');
	return plugin;
};

const enrichmentRequest = () =>
	createMockRequest({ input: createMockAtomInput({ hints: { url: TRACK_URL } }) });

describe('production preset wiring shares one Spotify token', () => {
	test.each([
		'music',
		'default',
	] as const)('classify then enrich through the %s preset: one dial to the token endpoint, two to the API', async (preset) => {
		dials.length = 0;
		const env = freshEnv();
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: createClassificationPlugins(env),
		});
		const classified = await engine.classify({ input: TRACK_URL, mode: 'progressive' });
		const artifacts = await spotifyPlugin(env, preset).enrich(
			enrichmentRequest(),
			createMockPluginContext()
		);

		expect(classified.resolved?.atoms[0]?.source).toBe('platform-v0:domain-api');
		expect(artifacts[0]?.meta.provider).toBe('spotify-web-api');
		expect(dials.map((dial) => `${dial.method} ${dial.host}`)).toEqual([
			'POST accounts.spotify.com',
			'GET api.spotify.com',
			'GET api.spotify.com',
		]);
		// Both lookups used the token the single mint returned.
		expect(dials.filter((dial) => dial.host === 'api.spotify.com')).toEqual([
			expect.objectContaining({ authorization: 'Bearer fake-wired-token' }),
			expect.objectContaining({ authorization: 'Bearer fake-wired-token' }),
		]);
	});

	test('enrich then classify shares the token too, and another credential pair does not borrow it', async () => {
		dials.length = 0;
		const env = freshEnv();
		await spotifyPlugin(env, 'music').enrich(enrichmentRequest(), createMockPluginContext());
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: createClassificationPlugins(env),
		});
		await engine.classify({ input: TRACK_URL, mode: 'progressive' });
		expect(dials.filter((dial) => dial.host === 'accounts.spotify.com')).toHaveLength(1);

		await spotifyPlugin(freshEnv(), 'music').enrich(enrichmentRequest(), createMockPluginContext());
		expect(dials.filter((dial) => dial.host === 'accounts.spotify.com')).toHaveLength(2);
	});
});
