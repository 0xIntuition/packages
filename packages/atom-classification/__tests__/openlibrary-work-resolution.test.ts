import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import {
	createClassificationEngine,
	createGoodreadsPlugin,
	createIsbnPlugin,
	createMemoryClassificationCacheAdapter,
	createTypeProfilesPlugin,
	resolveOpenLibraryWork,
} from '../src';
import { decodeHtmlEntities } from '../src/plugins/shared/domain-html/document';
import { resetDomainHtmlHostCircuitBreakersForTests } from '../src/plugins/shared/domain-html/fetch';
import {
	buildOpenLibraryWorkAtom,
	resetOpenLibraryLookupCacheForTests,
} from '../src/plugins/shared/openlibrary-lookup';
import { resolvePublicTestHostname } from './helpers/public-dns';

type StubFetch = NonNullable<
	NonNullable<Parameters<typeof createGoodreadsPlugin>[0]>['openLibrary']
>['fetch'];

const GOODREADS_URL = 'https://www.goodreads.com/book/show/133518.The_Giver';
const ISBN = '9780544336261';
const WORK_KEY = 'OL1168083W';

type OpenLibraryBehavior = 'hit' | 'miss' | 'outage' | 'timeout';

function createOpenLibraryFetch(behavior: OpenLibraryBehavior, onFetch?: (url: string) => void) {
	const fetch: StubFetch = async (url, init) => {
		onFetch?.(url);
		if (behavior === 'outage') return new Response('', { status: 503 });
		if (behavior === 'miss') return Response.json({ docs: [], numFound: 0 });
		if (behavior === 'timeout') {
			return await new Promise<Response>((_resolve, reject) => {
				init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true });
			});
		}

		return Response.json({
			docs: [
				{
					author_name: ['Lois Lowry'],
					isbn: ['0544336267', ISBN],
					key: `/works/${WORK_KEY}`,
					title: 'The Giver',
				},
			],
			numFound: 1,
		});
	};
	return fetch;
}

function createGoodreadsEngine(behavior: OpenLibraryBehavior, onFetch?: (url: string) => void) {
	return createClassificationEngine({
		onClassifierError: () => undefined,
		plugins: [
			createTypeProfilesPlugin(),
			createGoodreadsPlugin({
				openLibrary: {
					fetch: createOpenLibraryFetch(behavior, onFetch),
					...(behavior === 'timeout' ? { budgetMs: 30 } : {}),
					resolveHostname: resolvePublicTestHostname,
				},
				useDefaultOpenGraphAdapter: false,
			}),
		],
		runtime: 'server',
	});
}

function createIsbnEngine(behavior: OpenLibraryBehavior, onFetch?: (url: string) => void) {
	return createClassificationEngine({
		onClassifierError: () => undefined,
		plugins: [
			createTypeProfilesPlugin(),
			createIsbnPlugin({
				openLibrary: {
					fetch: createOpenLibraryFetch(behavior, onFetch),
					...(behavior === 'timeout' ? { budgetMs: 30 } : {}),
					resolveHostname: resolvePublicTestHostname,
				},
			}),
		],
		runtime: 'server',
	});
}

function decodeToDisplayDepth(value: string): string {
	let decoded = value;
	for (let index = 0; index < 3; index += 1) {
		const next = decodeHtmlEntities(decoded) ?? decoded;
		if (next === decoded) break;
		decoded = next;
	}
	return decoded;
}

