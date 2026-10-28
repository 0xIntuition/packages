import { beforeEach, describe, expect, it, spyOn } from 'bun:test';
import { projectIdentifierLadder, schemeOrderForIdentityCategory } from '@0xintuition/iid-ladder';
import {
	createClassificationEngine,
	createGoodreadsOpenGraphAdapter,
	createGoodreadsPlugin,
	createTypeProfilesPlugin,
} from '../src';
import { resetDomainHtmlHostCircuitBreakersForTests } from '../src/plugins/shared/domain-html/fetch';
import { resetOpenLibraryLookupCacheForTests } from '../src/plugins/shared/openlibrary-lookup';
import { resolvePublicTestHostname } from './helpers/public-dns';

const GOODREADS_BOOK_ID = '25744928';
const GOODREADS_URL = `https://www.goodreads.com/book/show/${GOODREADS_BOOK_ID}.Deep_Work`;
const CANONICAL_GOODREADS_URL = `https://www.goodreads.com/book/show/${GOODREADS_BOOK_ID}`;
const ISBN_10 = '1455586692';
const ISBN_13 = '9781455586691';
const WORK_OLID = 'OL17713267W';
const WORK_URL = `https://openlibrary.org/works/${WORK_OLID}`;

type LookupBehavior = 'failure' | 'hit' | 'miss' | 'timeout';
type PageIsbnSource = 'json-ld' | 'meta' | 'none';

function openLibraryResponse(behavior: LookupBehavior, signal: AbortSignal | null | undefined) {
	if (behavior === 'failure') {
		return new Response('', { status: 503 });
	}
	if (behavior === 'miss') {
		return Response.json({ docs: [], numFound: 0 });
	}
	if (behavior === 'timeout') {
		return new Promise<Response>((_resolve, reject) => {
			signal?.addEventListener('abort', () => reject(signal.reason), { once: true });
		});
	}

	return Response.json({
		docs: [
			{
				author_name: ['Cal Newport'],
				isbn: [ISBN_10, ISBN_13],
				key: `/works/${WORK_OLID}`,
				title: 'Deep Work',
			},
		],
		numFound: 1,
	});
}

function goodreadsHtml(source: PageIsbnSource, isbn = ISBN_13): string {
	const isbnMetadata =
		source === 'json-ld'
			? `<script type="application/ld+json">${JSON.stringify({
					'@context': 'https://schema.org',
					'@type': 'Book',
					isbn,
					name: 'Deep Work',
				})}</script>`
			: source === 'meta'
				? `<meta property="books:isbn" content="${isbn}">`
				: '';

	return `<html><head><meta property="og:title" content="Deep Work | Goodreads">${isbnMetadata}</head></html>`;
}

async function classifyFixture(input: {
	idBehavior: LookupBehavior;
	idDelayMs?: number;
	isbnBehavior?: LookupBehavior;
	pageHtml?: string;
	pageIsbn?: string;
	pageIsbnSource?: PageIsbnSource;
}) {
	let goodreadsHtmlFetchCount = 0;
	const lookupQueries: string[] = [];
	const fetch = async (url: string | URL | Request, init?: RequestInit) => {
		const parsed = new URL(String(url));
		if (parsed.hostname === 'www.goodreads.com') {
			goodreadsHtmlFetchCount += 1;
			return new Response(
				input.pageHtml ??
					goodreadsHtml(input.pageIsbnSource ?? 'json-ld', input.pageIsbn ?? ISBN_13),
				{ headers: { 'content-type': 'text/html' } }
			);
		}

		const query = parsed.searchParams.get('q');
		if (!query) {
			throw new Error(`Missing OpenLibrary query for ${parsed.href}`);
		}
		lookupQueries.push(query);
		const behavior = query.startsWith('id_goodreads:')
			? input.idBehavior
			: (input.isbnBehavior ?? 'hit');
		if (query.startsWith('id_goodreads:') && input.idDelayMs) {
			await new Promise((resolve) => setTimeout(resolve, input.idDelayMs));
		}
		return openLibraryResponse(behavior, init?.signal);
	};
	const openLibrary = { fetch, resolveHostname: resolvePublicTestHostname };
	const engine = createClassificationEngine({
		onClassifierError: () => undefined,
		plugins: [
			createTypeProfilesPlugin(),
			createGoodreadsPlugin({
				adapters: {
					openGraph: createGoodreadsOpenGraphAdapter(openLibrary),
				},
				openLibrary,
			}),
		],
		runtime: 'server',
	});
	const startedAt = performance.now();
	const classification = await engine.classify({
		classificationSessionId: `goodreads-isbn-bridge-${input.idBehavior}-${input.isbnBehavior ?? 'hit'}-${input.pageIsbnSource ?? 'json-ld'}`,
		input: GOODREADS_URL,
		mode: 'server-only',
	});

	return {
		classification,
		elapsedMs: performance.now() - startedAt,
		goodreadsHtmlFetchCount,
		lookupQueries,
	};
}

