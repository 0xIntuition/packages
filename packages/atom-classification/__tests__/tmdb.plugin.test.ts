import { describe, expect, it } from 'bun:test';
import { createPinAwareFetch } from '@0xintuition/atom-enrichment/providers';
import { useStubbedPublicDns } from '@0xintuition/atom-enrichment/testing';
import { createWikidataIdentityBridge } from '../src/identity-bridge';
import { createServerEngine } from '../src/server';
import { unspacedRequestSlot } from '../src/testing';
import { createDefaultTestPlugins } from './helpers/default-plugins';

useStubbedPublicDns();

const TMDB_UNAVAILABLE_COPY =
	"We can't source this title from TMDB; try the Letterboxd or Wikipedia link";

function wikidataEntity(qid: string, property: 'P4947' | 'P4983', value: string, p31: string) {
	return {
		entities: {
			[qid]: {
				id: qid,
				labels: {
					en: { language: 'en', value: qid === 'Q190050' ? 'Fight Club' : 'Breaking Bad' },
				},
				descriptions: { en: { language: 'en', value: 'Wikidata description' } },
				claims: {
					[property]: [{ mainsnak: { datavalue: { value } }, rank: 'normal' }],
					P31: [{ mainsnak: { datavalue: { value: { id: p31 } } }, rank: 'normal' }],
				},
			},
		},
	};
}

describe('tmdb platform plugin', () => {
	for (const fixture of [
		{
			input: 'https://www.themoviedb.org/movie/550-fight-club',
			mediaType: 'movie',
			schemaType: 'Movie',
			canonicalId: 'tmdb:movie:550',
			canonicalUrl: 'https://www.themoviedb.org/movie/550',
		},
		{
			input: 'https://www.themoviedb.org/tv/1396-breaking-bad',
			mediaType: 'tv',
			schemaType: 'TVSeries',
			canonicalId: 'tmdb:tv:1396',
			canonicalUrl: 'https://www.themoviedb.org/tv/1396',
		},
	] as const) {
		it(`classifies ${fixture.mediaType} URLs as identity-only bridge inputs`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: createDefaultTestPlugins(),
			});

			const result = await engine.classify({
				input: fixture.input,
				mode: 'progressive',
				classificationSessionId: `tmdb-${fixture.mediaType}-identity-only`,
			});

			const atom = result.resolved?.atoms[0];
			expect(result.classification).toMatchObject({
				domain: 'tmdb',
				subtype: fixture.mediaType,
				meta: {
					mediaType: fixture.mediaType,
					tmdbId: fixture.canonicalId.split(':').at(-1),
					canonicalUrl: fixture.canonicalUrl,
				},
			});
			expect(atom).toMatchObject({
				schemaType: fixture.schemaType,
				canonicalId: fixture.canonicalId,
				sameAs: [fixture.canonicalUrl],
				metadata: { identityBridgeEligible: true },
			});
			expect(atom?.title).toBe(TMDB_UNAVAILABLE_COPY);
			expect(atom?.data).toEqual({
				'@context': 'https://schema.org/',
				'@type': fixture.schemaType,
				identifier: fixture.canonicalId,
				sameAs: [fixture.canonicalUrl],
			});
		});
	}

	it('never requests a TMDB host while movie and TV identities use the Wikidata bridge', async () => {
		const requestedUrls: URL[] = [];
		let forbiddenAdapterCalls = 0;
		const bridge = createWikidataIdentityBridge({
			fetch: createPinAwareFetch(async (input) => {
				const url = new URL(String(input));
				requestedUrls.push(url);
				const isTv =
					url.pathname.includes('Q1079') ||
					(url.searchParams.get('srsearch')?.includes('P4983=1396') ?? false);
				if (url.pathname.includes('Special:EntityData')) {
					return new Response(
						JSON.stringify(
							isTv
								? wikidataEntity('Q1079', 'P4983', '1396', 'Q5398426')
								: wikidataEntity('Q190050', 'P4947', '550', 'Q11424')
						),
						{ status: 200 }
					);
				}
				return new Response(
					JSON.stringify({ query: { search: [{ title: isTv ? 'Q1079' : 'Q190050' }] } }),
					{ status: 200 }
				);
			}),
			requestSlot: unspacedRequestSlot(),
		});
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins({
				tmdbPluginOptions: {
					adapters: {
						openGraph: () => {
							forbiddenAdapterCalls += 1;
							return null;
						},
					},
				} as never,
			}),
		});

		for (const [index, fixture] of [
			{ input: 'https://www.themoviedb.org/movie/550-fight-club', title: 'Fight Club' },
			{ input: 'https://www.themoviedb.org/tv/1396-breaking-bad', title: 'Breaking Bad' },
		].entries()) {
			const result = await bridge(
				await engine.classify({
					input: fixture.input,
					mode: 'server-only',
					classificationSessionId: `tmdb-no-request-${index}`,
				})
			);
			expect(result.resolved?.atoms[0]).toMatchObject({
				title: fixture.title,
				description: 'Wikidata description',
				data: { name: fixture.title, description: 'Wikidata description' },
			});
		}

		expect(forbiddenAdapterCalls).toBe(0);
		expect(
			requestedUrls.some((url) => /(?:^|\.)(?:themoviedb|tmdb)\.org$/.test(url.hostname))
		).toBe(false);
		expect(requestedUrls.some((url) => url.hostname === 'www.wikidata.org')).toBe(true);
		expect(requestedUrls).toHaveLength(4);
	});

	it('returns a typed non-fabricating terminal outcome when Wikidata has no match', async () => {
		const engine = createServerEngine({
			onClassifierError: () => undefined,
			plugins: createDefaultTestPlugins(),
		});
		const classified = await engine.classify({
			input: 'https://www.themoviedb.org/movie/550-fight-club',
			mode: 'server-only',
			classificationSessionId: 'tmdb-bridge-unavailable',
		});
		const result = await createWikidataIdentityBridge({
			fetch: createPinAwareFetch(
				async () => new Response(JSON.stringify({ query: { search: [] } }), { status: 200 })
			),
			requestSlot: unspacedRequestSlot(),
		})(classified);

		expect(result.resolved?.atoms[0]).toMatchObject({
			canonicalId: 'tmdb:movie:550',
			schemaType: 'Movie',
			title: TMDB_UNAVAILABLE_COPY,
			metadata: {
				acquisitionOutcome: {
					status: 'unavailable',
					reason: 'identity_bridge_not_found',
					terminal: true,
				},
			},
		});
		expect(result.resolved?.publishable).toEqual([]);
		expect(result.resolved?.classifications).toEqual([]);
	});

	for (const input of [
		'https://www.themoviedb.org/person/287-brad-pitt',
		'https://www.themoviedb.org/collection/10',
		'https://www.themoviedb.org/movie/0',
		'https://www.themoviedb.org/movie/550/credits',
		'https://www.themoviedb.org/movie/not-a-number',
		'https://www.themoviedb.org/?movie=550',
	] as const) {
		it(`rejects unsupported TMDB input ${input}`, async () => {
			const engine = createServerEngine({
				onClassifierError: () => undefined,
				plugins: createDefaultTestPlugins(),
			});
			const result = await engine.classify({
				input,
				mode: 'progressive',
				classificationSessionId: `tmdb-reject-${input}`,
				pluginIds: ['tmdb'],
			});
			expect(result.classification).toBeUndefined();
			expect(result.resolved).toBeUndefined();
		});
	}
});
