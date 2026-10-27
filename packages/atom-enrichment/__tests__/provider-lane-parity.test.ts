import { describe, expect, it } from 'bun:test';

import { projectIidDataResolvedFromArtifacts } from '../src/iid-data-resolved-projection';
import { materializeNodeDataResolved } from '../src/materialize-node-data-resolved';
import type { EnrichmentArtifact } from '../src/types';

const FETCHED_AT = '2026-08-23T12:00:00.000Z';

function artifact(
	artifactType: string,
	data: Record<string, unknown>,
	sourceUrl: string
): EnrichmentArtifact {
	return {
		artifact_type: artifactType,
		data,
		meta: {
			pluginId: artifactType,
			provider: artifactType,
			fetchedAt: FETCHED_AT,
			sourceUrl,
		},
	};
}

const bulkProjectionCases = [
	{
		family: 'book',
		expectedTitle: 'The Left Hand of Darkness',
		project: async () =>
			await projectIidDataResolvedFromArtifacts({
				canonicalIid: 'int:isbn:9780441478125',
				classificationSlug: 'book',
				schemaType: 'Book',
				artifacts: [
					artifact(
						'openlibrary',
						{
							authors: [{ name: 'Ursula K. Le Guin', olid: 'OL31353A' }],
							name: 'The Left Hand of Darkness',
						},
						'https://openlibrary.org/works/OL27448W'
					),
				],
			}),
	},
	{
		family: 'movie',
		expectedTitle: 'The Matrix',
		project: async () => ({
			dataResolved: materializeNodeDataResolved({
				classification: {
					data: {
						'@context': 'https://schema.org/',
						'@type': 'Movie',
						name: 'TMDB Movie 603',
						url: 'https://www.themoviedb.org/movie/603',
					},
					schemaType: 'Movie',
				},
				artifacts: [
					artifact(
						'opengraph',
						{ title: 'The Matrix', url: 'https://letterboxd.com/film/the-matrix/' },
						'https://letterboxd.com/film/the-matrix/'
					),
				],
			}),
		}),
	},
	{
		family: 'tv',
		expectedTitle: 'Breaking Bad',
		project: async () => ({
			dataResolved: materializeNodeDataResolved({
				classification: {
					data: {
						'@context': 'https://schema.org/',
						'@type': 'TVSeries',
						name: 'TMDB TV Series 1396',
						url: 'https://www.themoviedb.org/tv/1396',
					},
					schemaType: 'TVSeries',
				},
				artifacts: [
					artifact(
						'wikipedia',
						{ title: 'Breaking Bad', url: 'https://en.wikipedia.org/wiki/Breaking_Bad' },
						'https://en.wikipedia.org/wiki/Breaking_Bad'
					),
				],
			}),
		}),
	},
	{
		family: 'song',
		expectedTitle: 'One Last Time',
		project: async () =>
			await projectIidDataResolvedFromArtifacts({
				canonicalIid: 'int:isrc:USUM71703861',
				classificationSlug: 'music-recording',
				schemaType: 'MusicRecording',
				artifacts: [
					artifact(
						'spotify',
						{
							artists: [{ name: 'Ariana Grande', spotifyId: '66CXWjxzNUsdJxJ2JdwvnR' }],
							name: 'One Last Time',
							spotifyId: '1zzxoZVylsna2BQB65Ppcb',
							spotifyUrl: 'https://open.spotify.com/track/1zzxoZVylsna2BQB65Ppcb',
							type: 'track',
						},
						'https://open.spotify.com/track/1zzxoZVylsna2BQB65Ppcb'
					),
				],
			}),
	},
	{
		family: 'podcast',
		expectedTitle: 'Spotify Engineering Culture',
		project: async () =>
			await projectIidDataResolvedFromArtifacts({
				canonicalIid: 'int:url:https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ',
				classificationSlug: 'podcast-series',
				schemaType: 'PodcastSeries',
				artifacts: [
					artifact(
						'spotify',
						{
							name: 'Spotify Engineering Culture',
							publisher: 'Spotify',
							spotifyId: '38bS44xjbVVZ3No3ByF1dJ',
							spotifyUrl: 'https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ',
							type: 'show',
						},
						'https://open.spotify.com/show/38bS44xjbVVZ3No3ByF1dJ'
					),
				],
			}),
	},
	{
		family: 'web catch-all',
		expectedTitle: 'A Practical Guide to Knowledge Graphs',
		project: async () =>
			await projectIidDataResolvedFromArtifacts({
				canonicalIid: 'int:url:https://example.com/guides/knowledge-graphs',
				classificationSlug: 'thing',
				schemaType: 'Article',
				artifacts: [
					artifact(
						'opengraph',
						{
							description: 'A real-shaped OpenGraph article fixture.',
							title: 'A Practical Guide to Knowledge Graphs',
							url: 'https://example.com/guides/knowledge-graphs',
						},
						'https://example.com/guides/knowledge-graphs'
					),
				],
			}),
	},
] as const;

describe('bulk artifact provider-lane parity', () => {
	for (const fixture of bulkProjectionCases) {
		it(`projects a human-usable ${fixture.family} title into data_resolved`, async () => {
			const projection = await fixture.project();
			const dataResolved = projection?.dataResolved as Record<string, unknown> | undefined;
			const title = dataResolved?.name;

			expect(title).toBe(fixture.expectedTitle);
			expect(title).not.toMatch(/^https?:\/\//i);
			expect(title).not.toMatch(
				/^(?:Goodreads Book|TMDB Movie|TMDB TV Series|Spotify (?:Track|Show)) /i
			);
		});
	}
});
