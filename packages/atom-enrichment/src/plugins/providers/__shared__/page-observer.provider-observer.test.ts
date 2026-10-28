import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import {
	addProviderObserver,
	type ProviderEvent,
	type ProviderRequestEvent,
	resetProviderObserversForTests,
} from '@0xintuition/pipeline-runtime/provider-observer';
import { isGoodreadsPageUrl, pageRefusal, startPageFetch } from './page-observer';

let events: ProviderEvent[];
beforeEach(() => {
	events = [];
	resetProviderObserversForTests();
	addProviderObserver((event) => {
		events.push(event);
	});
});
afterEach(() => resetProviderObserversForTests());

const tuples = () =>
	events
		.filter((event): event is ProviderRequestEvent => event.type === 'provider_request')
		.map((e) => `${e.provider}:${e.operation}:${e.outcome}:${e.reason}:${e.source}`);

const PAGE = 'https://www.goodreads.com/book/show/2657';
const hop = (status: number, headers: Record<string, string> = {}, url = PAGE) => ({
	status,
	headers: new Headers(headers),
	url,
});

describe('isGoodreadsPageUrl', () => {
	it.each([
		['https://www.goodreads.com/book/show/2657', true],
		['https://goodreads.com/book/show/2657', true],
		['https://m.goodreads.com/book/show/2657', true],
		['http://www.goodreads.com/book/show/2657', true],
		['https://WWW.GOODREADS.COM./book/show/2657', true],
		['https://goodreads.com.evil.com/book/show/2657', false],
		['https://evil.com/goodreads.com/book/show/2657', false],
		['https://notgoodreads.com/book/show/2657', false],
		['https://goodreads.com@evil.com/book/show/2657', false],
		['https://evil.com@goodreads.com/book/show/2657', true],
		['https://images.goodreads.com/books/1.jpg', false],
		['ftp://goodreads.com/x', false],
		['not a url', false],
	])('%s -> %p', (url, expected) => {
		expect(isGoodreadsPageUrl(url)).toBe(expected);
	});
});

/** What a finished fetch whose latest hop is `status` records, for a page URL. */
function recorded(
	url: string,
	status: number,
	usable: boolean,
	headers: Record<string, string> = {}
): string[] {
	events.length = 0;
	const page = startPageFetch(url, {});
	page.sink?.record(hop(status, headers, url));
	page.finish({ usable });
	return tuples();
}

/** What a thrown error records, after the latest hop `last` (none: nothing was dialled). */
function failed(url: string, error: unknown, last?: number): string[] {
	events.length = 0;
	const page = startPageFetch(url, {});
	if (last !== undefined) page.sink?.record(hop(last, {}, url));
	page.fail(error);
	return tuples();
}

const WEB = 'https://example.com/post';

describe('Goodreads profile: the latest hop of a finished fetch', () => {
	it('maps the status', () => {
		const out = (status: number, usable: boolean, headers: Record<string, string> = {}) =>
			recorded(PAGE, status, usable, headers);
		expect(out(200, true)).toEqual(['goodreads:page:hit:none:live']);
		expect(out(200, false)).toEqual(['goodreads:page:miss:none:live']);
		expect(out(404, false)).toEqual(['goodreads:page:miss:none:live']);
		expect(out(410, false)).toEqual(['goodreads:page:miss:none:live']);
		expect(out(403, false)).toEqual(['goodreads:page:error:http_4xx:live']);
		expect(out(429, false)).toEqual(['goodreads:page:error:rate_limited:live']);
		expect(out(503, false)).toEqual(['goodreads:page:error:upstream_5xx:live']);
		expect(out(302, false)).toEqual(['goodreads:page:error:invalid_response:live']);
		expect(out(301, true)).toEqual(['goodreads:page:error:invalid_response:live']);
	});
	it('maps a challenge to blocked whatever the status or usability', () => {
		for (const status of [200, 202, 403, 405]) {
			expect(recorded(PAGE, status, true, { 'x-amzn-waf-action': 'challenge' })).toEqual([
				'goodreads:page:error:blocked:live',
			]);
		}
		expect(recorded(PAGE, 202, false)).toEqual(['goodreads:page:error:blocked:live']);
		expect(recorded(PAGE, 200, true, { 'cf-mitigated': 'challenge' })).toEqual([
			'goodreads:page:error:blocked:live',
		]);
	});
	it('records nothing when nothing was dialled', () => {
		events.length = 0;
		startPageFetch(PAGE, {}).finish({ usable: true });
		expect(tuples()).toEqual([]);
	});
	it('does not read a dead host as a miss', () => {
		events.length = 0;
		startPageFetch(PAGE, {}).finish({ usable: false, deadUrl: true });
		expect(tuples()).toEqual([]);
	});
});

