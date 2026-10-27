import { describe, expect, it } from 'bun:test';
import { createEnrichmentEngine } from '../../src/engine';
import { toClassifiedAtomInput } from '../../src/handoff';
import { createPinAwareFetch } from '../../src/plugins/providers/__shared__/http';
import { createMusicBrainzPlugin } from '../../src/plugins/providers/musicbrainz';
import { createWikidataPlugin } from '../../src/plugins/providers/wikidata';
import { createWikipediaPlugin } from '../../src/plugins/providers/wikipedia';
import { createMockAtomInput, createMockRequest } from '../../src/testing';

const generatedName = 'Spotify Track 3n3Ppam7vgaVa1iaRUc9Lp';
const sourceUrl = 'https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp';

describe('generated provider placeholder lookup sweep', () => {
	for (const [pluginId, createPlugin] of [
		['wikipedia', createWikipediaPlugin],
		['wikidata', createWikidataPlugin],
		['musicbrainz', createMusicBrainzPlugin],
	] as const) {
		it(`${pluginId} skips a synthesized Spotify name without issuing a lookup`, async () => {
			let fetchCallCount = 0;
			const engine = createEnrichmentEngine({
				plugins: [
					createPlugin({
						fetch: createPinAwareFetch(async () => {
							fetchCallCount += 1;
							return Response.json({});
						}),
					}),
				],
			});
			const result = await engine.enrich(
				createMockRequest({
					input: createMockAtomInput({
						atomType: 'song',
						hints: { name: generatedName, url: sourceUrl },
						jsonLd: {
							'@context': 'https://schema.org',
							'@type': 'MusicRecording',
							name: generatedName,
							url: sourceUrl,
						},
						source: {
							classificationEngine: '@0xintuition/atom-classification',
							classifiedAt: '2026-08-23T00:00:00.000Z',
							fallbackStage: 'generic',
							provider: 'spotify',
						},
					}),
				})
			);

			expect(fetchCallCount).toBe(0);
			expect(result.artifacts).toEqual([]);
			expect(result.errors).toEqual([]);
			expect(result.skipped).toContainEqual({ pluginId, reason: 'not_applicable' });
		});
	}

	for (const [pluginId, createPlugin] of [
		['wikipedia', createWikipediaPlugin],
		['wikidata', createWikidataPlugin],
		['musicbrainz', createMusicBrainzPlugin],
	] as const) {
		for (const fixture of [
			{
				atomType: 'song' as const,
				fallbackStage: 'opengraph',
				name: 'Spotify Track ABCDEFGH',
				provider: 'spotify',
				schemaType: 'MusicRecording',
				url: 'https://open.spotify.com/track/ABCDEFGH',
			},
			{
				atomType: 'thing' as const,
				fallbackStage: 'opengraph',
				name: 'TMDB Movie 550',
				provider: 'tmdb',
				schemaType: 'Movie',
				url: 'https://www.themoviedb.org/movie/550',
			},
		] as const) {
			it(`${pluginId} looks up a real ${fixture.provider} OpenGraph title with placeholder shape after handoff`, async () => {
				// MusicBrainz only accepts recording requests; retain that supported
				// family while probing whether provenance suppresses this exact title.
				const input = classificationHandoffInput(
					pluginId === 'musicbrainz'
						? { ...fixture, atomType: 'song', schemaType: 'MusicRecording' }
						: fixture
				);
				const { fetchCallCount } = await enrichWithLookupPlugin({ createPlugin, input });

				expect(input?.source).toMatchObject({
					fallbackStage: 'opengraph',
					provider: fixture.provider,
				});
				expect(fetchCallCount).toBeGreaterThan(0);
			});
		}

		it(`${pluginId} skips an explicit generic-stage placeholder after handoff`, async () => {
			const input = classificationHandoffInput({
				atomType: 'song',
				fallbackStage: 'generic',
				name: generatedName,
				provider: 'spotify',
				schemaType: 'MusicRecording',
				url: sourceUrl,
			});
			const { fetchCallCount, result } = await enrichWithLookupPlugin({ createPlugin, input });

			expect(fetchCallCount).toBe(0);
			expect(result.skipped).toContainEqual({ pluginId, reason: 'not_applicable' });
		});

		it(`${pluginId} fails open for a legacy placeholder-shaped input without provenance`, async () => {
			const input = classificationHandoffInput({
				atomType: 'song',
				name: generatedName,
				schemaType: 'MusicRecording',
				url: sourceUrl,
			});
			const { fetchCallCount } = await enrichWithLookupPlugin({ createPlugin, input });

			expect(input?.source.provider).toBeUndefined();
			expect(fetchCallCount).toBeGreaterThan(0);
		});

		it(`${pluginId} fails open for an unknown resolution stage`, async () => {
			const input = classificationHandoffInput({
				atomType: 'song',
				fallbackStage: 'legacy-unknown',
				name: generatedName,
				provider: 'spotify',
				schemaType: 'MusicRecording',
				url: sourceUrl,
			});
			const { fetchCallCount } = await enrichWithLookupPlugin({ createPlugin, input });

			expect(fetchCallCount).toBeGreaterThan(0);
		});
	}
});

function classificationHandoffInput(input: {
	atomType: 'song' | 'thing';
	fallbackStage?: string;
	name: string;
	provider?: string;
	schemaType: string;
	url: string;
}) {
	return toClassifiedAtomInput(input.url, {
		resolved: {
			publishable: [
				{
					type: input.schemaType,
					data: { name: input.name, url: input.url },
					meta: {
						...(input.provider ? { provider: input.provider } : {}),
						sourceUrl: input.url,
					},
				},
			],
			atoms: [
				{
					category: input.atomType,
					schemaType: input.schemaType,
					title: input.name,
					metadata: {
						...(input.fallbackStage ? { fallbackStage: input.fallbackStage } : {}),
						...(input.provider ? { provider: input.provider } : {}),
					},
				},
			],
		},
	});
}

async function enrichWithLookupPlugin(input: {
	createPlugin:
		| typeof createWikipediaPlugin
		| typeof createWikidataPlugin
		| typeof createMusicBrainzPlugin;
	input: ReturnType<typeof classificationHandoffInput>;
}) {
	if (!input.input) {
		throw new Error('Expected classification handoff input');
	}
	let fetchCallCount = 0;
	const engine = createEnrichmentEngine({
		plugins: [
			input.createPlugin({
				fetch: createPinAwareFetch(async () => {
					fetchCallCount += 1;
					return Response.json({ search: [] });
				}),
			}),
		],
	});
	const result = await engine.enrich(
		createMockRequest({
			input: input.input,
		})
	);

	return { fetchCallCount, result };
}
