import { describe, expect, it } from 'bun:test';
import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';
import { useStubbedPublicDns } from '@0xintuition/atom-enrichment/testing';
import { createWikidataIdentityBridge } from '../src/identity-bridge';
import { createDefaultUrlPlugin } from '../src/plugins/default-url';
import { createImdbPlugin } from '../src/plugins/imdb';
import { fetchHtmlDocumentResult } from '../src/plugins/shared/domain-html/fetch';
import { createV0TypeProfilesPlugin } from '../src/plugins/type-profiles';
import { createServerEngine } from '../src/server';
import { unspacedRequestSlot } from '../src/testing';

useStubbedPublicDns();

const imdbUrl = 'https://www.imdb.com/title/tt0137523/';
const resolveHostname = async () => [{ address: '93.184.216.34', family: 4 as const }];

async function classify(payload: unknown, status = 200, title: string | undefined = 'Fight Club') {
	const requests: string[] = [];
	const plugin = createImdbPlugin({
		apiKey: 'fixture-key',
		resolveHostname,
		fetch: async (url) => {
			requests.push(url);
			if (url.includes('/find/'))
				return new Response(typeof payload === 'string' ? payload : JSON.stringify(payload), {
					status,
				});
			if (url.includes('/suggestion/'))
				return Response.json({
					d: title
						? [
								{
									id: 'tt0137523',
									l: title,
									qid: 'movie',
									i: { imageUrl: 'https://example.com/unwanted.jpg' },
								},
							]
						: [],
				});
			throw new Error('Unexpected request');
		},
	});
	const engine = createServerEngine({
		onClassifierError: () => undefined,
		plugins: [createV0TypeProfilesPlugin(), plugin],
	});
	const result = await engine.classify({ input: imdbUrl, mode: 'server-only' });
	expect(requests.filter((url) => /(^|\.)imdb\.com\.?$/i.test(new URL(url).hostname))).toEqual([]);
	return { result, atom: result.resolved?.atoms[0], requests };
}

