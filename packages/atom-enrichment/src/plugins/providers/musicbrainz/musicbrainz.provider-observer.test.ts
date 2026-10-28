import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import {
	createRequestSlot,
	getProcessRequestSlot,
	type RequestSlot,
	RequestSlotRejectedError,
	resetProcessRequestSlotsForTests,
} from '@0xintuition/pipeline-runtime/request-slot';
import { createHeldRequestSlot } from '@0xintuition/pipeline-runtime/testing/held-request-slot';
import { createMemoryCacheAdapter } from '../../../cache';
import { createEnrichmentEngine } from '../../../engine';
import { createServerDefaultPresetOptions } from '../../../presets/bundles';
import { createMockPluginContext, createMockRequest } from '../../../testing';
import { createPinAwareFetch, type FetchLike } from '../__shared__/http';
import {
	createMusicBrainzPlugin as createProviderPlugin,
	DEFAULT_MUSICBRAINZ_USER_AGENT,
	escapeLucenePhrase,
	resolveMusicBrainzUserAgent,
} from './index';
import { classifyMusicBrainzResult } from './request-observer';

// mock-module-exempt: the shared provider hop resolves every target through node:dns before it
// dials, so a real lookup would make these tests depend on the network. Nothing is dialled.
const realDns = await import('node:dns/promises');
mock.module('node:dns/promises', () => ({
	...realDns,
	default: realDns,
	lookup: async () => [{ address: '93.184.216.34', family: 4 }],
}));

const MBID = '17eb3129-0f17-403f-bea0-b524d6ffb770';
const recording = { id: MBID, title: 'Bohemian Rhapsody' };

let events: ProviderEvent[];
const requests = () =>
	events.filter((event): event is ProviderRequestEvent => event.type === 'provider_request');
const tuples = () =>
	requests().map(({ provider, operation, outcome, reason, source }) => ({
		provider,
		operation,
		outcome,
		reason,
		source,
	}));
const tuple = (
	operation: ProviderRequestEvent['operation'],
	outcome: ProviderRequestEvent['outcome'],
	reason: ProviderRequestEvent['reason'] = 'none'
) => ({ provider: 'musicbrainz' as const, operation, outcome, reason, source: 'live' as const });

