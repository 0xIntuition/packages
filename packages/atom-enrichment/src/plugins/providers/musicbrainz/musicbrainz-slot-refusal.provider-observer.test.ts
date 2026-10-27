import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test';
import { resetProviderObserversForTests } from '@0xintuition/pipeline-runtime/provider-observer';
import {
	createRequestSlot,
	RequestSlotRejectedError,
	RequestSlotTimeoutError,
	resetProcessRequestSlotsForTests,
} from '@0xintuition/pipeline-runtime/request-slot';
import {
	createHeldRequestSlot,
	createRefusingAfterSlot,
} from '@0xintuition/pipeline-runtime/testing/held-request-slot';
import { createEnrichmentEngine } from '../../../engine';
import { createMockPlugin, createMockRequest } from '../../../testing';
import { createPinAwareFetch, type FetchLike } from '../__shared__/http';
import { createMusicBrainzPlugin } from './index';

// ENG-17116: a lookup our own pacing slot refused is retried later, like a real 429, and keeps its
// own identity (`details.errorClass: 'budget_exhausted'`), never `rate_limited`. Everything runs
// through the real engine and the real MusicBrainz plugin; only the fetch is stubbed.

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

beforeEach(() => {
	resetProcessRequestSlotsForTests();
	resetProviderObserversForTests();
});
afterEach(() => {
	resetProviderObserversForTests();
	resetProcessRequestSlotsForTests();
});

const mbidRequest = (timeoutMs?: number) => ({
	...createMockRequest({
		input: {
			atomType: 'thing',
			identifier: { iid: 'int:wd:Q189729', scheme: 'wd', value: 'Q189729' },
			source: { classificationEngine: 'fixture', classifiedAt: '2026-10-07T00:00:00Z' },
			hints: { identifiers: { mbid: MBID } },
		},
	}),
	...(timeoutMs === undefined ? {} : { timeoutMs }),
});

function engineWith(
	fetch: FetchLike,
	requestSlot: ReturnType<typeof createRequestSlot>,
	random?: () => number
) {
	return createEnrichmentEngine({
		plugins: [createMusicBrainzPlugin({ requestSlot, fetch: createPinAwareFetch(fetch) })],
		...(random ? { random } : {}),
	});
}

/** A slot that refuses every request with the given error, so the hint is exactly what the test says. */
const refusingWith = (error: Error): ReturnType<typeof createRequestSlot> => ({
	run: () => Promise.reject(error),
});

const ok: FetchLike = async () => Response.json(recording);

describe('a pacing-slot refusal is a retriable budget_exhausted error (ENG-17116)', () => {
	test('queue_full: retriable, a positive retryAfterMs, internal_error code kept, nothing dialled', async () => {
		let dials = 0;
		const result = await engineWith(async (...args) => {
			dials += 1;
			return ok(...args);
		}, createHeldRequestSlot(0)).enrich(mbidRequest());
		expect(dials).toBe(0);
		expect(result.artifacts).toEqual([]);
		expect(result.errors).toHaveLength(1);
		const [error] = result.errors;
		expect(error).toMatchObject({
			pluginId: 'musicbrainz',
			code: 'internal_error',
			retriable: true,
			details: { errorClass: 'budget_exhausted' },
		});
		const retryAfterMs = error?.details?.retryAfterMs;
		expect(retryAfterMs).toBeGreaterThan(0);
		// Bounded: the shared maximum caps it, so a refusal never parks a stage for long.
		expect(retryAfterMs).toBeLessThanOrEqual(30_000);
		// Not an HTTP exchange: no invented status.
		expect(error?.details).not.toHaveProperty('status');
	});

	test('queue_full: the delay is jittered, so a refused burst does not retry in lock step', async () => {
		const delays = new Set<number>();
		for (let index = 0; index < 12; index += 1) {
			const result = await engineWith(ok, createHeldRequestSlot(0)).enrich(mbidRequest());
			delays.add(result.errors[0]?.details?.retryAfterMs ?? -1);
		}
		expect(delays.size).toBeGreaterThan(1);
		expect(delays.has(-1)).toBe(false);
	});

	test('deadline: the delay is derived from the time the lane is still owed, and jitter scales with it', async () => {
		// One dial keeps the lane spaced for 12 s, so the next request cannot start before its
		// 2 s engine deadline and is refused at once with reason `deadline` (the real slot's hint).
		const delayFor = async (random: number) => {
			const slot = createRequestSlot({ minSpacingMs: 12_000 });
			await slot.run(async () => undefined);
			const before = Date.now();
			const result = await engineWith(ok, slot, () => random).enrich(mbidRequest(2_000));
			const [error] = result.errors;
			expect(error).toMatchObject({
				code: 'internal_error',
				retriable: true,
				details: { errorClass: 'budget_exhausted' },
			});
			return { delay: error?.details?.retryAfterMs ?? 0, owed: 12_000 - (Date.now() - before) };
		};
		// No jitter: exactly the slot's own estimate (never a constant: the floor is only 1 s).
		const lowest = await delayFor(0);
		expect(lowest.delay).toBeGreaterThanOrEqual(lowest.owed - 50);
		expect(lowest.delay).toBeLessThanOrEqual(lowest.owed + 50);
		// Maximum jitter adds ~half of the hint (6 s), far more than a flat 1 s window would.
		const highest = await delayFor(0.999);
		expect(highest.delay).toBeGreaterThanOrEqual(highest.owed * 1.4);
		expect(highest.delay).toBeLessThanOrEqual(30_000);
	});

	test('the delay is exactly hint + random * hint * 0.5, floored at 1 s and capped at 30 s (pinned values)', async () => {
		const delay = async (hint: number | undefined, random: number) => {
			const slot = refusingWith(new RequestSlotRejectedError('queue_full', undefined, hint));
			const result = await engineWith(ok, slot, () => random).enrich(mbidRequest());
			return result.errors[0]?.details?.retryAfterMs;
		};
		expect(await delay(4_000, 0)).toBe(4_000);
		expect(await delay(4_000, 0.5)).toBe(5_000);
		expect(await delay(4_000, 0.999)).toBe(5_998);
		// A hint of 0 and a missing hint both give the floor.
		expect(await delay(0, 0)).toBe(1_000);
		expect(await delay(undefined, 0)).toBe(1_000);
		expect(await delay(0, 0.5)).toBe(1_250);
		// A huge hint is clamped to the 30 s maximum, jitter or not.
		expect(await delay(10 * 60_000, 0)).toBe(30_000);
		expect(await delay(10 * 60_000, 0.999)).toBe(30_000);
		// A hint that is not a number is no hint (the constructor drops it): the floor, never NaN.
		expect(await delay(Number.NaN, 0)).toBe(1_000);
		expect(await delay(Number.POSITIVE_INFINITY, 0)).toBe(1_000);
		expect(await delay(-5_000, 0)).toBe(1_000);
	});

	test('a deadline refusal built without earliestStartAtMs or a hint still gets the floor', async () => {
		const slot = refusingWith(new RequestSlotRejectedError('deadline'));
		const result = await engineWith(ok, slot, () => 0).enrich(mbidRequest());
		expect(result.errors[0]).toMatchObject({
			code: 'internal_error',
			retriable: true,
			details: { errorClass: 'budget_exhausted', retryAfterMs: 1_000 },
		});
	});

	test('a slot error raised before the dial (RequestSlotTimeoutError) is the same retriable refusal', async () => {
		const slot = createRefusingAfterSlot(0, 'deadline');
		const result = await engineWith(ok, slot).enrich(mbidRequest());
		expect(slot.runs).toBe(1);
		expect(result.errors[0]).toMatchObject({
			code: 'internal_error',
			retriable: true,
			details: { errorClass: 'budget_exhausted' },
		});
		expect(result.errors[0]?.details?.retryAfterMs).toBeGreaterThan(0);
	});

	test('the slot error class itself says whether the request was dialled', () => {
		expect(new RequestSlotTimeoutError(false).dialled).toBe(false);
		expect(new RequestSlotTimeoutError(true).dialled).toBe(true);
		const refused = new RequestSlotRejectedError('queue_full');
		expect(refused.retryAfterMs).toBeUndefined();
	});
});

