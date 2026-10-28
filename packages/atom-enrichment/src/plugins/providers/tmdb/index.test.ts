import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import type { EnrichmentRequest } from '../../../types';
import { createPinAwareFetch, type FetchLike } from '../__shared__/http';
import {
	buildTmdbDetailsEndpoint,
	createTmdbPlugin,
	parseTmdbReference,
	parseTmdbUrl,
} from './index';

const NOW = '2026-09-02T12:00:00.000Z';
const CONTEXT = { now: () => NOW, signal: new AbortController().signal };

function request(input: { identifiers?: Record<string, string>; url?: string }): EnrichmentRequest {
	return {
		input: {
			atomType: 'thing',
			jsonLd: { '@context': 'https://schema.org/', '@type': 'Movie' },
			source: { classificationEngine: 'fixture', classifiedAt: NOW },
			hints: {
				...(input.identifiers ? { identifiers: input.identifiers } : {}),
				...(input.url ? { url: input.url } : {}),
			},
		},
		runtime: 'server',
	};
}

function jsonResponse(payload: unknown, status = 200, headers?: Record<string, string>): Response {
	return new Response(JSON.stringify(payload), {
		headers: { 'content-type': 'application/json', ...headers },
		status,
	});
}

describe('TMDB provider target and key gates', () => {
	test('accepts only typed positive IDs and exact TMDB page hosts', () => {
		expect(parseTmdbReference('movie:550')).toEqual({ mediaType: 'movie', tmdbId: 550 });
		expect(parseTmdbReference('tmdb:tv:1396')).toEqual({ mediaType: 'tv', tmdbId: 1396 });
		expect(parseTmdbReference('550')).toBeUndefined();
		expect(parseTmdbUrl('https://www.themoviedb.org/tv/1396-breaking-bad')).toEqual({
			mediaType: 'tv',
			tmdbId: 1396,
		});
		expect(parseTmdbUrl('https://themoviedb.org.evil/movie/550')).toBeUndefined();
	});

	test('is dormant without TMDB_API_KEY and never calls fetch', async () => {
		let calls = 0;
		const plugin = createTmdbPlugin({
			apiKey: '   ',
			fetch: createPinAwareFetch(async () => {
				calls += 1;
				return jsonResponse({});
			}),
		});
		const target = request({ identifiers: { tmdb: 'movie:550' } });
		expect(plugin.supports(target)).toBe(false);
		expect(await plugin.enrich(target, CONTEXT)).toEqual([]);
		expect(calls).toBe(0);
	});

	test('pins movie and TV append_to_response query shapes', () => {
		const movie = new URL(
			buildTmdbDetailsEndpoint({ mediaType: 'movie', tmdbId: 550 }, 'fixture-key')
		);
		const tv = new URL(buildTmdbDetailsEndpoint({ mediaType: 'tv', tmdbId: 1396 }, 'fixture-key'));
		expect(movie.searchParams.get('append_to_response')).toBe(
			'credits,keywords,external_ids,release_dates,videos'
		);
		expect(tv.searchParams.get('append_to_response')).toBe(
			'credits,keywords,external_ids,content_ratings,videos'
		);
		expect(movie.searchParams.get('api_key')).toBe('fixture-key');
	});
});

