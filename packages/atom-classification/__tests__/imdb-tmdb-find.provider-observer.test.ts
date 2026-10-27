import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import { createClassificationEngine } from '../src/engine';
import { createImdbDomainHtmlAdapter } from '../src/plugins/imdb/domain-html-adapter';
import { createImdbPlugin, createV0TypeProfilesPlugin } from '../src/plugins/index';
import type { PlatformStageInput } from '../src/plugins/shared/platform';

/**
 * The IMDb to TMDB `/find` bridge is recorded as `tmdb|find` (ENG-17018) while the user-facing
 * fallback (`unavailable`, then the IMDb suggestion title) stays exactly what it was. Every case
 * runs the real adapter or the real classification engine; only the fetch is faked, with an
 * obviously fake key.
 */

const FAKE_KEY = 'fake-tmdb-key-for-tests-only';
const IMDB_ID = 'tt0133093';
const IMDB_URL = `https://www.imdb.com/title/${IMDB_ID}/`;
const resolveHostname = async () => [{ address: '93.184.216.34', family: 4 as const }];

let events: ProviderEvent[];
const tuples = () =>
	events
		.filter((event): event is ProviderRequestEvent => event.type === 'provider_request')
		.map(({ provider, operation, outcome, reason, source }) => ({
			provider,
			operation,
			outcome,
			reason,
			source,
		}));
const find = (
	outcome: ProviderRequestEvent['outcome'],
	reason: ProviderRequestEvent['reason'] = 'none'
) => ({
	provider: 'tmdb' as const,
	operation: 'find' as const,
	outcome,
	reason,
	source: 'live' as const,
});

beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

type FindHandler = () => Response | Promise<Response>;

function fetcherFor(handler: FindHandler, calls: string[] = []) {
	return async (url: string) => {
		calls.push(url);
		if (url.includes('/find/')) return await handler();
		return Response.json({ d: [{ id: IMDB_ID, l: 'Fight Club', qid: 'movie' }] });
	};
}

function stageInput(extra: Partial<PlatformStageInput> = {}): PlatformStageInput {
	return {
		runtime: 'server',
		now: '2026-10-22T00:00:00.000Z',
		domain: 'imdb',
		classification: {
			type: 'url',
			subtype: 'title',
			domain: 'imdb',
			meta: { titleId: IMDB_ID },
		} as unknown as PlatformStageInput['classification'],
		requestInput: IMDB_URL,
		canonicalUrl: IMDB_URL,
		stageContext: new Map(),
		...extra,
	};
}

async function runAdapter(handler: FindHandler, extra: Partial<PlatformStageInput> = {}) {
	const adapter = createImdbDomainHtmlAdapter({
		apiKey: FAKE_KEY,
		resolveHostname,
		fetch: fetcherFor(handler),
	});
	return await adapter(stageInput(extra));
}

const movie = (id = 550) => ({ id, title: 'Fight Club', release_date: '1999-10-15' });
const found = (extra: Record<string, unknown> = {}) =>
	Response.json({ movie_results: [movie()], tv_results: [], ...extra });