describe('a slot timeout after the dial, and a refusal next to a real throttle', () => {
	test('a RequestSlotTimeoutError raised after the request was sent is a retriable timeout, not a refusal', async () => {
		const result = await engineWith(
			ok,
			refusingWith(new RequestSlotTimeoutError(true)),
			() => 0
		).enrich(mbidRequest());
		expect(result.errors).toHaveLength(1);
		expect(result.errors[0]).toMatchObject({ code: 'timeout', retriable: true });
		expect(result.errors[0]?.details).toBeUndefined();
	});

	test('a real 429 from one plugin and a refusal from another keep their own identities', async () => {
		const throttled = createMockPlugin({
			id: 'throttled-plugin',
			enrich: async () => {
				throw new Error('HTTP 429 rate limit exceeded');
			},
		});
		const result = await createEnrichmentEngine({
			plugins: [
				createMusicBrainzPlugin({
					requestSlot: createHeldRequestSlot(0),
					fetch: createPinAwareFetch(ok),
				}),
				throttled,
			],
			random: () => 0,
		}).enrich(mbidRequest());
		expect(result.artifacts).toEqual([]);
		const byPlugin = new Map(result.errors.map((error) => [error.pluginId, error] as const));
		expect(byPlugin.get('musicbrainz')).toMatchObject({
			code: 'internal_error',
			retriable: true,
			details: { errorClass: 'budget_exhausted', retryAfterMs: 1_000 },
		});
		// The throttle is NOT relabelled as a refusal and carries no refusal class.
		expect(byPlugin.get('throttled-plugin')).toMatchObject({
			code: 'rate_limited',
			retriable: true,
		});
		expect(byPlugin.get('throttled-plugin')?.details).toBeUndefined();
	});
});

describe('what stays what it was', () => {
	test('a real upstream 429 is still rate_limited, never budget_exhausted', async () => {
		const result = await engineWith(
			async () => new Response('slow down', { status: 429, headers: { 'retry-after': '7' } }),
			createRequestSlot({ minSpacingMs: 0, maxQueue: 0 })
		).enrich(mbidRequest());
		expect(result.errors[0]).toMatchObject({
			code: 'rate_limited',
			retriable: true,
			details: { status: 429, retryAfterMs: 7_000 },
		});
		expect(result.errors[0]?.details?.errorClass).not.toBe('budget_exhausted');
	});

	test('a deadline reached after the request was dialled is still timeout', async () => {
		let dials = 0;
		const result = await engineWith(
			() => {
				dials += 1;
				return new Promise<Response>(() => {});
			},
			createRequestSlot({ minSpacingMs: 0, maxQueue: 0 })
		).enrich(mbidRequest(60));
		expect(dials).toBe(1);
		expect(result.errors[0]).toMatchObject({ code: 'timeout', retriable: true });
		expect(result.errors[0]?.details).toBeUndefined();
	});
});