describe('IMDb licensed create bridge', () => {
	for (const mediaType of ['movie', 'tv'] as const) {
		it(`emits every learned rung for a sole ${mediaType} hit without images`, async () => {
			const { atom, requests } = await classify({
				movie_results:
					mediaType === 'movie'
						? [
								{
									id: 550,
									title: 'Fight Club',
									release_date: '1999-10-15',
									poster_path: '/poster.jpg',
								},
							]
						: [],
				tv_results:
					mediaType === 'tv'
						? [
								{
									id: 550,
									name: 'Fight Club',
									first_air_date: '1999-10-15',
									poster_path: '/poster.jpg',
								},
							]
						: [],
			});
			expect(atom).toMatchObject({
				canonicalId: `tmdb:${mediaType}:550`,
				schemaType: mediaType === 'movie' ? 'Movie' : 'TVSeries',
				hints: {
					identifiers: { tmdbId: '550', mediaType, imdbId: 'tt0137523' },
					providerCanonicalIds: ['imdb:title:tt0137523'],
				},
				metadata: { identityBridgeEligible: true, imdbBridge: { status: 'hit', hits: 1 } },
				data: {
					identifier: `int:tmdb:${mediaType}:550`,
					tmdbId: '550',
					mediaType,
					datePublished: '1999-10-15',
					sameAs: [imdbUrl, `https://www.themoviedb.org/${mediaType}/550`],
				},
			});
			expect(atom?.data.image).toBeUndefined();
			expect(requests).toHaveLength(1);
			expect(new URL(requests[0]!).pathname).toBe('/3/find/tt0137523');
			expect(new URL(requests[0]!).searchParams.get('external_source')).toBe('imdb_id');
		});
	}
	for (const [label, payload, status, hits] of [
		['miss', { movie_results: [], tv_results: [] }, 200, 0],
		[
			'ambiguous',
			{
				movie_results: [{ id: 550, title: 'Fight Club' }],
				tv_results: [{ id: 1, name: 'Another' }],
			},
			200,
			2,
		],
		['unavailable', {}, 429, 0],
		['unavailable', {}, 500, 0],
		['unavailable', '{', 200, 0],
		['unavailable', { movie_results: [{ id: 550 }] }, 200, 0],
	] as const) {
		it(`records ${label} (${status}, ${hits}) and uses only the suggestion title`, async () => {
			const { atom, result } = await classify(payload, status);
			if (label !== 'miss') {
				expect(atom).toBeUndefined();
				expect(result.classification?.meta.imdbBridge).toEqual({ status: label, hits });
				expect(result.classification?.meta.acquisitionOutcome).toMatchObject({
					status: 'unavailable',
					terminal: true,
				});
				return;
			}
			expect(atom).toMatchObject({
				canonicalId: 'imdb:title:tt0137523',
				metadata: { imdbBridge: { status: label, hits } },
				data: { identifier: 'int:imdb:tt0137523', name: 'Fight Club', sameAs: [imdbUrl] },
			});
			expect(atom?.data.image).toBeUndefined();
		});
	}
	it('terminates a titleless miss with no atom', async () => {
		const { result, atom } = await classify({ movie_results: [], tv_results: [] }, 200, '');
		expect(atom).toBeUndefined();
		expect(result.classification?.meta.acquisitionOutcome).toMatchObject({
			status: 'unavailable',
			terminal: true,
		});
	});
	for (const host of ['imdb.com', 'WWW.IMDB.COM.', 'sub.imdb.com']) {
		it(`denies ${host} at admission and every page hop`, async () => {
			const requests: string[] = [];
			const fetcher = async (url: string) => {
				requests.push(url);
				return new Response(null, {
					status: 302,
					headers: { location: `https://${host}/title/tt0137523/` },
				});
			};
			const plugin = createDefaultUrlPlugin({ fetch: fetcher, resolveHostname });
			expect(
				await plugin.classifiers?.[0]?.classify(`https://${host}/whatever`, {} as never)
			).toBeNull();
			expect(
				(await fetchHtmlDocumentResult(fetcher, { url: `https://${host}/`, resolveHostname })).ok
			).toBe(false);
			expect(
				(
					await fetchHtmlDocumentResult(fetcher, {
						url: 'https://example.com/redirect',
						resolveHostname,
					})
				).ok
			).toBe(false);
			expect(requests).toEqual(['https://example.com/redirect']);
		});
	}
});

for (const mediaType of ['movie', 'tv'] as const) {
	for (const promote of [true, false]) {
		it(`retains IMDb and TMDB evidence with ${mediaType} Wikidata promotion=${promote}`, async () => {
			const { result } = await classify({
				movie_results: mediaType === 'movie' ? [{ id: 550, title: 'Fight Club' }] : [],
				tv_results: mediaType === 'tv' ? [{ id: 550, name: 'Fight Club' }] : [],
			});
			const requests: string[] = [];
			const bridge = createWikidataIdentityBridge({
				requestSlot: unspacedRequestSlot(),
				fetch: createPinAwareFetch(async (input) => {
					const url = new URL(String(input));
					requests.push(url.toString());
					if (url.pathname.includes('Special:EntityData'))
						return Response.json({
							entities: {
								Q190050: {
									id: 'Q190050',
									claims: {
										[mediaType === 'movie' ? 'P4947' : 'P4983']: [
											{ mainsnak: { datavalue: { value: '550' } } },
										],
										P31: [
											{
												mainsnak: {
													datavalue: {
														value: { id: mediaType === 'movie' ? 'Q11424' : 'Q5398426' },
													},
												},
											},
										],
									},
								},
							},
						});
					return Response.json({ query: { search: promote ? [{ title: 'Q190050' }] : [] } });
				}),
			});
			const atom = (await bridge(result)).resolved?.atoms[0];
			expect(atom?.canonicalId).toBe(
				promote
					? `int:wd:${mediaType === 'movie' ? 'film' : 'television-series'}:Q190050`
					: `tmdb:${mediaType}:550`
			);
			expect(atom?.hints.identifiers).toMatchObject({
				tmdbId: '550',
				mediaType,
				imdbId: 'tt0137523',
			});
			expect(atom?.data.sameAs).toContain(imdbUrl);
			expect(requests.every((url) => new URL(url).hostname.endsWith('wikidata.org'))).toBe(true);
		});
	}
}