describe('web profile: the latest hop of a finished fetch', () => {
	it('a fetched 2xx page is a hit, with or without metadata', () => {
		expect(recorded(WEB, 200, true)).toEqual(['web:page:hit:none:live']);
		// Fetched but nothing read from it: still a hit, told apart by its reason.
		expect(recorded(WEB, 200, false)).toEqual(['web:page:hit:no_metadata:live']);
		expect(recorded(WEB, 202, false)).toEqual(['web:page:hit:no_metadata:live']);
	});
	it('404 and 410 are a miss with reason dead_url', () => {
		expect(recorded(WEB, 404, false)).toEqual(['web:page:miss:dead_url:live']);
		expect(recorded(WEB, 410, false)).toEqual(['web:page:miss:dead_url:live']);
	});
	it('401, 403 and 451 are blocked; other statuses keep the generic mapping', () => {
		for (const status of [401, 403, 451]) {
			expect(recorded(WEB, status, false)).toEqual(['web:page:error:blocked:live']);
		}
		expect(recorded(WEB, 400, false)).toEqual(['web:page:error:http_4xx:live']);
		expect(recorded(WEB, 408, false)).toEqual(['web:page:error:http_4xx:live']);
		expect(recorded(WEB, 429, false)).toEqual(['web:page:error:rate_limited:live']);
		expect(recorded(WEB, 500, false)).toEqual(['web:page:error:upstream_5xx:live']);
		expect(recorded(WEB, 302, false)).toEqual(['web:page:error:invalid_response:live']);
	});
	it('a Cloudflare or AWS WAF header is blocked whatever the status; a bare 202 is not', () => {
		for (const [status, headers] of [
			[200, { 'cf-mitigated': 'challenge' }],
			[403, { 'cf-mitigated': 'challenge' }],
			[200, { 'x-amzn-waf-action': 'challenge' }],
			[405, { 'x-amzn-waf-action': 'captcha' }],
		] as const) {
			expect(recorded(WEB, status, true, headers)).toEqual(['web:page:error:blocked:live']);
		}
		expect(recorded(WEB, 200, true, { 'x-amzn-waf-action': 'allow' })).toEqual([
			'web:page:hit:none:live',
		]);
	});
	it('an off-site redirect is not special: the final page counts', () => {
		events.length = 0;
		const page = startPageFetch(WEB, {});
		page.sink?.record(hop(301, { location: 'https://other.example/x' }, WEB));
		page.sink?.record(hop(200, {}, 'https://other.example/x'));
		page.finish({ usable: true });
		expect(tuples()).toEqual(['web:page:hit:none:live']);
	});
	it('a host that never answered or does not exist is a dead_url miss; undialled is nothing', () => {
		const out = (result: Parameters<ReturnType<typeof startPageFetch>['finish']>[0]) => {
			events.length = 0;
			startPageFetch(WEB, {}).finish(result);
			return tuples();
		};
		expect(out({ usable: false, deadUrl: true })).toEqual(['web:page:miss:dead_url:live']);
		expect(out({ usable: false, refusal: 'lookup_not_found' })).toEqual([
			'web:page:miss:dead_url:live',
		]);
		// A lookup that failed for another reason says nothing about the site being gone.
		expect(out({ usable: false, refusal: 'lookup_failed' })).toEqual([
			'web:page:error:network:live',
		]);
		expect(out({ usable: false })).toEqual([]);
	});
	it('a refusal by our own policy is never recorded, before a dial or behind a redirect', () => {
		events.length = 0;
		startPageFetch(WEB, {}).finish({ usable: false, refusal: 'policy' });
		expect(tuples()).toEqual([]);
		const page = startPageFetch(WEB, {});
		page.sink?.record(hop(302, { location: 'http://10.0.0.1/' }, WEB));
		page.finish({ usable: false, refusal: 'policy' });
		expect(tuples()).toEqual([]);
		// A redirect to a host that does not exist is the site's redirect: an unusable response.
		const dead = startPageFetch(WEB, {});
		dead.sink?.record(hop(302, { location: 'https://gone.example/' }, WEB));
		dead.finish({ usable: false, refusal: 'lookup_not_found' });
		expect(tuples()).toEqual(['web:page:error:invalid_response:live']);
	});
	it('a head longer than the size cap was still a fetched page: a hit without metadata', () => {
		const page = startPageFetch(WEB, {});
		page.sink?.record(hop(200, {}, WEB));
		page.finish({ usable: false, headCapExceeded: true });
		expect(tuples()).toEqual(['web:page:hit:no_metadata:live']);
	});
	it('a cache consumer records only hits and misses', () => {
		events.length = 0;
		for (const status of [200, 404, 403]) {
			const page = startPageFetch(WEB, {}, 'cache');
			page.sink?.record(hop(status, {}, WEB));
			page.finish({ usable: status === 200 });
		}
		expect(tuples()).toEqual(['web:page:hit:none:cache', 'web:page:miss:none:cache']);
	});
	it('the live-only reasons never reach a cache event, whatever the result', () => {
		events.length = 0;
		for (const [status, usable] of [
			[200, false],
			[404, false],
		] as const) {
			const page = startPageFetch(WEB, {}, 'cache');
			page.sink?.record(hop(status, {}, WEB));
			page.finish({ usable });
		}
		expect(tuples()).toEqual(['web:page:hit:none:cache', 'web:page:miss:none:cache']);
	});
	it('abort rules hold on the web profile: a caller cancel records nothing, the deadline a timeout', () => {
		const cancelled = new AbortController();
		const first = startPageFetch(WEB, {
			signal: cancelled.signal,
			deadlineAtMs: Date.now() + 60_000,
		});
		cancelled.abort();
		first.fail(new DOMException('aborted', 'AbortError'));
		expect(tuples()).toEqual([]);

		const timedOut = new AbortController();
		const second = startPageFetch(WEB, { signal: timedOut.signal, deadlineAtMs: Date.now() });
		timedOut.abort();
		second.fail(new DOMException('aborted', 'AbortError'));
		expect(tuples()).toEqual(['web:page:error:timeout:live']);
	});
});