describe('TMDB provider extraction and aliases', () => {
	test.each([
		{ mediaType: 'movie' as const, requestedId: 550, responseId: 551 },
		{ mediaType: 'tv' as const, requestedId: 1396, responseId: 1397 },
	])('rejects a hostile $mediaType response whose id does not match the requested identity', async ({
		mediaType,
		requestedId,
		responseId,
	}) => {
		const fixture = JSON.parse(
			await readFile(new URL('./__fixtures__/movie.json', import.meta.url), 'utf8')
		) as Record<string, unknown>;
		const plugin = createTmdbPlugin({
			apiKey: 'fixture-key',
			fetch: createPinAwareFetch(async () => jsonResponse({ ...fixture, id: responseId })),
		});
		let artifacts: Awaited<ReturnType<typeof plugin.enrich>> = [];

		await expect(
			(async () => {
				artifacts = await plugin.enrich(
					request({ identifiers: { tmdb: `${mediaType}:${requestedId}` } }),
					CONTEXT
				);
			})()
		).rejects.toThrow('mismatched payload id');
		expect(artifacts).toEqual([]);
	});

	test('retains the full movie payload and stamps facets, identifier rungs, and canonical aliases', async () => {
		const fixture = JSON.parse(
			await readFile(new URL('./__fixtures__/movie.json', import.meta.url), 'utf8')
		) as Record<string, unknown>;
		fixture.videos = {
			results: [{ key: 'abcdefghijk', site: 'YouTube', type: 'Trailer', futureField: 'preserved' }],
		};
		const requested: string[] = [];
		const fetcher: FetchLike = async (url) => {
			requested.push(url);
			return jsonResponse(fixture);
		};
		const plugin = createTmdbPlugin({ apiKey: 'fixture-key', fetch: createPinAwareFetch(fetcher) });
		const target = request({ identifiers: { tmdb: 'movie:550' } });

		expect(plugin.supports(target)).toBe(true);
		const [artifact] = await plugin.enrich(target, CONTEXT);
		expect(requested).toHaveLength(1);
		expect(new URL(requested[0]!).pathname).toBe('/3/movie/550');
		expect(artifact).toMatchObject({
			artifact_type: 'tmdb',
			data: {
				backdropPath: '/backdrop.jpg',
				externalIds: { imdbId: 'tt1234567', tvdbId: 9876, wikidataId: 'Q12345' },
				genres: ['Drama', 'Thriller'],
				identifierRung: [
					{ scheme: 'tmdb', value: 'movie:550' },
					{ scheme: 'imdb', value: 'title:tt1234567' },
				],
				keywords: ['origin story', 'fixture'],
				originalLanguage: 'en',
				posterPath: '/poster.jpg',
				productionCountries: ['United States of America'],
				runtime: 123,
				sameAs: ['https://www.themoviedb.org/movie/550', 'https://www.imdb.com/title/tt1234567/'],
				spokenLanguages: ['English'],
				tmdbApiPayload: fixture,
				tmdbId: 550,
				topBilledCredits: [
					{ id: 1, name: 'First Billing', order: 0 },
					{ id: 2, name: 'Second Billing', order: 1 },
				],
				voteAverage: 7.8,
				voteCount: 4201,
			},
			meta: {
				fetchedAt: NOW,
				pluginId: 'tmdb',
				provider: 'tmdb',
				sourceUrl: 'https://www.themoviedb.org/movie/550',
			},
		});
		const data = artifact?.data as Record<string, unknown>;
		expect(data).not.toHaveProperty('key');
		expect(data).not.toHaveProperty('iid');
		expect(data).not.toHaveProperty('canonicalId');
	});

	test('normalizes TV response fields and uses TV keyword/content-rating append shapes', async () => {
		let requested = '';
		const plugin = createTmdbPlugin({
			apiKey: 'fixture-key',
			fetch: createPinAwareFetch(async (url) => {
				requested = url;
				return jsonResponse({
					videos: { results: [{ key: 'abcdefghijk', site: 'YouTube', type: 'Trailer' }] },
					content_ratings: { results: [{ iso_3166_1: 'US', rating: 'TV-MA' }] },
					credits: { cast: [] },
					episode_run_time: [47],
					external_ids: { imdb_id: 'tt0903747', tvdb_id: 81189, wikidata_id: 'Q1079' },
					first_air_date: '2008-01-20',
					genres: [{ id: 18, name: 'Drama' }],
					id: 1396,
					keywords: { results: [{ id: 1, name: 'crime' }] },
					name: 'Breaking Bad',
					production_countries: [],
					spoken_languages: [],
					vote_count: 12_345,
				});
			}),
		});
		const [artifact] = await plugin.enrich(
			request({ url: 'https://www.themoviedb.org/tv/1396-breaking-bad' }),
			CONTEXT
		);
		expect(new URL(requested).searchParams.get('append_to_response')).toBe(
			'credits,keywords,external_ids,content_ratings,videos'
		);
		expect(artifact?.data).toMatchObject({
			identifierRung: [
				{ scheme: 'tmdb', value: 'tv:1396' },
				{ scheme: 'imdb', value: 'title:tt0903747' },
			],
			keywords: ['crime'],
			mediaType: 'tv',
			releaseDate: '2008-01-20',
			runtime: 47,
			tmdbApiPayload: {
				videos: { results: [{ key: 'abcdefghijk', site: 'YouTube', type: 'Trailer' }] },
			},
		});
	});
});
