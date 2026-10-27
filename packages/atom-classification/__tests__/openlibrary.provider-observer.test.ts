import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import {
	PROVIDER_CIRCUIT_HOSTS,
	type ProviderOperationOf,
} from '@0xintuition/pipeline-runtime/provider-registry';
import {
	fetchJsonDocumentResult,
	getDomainHtmlHostCircuitOpen,
} from '../src/plugins/shared/domain-html/fetch';
import {
	type OpenLibraryWorkLookupOptions,
	type OpenLibraryWorkLookupQuery,
	resolveOpenLibraryWork,
} from '../src/plugins/shared/openlibrary-lookup';
import {
	resetDomainHtmlHostCircuitBreakersForTests,
	resetOpenLibraryLookupCacheForTests,
} from '../src/testing';
import { resolvePublicTestHostname } from './helpers/public-dns';

type Fetch = NonNullable<OpenLibraryWorkLookupOptions['fetch']>;

const hitBody = () =>
	Response.json({
		docs: [{ key: '/works/OL27482W', title: 'The Hobbit', author_name: ['J.R.R. Tolkien'] }],
		numFound: 1,
	});
const missBody = () => Response.json({ docs: [], numFound: 0 });

let events: ProviderEvent[];

function requests(): ProviderRequestEvent[] {
	return events.filter((event): event is ProviderRequestEvent => event.type === 'provider_request');
}

/** The exact events, with the wall time dropped so they can be compared. */
function tuples() {
	return requests().map(({ durationMs: _durationMs, ...rest }) => rest);
}

/** One full expected event: every label is spelled out by the test. */
function tuple(
	operation: ProviderOperationOf<'openlibrary'>,
	outcome: ProviderRequestEvent['outcome'],
	reason: ProviderRequestEvent['reason'] = 'none',
	source: ProviderRequestEvent['source'] = 'live'
) {
	return {
		type: 'provider_request' as const,
		provider: 'openlibrary' as const,
		operation,
		outcome,
		reason,
		source,
	};
}

function run(
	query: OpenLibraryWorkLookupQuery,
	fetch: Fetch,
	extra: Partial<OpenLibraryWorkLookupOptions> = {}
) {
	return resolveOpenLibraryWork(query, {
		fetch,
		resolveHostname: resolvePublicTestHostname,
		...extra,
	});
}

const GR: OpenLibraryWorkLookupQuery = { kind: 'goodreads', value: '5907' };

beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	resetOpenLibraryLookupCacheForTests();
	resetDomainHtmlHostCircuitBreakersForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});

afterEach(() => {
	resetProviderObserversForTests();
	resetOpenLibraryLookupCacheForTests();
	resetDomainHtmlHostCircuitBreakersForTests();
});