describe('ENG-15074 OpenLibrary work-resolution parity', () => {
	beforeEach(() => {
		resetDomainHtmlHostCircuitBreakersForTests();
		resetOpenLibraryLookupCacheForTests();
	});

	it('treats multiple distinct valid work keys as a typed miss', async () => {
		const result = await resolveOpenLibraryWork(
			{ kind: 'isbn', value: ISBN },
			{
				fetch: async () =>
					Response.json({
						docs: [
							{ key: '/works/OL111W', title: 'Wrong work' },
							{ key: '/authors/OL1A', title: 'Malformed interleave' },
							{ key: '/works/OL222W', title: 'Right work' },
						],
						numFound: 3,
					}),
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toEqual({ status: 'miss' });
	});

	it('accepts duplicate documents that all identify the same work key', async () => {
		const result = await resolveOpenLibraryWork(
			{ kind: 'isbn', value: ISBN },
			{
				fetch: async () =>
					Response.json({
						docs: [
							{ key: `/works/${WORK_KEY}`, title: 'The Giver' },
							{ key: `/works/${WORK_KEY.toLowerCase()}`, title: 'The Giver' },
						],
						numFound: 2,
					}),
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toMatchObject({ status: 'hit', workKey: WORK_KEY, title: 'The Giver' });
	});

	it('ignores malformed documents around one uniquely valid work key', async () => {
		const result = await resolveOpenLibraryWork(
			{ kind: 'goodreads', value: '133518' },
			{
				fetch: async () =>
					Response.json({
						docs: [
							null,
							{ key: '/books/OL7353617M', title: 'Edition, not work' },
							{ key: `/works/${WORK_KEY}`, title: 'The Giver' },
							{ key: 42 },
						],
						numFound: 4,
					}),
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toMatchObject({ status: 'hit', workKey: WORK_KEY, title: 'The Giver' });
	});

	it('rejects a response-bearing redirect outside the OpenLibrary authority', async () => {
		let attackerBodyAccepted = false;
		const result = await resolveOpenLibraryWork(
			{ kind: 'isbn', value: ISBN },
			{
				fetch: async (url) => {
					if (new URL(url).hostname === 'openlibrary.org') {
						return new Response('', {
							headers: { location: 'https://attacker.example/result.json' },
							status: 302,
						});
					}
					const body = new TextEncoder().encode(
						JSON.stringify({
							docs: [{ key: '/works/OL999W', title: 'Attacker work' }],
							numFound: 1,
						})
					);
					let sent = false;
					return {
						body: {
							getReader: () => ({
								cancel: async () => undefined,
								read: async () => {
									attackerBodyAccepted = true;
									if (sent) return { done: true };
									sent = true;
									return { done: false, value: body };
								},
								releaseLock: () => undefined,
							}),
						},
						headers: new Headers({ 'content-type': 'application/json' }),
						ok: true,
						status: 200,
						text: async () => new TextDecoder().decode(body),
					};
				},
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toMatchObject({
			status: 'failure',
			failure: { kind: 'redirect_exhausted', reason: 'redirect_exhausted' },
		});
		expect(attackerBodyAccepted).toBe(false);
	});

	it.each([
		undefined,
		2000,
	])('enforces one shared redirect deadline with budgetMs=%s (default 5000)', async (budgetMs) => {
		let fetchCallCount = 0;
		const scheduled: number[] = [];
		const originalTimer = globalThis.setTimeout;
		const timer = spyOn(globalThis, 'setTimeout').mockImplementation(((
			callback: () => void,
			ms: number
		) => {
			scheduled.push(ms);
			return originalTimer(callback, Math.min(ms, 30));
		}) as typeof setTimeout);
		try {
			const result = await resolveOpenLibraryWork(
				{ kind: 'isbn', value: ISBN },
				{
					budgetMs,
					fetch: async (_url, init) => {
						fetchCallCount += 1;
						if (fetchCallCount === 1)
							return new Response('', {
								status: 302,
								headers: { location: 'https://www.openlibrary.org/search.json?hop=2' },
							});
						return await new Promise<Response>((_resolve, reject) => {
							init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), {
								once: true,
							});
						});
					},
					resolveHostname: resolvePublicTestHostname,
				}
			);
			expect(result).toMatchObject({
				status: 'failure',
				failure: { kind: 'timeout', reason: 'timeout' },
			});
			expect(fetchCallCount).toBe(2);
			expect(scheduled).toHaveLength(1);
			expect(scheduled[0]).toBeGreaterThan((budgetMs ?? 5000) - 100);
			expect(scheduled[0]).toBeLessThanOrEqual(budgetMs ?? 5000);
		} finally {
			timer.mockRestore();
		}
	});

	it('keeps loopback redirects rejected before loopback fetch I/O', async () => {
		let loopbackFetchCount = 0;
		const result = await resolveOpenLibraryWork(
			{ kind: 'goodreads', value: '133518' },
			{
				fetch: async (url) => {
					if (new URL(url).hostname === '127.0.0.1') {
						loopbackFetchCount += 1;
						return Response.json({ docs: [{ key: '/works/OL999W' }] });
					}
					return new Response('', {
						headers: { location: 'http://127.0.0.1/private' },
						status: 302,
					});
				},
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toMatchObject({
			status: 'failure',
			failure: { kind: 'ssrf_rejected', reason: 'ssrf_rejected' },
		});
		expect(loopbackFetchCount).toBe(0);
	});

	it.each([
		['bidi override', `A deceptive\u202E title`],
		['markup delimiters', '<script>alert(1)</script>'],
		['single-encoded markup delimiters', '&lt;script&gt;alert(1)&lt;/script&gt;'],
		['double-encoded markup delimiters', '&amp;lt;script&amp;gt;alert(1)&amp;lt;/script&amp;gt;'],
		[
			'triple-encoded markup delimiters',
			'&amp;amp;lt;script&amp;amp;gt;alert(1)&amp;amp;lt;/script&amp;amp;gt;',
		],
		[
			'fourth-level encoded markup delimiters',
			'&amp;amp;amp;lt;script&amp;amp;amp;gt;alert(1)&amp;amp;amp;lt;/script&amp;amp;amp;gt;',
		],
		['hex-encoded bidi override', 'A deceptive &#x202E; title'],
		['decimal-encoded bidi override', 'A deceptive &#8238; title'],
		['decimal zero reference', 'Safe&#0;Title'],
		['hexadecimal zero reference', 'Safe&#x0;Title'],
		['decimal above-Unicode reference', 'Safe&#1114112;Title'],
		['hexadecimal above-Unicode reference', 'Safe&#x110000;Title'],
		['decimal lone-surrogate reference', 'Safe&#55296;Title'],
		['hexadecimal lone-surrogate reference', 'Safe&#xD800;Title'],
		['decimal C0-control reference', 'Safe&#1;Title'],
		['hexadecimal C0-control reference', 'Safe&#x1F;Title'],
		['decimal C1-control reference', 'Safe&#128;Title'],
		['hexadecimal C1-control reference', 'Safe&#x9F;Title'],
		['decimal noncharacter reference', 'Safe&#64976;Title'],
		['hexadecimal noncharacter reference', 'Safe&#xFFFF;Title'],
		['unresolved named entity', 'A title with &DefinitelyNotAnHtmlEntity;'],
		['control character', 'Control\u0000Title'],
		['byte-order mark', `Hidden\uFEFFTitle`],
		['more than 200 Unicode code points', '📚'.repeat(201)],
	] as const)('keeps the work hit but drops an unsafe OL title: %s', async (_label, title) => {
		const result = await resolveOpenLibraryWork(
			{ kind: 'goodreads', value: '133518' },
			{
				fetch: async () =>
					Response.json({
						docs: [{ key: `/works/${WORK_KEY}`, title }],
						numFound: 1,
					}),
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result.status).toBe('hit');
		if (result.status !== 'hit') throw new Error('Expected a work identity hit');
		expect(result.title).toBeUndefined();
		const atom = buildOpenLibraryWorkAtom(result);
		expect(atom).toMatchObject({
			canonicalId: `openlibrary:work:${WORK_KEY}`,
			title: `OpenLibrary Work ${WORK_KEY}`,
			data: { name: `OpenLibrary Work ${WORK_KEY}` },
		});
		const lifecycleName = atom.data?.name;
		expect(typeof lifecycleName).toBe('string');
		expect(decodeToDisplayDepth(String(lifecycleName))).toBe(`OpenLibrary Work ${WORK_KEY}`);
	});

	it.each([
		['literal ampersand and diacritics', 'L’Étranger & Café', 'L’Étranger & Café'],
		['literal ampersand', 'AT&T', 'AT&T'],
		['encoded ampersand', 'AT&amp;T', 'AT&T'],
		['named acute accent', 'Caf&eacute;', 'Café'],
		[
			'multibyte named references',
			'Schr&ouml;dinger &mdash; A Biography&hellip;',
			'Schrödinger — A Biography…',
		],
	] as const)('preserves a legitimate OL title with %s', async (_label, title, expected) => {
		const result = await resolveOpenLibraryWork(
			{ kind: 'isbn', value: ISBN },
			{
				fetch: async () =>
					Response.json({
						docs: [{ key: `/works/${WORK_KEY}`, title }],
						numFound: 1,
					}),
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toMatchObject({ status: 'hit', workKey: WORK_KEY, title: expected });
		if (result.status !== 'hit') throw new Error('Expected a work identity hit');
		const atom = buildOpenLibraryWorkAtom(result);
		expect(atom).toMatchObject({ data: { name: expected } });
		expect(decodeToDisplayDepth(String(atom.data?.name))).toBe(expected);
	});

	it('goodreads × OL-hit resolves the work and carries fresh book fields', async () => {
		let requestedUrl = '';
		let fetchCallCount = 0;
		const result = await createGoodreadsEngine('hit', (url) => {
			requestedUrl = url;
			fetchCallCount += 1;
		}).classify({
			classificationSessionId: 'goodreads-ol-hit',
			input: GOODREADS_URL,
			mode: 'server-only',
		});

		expect(new URL(requestedUrl).pathname).toBe('/search.json');
		expect(new URL(requestedUrl).searchParams.get('q')).toBe('id_goodreads:133518');
		expect(new URL(requestedUrl).searchParams.get('fields')).toBe('key,title,author_name,isbn');
		expect(fetchCallCount).toBe(1);
		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: `openlibrary:work:${WORK_KEY}`,
			title: 'The Giver',
			hints: {
				identifiers: { goodreadsBookId: '133518', isbn: ISBN, olid: WORK_KEY },
				providerCanonicalIds: ['goodreads:book:133518'],
			},
			data: {
				author_name: ['Lois Lowry'],
				identifier: `int:olid:${WORK_KEY}`,
				name: 'The Giver',
				isbn: ['0544336267', ISBN],
				sameAs: [
					GOODREADS_URL.replace('.The_Giver', ''),
					`https://openlibrary.org/works/${WORK_KEY}`,
				],
			},
		});
		expect(result.resolved?.atoms[0]?.data.author).toEqual([
			{ '@type': 'Person', name: 'Lois Lowry' },
		]);
		expect(result.resolved?.atoms[0]?.canonicalId).not.toContain('isbn');
	});

	it('goodreads × OL-miss falls through cleanly to the provider-local identity', async () => {
		const result = await createGoodreadsEngine('miss').classify({
			classificationSessionId: 'goodreads-ol-miss',
			input: GOODREADS_URL,
			mode: 'server-only',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'goodreads:book:133518',
			title: 'The Giver',
		});
		expect(result.resolverErrors ?? []).toEqual([]);
	});

	it('goodreads × OL-outage records a typed failure and still completes', async () => {
		const result = await createGoodreadsEngine('outage').classify({
			classificationSessionId: 'goodreads-ol-outage',
			input: GOODREADS_URL,
			mode: 'server-only',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]?.canonicalId).toBe('goodreads:book:133518');
		expect(result.resolverErrors?.[0]?.message).toContain('http_error');
	});

	it('goodreads × OL-timeout falls back to the provider-local identity without throwing', async () => {
		const result = await createGoodreadsEngine('timeout').classify({
			classificationSessionId: 'goodreads-ol-timeout',
			input: GOODREADS_URL,
			mode: 'server-only',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]?.canonicalId).toBe('goodreads:book:133518');
		expect(result.resolverErrors?.[0]?.message).toContain('timeout');
	});

	it('isbn-input × hit resolves to the work instead of the edition ISBN', async () => {
		let requestedUrl = '';
		const result = await createIsbnEngine('hit', (url) => {
			requestedUrl = url;
		}).classify({
			classificationSessionId: 'isbn-ol-hit',
			input: ISBN,
			mode: 'server-only',
		});

		expect(new URL(requestedUrl).searchParams.get('q')).toBe(`isbn:${ISBN}`);
		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: `openlibrary:work:${WORK_KEY}`,
			title: 'The Giver',
		});
	});

	it('isbn-input × miss emits the ISBN fallback only after the typed miss', async () => {
		const result = await createIsbnEngine('miss').classify({
			classificationSessionId: 'isbn-ol-miss',
			input: ISBN,
			mode: 'server-only',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]?.canonicalId).toBe(`isbn:${ISBN}`);
		expect(result.resolverErrors ?? []).toEqual([]);
	});

	it('isbn-input × outage emits the ISBN fallback with a typed failure', async () => {
		const result = await createIsbnEngine('outage').classify({
			classificationSessionId: 'isbn-ol-outage',
			input: ISBN,
			mode: 'server-only',
		});

		expect(result.status).toBe('complete');
		expect(result.resolved?.atoms[0]?.canonicalId).toBe(`isbn:${ISBN}`);
		expect(result.resolverErrors?.[0]?.message).toContain('http_error');
	});

	it('keeps the OpenLibrary stage behind the resolver cache', async () => {
		let fetchCallCount = 0;
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			cache: createMemoryClassificationCacheAdapter(),
			plugins: [
				createTypeProfilesPlugin(),
				createGoodreadsPlugin({
					openLibrary: {
						fetch: createOpenLibraryFetch('hit', () => {
							fetchCallCount += 1;
						}),
						resolveHostname: resolvePublicTestHostname,
					},
					useDefaultOpenGraphAdapter: false,
				}),
			],
			runtime: 'server',
		});

		await engine.classify({
			classificationSessionId: 'goodreads-cache-first',
			input: GOODREADS_URL,
			mode: 'server-only',
		});
		const cached = await engine.classify({
			classificationSessionId: 'goodreads-cache-second',
			input: GOODREADS_URL,
			mode: 'server-only',
		});

		expect(fetchCallCount).toBe(1);
		expect(cached.resolved?.atoms[0]?.canonicalId).toBe(`openlibrary:work:${WORK_KEY}`);
	});
});