describe('tmdb|find outcomes', () => {
	it('a sole hit is a find hit with a duration and the TMDB atom', async () => {
		const atom = await runAdapter(() => found());
		expect(tuples()).toEqual([find('hit')]);
		const recorded = events.find((event) => event.type === 'provider_request') as
			| ProviderRequestEvent
			| undefined;
		expect(typeof recorded?.durationMs).toBe('number');
		expect(atom).toMatchObject({ metadata: { imdbBridge: { status: 'hit', hits: 1 } } });
	});

	it('no results is a miss and the suggestion title still wins', async () => {
		const atom = await runAdapter(() => Response.json({ movie_results: [], tv_results: [] }));
		expect(tuples()).toEqual([find('miss')]);
		expect(atom).toMatchObject({ metadata: { imdbBridge: { status: 'miss', hits: 0 } } });
	});

	it('an ambiguous answer (two results) is a hit: TMDB answered', async () => {
		const atom = await runAdapter(() =>
			Response.json({ movie_results: [movie(1), movie(2)], tv_results: [] })
		);
		expect(tuples()).toEqual([find('hit')]);
		expect(atom).toMatchObject({ metadata: { imdbBridge: { status: 'ambiguous', hits: 2 } } });
	});

	it.each([
		[401, 'auth_failed'],
		[429, 'rate_limited'],
		[503, 'upstream_5xx'],
		[403, 'http_4xx'],
	] as const)('HTTP %i is error/%s and the fallback is unchanged', async (status, reason) => {
		const atom = await runAdapter(() => new Response('{}', { status }));
		expect(tuples()).toEqual([find('error', reason)]);
		expect(atom).toMatchObject({ metadata: { imdbBridge: { status: 'unavailable', hits: 0 } } });
	});

	it('404 is a miss (TMDB has nothing), but the bridge status stays unavailable', async () => {
		const atom = await runAdapter(() => new Response('{}', { status: 404 }));
		expect(tuples()).toEqual([find('miss')]);
		expect(atom).toMatchObject({ metadata: { imdbBridge: { status: 'unavailable', hits: 0 } } });
	});

	it.each([
		['a non-JSON body', () => new Response('<html>')],
		['a body without the result arrays', () => Response.json({ success: true })],
		[
			'a sole result that is not a usable record',
			() => Response.json({ movie_results: [{ id: 'x' }], tv_results: [] }),
		],
	] as const)('%s is invalid_response', async (_name, handler) => {
		await runAdapter(handler);
		expect(tuples()).toEqual([find('error', 'invalid_response')]);
	});

	it('an unusable sole result keeps its hit count on the bridge summary, as before', async () => {
		const atom = await runAdapter(() =>
			Response.json({ movie_results: [{ id: 'x' }], tv_results: [] })
		);
		expect(tuples()).toEqual([find('error', 'invalid_response')]);
		expect(atom).toMatchObject({ metadata: { imdbBridge: { status: 'unavailable', hits: 1 } } });
	});

	it('an oversized body is invalid_response', async () => {
		await runAdapter(
			() =>
				new Response('x'.repeat(1024 * 1024 + 1), {
					headers: { 'content-type': 'application/json' },
				})
		);
		expect(tuples()).toEqual([find('error', 'invalid_response')]);
	});

	it('a real 302 under redirect: error (Bun throws UnexpectedRedirect) is invalid_response', async () => {
		// The runtime's own redirect refusal, not a hand-built TypeError: Bun throws a plain Error
		// with code `UnexpectedRedirect`. Only the destination is swapped for a local server.
		const server = Bun.serve({
			port: 0,
			fetch: () => new Response('', { status: 302, headers: { location: 'https://example.com/' } }),
		});
		let sawRedirectMode: unknown;
		try {
			const adapter = createImdbDomainHtmlAdapter({
				apiKey: FAKE_KEY,
				resolveHostname,
				fetch: async (url, init) => {
					if (!url.includes('/find/')) {
						return Response.json({ d: [{ id: IMDB_ID, l: 'Fight Club', qid: 'movie' }] });
					}
					sawRedirectMode = init?.redirect;
					return await globalThis.fetch(`http://localhost:${server.port}/`, init);
				},
			});
			const atom = await adapter(stageInput());
			expect(atom).toMatchObject({ metadata: { imdbBridge: { status: 'unavailable', hits: 0 } } });
		} finally {
			await server.stop(true);
		}
		expect(sawRedirectMode).toBe('error');
		expect(tuples()).toEqual([find('error', 'invalid_response')]);
	});

	it('transport faults: TypeError is network, TimeoutError is timeout, other is other', async () => {
		await runAdapter(() => {
			throw new TypeError('connect ECONNREFUSED');
		});
		await runAdapter(() => {
			throw new DOMException('timed out', 'TimeoutError');
		});
		await runAdapter(() => {
			throw new RangeError('bug');
		});
		expect(tuples()).toEqual([
			find('error', 'network'),
			find('error', 'timeout'),
			find('error', 'other'),
		]);
	});

	it('the local find timer is a provider timeout, not a cancel', async () => {
		const adapter = createImdbDomainHtmlAdapter({
			apiKey: FAKE_KEY,
			resolveHostname,
			findTimeoutMs: 20,
			fetch: async (url, init) => {
				if (!url.includes('/find/')) return Response.json({ d: [] });
				return await new Promise<Response>((_resolve, reject) =>
					init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
				);
			},
		});
		await adapter(stageInput());
		expect(tuples()).toEqual([find('error', 'timeout')]);
		// Pins that the injected timer is what fired: the 3000 ms default would take far longer.
		const recorded = events.find((event) => event.type === 'provider_request') as
			| ProviderRequestEvent
			| undefined;
		expect(recorded?.durationMs).toBeGreaterThanOrEqual(0);
		expect(recorded?.durationMs).toBeLessThan(1000);
	});
});