describe('pageRefusal', () => {
	it.each([
		['blocked', 'private_address', 'policy'],
		['blocked', 'redirect_private_address', 'policy'],
		['blocked', 'invalid_scheme', 'policy'],
		['blocked', 'redirect_invalid_scheme', 'policy'],
		['blocked', 'invalid_url', 'policy'],
		['blocked', 'page_source_denied', 'policy'],
		['blocked', 'redirect_page_source_denied', 'policy'],
		['blocked', 'refused_host', 'policy'],
		['blocked', 'redirect_refused_host', 'policy'],
		['blocked', 'lookup_not_found', 'lookup_not_found'],
		['blocked', 'redirect_lookup_not_found', 'lookup_not_found'],
		['blocked', 'lookup_failed', 'lookup_failed'],
		// The site's own answers are not refusals by us.
		['blocked', 'http_blocked', undefined],
		['blocked', 'http_unusable', undefined],
		['blocked', 'redirect_missing_location', undefined],
		['blocked', 'redirect_cross_host', undefined],
		['fetched', 'private_address', undefined],
		['dead_url', 'dead_url', undefined],
	])('%s / %s -> %p', (status, reason, expected) => {
		expect(pageRefusal({ status, reason })).toBe(expected as ReturnType<typeof pageRefusal>);
	});
});

