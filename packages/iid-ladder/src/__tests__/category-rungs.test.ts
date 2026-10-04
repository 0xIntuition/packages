import { WD_ENTITYSCHEMA_BINDINGS } from '@0xintuition/iid';
import { classificationForScheme } from '@0xintuition/iid-registry';
import { describe, expect, it } from 'vitest';
import {
	IDENTITY_CATEGORIES,
	IDENTITY_CATEGORY_ALIAS_ONLY_POLICY,
	IDENTITY_CATEGORY_RUNG_POLICY,
	IDENTITY_RUNG_TOKENS,
	identityRungsForCategory,
	resolveWikidataP31Identity,
	SCHEMA_TYPE_IDENTITY_CATEGORIES,
	schemeOrderForIdentityCategory,
} from '../category-rungs.js';

describe('shared category identity-rung policy', () => {
	it('pins the create and seed priority rows strongest-first', () => {
		expect(IDENTITY_CATEGORY_RUNG_POLICY).toEqual({
			artist: ['isni', 'mbid:artist', 'wd', 'spotify:artist'],
			song: ['isrc', 'spotify:track'],
			'music-album': ['mbid:release-group', 'wd', 'spotify:album'],
			book: ['olid', 'isbn', 'goodreads:book'],
			movie: ['wd:film', 'tmdb:movie', 'imdb:title'],
			'tv-series': ['wd:television-series', 'tmdb:tv', 'imdb:title'],
			'podcast-series': ['podcastguid', 'podcast-index', 'spotify:show'],
			'podcast-episode': ['rssitem', 'podcast-index', 'spotify:episode'],
		});
	});

	it('keeps album identity at release-group level, separate from song rungs', () => {
		const rungs = IDENTITY_CATEGORY_RUNG_POLICY['music-album'];
		expect(rungs).toEqual(['mbid:release-group', 'wd', 'spotify:album']);
		for (const rung of IDENTITY_CATEGORY_RUNG_POLICY.song) {
			expect(rungs).not.toContain(rung);
		}
		expect(schemeOrderForIdentityCategory('music-album')).toEqual(['mbid', 'wd', 'spotify']);
		expect(schemeOrderForIdentityCategory('music-recording')).toEqual(['isrc', 'spotify']);
		expect(schemeOrderForIdentityCategory('podcast')).toEqual([
			'podcastguid',
			'podcast-index',
			'spotify',
		]);
		expect(schemeOrderForIdentityCategory('release-group')).toBeUndefined();
	});

	it('maps exact P31 classes without guessing an unknown class', () => {
		expect(resolveWikidataP31Identity(['Q11424'])).toEqual({
			schemaType: 'Movie',
			wdSlug: 'film',
		});
		expect(resolveWikidataP31Identity(['Q5398426'])).toEqual({
			schemaType: 'TVSeries',
			wdSlug: 'television-series',
		});
		expect(resolveWikidataP31Identity(['Q571'])).toEqual({ schemaType: 'Book' });
		expect(resolveWikidataP31Identity(['Q3302947'])).toEqual({
			schemaType: 'MusicRecording',
		});
		expect(resolveWikidataP31Identity(['Q5'])).toEqual({
			schemaType: 'Person',
			wdSlug: 'human',
		});
		expect(resolveWikidataP31Identity(['Q999999'])).toEqual({ schemaType: 'Thing' });
	});

	it('uses the pinned active subclass closure with deterministic precedence', () => {
		expect(resolveWikidataP31Identity(['Q506240'])).toEqual({
			schemaType: 'Movie',
			wdSlug: 'film',
		});
		expect(resolveWikidataP31Identity(['Q21191270', 'Q5398426'])).toEqual({
			schemaType: 'TVSeries',
			wdSlug: 'television-series',
		});
		expect(resolveWikidataP31Identity(['Q5398426', 'Q11424'])).toEqual({
			schemaType: 'Movie',
			wdSlug: 'film',
		});
	});

	it('retains every dormant binding classification without activating its slug', () => {
		for (const binding of WD_ENTITYSCHEMA_BINDINGS.filter(({ status }) => status === 'dormant')) {
			for (const qid of binding.anchorQids) {
				expect(resolveWikidataP31Identity([qid]), binding.slug).toEqual({
					schemaType: binding.classification,
				});
			}
		}
	});

	it('returns undefined for unknown categories, including inherited object property names', () => {
		expect(schemeOrderForIdentityCategory('movie')).toEqual(['wd', 'tmdb', 'imdb']);
		expect(schemeOrderForIdentityCategory('music-recording')).toEqual(['isrc', 'spotify']);
		for (const category of [
			'no-such-category',
			'constructor',
			'__proto__',
			'toString',
			'hasOwnProperty',
		]) {
			expect(schemeOrderForIdentityCategory(category), category).toBeUndefined();
		}
	});
});

it('artist MBID registry classification agrees with the artist policy row', () => {
	expect(IDENTITY_CATEGORY_RUNG_POLICY.artist).toEqual([
		'isni',
		'mbid:artist',
		'wd',
		'spotify:artist',
	]);
	expect(
		classificationForScheme('mbid', 'artist:5ae54dee-4dba-49c0-802a-a3b3b3adfe9b')
	).toMatchObject({ slug: 'music-group', schemaType: 'MusicGroup' });
});

it('keeps alias-only rungs available for matching outside primary scheme orders', () => {
	expect(IDENTITY_CATEGORY_ALIAS_ONLY_POLICY).toEqual({
		'music-album': ['gtin'],
		'podcast-series': ['wd', 'apple-podcasts'],
	});
	expect(identityRungsForCategory('music-album')).toEqual([
		'mbid:release-group',
		'wd',
		'spotify:album',
		'gtin',
	]);
	expect(identityRungsForCategory('podcast-series')).toEqual([
		'podcastguid',
		'podcast-index',
		'spotify:show',
		'wd',
		'apple-podcasts',
	]);
	expect(identityRungsForCategory('song')).toEqual(['isrc', 'spotify:track']);
	expect(schemeOrderForIdentityCategory('music-album')).not.toContain('gtin');
	expect(schemeOrderForIdentityCategory('podcast-series')).not.toContain('wd');
	expect(schemeOrderForIdentityCategory('podcast-series')).not.toContain('apple-podcasts');
	expect(IDENTITY_CATEGORIES).toEqual(Object.keys(IDENTITY_CATEGORY_RUNG_POLICY));
	expect(IDENTITY_RUNG_TOKENS).toEqual(
		[...new Set(IDENTITY_CATEGORIES.flatMap(identityRungsForCategory))].sort()
	);
	expect(SCHEMA_TYPE_IDENTITY_CATEGORIES).toEqual({
		Book: 'book',
		Movie: 'movie',
		MusicAlbum: 'music-album',
		MusicGroup: 'artist',
		MusicRecording: 'song',
		PodcastEpisode: 'podcast-episode',
		PodcastSeries: 'podcast-series',
		TVSeries: 'tv-series',
	});
});