describe('tmdb|find: when nothing is recorded', () => {
	it('records nothing without an API key, and makes no TMDB request', async () => {
		const calls: string[] = [];
		const adapter = createImdbDomainHtmlAdapter({
			resolveHostname,
			fetch: fetcherFor(() => found(), calls),
		});
		await adapter(stageInput());
		expect(calls.some((url) => url.includes('/find/'))).toBe(false);
		expect(tuples()).toEqual([]);
	});

	it('records nothing for a person page (no bridge)', async () => {
		const calls: string[] = [];
		const adapter = createImdbDomainHtmlAdapter({
			apiKey: FAKE_KEY,
			resolveHostname,
			fetch: fetcherFor(() => found(), calls),
		});
		await adapter(
			stageInput({
				classification: {
					type: 'url',
					subtype: 'person',
					domain: 'imdb',
					meta: { personId: 'nm0000206' },
				} as unknown as PlatformStageInput['classification'],
			})
		);
		expect(tuples()).toEqual([]);
	});

	it('a stage signal already aborted records nothing', async () => {
		const controller = new AbortController();
		controller.abort();
		await runAdapter(() => found(), { signal: controller.signal });
		expect(tuples()).toEqual([]);
	});

	it('a caller aborting mid-request (before the deadline) records nothing', async () => {
		const controller = new AbortController();
		const pending = runAdapter(
			() =>
				new Promise<Response>((_resolve, reject) =>
					controller.signal.addEventListener('abort', () => reject(controller.signal.reason))
				),
			{ signal: controller.signal, deadlineAtMs: Date.now() + 60_000 }
		);
		await new Promise((resolve) => setTimeout(resolve, 20));
		controller.abort(new Error('user left'));
		await pending;
		expect(tuples()).toEqual([]);
	});

	it('the stage deadline passing mid-request is exactly one find timeout', async () => {
		const controller = new AbortController();
		const deadlineAtMs = Date.now() + 30;
		setTimeout(() => controller.abort(new DOMException('deadline', 'TimeoutError')), 30);
		await runAdapter(
			() =>
				new Promise<Response>((_resolve, reject) =>
					controller.signal.addEventListener('abort', () => reject(controller.signal.reason))
				),
			{ signal: controller.signal, deadlineAtMs }
		);
		expect(tuples()).toEqual([find('error', 'timeout')]);
	});
});

describe('tmdb|find through the real classification engine', () => {
	const engineFor = (handler: FindHandler) =>
		createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			plugins: [
				createV0TypeProfilesPlugin(),
				createImdbPlugin({ apiKey: FAKE_KEY, resolveHostname, fetch: fetcherFor(handler) }),
			],
		});

	it('a paste with a TMDB miss records one find miss and still resolves the suggestion title', async () => {
		const result = await engineFor(() =>
			Response.json({ movie_results: [], tv_results: [] })
		).classify({ input: IMDB_URL, mode: 'server-only' });
		expect(tuples()).toEqual([find('miss')]);
		expect(result.resolved?.atoms[0]?.title).toBe('Fight Club');
		expect(result.resolved?.atoms[0]?.metadata.imdbBridge).toEqual({ status: 'miss', hits: 0 });
	});

	it('a refused key records auth_failed and the classification outcome is the unchanged unavailable one', async () => {
		// Same outcome the engine gave before the bridge was observed (checked on origin/develop).
		const result = await engineFor(() => new Response('{}', { status: 401 })).classify({
			input: IMDB_URL,
			mode: 'server-only',
		});
		expect(tuples()).toEqual([find('error', 'auth_failed')]);
		expect(result.classification?.meta.imdbBridge).toEqual({ status: 'unavailable', hits: 0 });
		expect(result.classification?.meta.acquisitionOutcome).toMatchObject({
			status: 'unavailable',
			terminal: true,
		});
	});

	it('a hung /find past the resolver timeout is exactly one find timeout, and nothing more at the local timer', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			runtime: 'server',
			resolverTimeoutMs: 100,
			plugins: [
				createV0TypeProfilesPlugin(),
				createImdbPlugin({
					apiKey: FAKE_KEY,
					resolveHostname,
					findTimeoutMs: 250,
					fetch: async (url, init) => {
						if (!url.includes('/find/')) {
							return Response.json({ d: [{ id: IMDB_ID, l: 'Fight Club', qid: 'movie' }] });
						}
						return await new Promise<Response>((_resolve, reject) =>
							init?.signal?.addEventListener('abort', () => reject(init.signal?.reason))
						);
					},
				}),
			],
		});
		await engine.classify({ input: IMDB_URL, mode: 'server-only' });
		// Past the local 250 ms timer: a second recording would show up here.
		await new Promise((resolve) => setTimeout(resolve, 400));
		expect(tuples()).toEqual([find('error', 'timeout')]);
		const recorded = events.find((event) => event.type === 'provider_request') as
			| ProviderRequestEvent
			| undefined;
		expect(recorded?.durationMs).toBeLessThan(240);
	});
});
