import { beforeEach, describe, expect, it } from 'bun:test';
import { resolvePublicTestHostname } from '../../../__tests__/helpers/public-dns';
import { createServerEngine } from '../../index';
import {
	type OpenLibraryWorkLookupOptions,
	resetOpenLibraryLookupCacheForTests,
	resolveOpenLibraryWork,
} from '../shared/openlibrary-lookup';
import { createTypeProfilesPlugin } from '../type-profiles';
import { createGoodreadsPlugin, resolveGoodreadsBlockedOutcome } from '.';
import { buildGoodreadsOpenLibraryWorkAtom } from './openlibrary-adapter';

type OpenLibraryDoc = {
	author_name?: string[];
	cover_i?: number;
	key: string;
	title: string;
};
type StubFetch = NonNullable<OpenLibraryWorkLookupOptions['fetch']>;

const response = (docs: OpenLibraryDoc[], numFound = docs.length) =>
	Response.json({ docs, numFound });

const work = (
	workKey: string,
	title: string,
	extra: Omit<OpenLibraryDoc, 'key' | 'title'> = {}
): OpenLibraryDoc => ({ key: `/works/${workKey}`, title, ...extra });

beforeEach(() => resetOpenLibraryLookupCacheForTests());

describe('Open Library title lookup', () => {
	it.each([
		['The Handmaid s Tale', "The Handmaid's Tale", 'The Handmaid Tale'],
		['11 22 63', '11/22/63', '11 22 63'],
		['Fat Quarter Friendly Quilts', 'Fat-Quarter Friendly Quilts', 'Fat Quarter Friendly Quilts'],
	] as const)('matches punctuation variants for %s', async (slugTitle, openLibraryTitle, expectedQuery) => {
		let requestedUrl = '';
		const result = await resolveOpenLibraryWork(
			{ kind: 'title', value: slugTitle },
			{
				cache: false,
				fetch: async (url) => {
					requestedUrl = String(url);
					return response([work('OL123W', openLibraryTitle)]);
				},
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toMatchObject({ status: 'hit', title: openLibraryTitle });
		const search = new URL(requestedUrl).searchParams;
		expect(search.get('title')).toBe(expectedQuery);
		expect(search.get('limit')).toBe('10');
		expect(search.get('fields')).toContain('cover_i');
	});

	it('returns candidates when an exact result window is incomplete', async () => {
		const result = await resolveOpenLibraryWork(
			{ kind: 'title', value: 'Rapture' },
			{
				cache: false,
				fetch: async () =>
					response([work('OL1W', 'Rapture', { author_name: ['A. Author'], cover_i: 42 })], 1522),
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toEqual({
			status: 'ambiguous',
			candidates: [
				{
					authorName: 'A. Author',
					coverId: 42,
					exact: true,
					title: 'Rapture',
					workKey: 'OL1W',
				},
			],
		});
	});

	it.each([
		['zero', 0],
		['fractional', 1.5],
		['larger than the returned rows', 2],
		['outside the requested window', 11],
		['missing', undefined],
	] as const)('never auto-accepts a single exact row when numFound is %s', async (_label, numFound) => {
		const result = await resolveOpenLibraryWork(
			{ kind: 'title', value: 'Rapture' },
			{
				cache: false,
				fetch: async () =>
					Response.json({
						docs: [work('OL1W', 'Rapture')],
						...(numFound === undefined ? {} : { numFound }),
					}),
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toMatchObject({ status: 'ambiguous', candidates: [{ workKey: 'OL1W' }] });
	});

	it('never auto-accepts when an exact-title row is not a work row', async () => {
		const result = await resolveOpenLibraryWork(
			{ kind: 'title', value: 'Rapture' },
			{
				cache: false,
				fetch: async () =>
					Response.json({
						docs: [work('OL1W', 'Rapture'), { key: '/authors/OL2A', title: 'Rapture' }],
						numFound: 2,
					}),
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toMatchObject({ status: 'ambiguous', candidates: [{ workKey: 'OL1W' }] });
	});

	it.each([
		['missing', {}],
		['numeric', { title: 42 }],
		['empty', { title: '' }],
	] as const)('never auto-accepts when another work row has an %s title', async (_label, doc) => {
		const result = await resolveOpenLibraryWork(
			{ kind: 'title', value: 'Rapture' },
			{
				cache: false,
				fetch: async () =>
					Response.json({
						docs: [work('OL1W', 'Rapture'), { key: '/works/OL2W', ...doc }],
						numFound: 2,
					}),
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toMatchObject({ status: 'ambiguous', candidates: [{ workKey: 'OL1W' }] });
	});

	it.each([
		['different punctuation', '---', '!!!'],
		['the same punctuation', '!!!', '!!!'],
	] as const)('never treats punctuation-only titles as exact (%s)', async (_label, query, candidate) => {
		const result = await resolveOpenLibraryWork(
			{ kind: 'title', value: query },
			{
				cache: false,
				fetch: async () => response([work('OL9W', candidate)]),
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toMatchObject({
			status: 'ambiguous',
			candidates: [{ exact: false, workKey: 'OL9W' }],
		});
	});

	it.each([
		['empty', ''],
		['whitespace-only', '   '],
		['longer than the candidate title cap', `${'-'.repeat(201)}A`],
	] as const)('misses without a request for a %s title query', async (_label, value) => {
		let requests = 0;
		const result = await resolveOpenLibraryWork(
			{ kind: 'title', value },
			{
				cache: false,
				fetch: async () => {
					requests += 1;
					return response([work('OL1W', 'A')]);
				},
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(requests).toBe(0);
		expect(result).toEqual({ status: 'miss' });
	});

	it('queries a title that is itself a lone S or T instead of an empty title', async () => {
		let requestedUrl = '';
		const result = await resolveOpenLibraryWork(
			{ kind: 'title', value: 'S' },
			{
				cache: false,
				fetch: async (url) => {
					requestedUrl = String(url);
					return response([work('OL3W', 'S.', { author_name: ['Doug Dorst', 'J. J. Abrams'] })]);
				},
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(new URL(requestedUrl).searchParams.get('title')).toBe('S');
		expect(result).toMatchObject({ status: 'hit', workKey: 'OL3W', title: 'S.' });
	});

	it('does not exact-match a title that retains non-ASCII code points after NFKD', async () => {
		const result = await resolveOpenLibraryWork(
			{ kind: 'title', value: 'The World Atlas of Wine' },
			{
				cache: false,
				fetch: async () => response([work('OL2W', '世界のワイン図鑑 The World Atlas of Wine')]),
				resolveHostname: resolvePublicTestHostname,
			}
		);

		expect(result).toMatchObject({
			status: 'ambiguous',
			candidates: [{ exact: false, workKey: 'OL2W' }],
		});
	});

	it('emits the same covered atom for Goodreads-id and title hits', async () => {
		const doc = work('OL468431W', 'The Great Gatsby', {
			author_name: ['F. Scott Fitzgerald'],
			cover_i: 12_345,
		});
		const options = {
			cache: false as const,
			fetch: async () => response([doc]),
			resolveHostname: resolvePublicTestHostname,
		};
		const idResult = await resolveOpenLibraryWork({ kind: 'goodreads', value: '4671' }, options);
		const titleResult = await resolveOpenLibraryWork(
			{ kind: 'title', value: 'The Great Gatsby' },
			options
		);

		expect(idResult).toMatchObject({ status: 'hit', coverId: 12_345 });
		expect(titleResult).toMatchObject({ status: 'hit', coverId: 12_345 });
		if (idResult.status !== 'hit' || titleResult.status !== 'hit') {
			throw new Error('Expected Goodreads-id and title work hits');
		}
		const input = {
			bookId: '4671',
			canonicalUrl: 'https://www.goodreads.com/book/show/4671',
		};
		const idAtom = buildGoodreadsOpenLibraryWorkAtom(idResult, input);
		const titleAtom = buildGoodreadsOpenLibraryWorkAtom(titleResult, input);
		expect(idAtom).toEqual(titleAtom);
		expect(idAtom.data).toMatchObject({ coverId: 12_345 });
	});
});

describe('Goodreads URL-only Open Library bridge', () => {
	const classify = async (input: string, fetch: StubFetch, budgetMs?: number) => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: [
				createTypeProfilesPlugin(),
				createGoodreadsPlugin({
					openLibrary: { budgetMs, fetch, resolveHostname: resolvePublicTestHostname },
				}),
			],
		});
		return await engine.classify({
			classificationSessionId: `goodreads-title-${input}`,
			input,
			mode: 'server-only',
		});
	};

	it('falls back from Goodreads id to a unique title and keeps the Goodreads URL as sameAs', async () => {
		const calls: string[] = [];
		const input = 'https://www.goodreads.com/book/show/59552636-living-untethered';
		const result = await classify(input, async (url) => {
			const requested = String(url);
			calls.push(requested);
			expect(new URL(requested).hostname).toBe('openlibrary.org');
			return new URL(requested).searchParams.has('q')
				? response([])
				: response([work('OL39510773W', 'Living Untethered')]);
		});

		expect(calls).toHaveLength(2);
		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'openlibrary:work:OL39510773W',
			data: { identifier: 'int:olid:OL39510773W' },
			sameAs: [
				'https://www.goodreads.com/book/show/59552636',
				'https://openlibrary.org/works/OL39510773W',
			],
		});
	});

	it('keeps the Goodreads-id hit path unchanged', async () => {
		const calls: string[] = [];
		const result = await classify(
			'https://www.goodreads.com/book/show/4671.The_Great_Gatsby',
			async (url) => {
				calls.push(String(url));
				return response([work('OL468431W', 'The Great Gatsby')]);
			}
		);

		expect(calls).toHaveLength(1);
		expect(new URL(calls[0] ?? '').searchParams.get('q')).toBe('id_goodreads:4671');
		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'openlibrary:work:OL468431W',
			data: { identifier: 'int:olid:OL468431W' },
		});
	});

	it('attaches ambiguous candidates to the generic atom without producing a blocked outcome', async () => {
		const input = 'https://www.goodreads.com/book/show/12345-Rapture';
		const result = await classify(input, async (url) => {
			if (new URL(String(url)).searchParams.has('q')) return response([]);
			return response([
				work('OL1W', 'Rapture', { author_name: ['First Author'], cover_i: 1 }),
				work('OL2W', 'Rapture', { author_name: ['Second Author'], cover_i: 2 }),
			]);
		});

		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'goodreads:book:12345',
			metadata: {
				openLibraryCandidates: [
					{ authorName: 'First Author', exact: true, title: 'Rapture', workKey: 'OL1W' },
					{ authorName: 'Second Author', exact: true, title: 'Rapture', workKey: 'OL2W' },
				],
			},
		});
		expect(result.resolverErrors?.some((error) => error.message.includes('ambiguous'))).toBe(true);
		expect(
			resolveGoodreadsBlockedOutcome({ classification: result, rawInput: input })
		).toBeUndefined();
	});

	it.each([
		'https://www.goodreads.com/book/show/999999901-a-field-guide-to-lichens-of-the-pacific-northwest',
		'https://www.goodreads.com/book/show/59552636',
		'https://www.goodreads.com/book/show/5470.1984',
	] as const)('returns a generic atom without candidates when no title work is found for %s', async (input) => {
		const calls: string[] = [];
		const result = await classify(input, async (url) => {
			calls.push(String(url));
			return response([]);
		});

		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: expect.stringContaining('goodreads:book:'),
		});
		expect(result.resolved?.atoms[0]?.metadata).not.toHaveProperty('openLibraryCandidates');
		if (input.endsWith('/59552636') || input.endsWith('5470.1984')) expect(calls).toHaveLength(1);
		else expect(calls).toHaveLength(2);
	});

	it('resolves a locale-prefixed URL through the same title path', async () => {
		const result = await classify(
			'https://www.goodreads.com/fr/book/show/59552636-living-untethered',
			async (url) =>
				new URL(String(url)).searchParams.has('q')
					? response([])
					: response([work('OL39510773W', 'Living Untethered')])
		);

		expect(result.resolved?.atoms[0]?.canonicalId).toBe('openlibrary:work:OL39510773W');
	});

	it('uses one deadline for the id and title lookups and degrades on title timeout', async () => {
		let titleSignal: AbortSignal | null | undefined;
		const result = await classify(
			'https://www.goodreads.com/book/show/59552636-living-untethered',
			async (url, init) => {
				if (new URL(String(url)).searchParams.has('q')) return response([]);
				titleSignal = init?.signal;
				return await new Promise<Response>((_resolve, reject) => {
					init?.signal?.addEventListener('abort', () => reject(init.signal?.reason), {
						once: true,
					});
				});
			},
			20
		);

		expect(titleSignal?.aborted).toBe(true);
		expect(result.resolved?.atoms[0]?.canonicalId).toBe('goodreads:book:59552636');
		expect(result.status).toBe('complete');
	});
});