describe('OpenLibrary search lookup observer', () => {
	it('records an id hit as live/hit with a duration', async () => {
		await run(GR, async () => hitBody());
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'hit')]);
		expect(typeof requests()[0]?.durationMs).toBe('number');
	});

	it('records an id miss', async () => {
		await run(GR, async () => missBody());
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'miss')]);
	});

	it('records an isbn lookup under search_isbn', async () => {
		await run({ kind: 'isbn', value: '9780547928227' }, async () => hitBody());
		expect(tuples()).toEqual([tuple('search_isbn', 'hit')]);
	});

	it('records budget_exhausted without a fetch or a duration', async () => {
		let calls = 0;
		await run(
			GR,
			async () => {
				calls += 1;
				return hitBody();
			},
			{ deadlineAtMs: Date.now() + 100, minimumRemainingMs: 10_000 }
		);
		expect(calls).toBe(0);
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'budget_exhausted')]);
		expect(requests()[0]?.durationMs).toBeUndefined();
	});

	it('records an exhausted deadline as a timeout error', async () => {
		await run(GR, async () => hitBody(), { deadlineAtMs: Date.now() - 1 });
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'error', 'timeout')]);
	});

	it('records a hung request as a timeout error', async () => {
		await run(
			GR,
			(_url, init) =>
				new Promise((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), {
						once: true,
					});
				}),
			{ budgetMs: 25 }
		);
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'error', 'timeout')]);
	});

	it('maps 429 to rate_limited', async () => {
		await run(GR, async () => new Response('slow down', { status: 429 }));
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'error', 'rate_limited')]);
	});

	it('maps 503 to upstream_5xx', async () => {
		await run(GR, async () => new Response('', { status: 503 }));
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'error', 'upstream_5xx')]);
	});

	it('maps 404 to http_4xx', async () => {
		await run(GR, async () => new Response('', { status: 404 }));
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'error', 'http_4xx')]);
	});

	it('maps a thrown fetch to network', async () => {
		await run(GR, async () => {
			throw new TypeError('socket hang up https://secret.example/?token=abc');
		});
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'error', 'network')]);
	});

	it('maps a non-JSON body to invalid_response', async () => {
		await run(GR, async () => new Response('<html>not json</html>', { status: 200 }));
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'error', 'invalid_response')]);
	});

	it('records circuit_open once the host breaker has tripped, with zero fetches', async () => {
		let calls = 0;
		const failing: Fetch = async () => {
			calls += 1;
			return new Response('', { status: 503 });
		};
		expect(getDomainHtmlHostCircuitOpen('openlibrary.org')).toBe(false);
		for (let index = 0; index < 3; index += 1) await run(GR, failing);
		expect(getDomainHtmlHostCircuitOpen('openlibrary.org')).toBe(true);
		events = [];
		const callsBefore = calls;
		await run(GR, failing);
		expect(calls).toBe(callsBefore);
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'error', 'circuit_open')]);
	});

	it('records a title hit', async () => {
		await run({ kind: 'title', value: 'the hobbit' }, async () =>
			Response.json({
				docs: [{ key: '/works/OL27482W', title: 'The Hobbit' }],
				numFound: 1,
			})
		);
		expect(tuples()).toEqual([tuple('search_title', 'hit')]);
	});

	it('records a title ambiguous result', async () => {
		await run({ kind: 'title', value: 'hobbit' }, async () =>
			Response.json({
				docs: [
					{ key: '/works/OL1W', title: 'The Hobbit' },
					{ key: '/works/OL2W', title: 'Hobbit Tales' },
				],
				numFound: 2,
			})
		);
		expect(tuples()).toEqual([tuple('search_title', 'ambiguous')]);
	});

	it('records a cache hit with zero fetch calls and no duration', async () => {
		let calls = 0;
		const fetch: Fetch = async () => {
			calls += 1;
			return hitBody();
		};
		await run(GR, fetch);
		events = [];
		await run(GR, fetch);
		expect(calls).toBe(1);
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'hit', 'none', 'cache')]);
		expect(requests()[0]?.durationMs).toBeUndefined();
	});

	it('records a cached miss as cache/miss', async () => {
		await run(GR, async () => missBody());
		events = [];
		await run(GR, async () => hitBody());
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'miss', 'none', 'cache')]);
	});

	it('records nothing for an unsearchable title (no lookup happened)', async () => {
		let calls = 0;
		await run({ kind: 'title', value: '   ' }, async () => {
			calls += 1;
			return hitBody();
		});
		expect(calls).toBe(0);
		expect(events).toEqual([]);
	});

	it('maps a redirect away from openlibrary.org to invalid_response', async () => {
		await run(
			GR,
			async () =>
				new Response('', { status: 302, headers: { location: 'https://elsewhere.example/x' } })
		);
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'error', 'invalid_response')]);
	});

	it('records nothing when the caller aborts while the request is in flight, even past a hung fetch', async () => {
		const controller = new AbortController();
		const pending = run(GR, () => new Promise(() => {}), { signal: controller.signal });
		await new Promise((resolve) => setTimeout(resolve, 20));
		controller.abort(new Error('user left'));
		await pending.catch(() => undefined);
		expect(events).toEqual([]);
	});

	it('still records a success that completed although the caller later aborted', async () => {
		const controller = new AbortController();
		await run(GR, async () => hitBody(), { signal: controller.signal });
		controller.abort(new Error('too late'));
		expect(tuples()).toEqual([tuple('search_goodreads_id', 'hit')]);
	});

	it('records nothing when the caller cancelled the request', async () => {
		const controller = new AbortController();
		const pending = run(
			GR,
			(_url, init) =>
				new Promise((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), {
						once: true,
					});
				}),
			{ signal: controller.signal }
		);
		controller.abort(new Error('lost the race'));
		await pending.catch(() => undefined);
		expect(events).toEqual([]);
	});
});

