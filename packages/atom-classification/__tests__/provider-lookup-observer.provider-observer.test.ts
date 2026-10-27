import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
	addProviderObserver,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import {
	isCallerCancelledLookup,
	observeProviderLookup,
} from '../src/plugins/shared/provider-lookup-observer';

let events: ProviderRequestEvent[];
beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		if (event.type === 'provider_request') events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

const observe = (
	result: Parameters<typeof observeProviderLookup>[0]['result'],
	source: 'live' | 'cache' = 'live',
	durationMs?: number
) =>
	observeProviderLookup({
		provider: 'openlibrary',
		operation: 'search_title',
		result,
		source,
		...(durationMs === undefined ? {} : { durationMs }),
	});

describe('observeProviderLookup', () => {
	it('maps each result status to one event with the given provider, operation and source', () => {
		observe({ status: 'hit' }, 'live', 120);
		observe({ status: 'ambiguous' }, 'cache');
		observe({ status: 'miss' }, 'live', 40);
		expect(events).toEqual([
			{
				type: 'provider_request',
				provider: 'openlibrary',
				operation: 'search_title',
				outcome: 'hit',
				reason: 'none',
				source: 'live',
				durationMs: 120,
			},
			{
				type: 'provider_request',
				provider: 'openlibrary',
				operation: 'search_title',
				outcome: 'ambiguous',
				reason: 'none',
				source: 'cache',
			},
			{
				type: 'provider_request',
				provider: 'openlibrary',
				operation: 'search_title',
				outcome: 'miss',
				reason: 'none',
				source: 'live',
				durationMs: 40,
			},
		]);
	});

	it('drops a duration passed with a cache hit: nothing was dialled', () => {
		observe({ status: 'hit' }, 'cache', 120);
		observe({ status: 'miss' }, 'cache', 5);
		observe({ status: 'hit' }, 'live', 120);
		expect(events[0]).not.toHaveProperty('durationMs');
		expect(events[1]).not.toHaveProperty('durationMs');
		expect(events[2]).toHaveProperty('durationMs', 120);
	});

	it('records a budget miss as budget_exhausted with no duration', () => {
		observe({ status: 'miss', budgetExhausted: true }, 'live', 4999);
		expect(events).toHaveLength(1);
		expect(events[0]).toMatchObject({ outcome: 'budget_exhausted', reason: 'none' });
		expect(events[0]).not.toHaveProperty('durationMs');
	});

	it('maps a failure through its kind or status', () => {
		observe({ status: 'failure', failure: { kind: 'timeout' } }, 'live', 5000);
		observe({ status: 'failure', failure: { kind: 'non_ok_status', status: 429 } }, 'live', 80);
		observe({ status: 'failure', failure: { kind: 'circuit_open' } }, 'live');
		observe({ status: 'failure', failure: { kind: 'auth_failed' } }, 'live', 10);
		expect(events.map((event) => `${event.outcome}:${event.reason}`)).toEqual([
			'error:timeout',
			'error:rate_limited',
			'error:circuit_open',
			'error:auth_failed',
		]);
	});

	it('only skips a lookup the caller cancelled, and only when it failed', () => {
		const aborted = AbortSignal.abort();
		expect(
			isCallerCancelledLookup(aborted, { status: 'failure', failure: { kind: 'timeout' } })
		).toBe(true);
		expect(isCallerCancelledLookup(aborted, { status: 'hit' })).toBe(false);
		expect(isCallerCancelledLookup(undefined, { status: 'failure', failure: {} })).toBe(false);
		expect(
			isCallerCancelledLookup(new AbortController().signal, { status: 'failure', failure: {} })
		).toBe(false);
	});
});
