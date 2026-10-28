import { describe, expect, it } from 'bun:test';
import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';
import { useStubbedPublicDns } from '@0xintuition/atom-enrichment/testing';
import { createClassificationEngine } from '../src/engine';
import {
	createSpotifyDomainApiAdapter,
	createSpotifyPlugin,
	createV0TypeProfilesPlugin,
} from '../src/plugins/index';
import type { PlatformStageInput } from '../src/plugins/shared/platform';

useStubbedPublicDns();

/**
 * The domain-api stage's failures carry a `PipelineErrorKind` (as the Wikipedia adapter's do), so
 * the stage errors an operator reads say what failed instead of echoing message text.
 */

const TRACK_ID = '4iV5W9uYEdYUVa79Axb7Rh';
const TRACK_URL = `https://open.spotify.com/track/${TRACK_ID}`;

let seq = 0;
const credentials = () => {
	seq += 1;
	return { clientId: `diag-client-${seq}`, clientSecret: `diag-secret-${seq}` };
};

type ItemHandler = () => Response | Promise<Response>;

function spotifyFetch(item: ItemHandler) {
	return createPinAwareFetch(async (input: string) =>
		new URL(input).hostname === 'accounts.spotify.com'
			? Response.json({ access_token: 'diag-token', expires_in: 3600 })
			: await item()
	);
}

function stageInput(extra: Partial<PlatformStageInput> = {}): PlatformStageInput {
	return {
		runtime: 'server',
		now: '2026-10-21T00:00:00.000Z',
		domain: 'spotify',
		classification: {
			type: 'url',
			subtype: 'track',
			domain: 'spotify',
			meta: { resourceId: TRACK_ID },
		} as unknown as PlatformStageInput['classification'],
		requestInput: TRACK_URL,
		canonicalUrl: TRACK_URL,
		stageContext: new Map(),
		...extra,
	};
}

async function failureOf(item: ItemHandler) {
	const creds = credentials();
	const adapter = createSpotifyDomainApiAdapter({ ...creds, fetch: spotifyFetch(item) });
	return await Promise.resolve(adapter(stageInput())).then(
		() => undefined,
		(error: unknown) => error as Error & { reason?: string }
	);
}

describe('Spotify domain-api stage diagnostics', () => {
	it.each([
		['a 500', () => new Response('{}', { status: 500 }), 'non_ok_status', 'HTTP 500'],
		['a 429', () => new Response('{}', { status: 429 }), 'non_ok_status', 'HTTP 429'],
		['a 403', () => new Response('{}', { status: 403 }), 'non_ok_status', 'HTTP 403'],
		['a 404', () => new Response('{}', { status: 404 }), 'non_ok_status', 'HTTP 404'],
		[
			'a redirect',
			() => new Response(null, { status: 302, headers: { location: 'https://evil.example/' } }),
			'redirect_rejected',
			'redirect',
		],
		['a non-JSON body', () => new Response('<html>'), 'parse_failure', 'invalid'],
		['a JSON body that is not an object', () => Response.json([1, 2]), 'parse_failure', 'invalid'],
		[
			'a failed fetch',
			() => {
				throw new TypeError('fetch failed');
			},
			'http_error',
			'request failed',
		],
	] as const)('%s is a %s diagnostic', async (_name, item, reason, messagePart) => {
		const error = await failureOf(item);
		expect(error?.reason).toBe(reason);
		expect(error?.message.toLowerCase()).toContain(messagePart.toLowerCase());
		// Label-safe: no id, no raw upstream text.
		expect(error?.message).not.toContain(TRACK_ID);
		expect(error?.message).not.toContain('fetch failed');
	});

	it('a caller cancel is not reported as a timeout (shared describer, round-2 finding 9)', async () => {
		const hangingFetch = createPinAwareFetch(
			(input: string, init?: RequestInit) =>
				new Promise<Response>((resolve, reject) => {
					if (new URL(input).hostname === 'accounts.spotify.com') {
						resolve(Response.json({ access_token: 'diag-token', expires_in: 3600 }));
						return;
					}
					init?.signal?.addEventListener('abort', () =>
						reject(new DOMException('aborted', 'AbortError'))
					);
				})
		);
		const adapter = createSpotifyDomainApiAdapter({ ...credentials(), fetch: hangingFetch });
		const controller = new AbortController();
		const pending = Promise.resolve(
			adapter(stageInput({ signal: controller.signal, deadlineAtMs: Date.now() + 60_000 }))
		).catch((error: unknown) => error as Error & { reason?: string });
		await new Promise((resolve) => setTimeout(resolve, 30));
		controller.abort();
		const error = await pending;
		expect(error).toMatchObject({
			reason: 'adapter_error',
			message: 'Spotify request was cancelled',
		});
	});

	it('a caller cancel while waiting for the token is a cancel, not a timeout', async () => {
		const hangingFetch = createPinAwareFetch(
			(_input: string, init?: RequestInit) =>
				new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () =>
						reject(new DOMException('aborted', 'AbortError'))
					);
				})
		);
		const adapter = createSpotifyDomainApiAdapter({ ...credentials(), fetch: hangingFetch });
		const controller = new AbortController();
		const pending = Promise.resolve(
			adapter(stageInput({ signal: controller.signal, deadlineAtMs: Date.now() + 60_000 }))
		).catch((error: unknown) => error as Error & { reason?: string });
		await new Promise((resolve) => setTimeout(resolve, 30));
		controller.abort();
		expect(await pending).toMatchObject({
			reason: 'adapter_error',
			message: 'Spotify request was cancelled',
		});
	});

	it('a 429 with Retry-After carries the wait in the diagnostic (the shared mapper adds it for every provider)', async () => {
		const error = await failureOf(
			() => new Response('{}', { status: 429, headers: { 'retry-after': '7' } })
		);
		expect(error?.reason).toBe('non_ok_status');
		expect(error?.message).toBe('HTTP 429 (retryAfterMs=7000)');
	});

	it('a token refusal is reported as the token failure it is', async () => {
		const creds = credentials();
		const fetch = createPinAwareFetch(async () =>
			Response.json({ error: 'invalid_client' }, { status: 400 })
		);
		const adapter = createSpotifyDomainApiAdapter({ ...creds, fetch });
		const error = await Promise.resolve(adapter(stageInput())).catch(
			(e: unknown) => e as Error & { reason?: string }
		);
		expect(error).toMatchObject({ reason: 'non_ok_status' });
		expect((error as Error).message).toBe('HTTP 400');
	});

	it('reaches the engine result as a formatted stage error, and the paste still classifies', async () => {
		const creds = credentials();
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createSpotifyPlugin({
					credentials: { spotify: creds },
					adapters: {
						domainApi: createSpotifyDomainApiAdapter({
							...creds,
							fetch: spotifyFetch(() => new Response('{}', { status: 500 })),
						}),
					},
				}),
			],
		});
		const result = await engine.classify({ input: TRACK_URL, mode: 'progressive' });
		expect(result.resolved?.atoms[0]?.source).not.toBe('platform-v0:domain-api');
		expect(JSON.stringify(result)).toContain('domain-api:non_ok_status: HTTP 500');
	});
});