describe('failed fetches', () => {
	const ok = 200;
	it('map the same transport faults for both profiles', () => {
		for (const [url, provider] of [
			[PAGE, 'goodreads'],
			[WEB, 'web'],
		] as const) {
			const reason = (error: unknown, last?: number) =>
				failed(url, error, last).map((t) => t.split(':')[3]);
			expect(reason(new TypeError('fetch failed'))).toEqual(['network']);
			expect(reason(new DOMException('x', 'AbortError'))).toEqual(['timeout']);
			expect(reason(Object.assign(new Error('t'), { code: 'timeout' }))).toEqual(['timeout']);
			expect(reason(Object.assign(new Error('d'), { code: 'dns_not_found' }))).toEqual(['network']);
			expect(reason(Object.assign(new Error('d'), { cause: { code: 'ENOTFOUND' } }))).toEqual([
				'network',
			]);
			expect(reason(new Error('boom'))).toEqual(['other']);
			expect(reason(new Error('body'), ok)).toEqual(['other']);
			expect(reason(Object.assign(new Error('http_503'), { code: 'http_503' }), 503)).toEqual([
				'upstream_5xx',
			]);
			expect(reason(Object.assign(new Error('rl'), { code: 'redirect_limit' }), 302)).toEqual([
				'invalid_response',
			]);
			expect(failed(url, new Error('boom'))[0]?.startsWith(`${provider}:page:error`)).toBe(true);
		}
	});
	it('a web 403 thrown after the hop is blocked; Goodreads keeps http_4xx', () => {
		expect(failed(WEB, new Error('http'), 403)).toEqual(['web:page:error:blocked:live']);
		expect(failed(PAGE, new Error('http'), 403)).toEqual(['goodreads:page:error:http_4xx:live']);
	});
	it('a refusal by our own policy before any dial is not a web event', () => {
		for (const errorClass of ['embargoed_host', 'page_source_denied', 'target_rejected']) {
			expect(failed(WEB, Object.assign(new Error('r'), { errorClass }))).toEqual([]);
		}
	});
	it('Goodreads keeps its rule: a guard refusal is a failed lookup (network), the other classes are other', () => {
		expect(failed(PAGE, Object.assign(new Error('r'), { errorClass: 'target_rejected' }))).toEqual([
			'goodreads:page:error:network:live',
		]);
		for (const errorClass of ['embargoed_host', 'page_source_denied']) {
			expect(failed(PAGE, Object.assign(new Error('r'), { errorClass }))).toEqual([
				'goodreads:page:error:other:live',
			]);
		}
	});
});

