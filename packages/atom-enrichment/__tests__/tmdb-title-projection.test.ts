import { describe, expect, test } from 'bun:test';

import { projectTmdbTitleFromArtifacts } from '../src/tmdb-title-projection';

describe('deprecated TMDB title projection', () => {
	test('never consumes a TMDB artifact and preserves identity bytes', () => {
		const dataResolved = {
			'@context': 'https://schema.org/',
			'@type': 'Movie',
			name: 'TMDB Movie 550',
			url: 'https://www.themoviedb.org/movie/550',
		};
		const projected = projectTmdbTitleFromArtifacts(dataResolved, [
			{
				artifactKind: 'tmdb',
				data: {
					image: 'https://image.tmdb.org/t/p/original/forbidden.jpg',
					title: 'Fight Club',
				},
				stableKey: 'tmdb:movie:550',
				status: 'active',
			},
		]);

		expect(projected).toBe(dataResolved);
		expect(projected).toEqual(dataResolved);
	});
});
