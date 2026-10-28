import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
	type DomainHtmlFetchLike,
	fetchHtmlDocumentResult,
	fetchJsonDocumentResult,
	HOST_CIRCUIT_BREAKER_FAILURE_THRESHOLD,
	HOST_CIRCUIT_BREAKER_MAX_HOSTS,
	HOST_CIRCUIT_BREAKER_RESET_AFTER_MS,
	HOST_FETCH_BUDGET_MS,
	resetDomainHtmlHostCircuitBreakersForTests,
	resolveDomainHtmlFetch,
	resolvePublicHttpUrlResult,
} from '../src/plugins/shared/domain-html/fetch';
import {
	DOMAIN_HTML_TEST_CA,
	DOMAIN_HTML_TEST_CERTIFICATE,
	DOMAIN_HTML_TEST_PRIVATE_KEY,
} from './fixtures/domain-html-tls';
import { resolvePublicTestHostname } from './helpers/public-dns';

type DomainHtmlResponse = Awaited<ReturnType<DomainHtmlFetchLike>>;

async function fetchHtmlDocument(
	fetcher: DomainHtmlFetchLike,
	input: Parameters<typeof fetchHtmlDocumentResult>[1]
): Promise<string | undefined> {
	const result = await fetchHtmlDocumentResult(fetcher, input);
	return result.ok ? result.value : undefined;
}

async function resolvePublicHttpUrl(
	fetcher: DomainHtmlFetchLike,
	input: Parameters<typeof resolvePublicHttpUrlResult>[1]
): Promise<string | undefined> {
	const result = await resolvePublicHttpUrlResult(fetcher, input);
	return result.ok ? result.value : undefined;
}

