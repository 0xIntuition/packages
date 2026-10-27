import { beforeEach, describe, expect, it } from 'bun:test';
import { projectIdentifierLadder } from '@0xintuition/iid-ladder';

import type { AtomClassificationPlugin, ResolverAtom } from '../src';
import {
	createClassificationEngine,
	createDefaultUrlPlugin,
	createGoodreadsOpenGraphAdapter,
	createGoodreadsPlugin,
	createOpenGraphPlatformAdapter,
	createSpotifyPlugin,
	createTmdbPlugin,
	createTypeProfilesPlugin,
} from '../src';
import { resetDomainHtmlHostCircuitBreakersForTests } from '../src/plugins/shared/domain-html/fetch';
import { resolvePublicTestHostname } from './helpers/public-dns';

type StubFetch = NonNullable<
	NonNullable<Parameters<typeof createOpenGraphPlatformAdapter>[0]>['fetch']
>;
type TransportBehavior =
	| 'success'
	| 'http_error_403'
	| 'http_error_500'
	| 'waf_challenge'
	| 'timeout'
	| 'empty_og';

const transportBehaviors: readonly TransportBehavior[] = [
	'success',
	'http_error_403',
	'http_error_500',
	'waf_challenge',
	'timeout',
	'empty_og',
];

function createStubTransport(
	behavior: TransportBehavior,
	title: string,
	onTimeoutAbort: () => void
): StubFetch {
	return async (_url, init) => {
		if (behavior === 'timeout') {
			return await new Promise((_resolve, reject) => {
				init?.signal?.addEventListener(
					'abort',
					() => {
						onTimeoutAbort();
						reject(
							init.signal?.reason instanceof Error
								? init.signal.reason
								: new Error('bounded transport abort')
						);
					},
					{ once: true }
				);
			});
		}
		if (behavior === 'http_error_403' || behavior === 'http_error_500') {
			return new Response('', { status: behavior === 'http_error_403' ? 403 : 500 });
		}
		if (behavior === 'waf_challenge') {
			return new Response('', {
				headers: { 'x-amzn-waf-action': 'challenge' },
				status: 202,
			});
		}
		if (behavior === 'empty_og') {
			return new Response('<html><head></head><body></body></html>', { status: 200 });
		}

		return new Response(
			`<html><head>
				<meta property="og:title" content="${title}" />
				<meta property="og:description" content="Provider parity fixture" />
				<meta property="og:image" content="https://cdn.parity.example/cover.jpg" />
			</head><body></body></html>`,
			{ headers: { 'content-type': 'text/html' }, status: 200 }
		);
	};
}

function matrixOpenGraphAdapter(input: {
	canonicalId: string;
	category: ResolverAtom['category'];
	domain: 'spotify';
	fetch: StubFetch;
	schemaType: string;
}) {
	return createOpenGraphPlatformAdapter({
		domains: [input.domain],
		fetch: input.fetch,
		resolveHostname: resolvePublicTestHostname,
		map: ({ canonicalUrl, metadata }) => {
			if (!metadata.title) {
				return null;
			}
			return {
				canonicalId: input.canonicalId,
				category: input.category,
				data: {
					'@context': 'https://schema.org/',
					'@type': input.schemaType,
					name: metadata.title,
					url: canonicalUrl,
				},
				sameAs: [canonicalUrl],
				schemaType: input.schemaType,
				title: metadata.title,
			};
		},
	});
}

type FamilyFixture = {
	canonicalId: string;
	canonicalUrl: string;
	createPlugin: (fetch: StubFetch) => AtomClassificationPlugin;
	degradedTitle: string;
	diagnostics: boolean;
	family: string;
	input: string;
	successDisplayTitle?: string;
	successTitle: string;
	urlCarriesTitle?: boolean;
};