beforeEach(() => {
	events = [];
	resetProcessRequestSlotsForTests();
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => {
	resetProviderObserversForTests();
	resetProcessRequestSlotsForTests();
});

function plugin(fetch: FetchLike, options: Parameters<typeof createProviderPlugin>[0] = {}) {
	return createProviderPlugin({
		requestSpacingMs: 0,
		...options,
		fetch: createPinAwareFetch(fetch),
	});
}

const mbidRequest = () =>
	createMockRequest({
		input: {
			atomType: 'thing',
			identifier: { iid: 'int:wd:Q189729', scheme: 'wd', value: 'Q189729' },
			source: { classificationEngine: 'fixture', classifiedAt: '2026-10-07T00:00:00Z' },
			hints: { identifiers: { mbid: MBID } },
		},
	});
const isrcRequest = () =>
	createMockRequest({
		input: {
			atomType: 'thing',
			identifier: { iid: 'int:wd:Q189729', scheme: 'wd', value: 'Q189729' },
			source: { classificationEngine: 'fixture', classifiedAt: '2026-10-07T00:00:00Z' },
			hints: { identifiers: { isrc: 'GBUM71029604' } },
		},
	});
const searchRequest = () =>
	createMockRequest({
		input: {
			atomType: 'song',
			jsonLd: {
				'@context': 'https://schema.org',
				'@type': 'MusicRecording',
				name: 'Bohemian Rhapsody',
			},
			source: { classificationEngine: 'fixture', classifiedAt: '2026-10-07T00:00:00Z' },
		},
	});

const ROUTES = [
	['recording', mbidRequest],
	['isrc', isrcRequest],
	['search', searchRequest],
] as const;

const body = (url: string) =>
	url.includes('/recording/') ? recording : { recordings: [recording] };

describe('MusicBrainz request observer', () => {
	for (const [operation, makeRequest] of ROUTES) {
		test(`${operation}: a 200 records exactly one hit with a duration`, async () => {
			const result = await createEnrichmentEngine({
				plugins: [plugin(async (url) => Response.json(body(String(url))))],
			}).enrich(makeRequest());
			expect(result.artifacts).toHaveLength(1);
			expect(tuples()).toEqual([tuple(operation, 'hit')]);
			expect(typeof requests()[0]?.durationMs).toBe('number');
		});

		test(`${operation}: a 404 is a miss in the metric and no error in the engine`, async () => {
			const result = await createEnrichmentEngine({
				plugins: [plugin(async () => new Response('{}', { status: 404 }))],
			}).enrich(makeRequest());
			expect(tuples()).toEqual([tuple(operation, 'miss')]);
			expect(result.errors).toEqual([]);
			expect(result.artifacts).toEqual([]);
			expect(result.status).toBe('success');
		});

		test(`${operation}: a 503 is rate_limited in the metric and the engine, and retriable`, async () => {
			const result = await createEnrichmentEngine({
				plugins: [plugin(async () => new Response('busy', { status: 503 }))],
			}).enrich(makeRequest());
			expect(tuples()).toEqual([tuple(operation, 'error', 'rate_limited')]);
			expect(result.errors).toMatchObject([
				{ pluginId: 'musicbrainz', code: 'rate_limited', retriable: true },
			]);
		});
	}

	test('429 is rate_limited, 403 is auth_failed', async () => {
		const engine429 = await createEnrichmentEngine({
			plugins: [plugin(async () => new Response('', { status: 429 }))],
		}).enrich(mbidRequest());
		expect(engine429.errors).toMatchObject([{ code: 'rate_limited', retriable: true }]);
		const engine403 = await createEnrichmentEngine({
			plugins: [plugin(async () => new Response('', { status: 403 }))],
		}).enrich(mbidRequest());
		expect(engine403.errors).toMatchObject([{ code: 'auth_failed' }]);
		expect(tuples()).toEqual([
			tuple('recording', 'error', 'rate_limited'),
			tuple('recording', 'error', 'auth_failed'),
		]);
	});

	test('other statuses keep their ordinary mapping: 500 is upstream_5xx, 400 is http_4xx', async () => {
		await createEnrichmentEngine({
			plugins: [plugin(async () => new Response('', { status: 500 }))],
		}).enrich(mbidRequest());
		const bad = await createEnrichmentEngine({
			plugins: [plugin(async () => new Response('', { status: 400 }))],
		}).enrich(mbidRequest());
		expect(tuples()).toEqual([
			tuple('recording', 'error', 'upstream_5xx'),
			tuple('recording', 'error', 'http_4xx'),
		]);
		expect(bad.errors).toMatchObject([{ code: 'upstream_error', retriable: false }]);
	});

	test('schema failure is invalid_response and a thrown fetch is network', async () => {
		await plugin(async () => Response.json({ id: 5 }))
			.enrich(mbidRequest(), createMockPluginContext())
			.catch(() => undefined);
		await plugin(async () => {
			throw new TypeError('fetch failed');
		})
			.enrich(mbidRequest(), createMockPluginContext())
			.catch(() => undefined);
		expect(tuples()).toEqual([
			tuple('recording', 'error', 'invalid_response'),
			tuple('recording', 'error', 'network'),
		]);
	});

	test('a signal aborted before the request starts records nothing', async () => {
		const controller = new AbortController();
		controller.abort(new Error('gone'));
		await plugin(async () => Response.json(recording))
			.enrich(mbidRequest(), createMockPluginContext({ signal: controller.signal }))
			.catch(() => undefined);
		expect(tuples()).toEqual([]);
	});
});

describe('MusicBrainz User-Agent', () => {
	const capture = async (options?: Parameters<typeof createProviderPlugin>[0]) => {
		const agents: (string | null)[] = [];
		await plugin(async (_url, init) => {
			agents.push(new Headers(init?.headers).get('user-agent'));
			return Response.json(recording);
		}, options).enrich(mbidRequest(), createMockPluginContext());
		return agents;
	};

	test('defaults to the intuition.systems contact', async () => {
		expect(DEFAULT_MUSICBRAINZ_USER_AGENT).toContain('https://intuition.systems');
		expect(await capture()).toEqual([DEFAULT_MUSICBRAINZ_USER_AGENT]);
	});

	test('an option overrides it and a blank one falls back to the default', async () => {
		expect(await capture({ userAgent: 'Custom/2 (+https://example.test)' })).toEqual([
			'Custom/2 (+https://example.test)',
		]);
		expect(await capture({ userAgent: '   ' })).toEqual([DEFAULT_MUSICBRAINZ_USER_AGENT]);
	});

	test('MUSICBRAINZ_USER_AGENT reaches the plugin through the server preset options', () => {
		expect(
			createServerDefaultPresetOptions({ MUSICBRAINZ_USER_AGENT: 'Env/1 (+https://env.test)' })
				.musicbrainz
		).toEqual({ userAgent: 'Env/1 (+https://env.test)' });
	});
});

/**
 * A virtual clock for a private request slot: the slot's own `now`/`wallNow`/`sleep` are injected,
 * so spacing and deadlines move only when the test advances the clock.
 */
let virtualNow = 0;
let virtualWallBase = 0;
/** Epoch ms on the virtual clock: anchored to the real now, so `isEngineDeadline` agrees with it. */
const virtualWallNow = () => virtualWallBase + (virtualNow - 1_000_000);
let timers: { at: number; run: () => void }[] = [];

function virtualSlot(minSpacingMs: number): RequestSlot {
	virtualNow = 1_000_000;
	virtualWallBase = Date.now();
	timers = [];
	return createRequestSlot({
		minSpacingMs,
		now: () => virtualNow,
		wallNow: virtualWallNow,
		sleep: (ms, signal) =>
			new Promise<void>((resolve, reject) => {
				const timer = { at: virtualNow + ms, run: resolve };
				timers.push(timer);
				signal.addEventListener(
					'abort',
					() => {
						timers = timers.filter((candidate) => candidate !== timer);
						reject(signal.reason);
					},
					{ once: true }
				);
			}),
	});
}

async function settle(): Promise<void> {
	for (let turn = 0; turn < 50; turn += 1) await Promise.resolve();
}

/** Moves the virtual clock, firing due timers in order and letting queued promises settle. */
async function advance(ms: number): Promise<void> {
	const target = virtualNow + ms;
	await settle();
	for (;;) {
		const due = timers.filter((timer) => timer.at <= target).sort((a, b) => a.at - b.at)[0];
		if (!due) break;
		timers = timers.filter((timer) => timer !== due);
		virtualNow = Math.max(virtualNow, due.at);
		due.run();
		await settle();
	}
	virtualNow = target;
	await settle();
}

describe('MusicBrainz request slot', () => {
	test('concurrent callers are serialised with 1 s between requests, and a failure does not block', async () => {
		const starts: number[] = [];
		const statuses = [200, 503, 200];
		const instance = plugin(
			async () => {
				starts.push(virtualNow);
				const status = statuses[starts.length - 1] ?? 200;
				return status === 200 ? Response.json(recording) : new Response('', { status });
			},
			{ requestSlot: virtualSlot(1_000) }
		);
		const calls = [1, 2, 3].map(() =>
			instance.enrich(mbidRequest(), createMockPluginContext()).catch((error: unknown) => error)
		);
		await advance(0);
		expect(starts).toHaveLength(1);
		await advance(999);
		expect(starts).toHaveLength(1);
		await advance(1);
		expect(starts).toHaveLength(2);
		await advance(999);
		expect(starts).toHaveLength(2);
		await advance(1);
		expect(starts).toHaveLength(3);
		await Promise.all(calls);
		expect(starts[1]! - starts[0]!).toBeGreaterThanOrEqual(1_000);
		expect(starts[2]! - starts[1]!).toBeGreaterThanOrEqual(1_000);
		// The 503 in the middle did not stop the third request.
		expect(tuples()).toEqual([
			tuple('recording', 'hit'),
			tuple('recording', 'error', 'rate_limited'),
			tuple('recording', 'hit'),
		]);
	});

	test('S6: a held-open first response keeps the second request from starting until end + 1 s', async () => {
		const starts: number[] = [];
		let releaseFirst: (() => void) | undefined;
		const instance = plugin(
			(_url) => {
				starts.push(virtualNow);
				if (starts.length > 1) return Promise.resolve(Response.json(recording));
				return new Promise<Response>((resolve) => {
					releaseFirst = () => resolve(Response.json(recording));
				});
			},
			{ requestSlot: virtualSlot(1_000) }
		);
		const calls = [1, 2].map(() => instance.enrich(mbidRequest(), createMockPluginContext()));
		await advance(0);
		expect(starts).toHaveLength(1);
		// Five seconds later the first is still open: the second must not overlap it.
		await advance(5_000);
		expect(starts).toHaveLength(1);
		const endedAt = virtualNow;
		releaseFirst?.();
		await advance(999);
		expect(starts).toHaveLength(1);
		await advance(1);
		expect(starts).toHaveLength(2);
		expect(starts[1]).toBe(endedAt + 1_000);
		await Promise.all(calls);
	});

	test('queued requests that die in the queue neither cost a turn nor go unrecorded (H1)', async () => {
		const starts: number[] = [];
		const slot = virtualSlot(1_000);
		const instance = plugin(
			async () => {
				starts.push(virtualNow);
				return Response.json(recording);
			},
			{ requestSlot: slot }
		);
		const live = instance.enrich(mbidRequest(), createMockPluginContext());
		await advance(0);
		// Two callers that give up while queued behind the first request's spacing.
		const gone = [1, 2].map(() => {
			const controller = new AbortController();
			const call = instance
				.enrich(mbidRequest(), createMockPluginContext({ signal: controller.signal }))
				.catch((error: unknown) => error);
			return { controller, call };
		});
		await advance(100);
		for (const { controller } of gone) controller.abort(new Error('user left'));
		await Promise.all(gone.map(({ call }) => call));
		const next = instance.enrich(mbidRequest(), createMockPluginContext());
		await advance(0);
		await advance(899);
		expect(starts).toHaveLength(1);
		await advance(1);
		// The dead entries did not push the next real request back: it starts 1 s after the first.
		expect(starts).toEqual([starts[0]!, starts[0]! + 1_000]);
		await Promise.all([live, next]);
		expect(tuples()).toEqual([tuple('recording', 'hit'), tuple('recording', 'hit')]);
	});

	test('a request the slot cannot fit before the engine deadline fails fast as budget_exhausted (not rate_limited)', async () => {
		const slot = virtualSlot(1_000);
		const instance = plugin(async () => Response.json(recording), { requestSlot: slot });
		const first = instance.enrich(mbidRequest(), createMockPluginContext());
		await advance(0);
		await first;
		// Spacing says the next start is 1 s away; this caller's deadline is 100 ms away.
		const refused = await instance
			.enrich(mbidRequest(), createMockPluginContext({ deadlineAtMs: virtualWallNow() + 100 }))
			.catch((error: unknown) => error);
		expect(refused).toBeInstanceOf(RequestSlotRejectedError);
		expect(tuples().at(-1)).toEqual(tuple('recording', 'budget_exhausted'));
		expect(events.at(-1)).not.toHaveProperty('durationMs');
	});
});

describe('MusicBrainz process-wide slot', () => {
	test('two plugin instances share one slot (the api builds one engine per preset)', async () => {
		const starts: number[] = [];
		const make = () =>
			createProviderPlugin({
				fetch: createPinAwareFetch(async () => {
					starts.push(performance.now());
					return Response.json(recording);
				}),
			});
		const [a, b] = [make(), make()];
		await Promise.all([
			a.enrich(mbidRequest(), createMockPluginContext()),
			b.enrich(mbidRequest(), createMockPluginContext()),
		]);
		expect(starts).toHaveLength(2);
		// Real clock: independent slots would start both at once.
		expect(starts[1]! - starts[0]!).toBeGreaterThanOrEqual(950);
	});

	test('the default spacing is 1 s: the process slot is registered with minSpacingMs 1000', async () => {
		await createProviderPlugin({
			fetch: createPinAwareFetch(async () => Response.json(recording)),
		}).enrich(mbidRequest(), createMockPluginContext());
		expect(() => getProcessRequestSlot('musicbrainz', { minSpacingMs: 1_000 })).not.toThrow();
		expect(() => getProcessRequestSlot('musicbrainz', { minSpacingMs: 0 })).toThrow();
	});

	test('a custom spacing uses a private slot and leaves the process slot alone', async () => {
		await plugin(async () => Response.json(recording), { requestSpacingMs: 0 }).enrich(
			mbidRequest(),
			createMockPluginContext()
		);
		// Nothing registered under another pacing yet: this registration is free to pick any.
		expect(() => getProcessRequestSlot('musicbrainz', { minSpacingMs: 5 })).not.toThrow();
	});
});

describe('MusicBrainz 503: Retry-After reaches the engine error', () => {
	test('S3: Retry-After: 30 is 30000 ms in the engine error details, class and metric', async () => {
		const result = await createEnrichmentEngine({
			plugins: [
				plugin(async () => new Response('busy', { status: 503, headers: { 'retry-after': '30' } })),
			],
		}).enrich(mbidRequest());
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({
			pluginId: 'musicbrainz',
			code: 'rate_limited',
			retriable: true,
			message: 'rate_limited',
			details: { status: 503, retryAfterMs: 30_000, errorClass: 'rate_limited' },
		});
		expect(tuples()).toEqual([tuple('recording', 'error', 'rate_limited')]);
	});
});

describe('MusicBrainz cancellation during a request', () => {
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

	test('the engine deadline during a hung request records exactly one timeout', async () => {
		const result = await createEnrichmentEngine({
			plugins: [plugin(() => new Promise<Response>(() => {}))],
		}).enrich({ ...mbidRequest(), timeoutMs: 40 });
		expect(result.errors.map((error) => error.code)).toEqual(['timeout']);
		await sleep(20);
		expect(tuples()).toEqual([tuple('recording', 'error', 'timeout')]);
	});

	test('a caller cancelling mid-request records nothing', async () => {
		const external = new AbortController();
		const pending = createEnrichmentEngine({
			plugins: [plugin(() => new Promise<Response>(() => {}))],
		})
			.enrich({ ...mbidRequest(), timeoutMs: 5_000 }, { signal: external.signal })
			.catch((error: unknown) => error);
		await sleep(30);
		external.abort(new Error('user left'));
		await pending;
		await sleep(20);
		expect(tuples()).toEqual([]);
	});
});

describe('MusicBrainz fetch receives the slot signal', () => {
	test('the signal handed to fetch aborts when the caller aborts, so a honouring fetch stops', async () => {
		const external = new AbortController();
		let seen: AbortSignal | undefined;
		const pending = plugin(
			(_url, init) =>
				new Promise<Response>((_resolve, reject) => {
					seen = init?.signal ?? undefined;
					init?.signal?.addEventListener('abort', () =>
						reject(new DOMException('x', 'AbortError'))
					);
				})
		)
			.enrich(mbidRequest(), createMockPluginContext({ signal: external.signal }))
			.catch((error: unknown) => error);
		await new Promise((resolve) => setTimeout(resolve, 20));
		expect(seen).toBeDefined();
		expect(seen?.aborted).toBe(false);
		external.abort(new Error('user left'));
		await pending;
		expect(seen?.aborted).toBe(true);
		expect(tuples()).toEqual([]);
	});
});

describe('MusicBrainz routing and query building', () => {
	const mbidFor = (mbid: string) =>
		createMockRequest({
			input: {
				atomType: 'thing',
				identifier: { iid: 'int:wd:Q189729', scheme: 'wd', value: 'Q189729' },
				source: { classificationEngine: 'fixture', classifiedAt: '2026-10-07T00:00:00Z' },
				hints: { identifiers: { mbid } },
			},
		});

	test('a malformed MBID is not supported and sends no request', async () => {
		let calls = 0;
		const instance = plugin(async () => {
			calls += 1;
			return Response.json(recording);
		});
		for (const bad of ['not-an-mbid', '17eb3129-0f17-403f-bea0-b524d6ffb77', `${MBID}/../x`, '']) {
			const request = mbidFor(bad);
			expect(instance.supports(request)).toBe(false);
			expect(await instance.enrich(request, createMockPluginContext())).toEqual([]);
		}
		expect(calls).toBe(0);
		expect(tuples()).toEqual([]);
	});

	test('an upper-case MBID is sent lower-cased', async () => {
		const urls: string[] = [];
		await plugin(async (url) => {
			urls.push(String(url));
			return Response.json(recording);
		}).enrich(mbidFor(MBID.toUpperCase()), createMockPluginContext());
		expect(urls).toEqual([`https://musicbrainz.org/ws/2/recording/${MBID}?fmt=json`]);
	});

	test('Lucene syntax in a title is escaped and sent as one phrase', async () => {
		const urls: string[] = [];
		const title = 'AC/DC (live): "Hells" AND * ~ ^ [x] \\ && ||';
		await plugin(async (url) => {
			urls.push(String(url));
			return Response.json({ recordings: [recording] });
		}).enrich(
			createMockRequest({
				input: {
					atomType: 'song',
					jsonLd: { '@context': 'https://schema.org', '@type': 'MusicRecording', name: title },
					source: { classificationEngine: 'fixture', classifiedAt: '2026-10-07T00:00:00Z' },
				},
			}),
			createMockPluginContext()
		);
		const url = new URL(urls[0] ?? '');
		expect(url.origin + url.pathname).toBe('https://musicbrainz.org/ws/2/recording');
		expect(url.searchParams.get('limit')).toBe('1');
		expect(url.searchParams.get('fmt')).toBe('json');
		expect(url.searchParams.get('query')).toBe(`recording:"${escapeLucenePhrase(title)}"`);
		expect(url.searchParams.get('query')).toBe(
			'recording:"AC\\/DC \\(live\\)\\: \\"Hells\\" AND \\* \\~ \\^ \\[x\\] \\\\ \\&\\& \\|\\|"'
		);
	});

	test('escapeLucenePhrase leaves plain text alone', () => {
		expect(escapeLucenePhrase('Bohemian Rhapsody')).toBe('Bohemian Rhapsody');
	});
});

describe('MusicBrainz User-Agent validation', () => {
	test('a User-Agent with CR/LF or control characters falls back to the default with a warning', () => {
		const warn = mock(() => undefined);
		const realWarn = console.warn;
		console.warn = warn;
		try {
			for (const bad of ['Evil/1\r\nX-Injected: 1', 'Tab\tAgent/1', 'Caf\u00e9/1']) {
				expect(resolveMusicBrainzUserAgent(bad)).toBe(DEFAULT_MUSICBRAINZ_USER_AGENT);
			}
			expect(warn).toHaveBeenCalledTimes(3);
			expect(resolveMusicBrainzUserAgent(' Ok/2 (+https://ok.test) ')).toBe(
				'Ok/2 (+https://ok.test)'
			);
			expect(warn).toHaveBeenCalledTimes(3);
		} finally {
			console.warn = realWarn;
		}
	});

	test('the default User-Agent carries the plugin version', () => {
		const pluginVersion = createProviderPlugin().version;
		expect(DEFAULT_MUSICBRAINZ_USER_AGENT).toContain(`IntuitionAtomEnrichment/${pluginVersion} `);
	});
});

describe('classifyMusicBrainzResult and the observed result (M2)', () => {
	test('the picked recording needs an id and a title to be a hit', () => {
		expect(classifyMusicBrainzResult(recording)).toBe('hit');
		expect(classifyMusicBrainzResult(undefined)).toBe('miss');
		expect(classifyMusicBrainzResult({})).toBe('miss');
		expect(classifyMusicBrainzResult({ id: MBID })).toBe('miss');
		expect(classifyMusicBrainzResult({ title: 'x' })).toBe('miss');
	});

	for (const [operation, makeRequest] of [
		['isrc', isrcRequest],
		['search', searchRequest],
	] as const) {
		test(`${operation}: a 200 with no recordings is a miss in the metric and no artifact`, async () => {
			const result = await createEnrichmentEngine({
				plugins: [plugin(async () => Response.json({ recordings: [] }))],
			}).enrich(makeRequest());
			expect(tuples()).toEqual([tuple(operation, 'miss')]);
			expect(result.artifacts).toEqual([]);
			expect(result.errors).toEqual([]);
		});

		test(`${operation}: a 200 whose first recording has no title is a miss`, async () => {
			await createEnrichmentEngine({
				plugins: [plugin(async () => Response.json({ recordings: [{ id: MBID }] }))],
			}).enrich(makeRequest());
			expect(tuples()).toEqual([tuple(operation, 'miss')]);
		});
	}

	test('recording: a 200 without id/title is a miss', async () => {
		await createEnrichmentEngine({
			plugins: [plugin(async () => Response.json({ id: MBID }))],
		}).enrich(mbidRequest());
		expect(tuples()).toEqual([tuple('recording', 'miss')]);
	});
});

describe('MusicBrainz engine cache observation', () => {
	for (const [operation, makeRequest] of ROUTES) {
		test(`${operation}: a second run served from the artifact cache records one source=cache hit and no dial`, async () => {
			let dials = 0;
			const engine = createEnrichmentEngine({
				cache: createMemoryCacheAdapter(),
				plugins: [
					plugin(async (url) => {
						dials += 1;
						return Response.json(body(String(url)));
					}),
				],
			});
			await engine.enrich(makeRequest());
			const second = await engine.enrich(makeRequest());
			expect(dials).toBe(1);
			expect(second.timings.cacheHits).toBe(1);
			expect(tuples()).toEqual([
				tuple(operation, 'hit'),
				{ ...tuple(operation, 'hit'), source: 'cache' },
			]);
		});
	}

	for (const [name, operation, makeRequest, respond] of [
		[
			'an empty search (200, no recordings)',
			'search',
			searchRequest,
			() => Response.json({ recordings: [] }),
		],
		[
			'an unknown recording (404)',
			'recording',
			mbidRequest,
			() => new Response('{}', { status: 404 }),
		],
	] as const) {
		test(`${name}: the cached empty run records exactly one source=cache miss and no second request`, async () => {
			let dials = 0;
			const engine = createEnrichmentEngine({
				cache: createMemoryCacheAdapter(),
				plugins: [
					plugin(async () => {
						dials += 1;
						return respond();
					}),
				],
			});
			await engine.enrich(makeRequest());
			expect(tuples()).toEqual([tuple(operation, 'miss')]);
			const second = await engine.enrich(makeRequest());
			expect(dials).toBe(1);
			expect(second.timings.cacheHits).toBe(1);
			expect(second.artifacts).toEqual([]);
			expect(tuples()).toEqual([
				tuple(operation, 'miss'),
				{ ...tuple(operation, 'miss'), source: 'cache' },
			]);
		});
	}

	test('a request MusicBrainz does not support declares no cache operation', () => {
		const instance = createProviderPlugin();
		const unsupported = createMockRequest();
		expect(instance.observability?.cacheOperations(unsupported)).toEqual([]);
	});
});

describe('MusicBrainz pacing-slot refusals are budget_exhausted, a real throttle stays rate_limited (ENG-17085)', () => {
	const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
	const heldSlot = createHeldRequestSlot;

	for (const [operation, makeRequest] of ROUTES) {
		test(`${operation}: a full slot queue is one budget_exhausted without a duration or a request, not rate_limited`, async () => {
			let dials = 0;
			await createEnrichmentEngine({
				plugins: [
					plugin(
						async () => {
							dials += 1;
							return Response.json(body(''));
						},
						{ requestSlot: heldSlot(0) }
					),
				],
			}).enrich(makeRequest());
			expect(dials).toBe(0);
			expect(tuples()).toEqual([tuple(operation, 'budget_exhausted')]);
			expect(events.find((e) => e.type === 'provider_request')).not.toHaveProperty('durationMs');
		});
	}

	test('the engine deadline while the request waits for its turn is budget_exhausted, never a timeout', async () => {
		let dials = 0;
		await createEnrichmentEngine({
			plugins: [
				plugin(
					async () => {
						dials += 1;
						return Response.json(recording);
					},
					{ requestSlot: heldSlot() }
				),
			],
		}).enrich({ ...mbidRequest(), timeoutMs: 40 });
		await sleep(30);
		expect(dials).toBe(0);
		expect(tuples()).toEqual([tuple('recording', 'budget_exhausted')]);
		expect(events.find((e) => e.type === 'provider_request')).not.toHaveProperty('durationMs');
	});

	test('a caller abort while it waits records nothing', async () => {
		const controller = new AbortController();
		const pending = plugin(async () => Response.json(recording), { requestSlot: heldSlot() })
			.enrich(
				mbidRequest(),
				createMockPluginContext({ signal: controller.signal, deadlineAtMs: Date.now() + 60_000 })
			)
			.catch((error: unknown) => error);
		await sleep(20);
		controller.abort(new Error('user left'));
		await pending;
		expect(tuples()).toEqual([]);
		// Control: the recorder is live. The same held slot, refused instead of cancelled, records one.
		await createEnrichmentEngine({
			plugins: [plugin(async () => Response.json(recording), { requestSlot: heldSlot(0) })],
		}).enrich(mbidRequest());
		expect(tuples()).toEqual([tuple('recording', 'budget_exhausted')]);
	});

	test('a real 429 through a slot with room stays rate_limited, with a duration', async () => {
		await createEnrichmentEngine({
			plugins: [
				plugin(async () => new Response('slow down', { status: 429 }), {
					requestSlot: createRequestSlot({ minSpacingMs: 0, maxQueue: 0 }),
				}),
			],
		}).enrich(mbidRequest());
		expect(tuples()).toEqual([tuple('recording', 'error', 'rate_limited')]);
		expect(events.find((e) => e.type === 'provider_request')).toHaveProperty('durationMs');
	});
});