describe('shared domain-html SSRF guard', () => {
	beforeEach(() => {
		resetDomainHtmlHostCircuitBreakersForTests();
	});

	it('pins the adjudicated breaker and host-budget constants', () => {
		expect(HOST_CIRCUIT_BREAKER_FAILURE_THRESHOLD).toBe(3);
		expect(HOST_CIRCUIT_BREAKER_RESET_AFTER_MS).toBe(5 * 60 * 1000);
		expect(HOST_CIRCUIT_BREAKER_MAX_HOSTS).toBe(256);
		expect(HOST_FETCH_BUDGET_MS).toEqual(
			new Map([
				['goodreads.com', 2000],
				['www.goodreads.com', 2000],
			])
		);
	});

	it('rejects an env-derived embargoed host before DNS or fetch, including redirects', async () => {
		const prior = process.env.TMDB_URL;
		process.env.TMDB_URL = 'https://image.tmdb.org/t/p/original/poster.jpg';
		let dnsCallCount = 0;
		let fetchCallCount = 0;
		const resolveHostname = async (hostname: string) => {
			dnsCallCount += 1;
			return await resolvePublicTestHostname(hostname);
		};
		const fetcher: DomainHtmlFetchLike = async () => {
			fetchCallCount += 1;
			return textResponse('', 302, { location: process.env.TMDB_URL as string });
		};

		try {
			const initial = await fetchHtmlDocumentResult(fetcher, {
				url: process.env.TMDB_URL,
				resolveHostname,
			});
			const redirected = await fetchHtmlDocumentResult(fetcher, {
				url: 'https://example.com/start',
				resolveHostname,
			});

			expect(initial).toEqual({
				ok: false,
				failure: { kind: 'embargoed_host', reason: 'embargoed_host' },
			});
			expect(redirected).toEqual({
				ok: false,
				failure: { kind: 'embargoed_host', reason: 'embargoed_host' },
			});
			expect(dnsCallCount).toBe(1);
			expect(fetchCallCount).toBe(1);
		} finally {
			if (prior === undefined) delete process.env.TMDB_URL;
			else process.env.TMDB_URL = prior;
		}
	});

	it('opens after three hostile outcomes and skips fetch and DNS for a new URL on that host', async () => {
		let fetchCallCount = 0;
		let dnsCallCount = 0;
		const fetcher: DomainHtmlFetchLike = async () => {
			fetchCallCount += 1;
			return new Response('', {
				headers: { 'x-amzn-waf-action': 'challenge' },
				status: 202,
			});
		};
		const resolveHostname = async () => {
			dnsCallCount += 1;
			return await resolvePublicTestHostname('goodreads.com');
		};

		for (let index = 0; index < 3; index += 1) {
			const result = await fetchHtmlDocumentResult(fetcher, {
				url: `https://goodreads.com/book/show/${index + 1}`,
				resolveHostname,
			});
			expect(result.ok).toBe(false);
		}

		const blocked = await fetchHtmlDocumentResult(fetcher, {
			url: 'https://goodreads.com/book/show/4',
			resolveHostname,
		});

		expect(blocked).toEqual({
			ok: false,
			failure: { kind: 'circuit_open', reason: 'circuit_open' },
		});
		if (blocked.ok) {
			throw new Error('Expected the fourth Goodreads request to be blocked.');
		}
		expect(blocked.failure.circuit).toMatchObject({
			hostname: 'goodreads.com',
			snapshot: {
				state: 'open',
				failures: 3,
				resetAfterMs: HOST_CIRCUIT_BREAKER_RESET_AFTER_MS,
			},
		});
		expect(fetchCallCount).toBe(3);
		expect(dnsCallCount).toBe(3);

		let otherHostFetches = 0;
		const otherHostResult = await fetchHtmlDocumentResult(
			async () => {
				otherHostFetches += 1;
				return textResponse('healthy');
			},
			{
				url: 'https://library.example/book/4',
				resolveHostname: resolvePublicTestHostname,
			}
		);
		expect(otherHostResult).toEqual({ ok: true, value: 'healthy' });
		expect(otherHostFetches).toBe(1);
	});

	it('blocks an open redirect destination before destination DNS or fetch I/O', async () => {
		const destinationHost = 'blocked-destination.example';
		const dnsCalls: string[] = [];
		const fetchCalls: string[] = [];
		const resolveHostname = async (hostname: string) => {
			dnsCalls.push(hostname);
			return await resolvePublicTestHostname(hostname);
		};
		const fetcher: DomainHtmlFetchLike = async (url) => {
			fetchCalls.push(url);
			if (new URL(url).hostname === destinationHost) {
				return textResponse('', 503);
			}
			return new Response('', {
				headers: { location: `https://${destinationHost}/final` },
				status: 302,
			});
		};

		for (let index = 0; index < 3; index += 1) {
			await fetchHtmlDocumentResult(fetcher, {
				url: `https://${destinationHost}/failure-${index}`,
				resolveHostname,
			});
		}
		dnsCalls.length = 0;
		fetchCalls.length = 0;

		const result = await fetchHtmlDocumentResult(fetcher, {
			url: 'https://redirect-origin.example/start',
			resolveHostname,
		});

		expect(result).toEqual({
			ok: false,
			failure: { kind: 'circuit_open', reason: 'circuit_open' },
		});
		expect(dnsCalls).toEqual(['redirect-origin.example']);
		expect(fetchCalls).toEqual(['https://redirect-origin.example/start']);
	});

	it('attributes redirected hostile outcomes to the destination host', async () => {
		const originHost = 'healthy-redirector.example';
		const destinationHost = 'hostile-destination.example';
		const fetchCalls: string[] = [];
		const fetcher: DomainHtmlFetchLike = async (url) => {
			fetchCalls.push(url);
			const parsed = new URL(url);
			if (parsed.hostname === originHost && parsed.pathname === '/healthy') {
				return textResponse('origin-ok');
			}
			if (parsed.hostname === originHost) {
				return new Response('', {
					headers: { location: `https://${destinationHost}${parsed.pathname}` },
					status: 302,
				});
			}
			return textResponse('', 503);
		};

		for (let index = 0; index < 3; index += 1) {
			const result = await fetchHtmlDocumentResult(fetcher, {
				url: `https://${originHost}/failure-${index}`,
				resolveHostname: resolvePublicTestHostname,
			});
			expect(result).toEqual({
				ok: false,
				failure: { kind: 'non_ok_status', reason: 'http_error', status: 503 },
			});
		}

		const blockedDestination = await fetchHtmlDocumentResult(fetcher, {
			url: `https://${originHost}/blocked`,
			resolveHostname: resolvePublicTestHostname,
		});
		const healthyOrigin = await fetchHtmlDocumentResult(fetcher, {
			url: `https://${originHost}/healthy`,
			resolveHostname: resolvePublicTestHostname,
		});

		expect(blockedDestination).toEqual({
			ok: false,
			failure: { kind: 'circuit_open', reason: 'circuit_open' },
		});
		expect(healthyOrigin).toEqual({ ok: true, value: 'origin-ok' });
		expect(fetchCalls.filter((url) => new URL(url).hostname === destinationHost)).toHaveLength(3);
	});

	it('selects the Goodreads timeout budget for a redirected hop', async () => {
		const timeoutSpy = spyOn(globalThis, 'setTimeout');
		try {
			const result = await fetchHtmlDocumentResult(
				async (url) =>
					new URL(url).hostname === 'redirect-budget.example'
						? new Response('', {
								headers: { location: 'https://www.goodreads.com/book/show/1' },
								status: 302,
							})
						: textResponse('book'),
				{
					url: 'https://redirect-budget.example/start',
					resolveHostname: resolvePublicTestHostname,
				}
			);

			expect(result).toEqual({ ok: true, value: 'book' });
			const delays = timeoutSpy.mock.calls.map((call) => call[1]);
			expect(delays).toContain(5000);
			expect(delays).toContain(2000);
		} finally {
			timeoutSpy.mockRestore();
		}
	});

	it('records every adjudicated hostile outcome and leaves another host unaffected', async () => {
		const scenarios = [
			{
				host: 'waf-host.example',
				fetch: async () =>
					new Response('', {
						headers: { 'x-amzn-waf-action': 'challenge' },
						status: 202,
					}),
				resolveHostname: resolvePublicTestHostname,
				timeoutMs: undefined,
			},
			{
				host: 'timeout-host.example',
				fetch: () => new Promise<never>(() => undefined),
				resolveHostname: resolvePublicTestHostname,
				timeoutMs: 1,
			},
			{
				host: 'dns-host.example',
				fetch: async () => textResponse('unused'),
				resolveHostname: async () => {
					throw new Error('offline');
				},
				timeoutMs: undefined,
			},
			...([403, 429, 500, 599] as const).map((status) => ({
				host: `status-${status}.example`,
				fetch: async () => new Response('', { status }),
				resolveHostname: resolvePublicTestHostname,
				timeoutMs: undefined,
			})),
		] as const;

		for (const scenario of scenarios) {
			for (let index = 0; index < 3; index += 1) {
				await fetchHtmlDocumentResult(scenario.fetch, {
					url: `https://${scenario.host}/${index}`,
					resolveHostname: scenario.resolveHostname,
					...(scenario.timeoutMs === undefined ? {} : { timeoutMs: scenario.timeoutMs }),
				});
			}
			const blocked = await fetchHtmlDocumentResult(scenario.fetch, {
				url: `https://${scenario.host}/blocked`,
				resolveHostname: scenario.resolveHostname,
			});
			expect(blocked).toEqual({
				ok: false,
				failure: { kind: 'circuit_open', reason: 'circuit_open' },
			});
		}

		let unaffectedFetches = 0;
		const unaffected = await fetchHtmlDocumentResult(
			async () => {
				unaffectedFetches += 1;
				return textResponse('healthy');
			},
			{
				url: 'https://healthy.example/article',
				resolveHostname: resolvePublicTestHostname,
			}
		);
		expect(unaffected).toEqual({ ok: true, value: 'healthy' });
		expect(unaffectedFetches).toBe(1);
	});

	it('does not open the circuit for status values above the 5xx range', async () => {
		let fetchCallCount = 0;
		const fetcher: DomainHtmlFetchLike = async () => {
			fetchCallCount += 1;
			return {
				body: null,
				ok: false,
				status: 600,
				text: async () => '',
			};
		};

		for (let index = 0; index < 4; index += 1) {
			const result = await fetchHtmlDocumentResult(fetcher, {
				url: `https://status-600.example/${index}`,
				resolveHostname: resolvePublicTestHostname,
			});
			expect(result).toEqual({
				ok: false,
				failure: { kind: 'non_ok_status', reason: 'http_error', status: 600 },
			});
		}
		expect(fetchCallCount).toBe(4);
	});

	it('does not open for clean misses, 404s, or parse failures', async () => {
		let fetchCallCount = 0;
		for (let index = 0; index < 4; index += 1) {
			const cleanMiss = await fetchHtmlDocumentResult(
				async () => {
					fetchCallCount += 1;
					return textResponse('');
				},
				{
					url: `https://clean-miss.example/${index}`,
					resolveHostname: resolvePublicTestHostname,
				}
			);
			expect(cleanMiss).toEqual({ ok: true, value: '' });

			const notFound = await fetchHtmlDocumentResult(
				async () => {
					fetchCallCount += 1;
					return textResponse('', 404);
				},
				{
					url: `https://not-found.example/${index}`,
					resolveHostname: resolvePublicTestHostname,
				}
			);
			expect(notFound).toEqual({
				ok: false,
				failure: { kind: 'non_ok_status', reason: 'http_error', status: 404 },
			});

			const parseFailure = await fetchJsonDocumentResult(
				async () => {
					fetchCallCount += 1;
					return textResponse('{broken');
				},
				{
					url: `https://parse-failure.example/${index}`,
					resolveHostname: resolvePublicTestHostname,
				}
			);
			expect(parseFailure).toEqual({
				ok: false,
				failure: { kind: 'parse_failure', reason: 'parse_failure' },
			});
		}
		expect(fetchCallCount).toBe(12);
	});

	it('admits one half-open probe, closes on success, and re-opens on failure', async () => {
		let now = 1_000;
		let releaseProbe: ((response: DomainHtmlResponse) => void) | undefined;
		let fetchCallCount = 0;
		const host = 'half-open-success.example';
		const fetcher: DomainHtmlFetchLike = async () => {
			fetchCallCount += 1;
			if (fetchCallCount <= 3) {
				return textResponse('', 503);
			}
			if (fetchCallCount === 4) {
				return await new Promise<DomainHtmlResponse>((resolve) => {
					releaseProbe = resolve;
				});
			}
			return textResponse('recovered');
		};
		const input = (path: string) => ({
			now: () => now,
			resolveHostname: resolvePublicTestHostname,
			url: `https://${host}/${path}`,
		});

		for (let index = 0; index < 3; index += 1) {
			await fetchHtmlDocumentResult(fetcher, input(String(index)));
		}
		now += HOST_CIRCUIT_BREAKER_RESET_AFTER_MS;
		const probe = fetchHtmlDocumentResult(fetcher, input('probe'));
		await Promise.resolve();
		const concurrent = await fetchHtmlDocumentResult(fetcher, input('concurrent'));
		expect(concurrent).toEqual({
			ok: false,
			failure: { kind: 'circuit_open', reason: 'circuit_open' },
		});
		releaseProbe?.(textResponse('probe-ok'));
		expect(await probe).toEqual({ ok: true, value: 'probe-ok' });
		expect(await fetchHtmlDocumentResult(fetcher, input('after-success'))).toEqual({
			ok: true,
			value: 'recovered',
		});

		resetDomainHtmlHostCircuitBreakersForTests();
		now = 10_000;
		let failingProbeCalls = 0;
		const failingProbe: DomainHtmlFetchLike = async () => {
			failingProbeCalls += 1;
			return textResponse('', 503);
		};
		for (let index = 0; index < 3; index += 1) {
			await fetchHtmlDocumentResult(failingProbe, {
				...input(`failure-${index}`),
				url: `https://half-open-failure.example/${index}`,
			});
		}
		now += HOST_CIRCUIT_BREAKER_RESET_AFTER_MS;
		await fetchHtmlDocumentResult(failingProbe, {
			...input('failure-probe'),
			url: 'https://half-open-failure.example/probe',
		});
		const reblocked = await fetchHtmlDocumentResult(failingProbe, {
			...input('failure-blocked'),
			url: 'https://half-open-failure.example/blocked',
		});
		expect(reblocked).toEqual({
			ok: false,
			failure: { kind: 'circuit_open', reason: 'circuit_open' },
		});
		expect(failingProbeCalls).toBe(4);
	});

	it('keeps the circuit open when an admitted success completes after three 503s', async () => {
		let fetchCallCount = 0;
		let releaseSlowSuccess: ((response: DomainHtmlResponse) => void) | undefined;
		const host = 'stale-success.example';
		const fetcher: DomainHtmlFetchLike = async (url) => {
			fetchCallCount += 1;
			if (new URL(url).pathname === '/slow-success') {
				return await new Promise<DomainHtmlResponse>((resolve) => {
					releaseSlowSuccess = resolve;
				});
			}
			if (new URL(url).pathname.startsWith('/failure-')) {
				return textResponse('', 503);
			}
			return textResponse('unexpected-fetch');
		};
		const input = (path: string) => ({
			url: `https://${host}/${path}`,
			resolveHostname: resolvePublicTestHostname,
		});

		const slowSuccess = fetchHtmlDocumentResult(fetcher, input('slow-success'));
		while (!releaseSlowSuccess) {
			await Promise.resolve();
		}
		for (let index = 0; index < 3; index += 1) {
			await fetchHtmlDocumentResult(fetcher, input(`failure-${index}`));
		}
		expect(await fetchHtmlDocumentResult(fetcher, input('blocked-before-release'))).toEqual({
			ok: false,
			failure: { kind: 'circuit_open', reason: 'circuit_open' },
		});

		releaseSlowSuccess(textResponse('late-success'));
		expect(await slowSuccess).toEqual({ ok: true, value: 'late-success' });
		expect(await fetchHtmlDocumentResult(fetcher, input('blocked-after-release'))).toEqual({
			ok: false,
			failure: { kind: 'circuit_open', reason: 'circuit_open' },
		});
		expect(fetchCallCount).toBe(4);
	});

	it('applies the Goodreads host budget and preserves the default for other hosts', async () => {
		const timeoutSpy = spyOn(globalThis, 'setTimeout');
		try {
			await fetchHtmlDocumentResult(async () => textResponse('book'), {
				url: 'https://www.goodreads.com/book/show/1',
				resolveHostname: resolvePublicTestHostname,
			});
			await fetchHtmlDocumentResult(async () => textResponse('book'), {
				url: 'https://goodreads.com/book/show/2',
				resolveHostname: resolvePublicTestHostname,
			});
			await fetchHtmlDocumentResult(async () => textResponse('article'), {
				url: 'https://example.com/article',
				resolveHostname: resolvePublicTestHostname,
			});
			const delays = timeoutSpy.mock.calls.map((call) => call[1]);
			expect(delays.filter((delay) => delay === 2000)).toHaveLength(2);
			expect(delays).toContain(5000);
		} finally {
			timeoutSpy.mockRestore();
		}
	});

	it('evicts the oldest host when the bounded registry reaches capacity', async () => {
		let firstHostFetches = 0;
		const firstHostFetcher: DomainHtmlFetchLike = async () => {
			firstHostFetches += 1;
			return textResponse('', 503);
		};
		for (let index = 0; index < 3; index += 1) {
			await fetchHtmlDocumentResult(firstHostFetcher, {
				url: `https://oldest.example/${index}`,
				resolveHostname: resolvePublicTestHostname,
			});
		}

		for (let index = 0; index < HOST_CIRCUIT_BREAKER_MAX_HOSTS; index += 1) {
			const result = await fetchHtmlDocumentResult(async () => textResponse('ok'), {
				url: `https://host-${index}.example/`,
				resolveHostname: resolvePublicTestHostname,
			});
			expect(result.ok).toBe(true);
		}

		const evictedHostResult = await fetchHtmlDocumentResult(firstHostFetcher, {
			url: 'https://oldest.example/after-eviction',
			resolveHostname: resolvePublicTestHostname,
		});
		expect(evictedHostResult).toEqual({
			ok: false,
			failure: { kind: 'non_ok_status', reason: 'http_error', status: 503 },
		});
		expect(firstHostFetches).toBe(4);
	});

	it('distinguishes WAF challenges from ordinary HTTP failures', async () => {
		const wafChallenge = await fetchHtmlDocumentResult(
			async () =>
				new Response('', {
					headers: { 'x-amzn-waf-action': 'challenge' },
					status: 202,
				}),
			{
				url: 'https://example.com/challenged',
				resolveHostname: resolvePublicTestHostname,
			}
		);
		const httpError = await fetchHtmlDocumentResult(async () => new Response('', { status: 503 }), {
			url: 'https://example.com/unavailable',
			resolveHostname: resolvePublicTestHostname,
		});

		expect(wafChallenge).toEqual({
			ok: false,
			failure: { kind: 'non_ok_status', reason: 'waf_challenge', status: 202 },
		});
		expect(httpError).toEqual({
			ok: false,
			failure: { kind: 'non_ok_status', reason: 'http_error', status: 503 },
		});
	});

	it('returns an attributable typed result for every transport failure class', async () => {
		const ssrfRejected = await fetchHtmlDocumentResult(async () => textResponse('unused'), {
			url: 'http://127.0.0.1/private',
		});
		const dnsFailure = await fetchHtmlDocumentResult(async () => textResponse('unused'), {
			url: 'https://offline.example',
			resolveHostname: async () => {
				throw new Error('offline DNS');
			},
		});
		const timeout = await fetchHtmlDocumentResult(() => new Promise<never>(() => undefined), {
			timeoutMs: 5,
			url: 'https://example.com/slow',
			resolveHostname: resolvePublicTestHostname,
		});
		let redirectCount = 0;
		const redirectExhausted = await fetchHtmlDocumentResult(
			async () => {
				redirectCount += 1;
				return textResponse('', 302, { location: `/hop/${redirectCount}` });
			},
			{
				url: 'https://example.com/start',
				resolveHostname: resolvePublicTestHostname,
			}
		);
		const bodyReadFailure = await fetchHtmlDocumentResult(
			async () => ({
				body: null,
				ok: true,
				status: 200,
				text: async () => 'must not be read',
			}),
			{
				url: 'https://example.com/bodyless',
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(ssrfRejected).toEqual({
			ok: false,
			failure: { kind: 'ssrf_rejected', reason: 'ssrf_rejected' },
		});
		expect(dnsFailure).toEqual({
			ok: false,
			failure: { kind: 'dns_failure', reason: 'dns_failure' },
		});
		expect(timeout).toEqual({
			ok: false,
			failure: { kind: 'timeout', reason: 'timeout' },
		});
		expect(redirectExhausted).toEqual({
			ok: false,
			failure: { kind: 'redirect_exhausted', reason: 'redirect_exhausted' },
		});
		expect(bodyReadFailure).toEqual({
			ok: false,
			failure: { kind: 'body_read_failure', reason: 'body_read_failure' },
		});
	});

	it('distinguishes empty and thrown DNS failures from unsafe DNS answers', async () => {
		const fetcher = async () => textResponse('unused');
		const emptyAnswer = await fetchHtmlDocumentResult(fetcher, {
			url: 'https://empty-dns.example',
			resolveHostname: async () => [],
		});
		const thrownLookup = await fetchHtmlDocumentResult(fetcher, {
			url: 'https://throwing-dns.example',
			resolveHostname: async () => {
				throw new Error('lookup failed');
			},
		});
		const privateAnswer = await fetchHtmlDocumentResult(fetcher, {
			url: 'https://private-answer.example',
			resolveHostname: async () => [{ address: '127.0.0.1', family: 4 }],
		});
		const malformedAnswer = await fetchHtmlDocumentResult(fetcher, {
			url: 'https://malformed-answer.example',
			resolveHostname: async () => [{ address: 'not-an-ip', family: 4 }],
		});

		expect(emptyAnswer).toEqual({
			ok: false,
			failure: { kind: 'dns_failure', reason: 'dns_failure' },
		});
		expect(thrownLookup).toEqual({
			ok: false,
			failure: { kind: 'dns_failure', reason: 'dns_failure' },
		});
		expect(privateAnswer).toEqual({
			ok: false,
			failure: { kind: 'ssrf_rejected', reason: 'ssrf_rejected' },
		});
		expect(malformedAnswer).toEqual({
			ok: false,
			failure: { kind: 'ssrf_rejected', reason: 'ssrf_rejected' },
		});
	});

	it('returns parse_failure for malformed JSON without throwing', async () => {
		const result = await fetchJsonDocumentResult(async () => textResponse('{broken'), {
			url: 'https://example.com/data.json',
			resolveHostname: resolvePublicTestHostname,
		});

		expect(result).toEqual({
			ok: false,
			failure: { kind: 'parse_failure', reason: 'parse_failure' },
		});
	});

	it('applies WAF detection only to challenged 202 or failed responses and never before redirects', async () => {
		for (const transport of ['headers', 'custom'] as const) {
			for (const status of [200, 202, 301] as const) {
				for (const wafAction of [undefined, 'ChAlLeNgE', 'allow'] as const) {
					const fetchedUrls: string[] = [];
					const fetcher: DomainHtmlFetchLike = async (url) => {
						fetchedUrls.push(url);
						if (url === 'https://example.org/final') {
							return transport === 'headers'
								? new Response('redirected')
								: customTextResponse('redirected', 200);
						}

						const headers = {
							...(status === 301 ? { location: 'https://example.org/final' } : {}),
							...(wafAction ? { 'x-amzn-waf-action': wafAction } : {}),
						};
						return transport === 'headers'
							? new Response(status === 301 ? null : 'accepted', { headers, status })
							: customTextResponse(status === 301 ? '' : 'accepted', status, headers);
					};

					const result = await fetchHtmlDocumentResult(fetcher, {
						url: 'https://example.com/start',
						resolveHostname: resolvePublicTestHostname,
					});

					if (status === 202 && wafAction?.toLowerCase() === 'challenge') {
						expect(result, `${transport} ${status} ${wafAction}`).toEqual({
							ok: false,
							failure: { kind: 'non_ok_status', reason: 'waf_challenge', status: 202 },
						});
					} else {
						expect(result, `${transport} ${status} ${wafAction}`).toEqual({
							ok: true,
							value: status === 301 ? 'redirected' : 'accepted',
						});
					}
					expect(fetchedUrls).toHaveLength(status === 301 ? 2 : 1);
				}
			}
		}
	});

	it('rejects unsafe schemes, credentials, and private literal address encodings before fetch', async () => {
		let fetchCallCount = 0;
		const fetcher: DomainHtmlFetchLike = async () => {
			fetchCallCount += 1;
			return textResponse('private data');
		};

		for (const url of [
			'file:///etc/passwd',
			'https://user:pass@example.com',
			'http://127.0.0.1',
			'http://2130706433',
			'http://0x7f000001',
			'http://127.1',
			'http://169.254.169.254/latest/meta-data',
			'https://[::1]',
			'https://[fc00::1]',
			'https://[fe80::1]',
		]) {
			expect(await fetchHtmlDocument(fetcher, { url })).toBeUndefined();
		}

		expect(fetchCallCount).toBe(0);
	});

	it('allows public IPv4 and IPv6 literals while rejecting private IPv6 literals', async () => {
		const connections: string[] = [];
		const fetcher: DomainHtmlFetchLike = async (_url, init) => {
			if (init?.connection) {
				connections.push(`${init.connection.family}:${init.connection.address}`);
			}
			return textResponse('public data');
		};

		expect(await fetchHtmlDocument(fetcher, { url: 'https://8.8.8.8' })).toBe('public data');
		expect(
			await fetchHtmlDocument(fetcher, {
				url: 'https://[2606:4700:4700::1111]/dns-query',
			})
		).toBe('public data');
		expect(await fetchHtmlDocument(fetcher, { url: 'https://[fec0::1]' })).toBeUndefined();
		expect(connections).toEqual(['4:8.8.8.8', '6:2606:4700:4700::1111']);
	});

	it('fails closed when any DNS answer is private', async () => {
		let fetchCallCount = 0;
		const result = await fetchHtmlDocument(
			async () => {
				fetchCallCount += 1;
				return textResponse('private data');
			},
			{
				url: 'https://127.0.0.1.nip.io',
				resolveHostname: async () => [
					{ address: '93.184.216.34', family: 4 },
					{ address: '127.0.0.1', family: 4 },
				],
			}
		);

		expect(result).toBeUndefined();
		expect(fetchCallCount).toBe(0);
	});

	it('rejects non-global IPv4 and IPv6 special-use DNS answers', async () => {
		const blockedAddresses = [
			{ address: '10.0.0.1', family: 4 },
			{ address: '100.64.0.1', family: 4 },
			{ address: '169.254.1.1', family: 4 },
			{ address: '192.0.0.1', family: 4 },
			{ address: '192.0.2.1', family: 4 },
			{ address: '192.88.99.1', family: 4 },
			{ address: '198.18.0.1', family: 4 },
			{ address: '198.51.100.1', family: 4 },
			{ address: '203.0.113.1', family: 4 },
			{ address: '64:ff9b:1::1', family: 6 },
			{ address: '100::1', family: 6 },
			{ address: '2001::1', family: 6 },
			{ address: '2001:2::1', family: 6 },
			{ address: '2001:db8::1', family: 6 },
			{ address: '2002:7f00:1::', family: 6 },
			{ address: '3fff::1', family: 6 },
			{ address: 'fc00::1', family: 6 },
			{ address: 'fe80::1', family: 6 },
			{ address: 'fec0::1', family: 6 },
			{ address: 'ff00::1', family: 6 },
		] as const;
		let fetchCallCount = 0;

		for (const [index, address] of blockedAddresses.entries()) {
			const result = await fetchHtmlDocument(
				async () => {
					fetchCallCount += 1;
					return textResponse('special-use data');
				},
				{
					url: `https://blocked-${index}.example`,
					resolveHostname: async () => [address],
				}
			);
			expect(result).toBeUndefined();
		}

		expect(fetchCallCount).toBe(0);
	});

	it('binds the validated DNS answer into the transport contract', async () => {
		const dnsAnswers = [
			[{ address: '93.184.216.34', family: 4 as const }],
			[{ address: '169.254.169.254', family: 4 as const }],
		] as const;
		let dnsCallCount = 0;
		let privateSentinelRequestCount = 0;
		const resolveHostname = async () => {
			const answer = dnsAnswers[dnsCallCount] ?? dnsAnswers[1];
			dnsCallCount += 1;
			return answer;
		};

		const result = await fetchHtmlDocument(
			async (_url, init) => {
				const address = init?.connection?.address;
				if (address === '169.254.169.254') {
					privateSentinelRequestCount += 1;
				}
				expect(address).toBe('93.184.216.34');
				expect(init?.connection?.hostname).toBe('rebind.example');
				return textResponse('public response');
			},
			{
				url: 'https://rebind.example/article',
				resolveHostname,
			}
		);

		expect(result).toBe('public response');
		expect(dnsCallCount).toBe(1);
		expect(privateSentinelRequestCount).toBe(0);
	});

	it('connects the default transport to the pinned address while preserving the HTTP Host', async () => {
		const received = { host: null as string | null };
		const server = Bun.serve({
			fetch: (request) => {
				received.host = request.headers.get('host');
				return new Response('local fixture');
			},
			hostname: '127.0.0.1',
			port: 0,
		});

		try {
			const fetcher = resolveDomainHtmlFetch(undefined);
			expect(fetcher).toBeDefined();
			const response = await fetcher?.(`http://metadata.example:${server.port}/article`, {
				connection: {
					address: '127.0.0.1',
					family: 4,
					hostname: 'metadata.example',
				},
			});

			expect(await response?.text()).toBe('local fixture');
			expect(received.host).toBe(`metadata.example:${server.port}`);
		} finally {
			server.stop(true);
		}
	});

	it('validates TLS against the original hostname while connecting to the pinned address', async () => {
		const fixtureDirectory = await mkdtemp(join(tmpdir(), 'atom-classification-tls-'));
		const caPath = join(fixtureDirectory, 'test-ca.pem');
		await writeFile(caPath, DOMAIN_HTML_TEST_CA);
		const receivedHosts: string[] = [];
		const server = Bun.serve({
			fetch: (request) => {
				receivedHosts.push(request.headers.get('host') ?? '');
				return new Response('trusted TLS fixture');
			},
			hostname: '127.0.0.1',
			port: 0,
			tls: {
				cert: DOMAIN_HTML_TEST_CERTIFICATE,
				key: DOMAIN_HTML_TEST_PRIVATE_KEY,
			},
		});

		try {
			const transportModuleUrl = new URL(
				'../src/plugins/shared/domain-html/fetch.ts',
				import.meta.url
			).href;
			const childScript = `
const { resolveDomainHtmlFetch } = await import(${JSON.stringify(transportModuleUrl)});
const fetcher = resolveDomainHtmlFetch(undefined);
if (!fetcher) {
	throw new Error('Expected the pinned transport');
}
const port = ${server.port};
const response = await fetcher(\`https://metadata.example:\${port}/article\`, {
	connection: {
		address: '127.0.0.1',
		family: 4,
		hostname: 'metadata.example',
	},
});
const body = await response.text();
let mismatchCode;
try {
	await fetcher(\`https://mismatch.example:\${port}/article\`, {
		connection: {
			address: '127.0.0.1',
			family: 4,
			hostname: 'mismatch.example',
		},
	});
} catch (error) {
	mismatchCode = error?.code ?? error?.cause?.code;
}
console.log(JSON.stringify({ body, mismatchCode }));
`;
			const child = Bun.spawn([process.execPath, '-e', childScript], {
				env: {
					...process.env,
					NODE_EXTRA_CA_CERTS: caPath,
				},
				stderr: 'pipe',
				stdout: 'pipe',
			});
			const [exitCode, stderr, stdout] = await Promise.all([
				child.exited,
				new Response(child.stderr).text(),
				new Response(child.stdout).text(),
			]);

			expect(stderr).toBe('');
			expect(exitCode).toBe(0);
			expect(JSON.parse(stdout)).toEqual({
				body: 'trusted TLS fixture',
				mismatchCode: 'ERR_TLS_CERT_ALTNAME_INVALID',
			});
			expect(receivedHosts).toEqual([`metadata.example:${server.port}`]);
		} finally {
			server.stop(true);
			await rm(fixtureDirectory, { force: true, recursive: true });
		}
	});

	it('connects the default transport to a pinned IPv6 address', async () => {
		const received = { host: null as string | null };
		const server = Bun.serve({
			fetch: (request) => {
				received.host = request.headers.get('host');
				return new Response('IPv6 fixture');
			},
			hostname: '::1',
			port: 0,
		});

		try {
			const fetcher = resolveDomainHtmlFetch(undefined);
			expect(fetcher).toBeDefined();
			const response = await fetcher?.(`http://metadata.example:${server.port}/article`, {
				connection: {
					address: '::1',
					family: 6,
					hostname: 'metadata.example',
				},
			});

			expect(await response?.text()).toBe('IPv6 fixture');
			expect(received.host).toBe(`metadata.example:${server.port}`);
		} finally {
			server.stop(true);
		}
	});

	it('fails closed when DNS resolution fails', async () => {
		let fetchCallCount = 0;
		const result = await fetchHtmlDocument(
			async () => {
				fetchCallCount += 1;
				return textResponse('unresolved data');
			},
			{
				url: 'https://offline.example',
				resolveHostname: async () => {
					throw new Error('offline DNS');
				},
			}
		);

		expect(result).toBeUndefined();
		expect(fetchCallCount).toBe(0);
	});

	it('includes DNS resolution in the request deadline', async () => {
		const timeoutMarker = Symbol('test timeout');
		const result = await Promise.race([
			fetchHtmlDocument(async () => textResponse('unused'), {
				url: 'https://slow-dns.example',
				resolveHostname: () => new Promise<never>(() => undefined),
				timeoutMs: 25,
			}),
			new Promise<typeof timeoutMarker>((resolve) => {
				setTimeout(() => resolve(timeoutMarker), 250);
			}),
		]);

		expect(result).toBeUndefined();
	});

	it('revalidates DNS per redirect hop and blocks a private target before fetching it', async () => {
		const fetchedUrls: string[] = [];
		const resolvedHostnames: string[] = [];
		const fetcher: DomainHtmlFetchLike = async (url) => {
			fetchedUrls.push(url);
			if (url === 'https://example.com/start') {
				return textResponse('', 302, {
					location: 'https://example.org/article',
				});
			}
			if (url === 'https://example.org/article') {
				return textResponse('', 302, {
					location: 'http://169.254.169.254/latest/meta-data',
				});
			}
			return textResponse('private data');
		};

		const result = await fetchHtmlDocument(fetcher, {
			url: 'https://example.com/start',
			resolveHostname: async (hostname) => {
				resolvedHostnames.push(hostname);
				return await resolvePublicTestHostname(hostname);
			},
		});

		expect(result).toBeUndefined();
		expect(fetchedUrls).toEqual(['https://example.com/start', 'https://example.org/article']);
		expect(resolvedHostnames).toEqual(['example.com', 'example.org']);
	});

	it('follows a public redirect chain to a successful response', async () => {
		const fetchedUrls: string[] = [];
		const result = await fetchHtmlDocument(
			async (url) => {
				fetchedUrls.push(url);
				return url === 'https://example.com/start'
					? textResponse('redirect', 302, {
							location: 'https://example.org/article',
						})
					: textResponse('article');
			},
			{
				url: 'https://example.com/start',
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toBe('article');
		expect(fetchedUrls).toEqual(['https://example.com/start', 'https://example.org/article']);
	});

	it('stops after the bounded number of redirects', async () => {
		let fetchCallCount = 0;
		let cancelCallCount = 0;
		const result = await fetchHtmlDocument(
			async () => {
				fetchCallCount += 1;
				return cancellableResponse({
					headers: { location: `/hop/${fetchCallCount}` },
					onCancel: () => {
						cancelCallCount += 1;
					},
					status: 302,
				});
			},
			{
				url: 'https://example.com/start',
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toBeUndefined();
		expect(fetchCallCount).toBe(6);
		expect(cancelCallCount).toBe(6);
	});

	it('removes credential-bearing headers after a cross-origin redirect', async () => {
		const requestHeaders: Record<string, string>[] = [];
		const result = await fetchHtmlDocument(
			async (url, init) => {
				requestHeaders.push(init?.headers ?? {});
				return url === 'https://example.com/start'
					? textResponse('redirect', 302, {
							location: 'https://example.org/article',
						})
					: textResponse('article');
			},
			{
				headers: {
					Authorization: 'Bearer redacted',
					Cookie: 'session=redacted',
					'X-API-Key': 'redacted',
				},
				resolveHostname: resolvePublicTestHostname,
				url: 'https://example.com/start',
			}
		);

		expect(result).toBe('article');
		expect(requestHeaders[0]?.Authorization).toBe('Bearer redacted');
		expect(requestHeaders[1]?.Authorization).toBeUndefined();
		expect(requestHeaders[1]?.Cookie).toBeUndefined();
		expect(requestHeaders[1]?.['X-API-Key']).toBeUndefined();
		expect(requestHeaders[1]?.accept).toBeDefined();
		expect(requestHeaders[1]?.['user-agent']).toBeDefined();
	});

	it('cancels redirect, non-OK, and declared-oversized response bodies', async () => {
		for (const scenario of ['redirect', 'non-ok', 'oversized'] as const) {
			let cancelCallCount = 0;
			const result = await fetchHtmlDocument(
				async () =>
					cancellableResponse({
						headers:
							scenario === 'redirect'
								? { location: 'http://127.0.0.1/private' }
								: scenario === 'oversized'
									? { 'content-length': '5' }
									: undefined,
						onCancel: () => {
							cancelCallCount += 1;
						},
						status: scenario === 'redirect' ? 302 : scenario === 'non-ok' ? 503 : 200,
					}),
				{
					maxResponseBytes: scenario === 'oversized' ? 4 : undefined,
					resolveHostname: resolvePublicTestHostname,
					url: 'https://example.com/start',
				}
			);

			expect(result).toBeUndefined();
			expect(cancelCallCount).toBe(1);
		}
	});

	it('cancels a successful response body when only the final URL is needed', async () => {
		let cancelCallCount = 0;
		const result = await resolvePublicHttpUrl(
			async () =>
				cancellableResponse({
					onCancel: () => {
						cancelCallCount += 1;
					},
					status: 200,
				}),
			{
				resolveHostname: resolvePublicTestHostname,
				url: 'https://example.com/article',
			}
		);

		expect(result).toBe('https://example.com/article');
		expect(cancelCallCount).toBe(1);
	});

	it('bounds a transport that ignores the abort signal', async () => {
		const timeoutMarker = Symbol('test timeout');
		const result = await Promise.race([
			fetchHtmlDocument(() => new Promise<never>(() => undefined), {
				url: 'https://example.com',
				resolveHostname: resolvePublicTestHostname,
				timeoutMs: 25,
			}),
			new Promise<typeof timeoutMarker>((resolve) => {
				setTimeout(() => resolve(timeoutMarker), 250);
			}),
		]);

		expect(result).toBeUndefined();
	});

	it('keeps the timeout active while reading and cancels a stalled response body', async () => {
		const timeoutMarker = Symbol('test timeout');
		let cancelCallCount = 0;
		const result = await Promise.race([
			fetchHtmlDocument(
				async () => ({
					body: {
						getReader: () => ({
							cancel: async () => {
								cancelCallCount += 1;
							},
							read: () => new Promise<never>(() => undefined),
						}),
					},
					ok: true,
					status: 200,
					text: async () => 'unused',
				}),
				{
					url: 'https://example.com',
					resolveHostname: resolvePublicTestHostname,
					timeoutMs: 25,
				}
			),
			new Promise<typeof timeoutMarker>((resolve) => {
				setTimeout(() => resolve(timeoutMarker), 250);
			}),
		]);

		expect(result).toBeUndefined();
		expect(cancelCallCount).toBe(1);
	});

	it('fails closed without invoking an unbounded bodyless text fallback', async () => {
		let textCallCount = 0;
		const result = await fetchHtmlDocument(
			async () => ({
				body: null,
				ok: true,
				status: 200,
				text: async () => {
					textCallCount += 1;
					return 'oversized';
				},
			}),
			{
				maxResponseBytes: 4,
				resolveHostname: resolvePublicTestHostname,
				url: 'https://example.com',
			}
		);

		expect(result).toBeUndefined();
		expect(textCallCount).toBe(0);
	});

	it('cancels a streamed response when it crosses the body cap', async () => {
		let cancelCallCount = 0;
		const result = await fetchHtmlDocument(
			async () => ({
				body: {
					getReader: () => ({
						cancel: async () => {
							cancelCallCount += 1;
						},
						read: async () => ({
							done: false,
							value: new TextEncoder().encode('12345'),
						}),
					}),
				},
				ok: true,
				status: 200,
				text: async () => 'unused',
			}),
			{
				url: 'https://example.com',
				maxResponseBytes: 4,
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toBeUndefined();
		expect(cancelCallCount).toBe(1);
	});
});

function textResponse(
	body: string,
	status = 200,
	headers?: Record<string, string>
): DomainHtmlResponse {
	return new Response(body, { headers, status });
}

function cancellableResponse(input: {
	headers?: Record<string, string>;
	onCancel: () => void;
	status: number;
}): DomainHtmlResponse {
	return {
		body: {
			getReader: () => ({
				cancel: async () => {
					input.onCancel();
				},
				read: async () => ({ done: true }),
			}),
		},
		headers: {
			get: (name: string) =>
				Object.entries(input.headers ?? {}).find(
					([headerName]) => headerName.toLowerCase() === name.toLowerCase()
				)?.[1] ?? null,
		},
		ok: input.status >= 200 && input.status < 300,
		status: input.status,
		text: async () => '',
	};
}

function customTextResponse(
	body: string,
	status: number,
	headers: Record<string, string> = {}
): DomainHtmlResponse {
	let consumed = false;
	return {
		body: {
			getReader: () => ({
				cancel: async () => {
					consumed = true;
				},
				read: async () => {
					if (consumed) {
						return { done: true };
					}
					consumed = true;
					return { done: false, value: new TextEncoder().encode(body) };
				},
				releaseLock: () => undefined,
			}),
		},
		headers: {
			get: (name: string) =>
				Object.entries(headers).find(
					([headerName]) => headerName.toLowerCase() === name.toLowerCase()
				)?.[1] ?? null,
		},
		ok: status >= 200 && status < 300,
		status,
		text: async () => body,
	};
}