const families: readonly FamilyFixture[] = [
	{
		canonicalId: 'goodreads:book:4671',
		canonicalUrl: 'https://www.goodreads.com/book/show/4671',
		createPlugin: (fetch) =>
			createGoodreadsPlugin({
				useDefaultOpenLibraryAdapter: false,
				adapters: {
					openGraph: createGoodreadsOpenGraphAdapter({
						fetch,
						resolveHostname: resolvePublicTestHostname,
					}),
				},
			}),
		degradedTitle: 'The Great Gatsby',
		diagnostics: true,
		family: 'book',
		input: 'https://www.goodreads.com/book/show/4671.The_Great_Gatsby',
		successTitle: 'The Great Gatsby: A Novel',
		urlCarriesTitle: true,
	},
	{
		canonicalId: 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp',
		canonicalUrl: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
		createPlugin: (fetch) =>
			createSpotifyPlugin({
				adapters: {
					openGraph: matrixOpenGraphAdapter({
						canonicalId: 'spotify:track:3n3Ppam7vgaVa1iaRUc9Lp',
						category: 'song',
						domain: 'spotify',
						fetch,
						schemaType: 'MusicRecording',
					}),
				},
			}),
		degradedTitle: 'Spotify Track 3n3Ppam7vgaVa1iaRUc9Lp',
		diagnostics: true,
		family: 'song',
		input: 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp',
		successTitle: 'Smells Like Teen Spirit',
	},
	{
		canonicalId: 'spotify:show:38bS44xjbVVZ3No3ByF1dJ',
		canonicalUrl: 'https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ',
		createPlugin: (fetch) =>
			createSpotifyPlugin({
				adapters: {
					openGraph: matrixOpenGraphAdapter({
						canonicalId: 'spotify:show:38bS44xjbVVZ3No3ByF1dJ',
						category: 'podcast',
						domain: 'spotify',
						fetch,
						schemaType: 'PodcastSeries',
					}),
				},
			}),
		degradedTitle: 'Spotify Show 38bS44xjbVVZ3No3ByF1dJ',
		diagnostics: true,
		family: 'podcast',
		input: 'https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ',
		successTitle: 'Spotify Engineering Culture',
	},
	{
		canonicalId: 'https://parity.example/articles/knowledge-graphs',
		canonicalUrl: 'https://parity.example/articles/knowledge-graphs',
		createPlugin: (fetch) =>
			createDefaultUrlPlugin({ fetch, resolveHostname: resolvePublicTestHostname }),
		degradedTitle: 'Website parity.example',
		diagnostics: false,
		family: 'web catch-all',
		input: 'https://parity.example/articles/knowledge-graphs',
		successDisplayTitle: 'Website parity.example',
		successTitle: 'Knowledge Graphs in Practice',
	},
];

