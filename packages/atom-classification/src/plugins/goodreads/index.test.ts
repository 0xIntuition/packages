import { beforeEach, describe, expect, it } from 'bun:test';
import { resolvePublicTestHostname } from '../../../__tests__/helpers/public-dns';
import {
	createClientEngine,
	createDefaultUrlPlugin,
	createServerEngine,
	createSpotifyPlugin,
} from '../../index';
import { resetDomainHtmlHostCircuitBreakersForTests } from '../shared/domain-html/fetch';
import { resetOpenLibraryLookupCacheForTests } from '../shared/openlibrary-lookup';
import { createTypeProfilesPlugin } from '../type-profiles';
import { createGoodreadsPlugin, resolveGoodreadsBlockedOutcome } from '.';

const GOODREADS_URL = 'https://www.goodreads.com/book/show/4671.The_Great_Gatsby';

describe('goodreads plugin', () => {
	beforeEach(() => {
		resetDomainHtmlHostCircuitBreakersForTests();
		resetOpenLibraryLookupCacheForTests();
	});

	for (const { input, expectedTitle } of [
		{
			input: 'https://www.goodreads.com/book/show/52036.Siddhartha',
			expectedTitle: 'Siddhartha',
		},
		{
			input: 'https://www.goodreads.com/book/show/2767052-the-hunger-games',
			expectedTitle: 'The Hunger Games',
		},
		{
			input: 'https://www.goodreads.com/en/book/show/186074.The_Name_of_the_Wind',
			expectedTitle: 'The Name of the Wind',
		},
		{
			input: 'https://www.goodreads.com/book/show/52036',
			expectedTitle: 'Goodreads Book 52036',
		},
		{
			input: 'https://www.goodreads.com/book/show/52036.The%20Glass%20Castle',
			expectedTitle: 'The Glass Castle',
		},
		{
			input: 'https://www.goodreads.com/book/show/52036.The_Handmaid%27s_Tale',
			expectedTitle: "The Handmaid's Tale",
		},
		{
			input: 'https://www.goodreads.com/book/show/52036.War_%26_Peace',
			expectedTitle: 'War & Peace',
		},
		{
			input: `https://www.goodreads.com/book/show/52036.${encodeURIComponent('café 東京')}`,
			expectedTitle: 'Café 東京',
		},
	] as const) {
		it(`derives the generic title for ${input}`, async () => {
			const engine = createClientEngine({
				onClassifierError: () => undefined,
				plugins: [createTypeProfilesPlugin(), createGoodreadsPlugin()],
			});

			const result = await engine.classify({
				input,
				mode: 'client-only',
				classificationSessionId: `goodreads-slug-${expectedTitle}`,
			});

			expect(result.resolved?.atoms[0]).toMatchObject({
				title: expectedTitle,
				data: { name: expectedTitle },
			});
		});
	}

	for (const input of [
		'https://www.goodreads.com/book/show/52036.12345',
		`https://www.goodreads.com/book/show/52036.${'a'.repeat(201)}`,
		'https://www.goodreads.com/book/show/52036.%E0%A4%A',
		'https://www.goodreads.com/book/show/52036.%3Cscript%3Ealert(1)%3C%2Fscript%3E',
		'https://www.goodreads.com/book/show/52036.bad%00title',
		'https://www.goodreads.com/book/show/52036.abc%E2%80%AEtxt',
		...[
			'\u061C',
			'\u200E',
			'\u200F',
			'\u202A',
			'\u202B',
			'\u202C',
			'\u202D',
			'\u202E',
			'\u2066',
			'\u2067',
			'\u2068',
			'\u2069',
			'\uFEFF',
		].map(
			(character) =>
				`https://www.goodreads.com/book/show/52036.safe${encodeURIComponent(character)}txt`
		),
	]) {
		it(`ignores an unusable Goodreads slug for ${input}`, async () => {
			const engine = createClientEngine({
				onClassifierError: () => undefined,
				plugins: [createTypeProfilesPlugin(), createGoodreadsPlugin()],
			});

			const result = await engine.classify({
				input,
				mode: 'client-only',
				classificationSessionId: `goodreads-unusable-slug-${input.length}`,
			});

			expect(result.resolved?.atoms[0]).toMatchObject({
				title: 'Goodreads Book 52036',
				data: { name: 'Goodreads Book 52036' },
			});
		});
	}

	for (const { codePointCount, slug, expectedTitle } of [
		{ codePointCount: 200, slug: 'a'.repeat(200), expectedTitle: `A${'a'.repeat(199)}` },
		{ codePointCount: 201, slug: 'a'.repeat(201), expectedTitle: 'Goodreads Book 52036' },
		{ codePointCount: 200, slug: '🚀'.repeat(200), expectedTitle: '🚀'.repeat(200) },
		{ codePointCount: 201, slug: '🚀'.repeat(201), expectedTitle: 'Goodreads Book 52036' },
	] as const) {
		it(`pins the Goodreads slug boundary at ${codePointCount} Unicode code points for ${slug.codePointAt(0)?.toString(16)}`, async () => {
			const engine = createClientEngine({
				onClassifierError: () => undefined,
				plugins: [createTypeProfilesPlugin(), createGoodreadsPlugin()],
			});

			const result = await engine.classify({
				input: `https://www.goodreads.com/book/show/52036.${encodeURIComponent(slug)}`,
				mode: 'client-only',
				classificationSessionId: `goodreads-code-point-boundary-${codePointCount}-${slug.length}`,
			});

			expect(result.resolved?.atoms[0]).toMatchObject({
				title: expectedTitle,
				data: { name: expectedTitle },
			});
		});
	}

	it('keeps canonical identity locale- and slug-free', async () => {
		const engine = createClientEngine({
			onClassifierError: () => undefined,
			plugins: [createTypeProfilesPlugin(), createGoodreadsPlugin()],
		});

		const result = await engine.classify({
			input: 'https://www.goodreads.com/en/book/show/52036.Siddhartha',
			mode: 'client-only',
			classificationSessionId: 'goodreads-slug-identity',
		});

		expect(result.classification).toMatchObject({
			domain: 'goodreads',
			subtype: 'book',
			confidence: 0.99,
			meta: {
				bookId: '52036',
				canonicalUrl: 'https://www.goodreads.com/book/show/52036',
				slugTitle: 'Siddhartha',
			},
		});
		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'goodreads:book:52036',
			sameAs: ['https://www.goodreads.com/book/show/52036'],
		});
	});

	it('strictly classifies Goodreads book URLs as Book', async () => {
		const engine = createClientEngine({
			onClassifierError: () => undefined,
			plugins: [createTypeProfilesPlugin(), createGoodreadsPlugin()],
		});

		const result = await engine.classify({
			input: GOODREADS_URL,
			mode: 'client-only',
			classificationSessionId: 'goodreads-book',
		});

		expect(result.resolved?.resolverId).toBe('goodreads-resolver');
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'Book',
			canonicalId: 'goodreads:book:4671',
			metadata: { pluginId: 'goodreads' },
		});
	});

	it.each([
		'https://m.goodreads.com/book/show/59552636-living-untethered',
		'https://www.goodreads.com/book/show/59552636-living-untethered/reviews',
		'https://www.goodreads.com/book/show/59552636-living-untethered/reviews/',
	] as const)('classifies supported Goodreads book URL shape %s', async (input) => {
		const engine = createClientEngine({
			onClassifierError: () => undefined,
			plugins: [createTypeProfilesPlugin(), createGoodreadsPlugin()],
		});

		const result = await engine.classify({
			input,
			mode: 'client-only',
			classificationSessionId: `goodreads-url-shape-${input}`,
		});

		expect(result.classification).toMatchObject({
			domain: 'goodreads',
			meta: {
				bookId: '59552636',
				canonicalUrl: 'https://www.goodreads.com/book/show/59552636',
				slugTitle: 'Living Untethered',
			},
		});
		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'goodreads:book:59552636',
			sameAs: ['https://www.goodreads.com/book/show/59552636'],
		});
	});

	for (const { input, localeFreeInput, bookId } of [
		{
			input: 'https://www.goodreads.com/en/book/show/4671',
			localeFreeInput: 'https://www.goodreads.com/book/show/4671',
			bookId: '4671',
		},
		{
			input: 'https://www.goodreads.com/es/book/show/19288043-gone-girl',
			localeFreeInput: 'https://www.goodreads.com/book/show/19288043-gone-girl',
			bookId: '19288043',
		},
		{
			input: 'https://www.goodreads.com/fr/book/show/17586508-paris-letters',
			localeFreeInput: 'https://www.goodreads.com/book/show/17586508-paris-letters',
			bookId: '17586508',
		},
		{
			input: 'https://www.goodreads.com/xx/book/show/4671',
			localeFreeInput: 'https://www.goodreads.com/book/show/4671',
			bookId: '4671',
		},
		{
			input: 'https://www.goodreads.com/de/book/show/4671.The_Great_Gatsby',
			localeFreeInput: 'https://www.goodreads.com/book/show/4671.The_Great_Gatsby',
			bookId: '4671',
		},
	]) {
		it(`classifies Goodreads two-letter locale namespace ${input} with locale-free canonical identity`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: [
					createTypeProfilesPlugin(),
					createGoodreadsPlugin({
						useDefaultOpenGraphAdapter: false,
						useDefaultOpenLibraryAdapter: false,
					}),
					createDefaultUrlPlugin({
						fetch: async () => ({ ok: false, status: 404, text: async () => '' }),
					}),
				],
			});

			const result = await engine.classify({
				input,
				mode: 'progressive',
				classificationSessionId: `goodreads-locale-book-${input}`,
			});
			const localeFreeResult = await engine.classify({
				input: localeFreeInput,
				mode: 'progressive',
				classificationSessionId: `goodreads-locale-free-book-${bookId}`,
			});

			expect(result.classification).toMatchObject({
				domain: 'goodreads',
				subtype: 'book',
				confidence: 0.99,
				meta: {
					bookId,
					canonicalUrl: `https://www.goodreads.com/book/show/${bookId}`,
				},
			});
			expect(result.resolved?.resolverId).toBe('goodreads-resolver');
			const atom = result.resolved?.atoms[0];
			const localeFreeAtom = localeFreeResult.resolved?.atoms[0];
			expect(atom).toMatchObject({
				schemaType: 'Book',
				canonicalId: `goodreads:book:${bookId}`,
				sameAs: [`https://www.goodreads.com/book/show/${bookId}`],
			});
			expect(result.classification?.meta.canonicalUrl).toBe(
				localeFreeResult.classification?.meta.canonicalUrl
			);
			expect(atom?.canonicalId).toBe(localeFreeAtom?.canonicalId);
			expect(atom?.sameAs).toEqual(localeFreeAtom?.sameAs);
		});
	}

	it('does not install the Goodreads OpenGraph adapter when the deprecated switch is true', async () => {
		const requestedUrls: string[] = [];
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: [
				createTypeProfilesPlugin(),
				createGoodreadsPlugin({
					openLibrary: {
						fetch: async (url) => {
							requestedUrls.push(String(url));
							throw new Error('No fetch should run when the OL adapter is disabled');
						},
					},
					useDefaultOpenGraphAdapter: true,
					useDefaultOpenLibraryAdapter: false,
				}),
			],
		});

		const result = await engine.classify({
			input: GOODREADS_URL,
			mode: 'server-only',
			classificationSessionId: 'goodreads-book-og',
		});

		expect(requestedUrls).toEqual([]);
		expect(result.resolved?.atoms[0]).toMatchObject({
			schemaType: 'Book',
			title: 'The Great Gatsby',
			canonicalId: 'goodreads:book:4671',
		});
	});

	it('uses only Open Library for default Goodreads resolution', async () => {
		const requestedUrls: string[] = [];
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: [
				createTypeProfilesPlugin(),
				createGoodreadsPlugin({
					openLibrary: {
						fetch: async (url) => {
							requestedUrls.push(String(url));
							return Response.json({ docs: [], numFound: 0 });
						},
						resolveHostname: resolvePublicTestHostname,
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://www.goodreads.com/en/book/show/52036.Siddhartha',
			mode: 'server-only',
			classificationSessionId: 'goodreads-url-only',
		});

		expect(requestedUrls).toHaveLength(2);
		expect(requestedUrls.every((url) => new URL(url).hostname === 'openlibrary.org')).toBe(true);
		expect(result.resolved?.atoms[0]).toMatchObject({
			title: 'Siddhartha',
			canonicalId: 'goodreads:book:52036',
			source: 'platform-v0:generic',
		});
		expect(result.resolverErrors ?? []).toEqual([]);
	});

	it('never maps an Open Library failure to the retired Goodreads blocked outcome', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: [
				createTypeProfilesPlugin(),
				createGoodreadsPlugin({
					openLibrary: {
						fetch: async () => new Response('', { status: 403 }),
						resolveHostname: resolvePublicTestHostname,
					},
				}),
			],
		});
		const rawInput = 'https://www.goodreads.com/book/show/52036.Siddhartha';
		const result = await engine.classify({
			input: rawInput,
			mode: 'server-only',
			classificationSessionId: 'goodreads-plain-http-403',
		});

		expect(result.resolverErrors?.[0]?.message).toContain('domain-api:http_error: HTTP 403');
		expect(resolveGoodreadsBlockedOutcome({ classification: result, rawInput })).toBeUndefined();
	});

	it('never requests Goodreads pages across repeated default-plugin resolutions', async () => {
		const requestedHosts: string[] = [];
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: [
				createTypeProfilesPlugin(),
				createGoodreadsPlugin({
					openLibrary: {
						cache: false,
						fetch: async (url) => {
							requestedHosts.push(new URL(String(url)).hostname);
							return Response.json({ docs: [], numFound: 0 });
						},
						resolveHostname: resolvePublicTestHostname,
					},
				}),
			],
		});

		for (const bookId of ['1', '2', '3']) {
			await engine.classify({
				input: `https://www.goodreads.com/book/show/${bookId}.Blocked`,
				mode: 'server-only',
				classificationSessionId: `goodreads-breaker-trip-${bookId}`,
			});
		}
		expect(requestedHosts.length).toBeGreaterThan(0);
		expect(new Set(requestedHosts)).toEqual(new Set(['openlibrary.org']));
	});

	for (const platform of ['goodreads', 'spotify'] as const) {
		for (const diagnosticLength of [511, 512, 513] as const) {
			it(`bounds a ${diagnosticLength}-character ${platform} adapter diagnostic without losing the generic fallback`, async () => {
				const stagePrefix = 'opengraph:adapter_error: ';
				const adapterMessage = 'x'.repeat(diagnosticLength - stagePrefix.length);
				const plugin =
					platform === 'goodreads'
						? createGoodreadsPlugin({
								useDefaultOpenLibraryAdapter: false,
								adapters: {
									openGraph: () => {
										throw new Error(adapterMessage);
									},
								},
							})
						: createSpotifyPlugin({
								adapters: {
									openGraph: () => {
										throw new Error(adapterMessage);
									},
								},
							});
				const engine = createServerEngine({
					onClassifierError: () => undefined,
					plugins: [createTypeProfilesPlugin(), plugin],
				});
				const result = await engine.classify({
					input:
						platform === 'goodreads'
							? 'https://www.goodreads.com/book/show/52036.Siddhartha'
							: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
					mode: 'server-only',
					classificationSessionId: `${platform}-bounded-error-${diagnosticLength}`,
				});

				expect(result.status).toBe('complete');
				expect(result.resolved?.atoms[0]?.source).toBe('platform-v0:generic');
				expect(result.resolverErrors).toHaveLength(1);
				const message = result.resolverErrors?.[0]?.message;
				expect(message?.length).toBe(Math.min(diagnosticLength, 512));
				if (diagnosticLength <= 512) {
					expect(message).toBe(`${stagePrefix}${adapterMessage}`);
				} else {
					expect(message?.endsWith('…')).toBe(true);
				}
			});
		}
	}

	it('keeps a clamped resolver diagnostic well-formed at a surrogate boundary', async () => {
		const adapterMessage = `${'x'.repeat(500)}😀${'y'.repeat(20)}`;
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: [
				createTypeProfilesPlugin(),
				createGoodreadsPlugin({
					useDefaultOpenLibraryAdapter: false,
					adapters: {
						openGraph: () => {
							throw new Error(adapterMessage);
						},
					},
				}),
			],
		});

		const result = await engine.classify({
			input: 'https://www.goodreads.com/book/show/52036.Siddhartha',
			mode: 'server-only',
			classificationSessionId: 'goodreads-surrogate-safe-error-boundary',
		});
		const message = result.resolverErrors?.[0]?.message;
		if (!message) {
			throw new Error('Expected a bounded resolver diagnostic');
		}

		expect((message as string & { isWellFormed(): boolean }).isWellFormed()).toBe(true);
		expect(message.length).toBeLessThanOrEqual(512);
	});

	for (const { adapterMessage, label } of [
		{
			adapterMessage: `\uDC00${'x'.repeat(600)}`,
			label: 'leading lone low surrogate',
		},
		{
			adapterMessage: `${'x'.repeat(501)}\uD83D`,
			label: 'exact-limit dangling high surrogate',
		},
	] as const) {
		it(`normalizes a ${label} in the final resolver diagnostic`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: [
					createTypeProfilesPlugin(),
					createGoodreadsPlugin({
						useDefaultOpenLibraryAdapter: false,
						adapters: {
							openGraph: () => {
								throw new Error(adapterMessage);
							},
						},
					}),
				],
			});

			const result = await engine.classify({
				input: 'https://www.goodreads.com/book/show/52036.Siddhartha',
				mode: 'server-only',
				classificationSessionId: `goodreads-${label.replaceAll(' ', '-')}`,
			});
			const message = result.resolverErrors?.[0]?.message;
			if (!message) {
				throw new Error('Expected a bounded resolver diagnostic');
			}

			expect((message as string & { isWellFormed(): boolean }).isWellFormed()).toBe(true);
			expect(message.length).toBeLessThanOrEqual(512);
		});
	}

	for (const input of [
		'https://www.goodreads.com/author/show/3190.F_Scott_Fitzgerald',
		'https://www.goodreads.com/xx/author/show/3190.F_Scott_Fitzgerald',
		'https://www.goodreads.com/list/show/6.Best_Books_of_the_20th_Century',
		'https://www.goodreads.com/en/list/show/6.Best_Books_of_the_20th_Century',
		'https://www.goodreads.com/series/45175-harry-potter',
		'https://www.goodreads.com/search?q=the+great+gatsby',
		'https://www.goodreads.com/work/editions/79345642-living-untethered',
		'https://example.com/book/show/4671.The_Great_Gatsby',
	]) {
		it(`declines unsupported Goodreads URL ${input}`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: [
					createTypeProfilesPlugin(),
					createGoodreadsPlugin({
						useDefaultOpenGraphAdapter: false,
						useDefaultOpenLibraryAdapter: false,
					}),
					createDefaultUrlPlugin({
						fetch: async () => ({ ok: false, status: 404, text: async () => '' }),
					}),
				],
			});

			const result = await engine.classify({
				input,
				mode: 'progressive',
				classificationSessionId: `goodreads-decline-${input}`,
			});

			expect(result.classification?.domain).toBe('web');
			expect(result.resolved?.resolverId).toBe('default-url-resolver');
			expect(result.resolved?.atoms[0]).toMatchObject({
				schemaType: 'WebSite',
				category: 'thing',
			});
			expect(
				result.resolved?.atoms.some((atom) => atom.canonicalId?.startsWith('goodreads:book:'))
			).toBe(false);
		});
	}
});
