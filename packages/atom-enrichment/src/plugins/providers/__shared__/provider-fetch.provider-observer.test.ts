import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderReason,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import {
	getProcessRequestSlot,
	resetProcessRequestSlotsForTests,
} from '@0xintuition/pipeline-runtime/request-slot';
import { z } from 'zod/v4';
import { useStubbedPublicDns } from '../../../testing';
import {
	createPinAwareFetch,
	type FetchLike,
	fetchJson,
	fetchText,
	type PinAwareFetch,
	type PinnedRequestInit,
	parseProviderJson,
	wrapPinAwareFetch,
} from './http';
import {
	describeProviderFetchFailure,
	fetchProviderJson,
	fetchProviderText,
	type ProviderFetchFailureKind,
	ProviderHttpError,
	rejectWikimediaMaxlag,
	WIKIMEDIA_USER_AGENT,
} from './provider-fetch';

useStubbedPublicDns();

const URL_OK = 'https://api.spotify.com/v1/tracks/abc';
// `spotify|item` is a registered pair; the helper is provider-agnostic.
const observe = {
	provider: 'spotify',
	operation: 'item',
	statusOutcomes: { 404: 'miss' },
} as const;

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
const live = (
	outcome: 'hit' | 'miss' | 'error' | 'budget_exhausted',
	reason: ProviderReason = 'none'
) => ({
	provider: 'spotify' as const,
	operation: 'item' as const,
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
afterEach(() => {
	resetProviderObserversForTests();
	resetProcessRequestSlotsForTests();
});

const json = (body: unknown, init?: ResponseInit) =>
	new Response(JSON.stringify(body), {
		headers: { 'content-type': 'application/json' },
		...init,
	});

/** A fetch that only ever settles by the caller's signal: a helper that drops it hangs. */
const hangUntilAborted = () => {
	let seen: AbortSignal | undefined;
	const fetcher = createPinAwareFetch(
		(_url, init) =>
			new Promise<Response>((_resolve, reject) => {
				seen = init?.signal ?? undefined;
				init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
			})
	);
	return { fetcher, signalSeen: () => seen };
};

/** Fails the test (rather than hanging it) when a promise does not settle. */
const settles = async <T>(promise: Promise<T>, ms = 1500): Promise<T> => {
	let timer: ReturnType<typeof setTimeout> | undefined;
	try {
		return await Promise.race([
			promise,
			new Promise<never>((_, reject) => {
				timer = setTimeout(() => reject(new Error('did not settle: signal ignored')), ms);
			}),
		]);
	} finally {
		clearTimeout(timer);
	}
};

describe('fetchProviderJson', () => {
	it('returns the parsed body through the pinned transport, with the headers and a hit', async () => {
		let dial: PinnedRequestInit | undefined;
		let dialUrl = '';
		const fetcher = createPinAwareFetch(async (url, init) => {
			dialUrl = url;
			dial = init;
			return json({ id: 'abc' });
		});

		const value = await fetchProviderJson({
			fetch: fetcher,
			url: URL_OK,
			schema: z.object({ id: z.string() }),
			userAgent: WIKIMEDIA_USER_AGENT,
			headers: { accept: 'application/json' },
			observe,
		});

		expect(value).toEqual({ id: 'abc' });
		expect(dialUrl).toBe(URL_OK);
		// The guarded hop resolved the host and pinned the dial to the validated address.
		expect(dial?.connection?.hostname).toBe('api.spotify.com');
		expect(dial?.connection?.address).toBeTruthy();
		expect(dial?.redirect).toBe('manual');
		const headers = new Headers(dial?.headers);
		expect(headers.get('user-agent')).toBe(WIKIMEDIA_USER_AGENT);
		expect(headers.get('accept')).toBe('application/json');
		expect(tuples()).toEqual([live('hit')]);
	});

	it('records nothing when no observation is requested', async () => {
		await fetchProviderJson({
			fetch: createPinAwareFetch(async () => json({})),
			url: URL_OK,
		});
		expect(tuples()).toEqual([]);
	});

	it('pins a descriptive Wikimedia User-Agent with an intuition.systems contact', () => {
		expect(WIKIMEDIA_USER_AGENT).toMatch(
			/^\S+\/\S+ \(https:\/\/intuition\.systems; \S+@intuition\.systems\)$/
		);
	});

	describe('signal, timeout and deadline', () => {
		it('hands the caller signal to the dial and rejects when the caller cancels, recording nothing', async () => {
			const { fetcher, signalSeen } = hangUntilAborted();
			const controller = new AbortController();
			const pending = fetchProviderJson({
				fetch: fetcher,
				url: URL_OK,
				signal: controller.signal,
				observe,
			});
			const outcome = settles(
				pending.then(
					() => 'resolved',
					(error: unknown) => error
				)
			);
			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(signalSeen()).toBeDefined();
			controller.abort(new DOMException('caller left', 'AbortError'));
			const error = await outcome;
			expect((error as Error).name).toBe('AbortError');
			expect(tuples()).toEqual([]);
		});

		it('records a timeout when the engine deadline aborts the signal', async () => {
			const { fetcher } = hangUntilAborted();
			const controller = new AbortController();
			const deadlineAtMs = Date.now() + 40;
			setTimeout(() => controller.abort(new DOMException('deadline', 'AbortError')), 40);
			await expect(
				settles(
					fetchProviderJson({
						fetch: fetcher,
						url: URL_OK,
						signal: controller.signal,
						deadlineAtMs,
						observe,
					})
				)
			).rejects.toThrow();
			expect(tuples()).toEqual([live('error', 'timeout')]);
		});

		it('fires its own timeoutMs as a provider timeout even without a caller signal', async () => {
			const { fetcher } = hangUntilAborted();
			const error = await settles(
				fetchProviderJson({ fetch: fetcher, url: URL_OK, timeoutMs: 30, observe }).then(
					() => undefined,
					(caught: unknown) => caught
				)
			);
			expect((error as Error).name).toBe('TimeoutError');
			expect(tuples()).toEqual([live('error', 'timeout')]);
			expect(describeProviderFetchFailure(error)).toEqual({ kind: 'timeout' });
		});

		it('combines a caller signal and timeoutMs: either one ends the request', async () => {
			const { fetcher } = hangUntilAborted();
			const controller = new AbortController();
			const error = await settles(
				fetchProviderJson({
					fetch: fetcher,
					url: URL_OK,
					signal: controller.signal,
					timeoutMs: 30,
				}).then(
					() => undefined,
					(caught: unknown) => caught
				)
			);
			expect((error as Error).name).toBe('TimeoutError');
			expect(controller.signal.aborted).toBe(false);
		});

		it('never dials with an already aborted signal and records nothing', async () => {
			let dialed = false;
			const controller = new AbortController();
			controller.abort();
			await expect(
				fetchProviderJson({
					fetch: createPinAwareFetch(async () => {
						dialed = true;
						return json({});
					}),
					url: URL_OK,
					signal: controller.signal,
					observe,
				})
			).rejects.toThrow();
			expect(dialed).toBe(false);
			expect(tuples()).toEqual([]);
		});
	});

	describe('body cap', () => {
		it('refuses a body over maxResponseBytes read as a stream, as invalid_response', async () => {
			const chunk = new TextEncoder().encode(`"${'x'.repeat(600)}"`);
			const fetcher = createPinAwareFetch(
				async () =>
					new Response(
						new ReadableStream({
							start(controller) {
								controller.enqueue(chunk);
								controller.enqueue(chunk);
								controller.close();
							},
						})
					)
			);
			const error = await fetchProviderJson({
				fetch: fetcher,
				url: URL_OK,
				maxResponseBytes: 1000,
				observe,
			}).catch((caught: unknown) => caught);
			expect(error).toBeInstanceOf(ProviderHttpError);
			expect((error as ProviderHttpError).errorClass).toBe('response_too_large');
			expect((error as ProviderHttpError).status).toBe(413);
			expect(tuples()).toEqual([live('error', 'invalid_response')]);
			expect(describeProviderFetchFailure(error)).toMatchObject({
				kind: 'body_limit',
				status: 413,
			});
		});

		it('refuses on a declared content-length without reading the body', async () => {
			const fetcher = createPinAwareFetch(
				async () => new Response('{}', { headers: { 'content-length': '5000' } })
			);
			await expect(
				fetchProviderJson({ fetch: fetcher, url: URL_OK, maxResponseBytes: 1000 })
			).rejects.toMatchObject({ errorClass: 'response_too_large' });
		});

		it('accepts a body exactly at the cap and applies the 1 MiB default ceiling', async () => {
			const body = JSON.stringify('y'.repeat(98));
			expect(body.length).toBe(100);
			await expect(
				fetchProviderJson({
					fetch: createPinAwareFetch(async () => new Response(body)),
					url: URL_OK,
					maxResponseBytes: 100,
				})
			).resolves.toBe('y'.repeat(98));
			// A caller cannot raise the cap above the shared ceiling.
			const big = JSON.stringify('z'.repeat(1_048_576));
			await expect(
				fetchProviderJson({
					fetch: createPinAwareFetch(async () => new Response(big)),
					url: URL_OK,
					maxResponseBytes: 10_000_000,
				})
			).rejects.toMatchObject({ errorClass: 'response_too_large' });
		});
	});

	describe('structured failures', () => {
		it('turns a status into a ProviderHttpError with status and retryAfterMs, never message text', async () => {
			const fetcher = createPinAwareFetch(
				async () =>
					new Response('secret upstream text', { status: 429, headers: { 'retry-after': '7' } })
			);
			const error = await fetchProviderJson({ fetch: fetcher, url: URL_OK, observe }).catch(
				(caught: unknown) => caught
			);
			expect(error).toBeInstanceOf(ProviderHttpError);
			expect(error).toMatchObject({ status: 429, retryAfterMs: 7000 });
			expect((error as Error).message).not.toContain('secret');
			expect(describeProviderFetchFailure(error)).toEqual({
				kind: 'non_ok_status',
				status: 429,
				retryAfterMs: 7000,
			});
			expect(tuples()).toEqual([live('error', 'rate_limited')]);
		});

		it('maps statusOutcomes: 404 is a miss, 401 stays a plain 4xx unless declared', async () => {
			const status = (code: number) =>
				createPinAwareFetch(async () => new Response('', { status: code }));
			await expect(
				fetchProviderJson({ fetch: status(404), url: URL_OK, observe })
			).rejects.toMatchObject({ status: 404 });
			await expect(
				fetchProviderJson({
					fetch: status(401),
					url: URL_OK,
					observe: { ...observe, statusOutcomes: { 401: 'auth_failed' } },
				})
			).rejects.toMatchObject({ status: 401 });
			await expect(
				fetchProviderJson({ fetch: status(401), url: URL_OK, observe })
			).rejects.toThrow();
			expect(tuples()).toEqual([
				live('miss'),
				live('error', 'auth_failed'),
				live('error', 'http_4xx'),
			]);
		});

		it('uses a custom classifyError when given', async () => {
			await expect(
				fetchProviderJson({
					fetch: createPinAwareFetch(async () => new Response('', { status: 500 })),
					url: URL_OK,
					observe: {
						provider: 'spotify',
						operation: 'item',
						classifyError: () => ({ outcome: 'miss', reason: 'none' }),
					},
				})
			).rejects.toThrow();
			expect(tuples()).toEqual([live('miss')]);
		});

		it('carries statusClasses and the captured OAuth error code to the error', async () => {
			const fetcher = createPinAwareFetch(
				async () => new Response(JSON.stringify({ error: 'invalid_client' }), { status: 400 })
			);
			const error = await fetchProviderJson({
				fetch: fetcher,
				url: URL_OK,
				http: { captureErrorCode: true },
			}).catch((caught: unknown) => caught);
			expect(error).toMatchObject({ status: 400, errorCode: 'invalid_client' });
			const classed = await fetchProviderJson({
				fetch: createPinAwareFetch(async () => new Response('', { status: 503 })),
				url: URL_OK,
				http: { statusClasses: { 503: 'rate_limited' } },
			}).catch((caught: unknown) => caught);
			expect(classed).toMatchObject({ status: 503, errorClass: 'rate_limited' });
		});

		it('treats invalid JSON and a schema mismatch as invalid_response', async () => {
			await expect(
				fetchProviderJson({
					fetch: createPinAwareFetch(async () => new Response('<html>')),
					url: URL_OK,
					observe,
				})
			).rejects.toMatchObject({ errorClass: 'invalid_json' });
			const mismatch = await fetchProviderJson({
				fetch: createPinAwareFetch(async () => json({ id: 7 })),
				url: URL_OK,
				schema: z.object({ id: z.string() }),
				observe,
			}).catch((caught: unknown) => caught);
			expect(mismatch).toBeInstanceOf(z.ZodError);
			expect(describeProviderFetchFailure(mismatch)).toEqual({ kind: 'parse_failure' });
			expect(tuples()).toEqual([
				live('error', 'invalid_response'),
				live('error', 'invalid_response'),
			]);
		});

		it('records a classifyResult miss for a 200 that holds nothing', async () => {
			await fetchProviderJson({
				fetch: createPinAwareFetch(async () => json({ items: [] })),
				url: URL_OK,
				observe: {
					...observe,
					classifyResult: (value: { items: unknown[] }) => (value.items.length ? 'hit' : 'miss'),
				},
			});
			expect(tuples()).toEqual([live('miss')]);
		});
	});

	describe('guards', () => {
		it('refuses a private target before dialling, as blocked / ssrf_rejected', async () => {
			let dialed = false;
			const error = await fetchProviderJson({
				fetch: createPinAwareFetch(async () => {
					dialed = true;
					return json({});
				}),
				url: 'http://169.254.169.254/latest/meta-data',
				observe,
			}).catch((caught: unknown) => caught);
			expect(dialed).toBe(false);
			expect(error).toMatchObject({ errorClass: 'target_rejected' });
			expect(describeProviderFetchFailure(error)).toMatchObject({ kind: 'ssrf_rejected' });
			expect(tuples()).toEqual([live('error', 'blocked')]);
		});

		it('refuses an embargoed host', async () => {
			const error = await fetchProviderJson({
				fetch: createPinAwareFetch(async () => json({})),
				url: 'https://www.imdb.com/title/tt0111161/',
			}).catch((caught: unknown) => caught);
			expect(error).toMatchObject({ errorClass: 'embargoed_host' });
			expect(describeProviderFetchFailure(error)).toMatchObject({ kind: 'embargoed_host' });
		});

		it('follows a guarded redirect by default and refuses one with redirect: error', async () => {
			const calls: string[] = [];
			const fetcher = createPinAwareFetch(async (url) => {
				calls.push(url);
				return url.endsWith('/a')
					? new Response(null, { status: 302, headers: { location: 'https://api.spotify.com/b' } })
					: json({ ok: true });
			});
			await expect(
				fetchProviderJson({ fetch: fetcher, url: 'https://api.spotify.com/a' })
			).resolves.toEqual({ ok: true });
			expect(calls).toEqual(['https://api.spotify.com/a', 'https://api.spotify.com/b']);

			calls.length = 0;
			const error = await fetchProviderJson({
				fetch: fetcher,
				url: 'https://api.spotify.com/a',
				redirect: 'error',
				observe,
			}).catch((caught: unknown) => caught);
			expect(calls).toEqual(['https://api.spotify.com/a']);
			expect(error).toMatchObject({ errorClass: 'redirect_rejected' });
			expect(describeProviderFetchFailure(error)).toMatchObject({
				kind: 'redirect_rejected',
				status: 302,
			});
		});

		it('rejects a redirect into a private address, strips credentials cross-origin', async () => {
			const seen: Array<{ url: string; auth: string | null }> = [];
			const fetcher = createPinAwareFetch(async (url, init) => {
				seen.push({ url, auth: new Headers(init?.headers).get('authorization') });
				return new Response(null, {
					status: 302,
					headers: {
						location: url.includes('spotify') ? 'https://other.example/x' : 'http://10.0.0.1/',
					},
				});
			});
			const error = await fetchProviderJson({
				fetch: fetcher,
				url: URL_OK,
				headers: { authorization: 'Bearer fake-token' },
			}).catch((caught: unknown) => caught);
			expect(seen.map((s) => s.auth)).toEqual(['Bearer fake-token', null]);
			expect(error).toMatchObject({ errorClass: 'target_rejected' });
		});
	});

	describe('request slot', () => {
		it('paces through the slot and records a hit once', async () => {
			const slot = getProcessRequestSlot('provider-fetch-test', { minSpacingMs: 0 });
			await fetchProviderJson({
				fetch: createPinAwareFetch(async () => json({ id: 1 })),
				url: URL_OK,
				observe: { ...observe, slot },
			});
			expect(tuples()).toEqual([live('hit')]);
		});

		it('counts a request the slot cannot fit before the deadline as budget_exhausted (no duration), and never dials it', async () => {
			// `musicbrainz|recording` declares `budget_exhausted`; the top-level `slot` is the supported input.
			const slotted = { provider: 'musicbrainz', operation: 'recording' } as const;
			const slot = getProcessRequestSlot('provider-fetch-test-wait', { minSpacingMs: 500 });
			await fetchProviderJson({
				fetch: createPinAwareFetch(async () => json({})),
				url: URL_OK,
				observe: slotted,
				slot,
			});
			events.length = 0;
			let dialed = false;
			const controller = new AbortController();
			const deadlineAtMs = Date.now() + 30;
			setTimeout(() => controller.abort(new DOMException('deadline', 'AbortError')), 30);
			await expect(
				settles(
					fetchProviderJson({
						fetch: createPinAwareFetch(async () => {
							dialed = true;
							return json({});
						}),
						url: URL_OK,
						signal: controller.signal,
						deadlineAtMs,
						observe: slotted,
						slot,
					})
				)
			).rejects.toThrow();
			expect(dialed).toBe(false);
			expect(tuples()).toEqual([
				{ ...live('budget_exhausted'), operation: 'recording', provider: 'musicbrainz' },
			]);
			const recorded = events.filter((event) => event.type === 'provider_request');
			expect(recorded).toHaveLength(1);
			expect(recorded[0]).not.toHaveProperty('durationMs');
		});

		it('records the dialled hit through the top-level slot with a duration', async () => {
			const slot = getProcessRequestSlot('provider-fetch-test-dur', { minSpacingMs: 0 });
			await fetchProviderJson({
				fetch: createPinAwareFetch(async () => json({ id: 1 })),
				url: URL_OK,
				observe: { provider: 'musicbrainz', operation: 'recording' },
				slot,
			});
			const recorded = events.filter((event) => event.type === 'provider_request');
			expect(recorded).toHaveLength(1);
			expect(typeof (recorded[0] as { durationMs?: number }).durationMs).toBe('number');
		});
	});
});

describe('fetchProviderText', () => {
	it('returns the capped text with the same guards', async () => {
		await expect(
			fetchProviderText({
				fetch: createPinAwareFetch(async () => new Response('<xml/>')),
				url: URL_OK,
				observe: { provider: 'spotify', operation: 'oembed' },
			})
		).resolves.toBe('<xml/>');
		await expect(
			fetchProviderText({
				fetch: createPinAwareFetch(async () => new Response('x'.repeat(50))),
				url: URL_OK,
				maxResponseBytes: 10,
			})
		).rejects.toMatchObject({ errorClass: 'response_too_large' });
	});
});

describe('describeProviderFetchFailure', () => {
	it('is label-safe for non-HTTP errors', () => {
		expect(describeProviderFetchFailure(new Error('boom with an id 123'))).toEqual({
			kind: 'http_error',
		});
		expect(describeProviderFetchFailure(new SyntaxError('bad'))).toEqual({ kind: 'parse_failure' });
		expect(describeProviderFetchFailure(new DOMException('x', 'AbortError'))).toEqual({
			kind: 'timeout',
		});
	});
});

describe('describeProviderFetchFailure tells a caller cancel from a timeout (round-2 finding 9)', () => {
	const failure = async (input: Parameters<typeof fetchProviderJson>[0]) => {
		const error = await settles(
			fetchProviderJson(input).then(
				() => undefined,
				(caught: unknown) => caught
			)
		);
		return describeProviderFetchFailure(error, {
			signal: input.signal,
			deadlineAtMs: input.deadlineAtMs,
		});
	};

	it('a caller cancel is `cancelled`, not `timeout` (observed and unobserved)', async () => {
		for (const observed of [observe, undefined]) {
			const { fetcher } = hangUntilAborted();
			const controller = new AbortController();
			setTimeout(() => controller.abort(new DOMException('caller left', 'AbortError')), 20);
			const kind = await failure({
				fetch: fetcher,
				url: URL_OK,
				signal: controller.signal,
				deadlineAtMs: Date.now() + 60_000,
				...(observed ? { observe: observed } : {}),
			});
			expect(kind).toEqual({ kind: 'cancelled' });
		}
		expect(tuples()).toEqual([]);
	});

	it('the engine deadline is `timeout`', async () => {
		const { fetcher } = hangUntilAborted();
		const controller = new AbortController();
		setTimeout(() => controller.abort(new DOMException('deadline', 'AbortError')), 40);
		const result = await failure({
			fetch: fetcher,
			url: URL_OK,
			signal: controller.signal,
			deadlineAtMs: Date.now() + 40,
			observe,
		});
		expect(result).toEqual({ kind: 'timeout' });
		expect(tuples()).toEqual([live('error', 'timeout')]);
	});

	it('the helper timeoutMs timer is `timeout`, with or without a caller signal', async () => {
		const { fetcher } = hangUntilAborted();
		expect(await failure({ fetch: fetcher, url: URL_OK, timeoutMs: 30 })).toEqual({
			kind: 'timeout',
		});
		const controller = new AbortController();
		expect(
			await failure({
				fetch: fetcher,
				url: URL_OK,
				timeoutMs: 30,
				signal: controller.signal,
				deadlineAtMs: Date.now() + 60_000,
			})
		).toEqual({ kind: 'timeout' });
	});

	it('a stray AbortError while no caller signal is aborted is not a cancel', async () => {
		const stray = createPinAwareFetch(async () => {
			throw new DOMException('stream reset', 'AbortError');
		});
		// No signal at all, and a live (never aborted) signal: both keep the `timeout` answer.
		expect(await failure({ fetch: stray, url: URL_OK })).toEqual({ kind: 'timeout' });
		const controller = new AbortController();
		const error = await fetchProviderJson({
			fetch: stray,
			url: URL_OK,
			signal: controller.signal,
			deadlineAtMs: Date.now() + 60_000,
		}).catch((caught: unknown) => caught);
		expect(describeProviderFetchFailure(error, { signal: controller.signal })).toEqual({
			kind: 'timeout',
		});
	});

	it('two calls on one signal share the abort reason, and each is described by its own context', async () => {
		const { fetcher } = hangUntilAborted();
		const controller = new AbortController();
		const deadlineAtMs = Date.now() + 40;
		setTimeout(() => controller.abort(), 40);
		const [withoutDeadline, withDeadline] = await Promise.all(
			[undefined, deadlineAtMs].map((deadline) =>
				fetchProviderJson({
					fetch: fetcher,
					url: URL_OK,
					signal: controller.signal,
					...(deadline === undefined ? {} : { deadlineAtMs: deadline }),
				}).catch((caught: unknown) => caught)
			)
		);
		expect(withDeadline).toBe(withoutDeadline);
		// The engine deadline is a timeout for the call that carries it, whatever its sibling says.
		expect(
			describeProviderFetchFailure(withDeadline, { signal: controller.signal, deadlineAtMs })
		).toEqual({ kind: 'timeout' });
		expect(describeProviderFetchFailure(withoutDeadline, { signal: controller.signal })).toEqual({
			kind: 'cancelled',
		});
		expect(
			describeProviderFetchFailure(withDeadline, { signal: controller.signal, deadlineAtMs })
		).toEqual({ kind: 'timeout' });
	});

	it('an untagged AbortError keeps the old `timeout` answer', () => {
		expect(describeProviderFetchFailure(new DOMException('x', 'AbortError'))).toEqual({
			kind: 'timeout',
		});
	});
});

const MAXLAG_HEADERS = { 'retry-after': '5', 'mediawiki-api-error': 'maxlag' };
const maxlagResponse = () =>
	json(
		{ error: { code: 'maxlag', info: 'Waiting for a database server' } },
		{ headers: MAXLAG_HEADERS }
	);
const rateLimitedObserve = { ...observe, statusOutcomes: { 429: 'rate_limited' } } as const;

describe('rejectOk: a 2xx that is really an error (Wikimedia maxlag, finding 1)', () => {
	it('baseline: without the hook a maxlag 200 is a hit', async () => {
		await fetchProviderJson({
			fetch: createPinAwareFetch(async () => maxlagResponse()),
			url: URL_OK,
			observe: rateLimitedObserve,
		});
		expect(tuples()).toEqual([live('hit')]);
	});

	it('records error/rate_limited and carries retryAfterMs 5000 for the exact Wikimedia fixture', async () => {
		const error = await fetchProviderJson({
			fetch: createPinAwareFetch(async () => maxlagResponse()),
			url: URL_OK,
			rejectOk: rejectWikimediaMaxlag,
			observe: rateLimitedObserve,
		}).catch((caught: unknown) => caught);
		expect(error).toBeInstanceOf(ProviderHttpError);
		expect(error).toMatchObject({ status: 429, retryAfterMs: 5000 });
		expect(tuples()).toEqual([live('error', 'rate_limited')]);
		expect(describeProviderFetchFailure(error)).toEqual({
			kind: 'non_ok_status',
			status: 429,
			retryAfterMs: 5000,
			errorCode: 'maxlag',
		});
	});

	it('leaves an ordinary 200 alone, and a custom hook sees status and headers and runs before the body is read', async () => {
		await expect(
			fetchProviderJson({
				fetch: createPinAwareFetch(async () => json({ id: 1 })),
				url: URL_OK,
				rejectOk: rejectWikimediaMaxlag,
				observe,
			})
		).resolves.toEqual({ id: 1 });
		let seen: { status: number; xa: string | null } | undefined;
		let bodyCancelled = false;
		const stream = new ReadableStream({
			cancel() {
				bodyCancelled = true;
			},
		});
		const error = await fetchProviderText({
			fetch: createPinAwareFetch(
				async () => new Response(stream, { status: 200, headers: { 'x-a': '1' } })
			),
			url: URL_OK,
			rejectOk: ({ status, headers }) => {
				seen = { status, xa: headers.get('x-a') };
				return new ProviderHttpError({ status: 503, errorClass: 'custom_2xx_error' });
			},
		}).catch((caught: unknown) => caught);
		expect(seen).toEqual({ status: 200, xa: '1' });
		expect(error).toMatchObject({ status: 503, errorClass: 'custom_2xx_error' });
		expect(bodyCancelled).toBe(true);
	});

	it('is also honoured by the http.ts fetchText / fetchJson the helper is built on', async () => {
		const fetcher = createPinAwareFetch(async () => maxlagResponse());
		const options = { rejectOk: rejectWikimediaMaxlag };
		await expect(fetchText(fetcher, URL_OK, undefined, options)).rejects.toMatchObject({
			status: 429,
			retryAfterMs: 5000,
		});
		await expect(fetchJson(fetcher, URL_OK, undefined, options)).rejects.toMatchObject({
			status: 429,
		});
	});
});

describe('the pin-aware fetch seam (finding 2)', () => {
	it('is typed as PinAwareFetch: a plain fetcher is a compile error', () => {
		const plain: FetchLike = async () => json({});
		const branded: PinAwareFetch = createPinAwareFetch(plain);
		// Never executed: this block exists for the typechecker.
		const typeOnly = () => {
			// @ts-expect-error a plain fetcher would be silently ignored at runtime
			void fetchProviderJson({ url: URL_OK, fetch: plain });
			void fetchProviderJson({ url: URL_OK, fetch: branded });
		};
		expect(typeof typeOnly).toBe('function');
	});

	it('wrapPinAwareFetch lets a caller pace a pin-aware dial and keeps the pinned connection', async () => {
		let dialInit: PinnedRequestInit | undefined;
		const inner = createPinAwareFetch(async (_url, init) => {
			dialInit = init;
			return json({ ok: true });
		});
		const order: string[] = [];
		const paced = wrapPinAwareFetch(inner, async (dial, url, init) => {
			order.push('before');
			const response = await dial(url, init);
			order.push('after');
			return response;
		});
		await expect(fetchProviderJson({ fetch: paced, url: URL_OK })).resolves.toEqual({ ok: true });
		expect(order).toEqual(['before', 'after']);
		expect(dialInit?.connection?.hostname).toBe('api.spotify.com');
	});

	it('wrap runs once per hop, redirects included, and the default dial is wrapped too', async () => {
		const dialed: string[] = [];
		const inner = createPinAwareFetch(async (url) => {
			dialed.push(url);
			return dialed.length === 1
				? new Response(null, { status: 302, headers: { location: 'https://api.spotify.com/v1/b' } })
				: json({ ok: true });
		});
		const paced: string[] = [];
		const wrapped = wrapPinAwareFetch(inner, async (dial, url, init) => {
			paced.push(url);
			return dial(url, init);
		});
		await expect(fetchProviderJson({ fetch: wrapped, url: URL_OK })).resolves.toEqual({ ok: true });
		expect(paced).toEqual([URL_OK, 'https://api.spotify.com/v1/b']);
		expect(dialed).toEqual(paced);

		// `undefined` inner: the pinned Node transport is the dial; wrap still sees every hop.
		const seen: string[] = [];
		const viaDefault = wrapPinAwareFetch(undefined, async (_dial, url) => {
			seen.push(url);
			return json({ ok: true });
		});
		await expect(fetchProviderJson({ fetch: viaDefault, url: URL_OK })).resolves.toEqual({
			ok: true,
		});
		expect(seen).toEqual([URL_OK]);
	});
});

describe('single JSON contract in http.ts (finding 3)', () => {
	it('parseProviderJson is the one invalid_json producer for fetchJson and the helper', async () => {
		expect(parseProviderJson<{ a: number }>('{"a":1}')).toEqual({ a: 1 });
		expect(() => parseProviderJson('<html>')).toThrow(ProviderHttpError);
		const bad = createPinAwareFetch(async () => new Response('<html>'));
		const viaHttp = await fetchJson(bad, URL_OK).catch((caught: unknown) => caught);
		const viaHelper = await fetchProviderJson({ fetch: bad, url: URL_OK }).catch(
			(caught: unknown) => caught
		);
		expect(viaHttp).toMatchObject({ status: 502, errorClass: 'invalid_json' });
		expect(viaHelper).toMatchObject({ status: 502, errorClass: 'invalid_json' });
	});
});

describe('describeProviderFetchFailure maps by meaning (finding 4)', () => {
	it('a statusClasses class on a throttled 503 is non_ok_status, not parse_failure', async () => {
		const error = await fetchProviderJson({
			fetch: createPinAwareFetch(
				async () => new Response('', { status: 503, headers: { 'retry-after': '3' } })
			),
			url: URL_OK,
			http: { statusClasses: { 503: 'rate_limited' } },
			observe: { ...observe, statusOutcomes: { 503: 'rate_limited' } },
		}).catch((caught: unknown) => caught);
		expect(error).toMatchObject({ status: 503, errorClass: 'rate_limited' });
		expect(describeProviderFetchFailure(error)).toEqual({
			kind: 'non_ok_status',
			status: 503,
			retryAfterMs: 3000,
		});
	});

	it('maps every producer to its own kind', () => {
		const http = (errorClass: string, status: number) =>
			describeProviderFetchFailure(new ProviderHttpError({ errorClass, status })).kind;
		const kinds: Record<string, ProviderFetchFailureKind> = {
			response_too_large: http('response_too_large', 413),
			embargoed_host: http('embargoed_host', 403),
			target_rejected: http('target_rejected', 400),
			redirect_exhausted: http('redirect_exhausted', 302),
			invalid_json: http('invalid_json', 502),
		};
		expect(kinds).toEqual({
			response_too_large: 'body_limit',
			embargoed_host: 'embargoed_host',
			target_rejected: 'ssrf_rejected',
			redirect_exhausted: 'redirect_exhausted',
			invalid_json: 'parse_failure',
		});
		const dns = Object.assign(new Error('getaddrinfo ENOTFOUND secret.example'), {
			code: 'ENOTFOUND',
		});
		expect(describeProviderFetchFailure(dns)).toEqual({ kind: 'dns_failure' });
		expect(describeProviderFetchFailure(new Error('x', { cause: dns }))).toEqual({
			kind: 'dns_failure',
		});
	});

	it('a resolver failure on the REAL guarded hop is dns_failure; a private address stays ssrf_rejected', async () => {
		const inner = createPinAwareFetch(async () => json({ ok: true }));
		const run = (resolve: (hostname: string) => Promise<{ address: string; family: 4 | 6 }[]>) =>
			fetchProviderJson({ fetch: inner, url: URL_OK, http: { resolve }, observe }).catch(
				(caught: unknown) => caught
			);
		for (const code of ['ENOTFOUND', 'EAI_AGAIN']) {
			events = [];
			const failed = await run(async () => {
				throw Object.assign(new Error(`getaddrinfo ${code} secret.example`), { code });
			});
			expect(failed).toBeInstanceOf(ProviderHttpError);
			expect(describeProviderFetchFailure(failed)).toEqual({ kind: 'dns_failure', status: 400 });
			// The metric is what it was for the same refusal before the diagnostic split.
			expect(tuples()).toEqual([live('error', 'blocked')]);
		}
		events = [];
		const privateTarget = await run(async () => [{ address: '10.0.0.5', family: 4 }]);
		expect(describeProviderFetchFailure(privateTarget)).toEqual({
			kind: 'ssrf_rejected',
			status: 400,
		});
		expect(tuples()).toEqual([live('error', 'blocked')]);
		const loopback = await run(async () => [{ address: '127.0.0.1', family: 4 }]);
		expect(describeProviderFetchFailure(loopback)).toEqual({ kind: 'ssrf_rejected', status: 400 });
	});
});

describe('slot independent of observe (finding 5)', () => {
	it('paces an unobserved request through a top-level slot, with no metric', async () => {
		const slot = getProcessRequestSlot('provider-fetch-unobserved', { minSpacingMs: 60 });
		const starts: number[] = [];
		const fetcher = createPinAwareFetch(async () => {
			starts.push(Date.now());
			return json({});
		});
		await Promise.all([
			fetchProviderJson({ fetch: fetcher, url: URL_OK, slot }),
			fetchProviderJson({ fetch: fetcher, url: URL_OK, slot }),
		]);
		expect(starts).toHaveLength(2);
		expect((starts[1] as number) - (starts[0] as number)).toBeGreaterThanOrEqual(50);
		expect(tuples()).toEqual([]);
	});

	it('the old observe.slot location still paces and observes', async () => {
		const slot = getProcessRequestSlot('provider-fetch-legacy-slot', { minSpacingMs: 0 });
		await fetchProviderJson({
			fetch: createPinAwareFetch(async () => json({})),
			url: URL_OK,
			observe: { ...observe, slot },
		});
		expect(tuples()).toEqual([live('hit')]);
	});

	it('the slot run signal, not the caller signal, reaches the dial (observed and unobserved)', async () => {
		for (const observed of [true, false]) {
			const slot = getProcessRequestSlot(`provider-fetch-signal-${observed}`, { minSpacingMs: 0 });
			const caller = new AbortController();
			const { fetcher, signalSeen } = hangUntilAborted();
			const pending = fetchProviderJson({
				fetch: fetcher,
				url: URL_OK,
				signal: caller.signal,
				slot,
				...(observed ? { observe } : {}),
			}).catch((caught: unknown) => caught);
			await new Promise((resolve) => setTimeout(resolve, 20));
			expect(signalSeen()).toBeDefined();
			expect(signalSeen()).not.toBe(caller.signal);
			caller.abort(new DOMException('cancel', 'AbortError'));
			await settles(pending);
		}
	});

	it('a caller cancel while queued records nothing and never dials', async () => {
		const slot = getProcessRequestSlot('provider-fetch-queued', {
			minSpacingMs: 0,
			maxConcurrent: 1,
		});
		const holder = hangUntilAborted();
		const holderCancel = new AbortController();
		const first = fetchProviderJson({
			fetch: holder.fetcher,
			url: URL_OK,
			signal: holderCancel.signal,
			slot,
		}).catch((caught: unknown) => caught);
		await new Promise((resolve) => setTimeout(resolve, 10));
		events.length = 0;
		let dialed = false;
		const queuedCancel = new AbortController();
		const queued = fetchProviderJson({
			fetch: createPinAwareFetch(async () => {
				dialed = true;
				return json({});
			}),
			url: URL_OK,
			signal: queuedCancel.signal,
			observe: { ...observe, slot },
		}).catch((caught: unknown) => caught);
		await new Promise((resolve) => setTimeout(resolve, 10));
		queuedCancel.abort(new DOMException('cancel', 'AbortError'));
		await settles(queued);
		expect(dialed).toBe(false);
		expect(tuples()).toEqual([]);
		holderCancel.abort(new DOMException('cancel', 'AbortError'));
		await settles(first);
	});

	it('timeoutMs under a slot starts at the dial, not at the enqueue, and records timeout', async () => {
		const slot = getProcessRequestSlot('provider-fetch-timeout', {
			minSpacingMs: 120,
			maxConcurrent: 1,
		});
		await fetchProviderJson({
			fetch: createPinAwareFetch(async () => json({})),
			url: URL_OK,
			slot,
		});
		const { fetcher } = hangUntilAborted();
		const startedAt = Date.now();
		const error = await settles(
			fetchProviderJson({
				fetch: fetcher,
				url: URL_OK,
				timeoutMs: 40,
				observe: { ...observe, slot },
			}),
			3000
		).catch((caught: unknown) => caught);
		expect((error as Error).name).toBe('TimeoutError');
		// It waited ~120 ms for the lane first; a timer started at enqueue would have fired at 40 ms.
		expect(Date.now() - startedAt).toBeGreaterThanOrEqual(130);
		expect(tuples()).toEqual([live('error', 'timeout')]);
	});
});

describe('method and body (finding 6)', () => {
	it('forwards a POST body and refuses to replay it on a redirect', async () => {
		const calls: Array<{ url: string; method?: string; body?: unknown }> = [];
		const fetcher = createPinAwareFetch(async (url, init) => {
			calls.push({ url, method: init?.method, body: init?.body });
			return new Response(null, {
				status: 303,
				headers: { location: 'https://api.spotify.com/next' },
			});
		});
		const error = await fetchProviderJson({
			fetch: fetcher,
			url: URL_OK,
			method: 'POST',
			body: 'a=1',
		}).catch((caught: unknown) => caught);
		expect(calls).toEqual([{ url: URL_OK, method: 'POST', body: 'a=1' }]);
		expect(error).toMatchObject({ errorClass: 'redirect_rejected', status: 303 });
	});

	it('a GET still follows a redirect by default', async () => {
		const calls: string[] = [];
		const fetcher = createPinAwareFetch(async (url) => {
			calls.push(url);
			return calls.length === 1
				? new Response(null, { status: 302, headers: { location: 'https://api.spotify.com/b' } })
				: json({ ok: true });
		});
		await expect(fetchProviderJson({ fetch: fetcher, url: URL_OK })).resolves.toEqual({ ok: true });
		expect(calls).toHaveLength(2);
	});

	it('the method check is case-insensitive: "get" follows a redirect, "post" does not', async () => {
		const run = async (method: string) => {
			const calls: string[] = [];
			const fetcher = createPinAwareFetch(async (url) => {
				calls.push(url);
				return calls.length === 1
					? new Response(null, { status: 302, headers: { location: 'https://api.spotify.com/b' } })
					: json({ ok: true });
			});
			const result = await fetchProviderJson({ fetch: fetcher, url: URL_OK, method }).catch(
				(caught: unknown) => caught
			);
			return { result, calls: calls.length };
		};
		expect(await run('get')).toEqual({ result: { ok: true }, calls: 2 });
		const post = await run('post');
		expect(post.calls).toBe(1);
		expect(post.result).toMatchObject({ errorClass: 'redirect_rejected' });
	});
});

describe('credentialHeaders (finding 7)', () => {
	it('strips caller-named headers on a cross-origin redirect and keeps them same-origin', async () => {
		const seen: Array<{ url: string; key: string | null; other: string | null }> = [];
		const fetcher = createPinAwareFetch(async (url, init) => {
			const headers = new Headers(init?.headers);
			seen.push({ url, key: headers.get('x-api-key'), other: headers.get('x-trace') });
			if (seen.length === 1) {
				return new Response(null, {
					status: 302,
					headers: { location: 'https://api.spotify.com/same' },
				});
			}
			if (seen.length === 2) {
				return new Response(null, {
					status: 302,
					headers: { location: 'https://other.example/x' },
				});
			}
			return json({ ok: true });
		});
		await fetchProviderJson({
			fetch: fetcher,
			url: URL_OK,
			headers: { 'x-api-key': 'fake-key', 'x-trace': 't' },
			credentialHeaders: ['X-Api-Key'],
		});
		expect(seen.map((s) => [s.key, s.other])).toEqual([
			['fake-key', 't'],
			['fake-key', 't'],
			[null, 't'],
		]);
	});
});

describe('fetchProviderText observation (finding 10)', () => {
	it('records the hit and the error tuple', async () => {
		await fetchProviderText({
			fetch: createPinAwareFetch(async () => new Response('<xml/>')),
			url: URL_OK,
			observe: { provider: 'spotify', operation: 'oembed' },
		});
		await fetchProviderText({
			fetch: createPinAwareFetch(async () => new Response('', { status: 429 })),
			url: URL_OK,
			observe: {
				provider: 'spotify',
				operation: 'oembed',
				statusOutcomes: { 429: 'rate_limited' },
			},
		}).catch(() => undefined);
		const oembed = (outcome: 'hit' | 'error', reason: ProviderReason) => ({
			...live(outcome, reason),
			operation: 'oembed' as const,
		});
		expect(tuples()).toEqual([oembed('hit', 'none'), oembed('error', 'rate_limited')]);
	});
});

describe('Google-shaped error reasons via captureErrorCode (lane 5)', () => {
	const googleError = (status: number, error: unknown) =>
		createPinAwareFetch(async () => json({ error }, { status }));
	const google400 = {
		code: 400,
		message: 'API key not valid. Please pass a valid API key.',
		status: 'INVALID_ARGUMENT',
		errors: [{ message: 'API key not valid', domain: 'global', reason: 'badRequest' }],
		details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'API_KEY_INVALID' }],
	};
	const byReason = {
		...observe,
		statusOutcomes: { 400: { byErrorCode: { API_KEY_INVALID: 'auth_failed' } } },
	} as const;

	it('tells a YouTube 400 API_KEY_INVALID from another 400 through byErrorCode', async () => {
		const invalid = await fetchProviderJson({
			fetch: googleError(400, google400),
			url: URL_OK,
			http: { captureErrorCode: true },
			observe: byReason,
		}).catch((caught: unknown) => caught);
		expect(invalid).toMatchObject({ status: 400, errorCode: 'API_KEY_INVALID' });
		expect((invalid as Error).message).not.toContain('API key not valid');
		const other = await fetchProviderJson({
			fetch: googleError(400, { ...google400, details: undefined, errors: undefined }),
			url: URL_OK,
			http: { captureErrorCode: true },
			observe: byReason,
		}).catch((caught: unknown) => caught);
		expect(other).toMatchObject({ status: 400, errorCode: 'INVALID_ARGUMENT' });
		expect(tuples()).toEqual([live('error', 'auth_failed'), live('error', 'http_4xx')]);
	});

	it('falls back to errors[].reason, keeps the OAuth string form, and drops free text', async () => {
		const code = async (error: unknown) =>
			(
				(await fetchProviderJson({
					fetch: googleError(403, error),
					url: URL_OK,
					http: { captureErrorCode: true },
				}).catch((caught: unknown) => caught)) as ProviderHttpError
			).errorCode;
		expect(await code({ errors: [{ reason: 'quotaExceeded' }] })).toBe('quotaExceeded');
		expect(await code('invalid_client')).toBe('invalid_client');
		expect(
			await code({ details: [{ reason: 'not a token!' }], status: 'bad status text' })
		).toBeUndefined();
		expect(await code('Invalid Client')).toBeUndefined();
		// id-like reasons (digits) never reach diagnostics
		expect(await code({ errors: [{ reason: 'user12345' }] })).toBeUndefined();
		expect(await code({ status: 'a1b2c3d4e5f6' })).toBeUndefined();
		expect(await code({ details: [{ reason: 'API_KEY_INVALID' }] })).toBe('API_KEY_INVALID');
		expect(await code({ status: 'PERMISSION_DENIED' })).toBe('PERMISSION_DENIED');
		expect(await code({ errors: [{ reason: 'dailyLimitExceeded' }] })).toBe('dailyLimitExceeded');
		expect(await code({ errors: [{ reason: 'Mixed_case' }] })).toBeUndefined();
	});

	it('captures nothing unless the request opts in', async () => {
		const error = await fetchProviderJson({
			fetch: googleError(400, google400),
			url: URL_OK,
		}).catch((caught: unknown) => caught);
		expect((error as ProviderHttpError).errorCode).toBeUndefined();
	});
});