describe('user-add provider transport parity', () => {
	beforeEach(() => {
		resetDomainHtmlHostCircuitBreakersForTests();
	});

	it('keeps TMDB structural identity non-diagnostic without deriving a slug title', async () => {
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			plugins: [createTypeProfilesPlugin(), createTmdbPlugin()],
			runtime: 'server',
		});

		const result = await engine.classify({
			classificationSessionId: 'provider-lane-tmdb-keyless',
			input: 'https://www.themoviedb.org/movie/284-the-apartment',
			mode: 'server-only',
		});
		const atom = result.resolved?.atoms[0];

		expect(result.status).toBe('complete');
		expect(result.resolverErrors ?? []).toEqual([]);
		expect(atom).toMatchObject({
			canonicalId: 'tmdb:movie:284',
			sameAs: ['https://www.themoviedb.org/movie/284'],
			schemaType: 'Movie',
			title: "We can't source this title from TMDB; try the Letterboxd or Wikipedia link",
		});
		expect(atom?.data.name).toBeUndefined();
		expect(
			projectIdentifierLadder({
				canonicalUrl: atom?.sameAs[0],
				providerCanonicalId: atom?.canonicalId,
			})
		).toEqual({ iid: 'int:tmdb:movie:284', rung: 'handle' });
		expect(engine.getLastMetadata()).toMatchObject({
			platformResolver: {
				fallbackStage: 'generic',
				skippedStages: ['domain-api:no-credentials', 'oembed:unsupported'],
				stageErrors: [],
			},
		});
	});

	for (const family of families) {
		for (const behavior of transportBehaviors) {
			const upgradesEng15036Gap =
				behavior === 'timeout' ||
				(family.family === 'web catch-all' && behavior !== 'success' && behavior !== 'empty_og');
			const testName = upgradesEng15036Gap
				? `${family.family} surfaces the typed outcome for ${behavior} (ENG-15036)`
				: `${family.family} preserves display and identity for ${behavior}`;
			it(testName, async () => {
				let fetchCallCount = 0;
				let timeoutAbortObserved = false;
				const stub = createStubTransport(behavior, family.successTitle, () => {
					timeoutAbortObserved = true;
				});
				const fetch: StubFetch = async (url, init) => {
					fetchCallCount += 1;
					return await stub(url, init);
				};
				const engine = createClassificationEngine({
					onClassifierError: () => undefined,
					plugins: [createTypeProfilesPlugin(), family.createPlugin(fetch)],
					runtime: 'server',
				});

				const result = await engine.classify({
					classificationSessionId: `provider-lane-${family.family}-${behavior}`,
					input: family.input,
					mode: 'server-only',
				});
				const atom = result.resolved?.atoms[0];
				const expectedTitle =
					behavior === 'success'
						? (family.successDisplayTitle ?? family.successTitle)
						: family.degradedTitle;

				expect(fetchCallCount).toBe(1);
				expect(result.status).toBe('complete');
				expect(atom?.title).toBe(expectedTitle);
				expect(atom?.title.trim()).not.toBe('');
				expect(atom?.title).not.toMatch(/^https?:\/\//i);
				expect(atom?.canonicalId).toBe(family.canonicalId);
				expect(atom?.sameAs).toEqual([family.canonicalUrl]);
				expect(result.classification?.meta.canonicalUrl).toBe(family.canonicalUrl);
				if (family.urlCarriesTitle) {
					expect(atom?.title).not.toMatch(/^Goodreads Book \d+$/i);
				}
				if (behavior === 'success') {
					expect(family.successTitle).not.toBe(family.degradedTitle);
				}
				if (behavior === 'timeout') {
					expect(timeoutAbortObserved).toBe(true);
				}
				if (family.family === 'web catch-all' && behavior === 'success') {
					expect(atom?.data).toMatchObject({
						description: 'Provider parity fixture',
						image: 'https://cdn.parity.example/cover.jpg',
					});
					expect(atom?.metadata).toMatchObject({ sourceFamily: 'opengraph' });
				}

				const shouldRecordStageError =
					upgradesEng15036Gap ||
					(family.diagnostics &&
						(behavior === 'http_error_403' ||
							behavior === 'http_error_500' ||
							behavior === 'waf_challenge'));
				if (shouldRecordStageError) {
					expect(result.resolverErrors).toHaveLength(1);
					if (upgradesEng15036Gap) {
						const expectedReason =
							behavior === 'timeout'
								? 'timeout'
								: behavior === 'waf_challenge'
									? 'waf_challenge'
									: 'http_error';
						expect(result.resolverErrors?.[0]?.message).toContain(expectedReason);
					}
					if (behavior === 'waf_challenge') {
						if (family.diagnostics) {
							expect(engine.getLastMetadata()).toMatchObject({
								platformResolver: {
									stageErrors: ['opengraph:waf_challenge: HTTP 202'],
								},
							});
						}
					} else if (family.diagnostics) {
						expect(engine.getLastMetadata()).toMatchObject({
							platformResolver: { stageErrors: [expect.any(String)] },
						});
					}
				} else {
					expect(result.resolverErrors ?? []).toEqual([]);
				}
			}, 10_000);
		}
	}

	it('keeps Goodreads generic fallback and identity when the host breaker is open', async () => {
		let fetchCallCount = 0;
		const fetch: StubFetch = async () => {
			fetchCallCount += 1;
			return new Response('', {
				headers: { 'x-amzn-waf-action': 'challenge' },
				status: 202,
			});
		};
		const family = families[0];
		if (!family) {
			throw new Error('Goodreads parity fixture missing');
		}
		const engine = createClassificationEngine({
			onClassifierError: () => undefined,
			plugins: [createTypeProfilesPlugin(), family.createPlugin(fetch)],
			runtime: 'server',
		});

		for (const bookId of ['1', '2', '3']) {
			await engine.classify({
				classificationSessionId: `provider-lane-breaker-trip-${bookId}`,
				input: `https://www.goodreads.com/book/show/${bookId}.Blocked`,
				mode: 'server-only',
			});
		}
		const result = await engine.classify({
			classificationSessionId: 'provider-lane-breaker-open',
			input: family.input,
			mode: 'server-only',
		});

		expect(fetchCallCount).toBe(3);
		expect(result.status).toBe('complete');
		expect(result.classification).toMatchObject({
			confidence: 0.99,
			meta: { canonicalUrl: family.canonicalUrl },
		});
		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: family.canonicalId,
			sameAs: [family.canonicalUrl],
			schemaType: 'Book',
			title: family.degradedTitle,
		});
		expect(result.resolverErrors).toHaveLength(1);
		expect(result.resolverErrors?.[0]?.message).toContain('circuit_open');
	});
});