describe('ENG-15152 Goodreads page ISBN bridge', () => {
	beforeEach(() => {
		resetDomainHtmlHostCircuitBreakersForTests();
		resetOpenLibraryLookupCacheForTests();
	});

	it('bridges an id miss through the page JSON-LD ISBN-13 to the OpenLibrary work', async () => {
		const result = await classifyFixture({ idBehavior: 'miss', isbnBehavior: 'hit' });

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`, `isbn:${ISBN_13}`]);
		expect(result.goodreadsHtmlFetchCount).toBe(1);
		expect(result.classification.resolved?.atoms[0]).toMatchObject({
			canonicalId: `openlibrary:work:${WORK_OLID}`,
			hints: {
				identifiers: {
					goodreadsBookId: GOODREADS_BOOK_ID,
					isbn: ISBN_13,
					olid: WORK_OLID,
				},
				providerCanonicalIds: [`goodreads:book:${GOODREADS_BOOK_ID}`],
			},
			metadata: { provider: 'openlibrary', sourceUrl: WORK_URL },
			sameAs: [CANONICAL_GOODREADS_URL, WORK_URL],
		});
	});

	it('converts a page ISBN-10 to ISBN-13 before resolving the same work', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			isbnBehavior: 'hit',
			pageIsbn: ISBN_10,
		});

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`, `isbn:${ISBN_13}`]);
		expect(result.goodreadsHtmlFetchCount).toBe(1);
		expect(result.classification.resolved?.atoms[0]?.canonicalId).toBe(
			`openlibrary:work:${WORK_OLID}`
		);
	});

	it('keeps an id hit unchanged without issuing an ISBN lookup', async () => {
		const result = await classifyFixture({ idBehavior: 'hit' });

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`]);
		expect(result.goodreadsHtmlFetchCount).toBe(0);
		expect(result.classification.resolved?.atoms[0]?.canonicalId).toBe(
			`openlibrary:work:${WORK_OLID}`
		);
	});

	it('uses one page fetch and the provider handle when the page exposes no ISBN', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			pageIsbnSource: 'none',
		});

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`]);
		expect(result.goodreadsHtmlFetchCount).toBe(1);
		expect(result.classification.resolved?.atoms[0]).toMatchObject({
			canonicalId: `goodreads:book:${GOODREADS_BOOK_ID}`,
		});
	});

	it('retains a normalized ISBN hint and selects the ISBN ladder rung when both lookups miss', async () => {
		const result = await classifyFixture({ idBehavior: 'miss', isbnBehavior: 'miss' });
		const atom = result.classification.resolved?.atoms[0];
		if (!atom) {
			throw new Error('Expected a Goodreads provider-local atom');
		}

		expect(result.goodreadsHtmlFetchCount).toBe(1);
		expect(atom).toMatchObject({
			canonicalId: `goodreads:book:${GOODREADS_BOOK_ID}`,
			hints: { identifiers: { isbn: ISBN_13 } },
		});
		const identifiers = atom.hints?.identifiers as Record<string, unknown> | undefined;
		const isbnHint = identifiers?.isbn;
		expect(
			projectIdentifierLadder({
				providerCanonicalId: atom.canonicalId,
				strongIdentifiers: typeof isbnHint === 'string' ? { isbn: isbnHint } : undefined,
				strongIdentifierOrder: schemeOrderForIdentityCategory('book'),
			})
		).toMatchObject({ iid: `int:isbn:${ISBN_13}` });
	});

	it('records an ISBN timeout as non-terminal and keeps the provider-local handle', async () => {
		const originalTimer = globalThis.setTimeout;
		const timer = spyOn(globalThis, 'setTimeout').mockImplementation(((
			callback: () => void,
			ms: number
		) => originalTimer(callback, Math.min(ms, ms > 5000 ? 50 : 10))) as typeof setTimeout);
		const result = await classifyFixture({ idBehavior: 'miss', isbnBehavior: 'timeout' }).finally(
			() => timer.mockRestore()
		);

		expect(result.goodreadsHtmlFetchCount).toBe(1);
		expect(result.classification.status).toBe('complete');
		expect(result.classification.resolved?.atoms[0]?.canonicalId).toBe(
			`goodreads:book:${GOODREADS_BOOK_ID}`
		);
		expect(
			result.classification.resolverErrors?.some((error) => error.message.includes('timeout'))
		).toBe(true);
		expect(result.classification.resolved?.atoms[0]?.hints).toMatchObject({
			identifiers: { isbn: ISBN_13 },
		});
	});

	it('does not attempt the ISBN bridge after a hard Goodreads-id lookup failure', async () => {
		const result = await classifyFixture({ idBehavior: 'failure', isbnBehavior: 'hit' });

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`]);
		expect(result.goodreadsHtmlFetchCount).toBe(1);
		expect(result.classification.status).toBe('complete');
		expect(result.classification.resolved?.atoms[0]?.canonicalId).toBe(
			`goodreads:book:${GOODREADS_BOOK_ID}`
		);
	});

	it('accepts books:isbn metadata as the page ISBN source', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			isbnBehavior: 'hit',
			pageIsbnSource: 'meta',
		});

		expect(result.lookupQueries.at(-1)).toBe(`isbn:${ISBN_13}`);
		expect(result.goodreadsHtmlFetchCount).toBe(1);
		expect(result.classification.resolved?.atoms[0]?.canonicalId).toBe(
			`openlibrary:work:${WORK_OLID}`
		);
	});

	it('binds the requested Book when a recommended Book appears first in @graph', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			pageHtml: `<meta property="og:title" content="Deep Work | Goodreads"><script type="application/ld+json">${JSON.stringify(
				{
					'@context': 'https://schema.org',
					'@graph': [
						{
							'@type': 'Book',
							isbn: '9780140328721',
							name: 'Recommended Book',
						},
						{
							'@id': `${GOODREADS_URL}?from_search=true`,
							'@type': 'Book',
							isbn: ISBN_13,
							name: 'Deep Work',
						},
					],
				}
			)}</script>`,
		});

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`, `isbn:${ISBN_13}`]);
		expect(result.classification.resolved?.atoms[0]?.canonicalId).toBe(
			`openlibrary:work:${WORK_OLID}`
		);
	});

	it('uses books:isbn to disambiguate multiple ISBNs on the bound Book', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			pageHtml: `<meta property="books:isbn" content="${ISBN_13}"><script type="application/ld+json">${JSON.stringify(
				{
					'@context': 'https://schema.org',
					'@id': GOODREADS_URL,
					'@type': 'Book',
					isbn: ['9780140328721', ISBN_13],
					name: 'Deep Work',
				}
			)}</script>`,
		});

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`, `isbn:${ISBN_13}`]);
	});

	it('fails closed when unbound JSON-LD and books:isbn evidence disagree', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			pageHtml: `<meta property="og:title" content="Deep Work | Goodreads"><meta property="books:isbn" content="${ISBN_13}"><script type="application/ld+json">${JSON.stringify(
				{
					'@context': 'https://schema.org',
					'@type': 'Book',
					isbn: '9780140328721',
					name: 'Unbound Book',
				}
			)}</script>`,
		});
		const atom = result.classification.resolved?.atoms[0];

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`]);
		expect(atom?.canonicalId).toBe(`goodreads:book:${GOODREADS_BOOK_ID}`);
		expect(atom?.hints?.identifiers).not.toHaveProperty('isbn');
		expect(
			result.classification.resolverErrors?.some((error) =>
				error.message.includes('goodreads_page_isbn_ambiguous')
			)
		).toBe(true);
	});

	it('bridges one unbound Book carrying one normalized ISBN', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			pageHtml: `<script type="application/ld+json">${JSON.stringify({
				wrapper: {
					'@type': 'Book',
					isbn: ISBN_10,
					name: 'Deep Work',
				},
			})}</script>`,
		});

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`, `isbn:${ISBN_13}`]);
		expect(result.classification.resolved?.atoms[0]?.canonicalId).toBe(
			`openlibrary:work:${WORK_OLID}`
		);
	});

	it('fails closed when two unbound Books carry different ISBNs', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			pageHtml: `<meta property="og:title" content="Deep Work | Goodreads"><script type="application/ld+json">${JSON.stringify(
				[
					{ '@type': 'Book', isbn: ISBN_13, name: 'Deep Work' },
					{ '@type': 'Book', isbn: '9780140328721', name: 'Recommended Book' },
				]
			)}</script>`,
		});
		const atom = result.classification.resolved?.atoms[0];

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`]);
		expect(atom?.canonicalId).toBe(`goodreads:book:${GOODREADS_BOOK_ID}`);
		expect(atom?.hints?.identifiers).not.toHaveProperty('isbn');
		expect(
			result.classification.resolverErrors?.some((error) =>
				error.message.includes('goodreads_page_isbn_ambiguous')
			)
		).toBe(true);
	});

	it('fails closed when a Book claims the requested url but its @id names another Goodreads book (ADV-R2 F1)', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			pageHtml: `<meta property="og:title" content="Deep Work | Goodreads"><script type="application/ld+json">${JSON.stringify(
				{
					'@id': 'https://www.goodreads.com/book/show/99999999.Recommended',
					'@type': 'Book',
					isbn: '9780140328721',
					name: 'Recommended Book',
					url: GOODREADS_URL,
				}
			)}</script>`,
		});
		const atom = result.classification.resolved?.atoms[0];

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`]);
		expect(atom?.canonicalId).toBe(`goodreads:book:${GOODREADS_BOOK_ID}`);
		expect(atom?.hints?.identifiers).not.toHaveProperty('isbn');
		expect(
			result.classification.resolverErrors?.some((error) =>
				error.message.includes('goodreads_page_isbn_ambiguous')
			)
		).toBe(true);
	});

	it('fails closed when the only ISBN-bearing Book names a different Goodreads id sharing the requested prefix (ADV-R2 F2)', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			pageHtml: `<meta property="og:title" content="Deep Work | Goodreads"><script type="application/ld+json">${JSON.stringify(
				{
					'@id': `https://www.goodreads.com/book/show/${GOODREADS_BOOK_ID}1.Other`,
					'@type': 'Book',
					isbn: '9780140328721',
					name: 'Other Book',
				}
			)}</script>`,
		});
		const atom = result.classification.resolved?.atoms[0];

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`]);
		expect(atom?.canonicalId).toBe(`goodreads:book:${GOODREADS_BOOK_ID}`);
		expect(atom?.hints?.identifiers).not.toHaveProperty('isbn');
		expect(
			result.classification.resolverErrors?.some((error) =>
				error.message.includes('goodreads_page_isbn_ambiguous')
			)
		).toBe(true);
	});

	it.each([
		'//attacker.example/book/show/25744928',
		'/book/show/25744928@evil',
		'book/show/25744928',
	])('fails closed when the only ISBN-bearing Book carries an opaque identity %s (ADV-R3 F1)', async (id) => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			pageHtml: `<meta property="og:title" content="Deep Work | Goodreads"><script type="application/ld+json">${JSON.stringify(
				{ '@id': id, '@type': 'Book', isbn: ISBN_13, name: 'Deep Work' }
			)}</script>`,
		});
		const atom = result.classification.resolved?.atoms[0];

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`]);
		expect(atom?.canonicalId).toBe(`goodreads:book:${GOODREADS_BOOK_ID}`);
		expect(atom?.hints?.identifiers).not.toHaveProperty('isbn');
		expect(
			result.classification.resolverErrors?.some((error) =>
				error.message.includes('goodreads_page_isbn_ambiguous')
			)
		).toBe(true);
	});

	it.each([
		['whitespace @id', { '@id': '  ' }],
		['numeric url', { url: 42 }],
		['empty-string-array url', { url: [''] }],
	] as const)('treats a present-but-malformed identity (%s) as opaque, never anonymous (ADV-R4 F1)', async (_label, identity) => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			pageHtml: `<meta property="og:title" content="Deep Work | Goodreads"><script type="application/ld+json">${JSON.stringify(
				{ ...identity, '@type': 'Book', isbn: ISBN_13, name: 'Deep Work' }
			)}</script>`,
		});
		const atom = result.classification.resolved?.atoms[0];

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`]);
		expect(atom?.canonicalId).toBe(`goodreads:book:${GOODREADS_BOOK_ID}`);
		expect(atom?.hints?.identifiers).not.toHaveProperty('isbn');
		expect(
			result.classification.resolverErrors?.some((error) =>
				error.message.includes('goodreads_page_isbn_ambiguous')
			)
		).toBe(true);
	});

	it('does not let an ISBN-less related Book block the anonymous ISBN fallback (ADV-R4 F2)', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			pageHtml: `<script type="application/ld+json">${JSON.stringify([
				{
					'@type': 'Book',
					name: 'Other Book',
					url: 'https://www.goodreads.com/book/show/99999999.Other',
				},
				{ '@type': 'Book', isbn: ISBN_13, name: 'Deep Work' },
			])}</script>`,
		});

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`, `isbn:${ISBN_13}`]);
		expect(result.classification.resolved?.atoms[0]?.canonicalId).toBe(
			`openlibrary:work:${WORK_OLID}`
		);
	});

	it('does not let an ISBN-less opaque-identity Book block the books:isbn fallback (ADV-R4 F2)', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			pageHtml: `<meta property="books:isbn" content="${ISBN_13}"><script type="application/ld+json">${JSON.stringify(
				{ '@id': '//attacker.example/book/show/25744928', '@type': 'Book', name: 'Deep Work' }
			)}</script>`,
		});

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`, `isbn:${ISBN_13}`]);
		expect(result.classification.resolved?.atoms[0]?.canonicalId).toBe(
			`openlibrary:work:${WORK_OLID}`
		);
	});

	it('resolves from the clean bound Book and ignores a separate related Book naming another Goodreads book (ADV-R3 F2)', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			pageHtml: `<script type="application/ld+json">${JSON.stringify({
				'@id': GOODREADS_URL,
				'@type': 'Book',
				isbn: ISBN_13,
				name: 'Deep Work',
				workExample: {
					'@type': 'Book',
					isbn: '9780140328721',
					name: 'Readers Also Enjoyed',
					url: 'https://www.goodreads.com/book/show/99999999.Other',
				},
			})}</script>`,
		});

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`, `isbn:${ISBN_13}`]);
		expect(result.classification.resolved?.atoms[0]?.canonicalId).toBe(
			`openlibrary:work:${WORK_OLID}`
		);
	});

	it('binds a Book through a site-relative @id and ignores a recommended Book with no Goodreads identity', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			pageHtml: `<script type="application/ld+json">${JSON.stringify({
				'@graph': [
					{ '@type': 'Book', isbn: '9780140328721', name: 'Recommended Book' },
					{
						'@id': `/book/show/${GOODREADS_BOOK_ID}.Deep_Work`,
						'@type': 'Book',
						isbn: ISBN_13,
						name: 'Deep Work',
					},
				],
			})}</script>`,
		});

		expect(result.lookupQueries).toEqual([`id_goodreads:${GOODREADS_BOOK_ID}`, `isbn:${ISBN_13}`]);
		expect(result.classification.resolved?.atoms[0]?.canonicalId).toBe(
			`openlibrary:work:${WORK_OLID}`
		);
	});

	it('keeps the ISBN rung when JSON-LD supplies the title and og:title is absent', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			isbnBehavior: 'miss',
			pageHtml: `<script type="application/ld+json">${JSON.stringify({
				'@id': GOODREADS_URL,
				'@type': 'Book',
				isbn: ISBN_13,
				name: 'Deep Work',
			})}</script>`,
		});
		const atom = result.classification.resolved?.atoms[0];
		const identifiers = atom?.hints?.identifiers as Record<string, unknown> | undefined;
		const isbnHint = identifiers?.isbn;

		expect(atom).toMatchObject({
			canonicalId: `goodreads:book:${GOODREADS_BOOK_ID}`,
			hints: { identifiers: { isbn: ISBN_13 } },
			title: 'Deep Work',
		});
		expect(
			projectIdentifierLadder({
				providerCanonicalId: atom?.canonicalId,
				strongIdentifiers: typeof isbnHint === 'string' ? { isbn: isbnHint } : undefined,
				strongIdentifierOrder: schemeOrderForIdentityCategory('book'),
			}).iid
		).toBe(`int:isbn:${ISBN_13}`);
	});

	it('keeps a typed OL failure when og:title is absent', async () => {
		const result = await classifyFixture({
			idBehavior: 'miss',
			isbnBehavior: 'failure',
			pageHtml: `<title>Deep Work | Goodreads</title><script type="application/ld+json">${JSON.stringify(
				{
					'@id': GOODREADS_URL,
					'@type': 'Book',
					isbn: ISBN_13,
				}
			)}</script>`,
		});

		expect(result.classification.resolved?.atoms[0]).toMatchObject({
			canonicalId: `goodreads:book:${GOODREADS_BOOK_ID}`,
			title: 'Deep Work',
		});
		expect(
			result.classification.resolverErrors?.some(
				(error) => error.message.includes('opengraph:http_error') && error.message.includes('503')
			)
		).toBe(true);
	});

	it('emits the same OpenLibrary atom for a Goodreads-id hit and an ISBN bridge hit', async () => {
		const idHit = await classifyFixture({ idBehavior: 'hit' });
		const bridgeHit = await classifyFixture({ idBehavior: 'miss', isbnBehavior: 'hit' });
		const normalizeTimestamp = (
			atom: NonNullable<typeof idHit.classification.resolved>['atoms'][number]
		) => ({
			...atom,
			metadata: { ...atom.metadata, fetchedAt: '<timestamp>' },
		});
		const idAtom = idHit.classification.resolved?.atoms[0];
		const bridgeAtom = bridgeHit.classification.resolved?.atoms[0];
		if (!(idAtom && bridgeAtom)) {
			throw new Error('Expected both Goodreads fixtures to resolve an atom');
		}

		expect(normalizeTimestamp(bridgeAtom)).toEqual(normalizeTimestamp(idAtom));
	});
});