it('counts malformed competitors rather than picking the one valid hit', async () => {
	const { atom, result } = await classify({
		movie_results: [{ id: 550, title: 'Fight Club' }, null],
		tv_results: [],
	});
	expect(atom).toBeUndefined();
	expect(result.classification?.meta.imdbBridge).toEqual({ status: 'ambiguous', hits: 2 });
});

it('rejects a malformed sole hit and retains its raw hit count', async () => {
	const { result } = await classify({ movie_results: [{ id: 550, title: '   ' }], tv_results: [] });
	expect(result.classification?.meta.imdbBridge).toEqual({ status: 'unavailable', hits: 1 });
});

for (const path of ['title/tt0137523', 'name/nm0000206']) {
	it(`never follows API redirects to IMDb on ${path}`, async () => {
		const requests: string[] = [];
		const plugin = createImdbPlugin({
			apiKey: 'fixture-key',
			resolveHostname,
			fetch: async (url, init) => {
				requests.push(url);
				expect(init?.redirect).toBe(url.includes('/find/') ? 'error' : 'manual');
				return new Response(null, {
					status: 302,
					headers: { location: `https://WWW.IMDB.COM./${path}` },
				});
			},
		});
		const result = await createServerEngine({
			onClassifierError: () => undefined,
			plugins: [createV0TypeProfilesPlugin(), plugin],
		}).classify({ input: `https://WWW.IMDB.COM./${path}`, mode: 'server-only' });
		expect(result.resolved?.atoms ?? []).toHaveLength(0);
		expect(requests.map((url) => new URL(url).hostname)).toEqual(
			path.startsWith('title')
				? ['api.themoviedb.org', 'v2.sg.media-imdb.com']
				: ['v2.sg.media-imdb.com']
		);
	});
}

it('does not accept a suggestion title belonging to a different IMDb id', async () => {
	const plugin = createImdbPlugin({
		resolveHostname,
		fetch: async () => Response.json({ d: [{ id: 'tt9999999', l: 'Wrong title' }] }),
	});
	const result = await createServerEngine({
		onClassifierError: () => undefined,
		plugins: [createV0TypeProfilesPlugin(), plugin],
	}).classify({ input: imdbUrl, mode: 'server-only' });
	expect(result.resolved?.atoms ?? []).toHaveLength(0);
});

it('blocks an IMDb redirect from the Wikidata promotion hop before fetching its destination', async () => {
	const { result } = await classify({
		movie_results: [{ id: 550, title: 'Fight Club' }],
		tv_results: [],
	});
	const requests: string[] = [];
	const bridge = createWikidataIdentityBridge({
		requestSlot: unspacedRequestSlot(),
		fetch: createPinAwareFetch(async (input, init) => {
			requests.push(String(input));
			if (init?.redirect !== 'manual') requests.push('https://WWW.IMDB.COM./title/tt0137523/');
			return new Response(null, {
				status: 302,
				headers: { location: 'https://WWW.IMDB.COM./title/tt0137523/' },
			});
		}),
	});
	expect((await bridge(result)).resolved?.atoms[0]?.canonicalId).toBe('tmdb:movie:550');
	expect(requests).toHaveLength(1);
	expect(new URL(requests[0]!).hostname).toBe('www.wikidata.org');
});