describe('circuit gauge source', () => {
	const URL_SEARCH = 'https://openlibrary.org/search.json?q=id_goodreads:5907&fields=key';

	it('reads 1 while open, 1 while half-open with the probe in flight, 0 once the probe succeeded', async () => {
		let nowMs = 5_000_000;
		const now = () => nowMs;
		const options = { url: URL_SEARCH, now, resolveHostname: resolvePublicTestHostname };
		const failing: Fetch = async () => new Response('', { status: 503 });
		expect(getDomainHtmlHostCircuitOpen('openlibrary.org')).toBe(false);
		for (let index = 0; index < 3; index += 1) await fetchJsonDocumentResult(failing, options);
		expect(getDomainHtmlHostCircuitOpen('openlibrary.org')).toBe(true);

		// The reset window passes: the next request is admitted as the probe, so nothing is refusing yet.
		nowMs += 5 * 60 * 1000;
		expect(getDomainHtmlHostCircuitOpen('openlibrary.org')).toBe(false);

		let finishProbe: (() => void) | undefined;
		const probe = fetchJsonDocumentResult(
			() =>
				new Promise((resolve) => {
					finishProbe = () => resolve(hitBody());
				}),
			options
		);
		await new Promise((resolve) => setTimeout(resolve, 10));
		// Half-open with the probe in flight: every other request is refused, so the gauge reads 1.
		expect(getDomainHtmlHostCircuitOpen('openlibrary.org')).toBe(true);
		const refused = await fetchJsonDocumentResult(failing, options);
		expect(refused.ok).toBe(false);
		finishProbe?.();
		await probe;
		expect(getDomainHtmlHostCircuitOpen('openlibrary.org')).toBe(false);
	});

	it('every registered circuit host is a domain-html host: its gauge follows the breaker that request path trips', async () => {
		// The gauge reads the domain-html host breaker for whatever the registry lists, so a host
		// registered with a breaker of another kind would sit at 0 forever. Trip each through the
		// real fetch path and require the gauge to follow.
		expect(PROVIDER_CIRCUIT_HOSTS.length).toBeGreaterThan(0);
		for (const host of PROVIDER_CIRCUIT_HOSTS) {
			expect(getDomainHtmlHostCircuitOpen(host)).toBe(false);
			const options = {
				url: `https://${host}/probe.json`,
				now: () => 7_000_000,
				resolveHostname: resolvePublicTestHostname,
			};
			for (let index = 0; index < 3; index += 1) {
				await fetchJsonDocumentResult(async () => new Response('', { status: 503 }), options);
			}
			expect(getDomainHtmlHostCircuitOpen(host)).toBe(true);
		}
	});

	it('is 0 for a host that never had a breaker, and creates none', () => {
		expect(getDomainHtmlHostCircuitOpen('openlibrary.org')).toBe(false);
		expect(getDomainHtmlHostCircuitOpen('never-seen.example')).toBe(false);
	});
});

describe('observer isolation', () => {
	it('returns byte-identical results with, without, and with a throwing observer', async () => {
		const fetchFor = (): Fetch => async () => hitBody();
		const cases: OpenLibraryWorkLookupQuery[] = [
			GR,
			{ kind: 'isbn', value: '9780547928227' },
			{ kind: 'title', value: 'the hobbit' },
		];
		const results: string[][] = [];
		for (const mode of ['observed', 'none', 'throwing'] as const) {
			resetProviderObserversForTests();
			resetOpenLibraryLookupCacheForTests();
			if (mode === 'observed') addProviderObserver(() => undefined);
			if (mode === 'throwing') {
				addProviderObserver(() => {
					throw new Error('observer exploded');
				});
			}
			const out: string[] = [];
			for (const query of cases) out.push(JSON.stringify(await run(query, fetchFor())));
			results.push(out);
		}
		expect(results[1]).toEqual(results[0] as string[]);
		expect(results[2]).toEqual(results[0] as string[]);
	});

	it('adds no network call when observed', async () => {
		const count = async (observed: boolean) => {
			resetProviderObserversForTests();
			resetOpenLibraryLookupCacheForTests();
			if (observed) addProviderObserver(() => undefined);
			let calls = 0;
			await run(GR, async () => {
				calls += 1;
				return hitBody();
			});
			return calls;
		};
		expect(await count(true)).toBe(await count(false));
		expect(await count(true)).toBe(1);
	});
});
