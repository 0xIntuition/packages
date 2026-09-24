import { WD_ENTITYSCHEMA_BINDINGS } from '@0xintuition/iid';
import { describe, expect, it } from 'vitest';
import {
	IDENTITY_CATEGORY_RUNG_POLICY,
	resolveWikidataP31Identity,
	schemeOrderForIdentityCategory,
} from '../category-rungs.js';

describe('shared category identity-rung policy', () => {
	it('pins the create and seed priority rows strongest-first', () => {
		expect(IDENTITY_CATEGORY_RUNG_POLICY).toEqual({
			song: ['isrc', 'spotify:track'],
			book: ['olid', 'isbn', 'goodreads:book'],
			movie: ['wd:film', 'tmdb:movie', 'imdb:title'],
			'tv-series': ['wd:television-series', 'tmdb:tv', 'imdb:title'],
			'podcast-series': ['podcastguid', 'podcast-index', 'spotify:show'],
			'podcast-episode': ['rssitem', 'podcast-index', 'spotify:episode'],
		});
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