describe('startPageFetch', () => {
	it('is inert for anything that is not an http(s) page', () => {
		for (const url of ['ftp://example.com/', 'not a url', 'data:text/html,x']) {
			const page = startPageFetch(url, {});
			expect(page.sink).toBeUndefined();
			page.finish({ usable: true });
			page.fail(new TypeError('x'));
		}
		expect(tuples()).toEqual([]);
	});

	it('routes by host: a spoofed Goodreads host is web, a real one is goodreads', () => {
		for (const [url, provider] of [
			['https://goodreads.com.evil.com/x', 'web'],
			['https://evil.com/goodreads.com/book/show/2657', 'web'],
			['https://evil.com@goodreads.com/book/show/2657', 'goodreads'],
			['https://m.goodreads.com/book/show/2657', 'goodreads'],
			['https://images.goodreads.com/books/1.jpg', 'web'],
		] as const) {
			events.length = 0;
			const page = startPageFetch(url, {});
			page.sink?.record(hop(200, {}, url));
			page.finish({ usable: true });
			expect(tuples()).toEqual([`${provider}:page:hit:none:live`]);
		}
	});

	it('emits one event with a finite duration for a logical fetch of several hops', () => {
		const page = startPageFetch(PAGE, {});
		page.sink?.record(hop(301, { location: '/x' }));
		page.sink?.record(hop(200));
		page.finish({ usable: true });
		page.finish({ usable: true });
		page.fail(new TypeError('late'));
		expect(tuples()).toEqual(['goodreads:page:hit:none:live']);
		expect(Number.isFinite((events[0] as ProviderRequestEvent).durationMs)).toBe(true);
	});

	it('counts a fetch that ended on a redirect as invalid_response', () => {
		const page = startPageFetch(PAGE, {});
		page.sink?.record(hop(302, { location: 'https://www.amazon.com/ap/signin' }));
		page.finish({ usable: false });
		expect(tuples()).toEqual(['goodreads:page:error:invalid_response:live']);
	});

	it('counts a fetch carried off goodreads.com by a redirect as invalid_response even on a 200', () => {
		const page = startPageFetch(PAGE, {});
		page.sink?.record(hop(302, { location: 'https://www.amazon.com/ap/signin' }));
		page.sink?.record(hop(200, {}, 'https://www.amazon.com/ap/signin'));
		page.finish({ usable: false });
		expect(tuples()).toEqual(['goodreads:page:error:invalid_response:live']);
	});

	it('counts a 200 with no usable metadata as miss', () => {
		const page = startPageFetch(PAGE, {});
		page.sink?.record(hop(200));
		page.finish({ usable: false });
		expect(tuples()).toEqual(['goodreads:page:miss:none:live']);
	});

	it('counts every refused target as network and an undialled non-rejection as nothing', () => {
		for (const refusal of ['policy', 'lookup_not_found', 'lookup_failed'] as const) {
			startPageFetch('https://m.goodreads.com/book/show/1', {}).finish({ usable: false, refusal });
		}
		startPageFetch(PAGE, {}).finish({ usable: false });
		expect(tuples()).toEqual(Array(3).fill('goodreads:page:error:network:live'));
	});

	it('keeps an over-long head a failure on Goodreads, and never adds a detailed reason there', () => {
		const page = startPageFetch(PAGE, {});
		page.sink?.record(hop(200));
		page.finish({ usable: false, headCapExceeded: true });
		expect(tuples()).toEqual(['goodreads:page:error:other:live']);
		events.length = 0;
		const dead = startPageFetch(PAGE, {});
		dead.sink?.record(hop(404));
		dead.finish({ usable: false });
		expect(tuples()).toEqual(['goodreads:page:miss:none:live']);
	});

	it('records a thrown failure once', () => {
		const page = startPageFetch(PAGE, {});
		page.fail(new TypeError('fetch failed'));
		page.fail(new Error('second'));
		expect(tuples()).toEqual(['goodreads:page:error:network:live']);
	});

	describe('abort rules (amendment 5)', () => {
		it('records nothing when the signal was already aborted', () => {
			const controller = new AbortController();
			controller.abort();
			const page = startPageFetch(PAGE, { signal: controller.signal });
			expect(page.sink).toBeUndefined();
			page.fail(new DOMException('x', 'AbortError'));
			expect(tuples()).toEqual([]);
		});

		it('records nothing for a caller abort before the deadline', () => {
			const controller = new AbortController();
			const page = startPageFetch(PAGE, {
				signal: controller.signal,
				deadlineAtMs: Date.now() + 60_000,
			});
			controller.abort();
			page.fail(new DOMException('aborted', 'AbortError'));
			expect(tuples()).toEqual([]);
		});

		it('records timeout for an abort at the deadline, via fail', () => {
			const controller = new AbortController();
			const page = startPageFetch(PAGE, {
				signal: controller.signal,
				deadlineAtMs: Date.now(),
			});
			controller.abort();
			page.fail(new DOMException('aborted', 'AbortError'));
			expect(tuples()).toEqual(['goodreads:page:error:timeout:live']);
		});

		it('records timeout at the deadline even when the fetch ignores the signal and never settles', async () => {
			const controller = new AbortController();
			startPageFetch(PAGE, {
				signal: controller.signal,
				deadlineAtMs: Date.now() + 20,
			});
			await new Promise((resolve) => setTimeout(resolve, 40));
			controller.abort();
			expect(tuples()).toEqual(['goodreads:page:error:timeout:live']);
		});
	});

	it('is unaffected by an observer that throws', () => {
		addProviderObserver(() => {
			throw new Error('observer exploded');
		});
		const page = startPageFetch(PAGE, {});
		page.sink?.record(hop(404));
		page.finish({ usable: false });
		expect(tuples()).toEqual(['goodreads:page:miss:none:live']);
	});
});
